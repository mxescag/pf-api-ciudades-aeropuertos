import { AppError } from "../utils/AppError.js";

// Express reconoce un manejador de errores por sus 4 parámetros,
// aunque no uses `next`. Debe registrarse el último.
export function errorHandler(error, req, res, next) {
  // Si ya se empezó a enviar la respuesta, Express debe cerrarla él
  if (res.headersSent) {
    return next(error);
  }

  // 1. Errores esperados, lanzados por nuestro código con AppError
  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  // 2. Errores del cliente generados por Express al leer el cuerpo
  //    (JSON mal formado, cuerpo demasiado grande...): traen status 4xx
  if (error.expose && error.status >= 400 && error.status < 500) {
    const mensaje =
      error.type === "entity.parse.failed"
        ? "El cuerpo JSON no es válido"
        : error.message;

    return res.status(error.status).json({ error: mensaje });
  }

  // 3. Cualquier otro error es inesperado: se registra en el servidor
  //    y el cliente solo recibe un mensaje genérico (sin trazas ni datos internos)
  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}
