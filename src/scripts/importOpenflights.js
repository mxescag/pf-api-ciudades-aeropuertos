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
