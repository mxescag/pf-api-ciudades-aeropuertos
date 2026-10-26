import { pool } from "../config/database.js";

export async function findAll(search) {
  if (search) {
    const [rows] = await pool.execute(
      "SELECT id, name, country FROM cities WHERE name LIKE ? ORDER BY name",
      [`%${search}%`], // el patrón también va como parámetro
    );
    return rows;
  }
  const [rows] = await pool.execute(
    "SELECT id, name, country FROM cities ORDER BY name",
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, name, country FROM cities WHERE id = ?",
    [id],
  );
  return rows[0] ?? null;
}

export async function findWithAirports() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.country, COUNT(a.id) AS airportCount
     FROM cities c
     JOIN airports a ON a.city_id = c.id
     GROUP BY c.id, c.name, c.country
     ORDER BY c.name`,
  );
  return rows;
}

export async function create({ name, country }) {
  const [result] = await pool.execute(
    "INSERT INTO cities (name, country) VALUES (?, ?)",
    [name, country],
  );
  return result.insertId;
}

export async function update(id, { name, country }) {
  await pool.execute("UPDATE cities SET name = ?, country = ? WHERE id = ?", [
    name,
    country,
    id,
  ]);
}
