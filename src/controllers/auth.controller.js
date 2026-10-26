import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as users from "../repositories/user.repository.js";
import {
  validateRegister,
  validateLogin,
} from "../validators/authValidator.js";
import { HttpError, assertValid } from "../utils/httpError.js";

export async function register(req, res) {
  const { values, details } = validateRegister(req.body);
  assertValid(details);

  const passwordHash = await bcrypt.hash(values.password, 10);

  try {
    const id = await users.create({
      name: values.name,
      email: values.email,
      passwordHash,
    });
    // Solo usamos name, email y password: cualquier "role" del body se ignora
    res
      .status(201)
      .json({ id, name: values.name, email: values.email, role: "user" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "EMAIL_TAKEN", "El correo ya está registrado.");
    }
    throw err;
  }
}

export async function login(req, res) {
  const { values, details } = validateLogin(req.body);
  assertValid(details);

  const user = await users.findByEmail(values.email);
  const ok =
    user && (await bcrypt.compare(values.password, user.password_hash));
  if (!ok) {
    // Mismo mensaje tanto si falla el correo como la contraseña
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Credenciales incorrectas.",
    );
  }

  const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 3600;
  const accessToken = jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn },
  );

  res.json({
    accessToken,
    tokenType: "Bearer",
    expiresIn,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export function me(req, res) {
  res.json(req.user);
}
