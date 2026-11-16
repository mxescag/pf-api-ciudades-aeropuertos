import { pool } from "../config/database.js";

export async function findDirect(fromCityId, toCityId) {
  const [rows] = await pool.execute(
    `SELECT al.name AS airline,
            sa.iata_code AS fromIata, sa.name AS fromAirport, sc.name AS fromCity,
            da.iata_code AS toIata,   da.name AS toAirport,   dc.name AS toCity
     FROM flights f
     JOIN airports sa ON sa.id = f.source_airport_id
     JOIN cities sc   ON sc.id = sa.city_id
     JOIN airports da ON da.id = f.destination_airport_id
     JOIN cities dc   ON dc.id = da.city_id
     LEFT JOIN airlines al ON al.id = f.airline_id
     WHERE sa.city_id = ? AND da.city_id = ? AND f.stops = 0
     ORDER BY sa.iata_code, da.iata_code, al.name`,
    [fromCityId, toCityId],
  );
  return rows;
}
/* Usamos LEFT JOIN con airlines porque airline_id puede ser NULL. 
Con un JOIN normal se perderían esas rutas. */
