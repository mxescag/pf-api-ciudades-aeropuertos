import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { pool } from "../config/database.js";

const DATA_DIR = path.resolve("data/openflights");
const BATCH_SIZE = 500;
const NULL_MARK = "\\N"; // en el fichero aparece como \N

const stats = {
  airportsRead: 0,
  airportsInserted: 0,
  airportsLinked: 0,
  airportsAlready: 0,
  airportsSkipped: 0,
  airlinesRead: 0,
  airlinesInserted: 0,
  airlinesAlready: 0,
  airlinesSkipped: 0,
  routesRead: 0,
  routesInserted: 0,
  routesAlready: 0,
  routesSkipped: 0,
  routesNoAirline: 0,
};

// Convierte "", "\N" y undefined en null y recorta espacios
function clean(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v === "" || v === NULL_MARK ? null : v;
}

function toPositiveInt(value) {
  const v = clean(value);
  return v !== null && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null;
}

function readDat(fileName) {
  const file = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(file)) {
    throw new Error(`No se encuentra ${file}. Descárgalo siguiendo el README.`);
  }
  return parse(fs.readFileSync(file, "utf8"), {
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
  });
}

// Ejecuta el trabajo por lotes, cada uno en su propia transacción
async function runInBatches(items, size, label, work) {
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await work(conn, batch);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(
        `Falló el lote de ${label} (filas ${i}-${i + batch.length}): ${err.message}`,
      );
      throw err;
    } finally {
      conn.release();
    }
  }
}

async function checkSchema() {
  try {
    await pool.query("SELECT openflights_id, icao_code FROM airports LIMIT 1");
    await pool.query("SELECT 1 FROM airlines LIMIT 1");
    await pool.query("SELECT 1 FROM flights LIMIT 1");
  } catch {
    throw new Error(
      "Falta la migración: ejecuta database/002_flights.sql antes de importar.",
    );
  }
}

async function importAirports() {
  const rows = readDat("airports.dat");
  stats.airportsRead = rows.length;

  await runInBatches(rows, BATCH_SIZE, "aeropuertos", async (conn, batch) => {
    for (const r of batch) {
      const openflightsId = toPositiveInt(r[0]);
      const name = clean(r[1]);
      const cityName = clean(r[2]);
      const country = clean(r[3]);
      const iata = clean(r[4])?.toUpperCase() ?? null;
      const icaoRaw = clean(r[5])?.toUpperCase() ?? null;
      const icao = icaoRaw && icaoRaw.length === 4 ? icaoRaw : null;
      const type = clean(r[12]);

      const valid =
        type === "airport" &&
        openflightsId &&
        name &&
        cityName &&
        country &&
        iata &&
        /^[A-Z]{3}$/.test(iata);
      if (!valid) {
        stats.airportsSkipped++;
        continue;
      }

      // 1) ya importado
      const [byOf] = await conn.execute(
        "SELECT id FROM airports WHERE openflights_id = ?",
        [openflightsId],
      );
      if (byOf.length > 0) {
        stats.airportsAlready++;
        continue;
      }

      // 2) existe por IATA (p. ej. los datos de ejemplo de la práctica 1)
      const [byIata] = await conn.execute(
        "SELECT id, openflights_id FROM airports WHERE iata_code = ?",
        [iata],
      );
      if (byIata.length > 0) {
        if (byIata[0].openflights_id === null) {
          await conn.execute(
            "UPDATE airports SET openflights_id = ?, icao_code = ? WHERE id = ?",
            [openflightsId, icao, byIata[0].id],
          );
          stats.airportsLinked++;
        } else {
          stats.airportsSkipped++; // conflicto: ese IATA ya está asignado a otro ID externo
        }
        continue;
      }

      // 3) nuevo: buscar o crear la ciudad
      let cityId;
      const [cityRows] = await conn.execute(
        "SELECT id FROM cities WHERE name = ? AND country = ? LIMIT 1",
        [cityName, country],
      );
      if (cityRows.length > 0) {
        cityId = cityRows[0].id;
      } else {
        const [res] = await conn.execute(
          "INSERT INTO cities (name, country) VALUES (?, ?)",
          [cityName, country],
        );
        cityId = res.insertId;
      }

      await conn.execute(
        `INSERT INTO airports (iata_code, name, city_id, openflights_id, icao_code)
         VALUES (?, ?, ?, ?, ?)`,
        [iata, name, cityId, openflightsId, icao],
      );
      stats.airportsInserted++;
    }
  });
}

async function importAirlines() {
  const rows = readDat("airlines.dat");
  stats.airlinesRead = rows.length;

  const valid = [];
  for (const r of rows) {
    const id = toPositiveInt(r[0]);
    const name = clean(r[1]);
    if (!id || !name) {
      stats.airlinesSkipped++;
      continue;
    }

    const iata = clean(r[3]);
    const icao = clean(r[4]);
    const active = clean(r[7]);
    valid.push([
      id,
      name.slice(0, 180),
      iata && iata !== "-" && iata.length <= 2 ? iata : null,
      icao && icao.length <= 3 ? icao : null,
      clean(r[6])?.slice(0, 120) ?? null,
      active === "Y" || active === "N" ? active : null,
    ]);
  }

  await runInBatches(valid, BATCH_SIZE, "aerolíneas", async (conn, batch) => {
    const [res] = await conn.query(
      `INSERT IGNORE INTO airlines (openflights_id, name, iata_code, icao_code, country, active)
       VALUES ?`,
      [batch],
    );
    stats.airlinesInserted += res.affectedRows;
  });
  stats.airlinesAlready = valid.length - stats.airlinesInserted;
}

async function importRoutes() {
  const rows = readDat("routes.dat");
  stats.routesRead = rows.length;

  const [airportRows] = await pool.query(
    "SELECT id, openflights_id FROM airports WHERE openflights_id IS NOT NULL",
  );
  const airportMap = new Map(airportRows.map((a) => [a.openflights_id, a.id]));
  const [airlineRows] = await pool.query(
    "SELECT id, openflights_id FROM airlines",
  );
  const airlineMap = new Map(airlineRows.map((a) => [a.openflights_id, a.id]));

  const valid = [];
  for (const r of rows) {
    const src = airportMap.get(toPositiveInt(r[3]));
    const dst = airportMap.get(toPositiveInt(r[5]));
    const stopsRaw = clean(r[7]);

    // Sin origen o destino enlazable no se puede guardar (FK); tampoco origen = destino
    if (!src || !dst || src === dst || !/^\d+$/.test(stopsRaw ?? "")) {
      stats.routesSkipped++;
      continue;
    }

    const airlineExt = toPositiveInt(r[1]);
    const airline = airlineExt ? (airlineMap.get(airlineExt) ?? null) : null;
    if (airline === null) stats.routesNoAirline++; // se conserva con airline_id = NULL

    // Identidad de la fila: hash de sus 9 campos normalizados (no el número de línea)
    const fields = Array.from({ length: 9 }, (_, i) => clean(r[i]) ?? "");
    const sourceKey = createHash("sha256")
      .update(fields.join("|"))
      .digest("hex");

    valid.push([
      airline,
      src,
      dst,
      clean(r[6]) === "Y" ? 1 : 0,
      Number(stopsRaw),
      clean(r[8])?.slice(0, 100) ?? null,
      sourceKey,
    ]);
  }

  await runInBatches(valid, BATCH_SIZE, "rutas", async (conn, batch) => {
    const [res] = await conn.query(
      `INSERT IGNORE INTO flights
         (airline_id, source_airport_id, destination_airport_id, codeshare, stops, equipment, source_key)
       VALUES ?`,
      [batch],
    );
    stats.routesInserted += res.affectedRows;
    stats.routesAlready += batch.length - res.affectedRows;
  });
}

function printSummary() {
  const line = (label, value) => console.log(`${label.padEnd(44)}${value}`);
  console.log("\n--- Resumen de importación ---");
  line("Aeropuertos leídos:", stats.airportsRead);
  line("Aeropuertos insertados:", stats.airportsInserted);
  line("Aeropuertos enlazados (ya existían por IATA):", stats.airportsLinked);
  line("Aeropuertos ya importados:", stats.airportsAlready);
  line("Aeropuertos omitidos:", stats.airportsSkipped);
  line("Aerolíneas leídas:", stats.airlinesRead);
  line("Aerolíneas insertadas:", stats.airlinesInserted);
  line(
    "Aerolíneas ya importadas / omitidas:",
    `${stats.airlinesAlready} / ${stats.airlinesSkipped}`,
  );
  line("Rutas leídas:", stats.routesRead);
  line("Rutas insertadas:", stats.routesInserted);
  line("Rutas ya importadas:", stats.routesAlready);
  line("Rutas omitidas por referencias ausentes:", stats.routesSkipped);
  line("Rutas guardadas sin aerolínea:", stats.routesNoAirline);
}

async function main() {
  await checkSchema();
  await importAirports();
  await importAirlines();
  await importRoutes();
  printSummary();
}

main()
  .catch((err) => {
    console.error("Importación fallida:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
