import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const error = { code: err.code, message: err.message };
    if (err.details) error.details = err.details;
    return res.status(err.status).json({ error });
  }
  // JSON mal formado en el cuerpo
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "BAD_REQUEST", message: "El JSON enviado no es válido." },
    });
  }
  console.error(err); // el detalle solo va al log, nunca al cliente
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." },
  });
}
