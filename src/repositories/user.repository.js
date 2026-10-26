import { pool } from "../config/database.js";

export async function findByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0] ?? null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [id],
  );
  return rows[0] ?? null;
}

export async function create({ name, email, passwordHash }) {
  // El rol NO se recibe: la base de datos aplica DEFAULT 'user'
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash],
  );
  return result.insertId;
}
