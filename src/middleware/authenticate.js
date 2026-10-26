import jwt from "jsonwebtoken";
import { findById } from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(
      401,
      "UNAUTHORIZED",
      "Falta el token de autenticación.",
    );
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET); // verifica firma y caducidad
  } catch {
    throw new HttpError(401, "UNAUTHORIZED", "Token inválido o caducado.");
  }

  // El rol se lee de la base de datos, no del token
  const user = await findById(Number(payload.sub));
  if (!user)
    throw new HttpError(401, "UNAUTHORIZED", "Token inválido o caducado.");

  req.user = user;
  next();
}
