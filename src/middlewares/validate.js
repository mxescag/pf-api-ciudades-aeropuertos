import { AppError } from "../utils/AppError.js";

// Fábrica de middlewares: recibe una función validadora y devuelve un
// middleware que la ejecuta sobre req.body antes de llegar al controlador.
// `opciones` se pasa tal cual al validador (por ejemplo { parcial: true }).
export function validate(validador, opciones = {}) {
  return (req, res, next) => {
    const cuerpo = req.body;

    // Sin cuerpo (undefined), null, un array o un valor simple: no es un objeto JSON
    if (
      cuerpo === null ||
      typeof cuerpo !== "object" ||
      Array.isArray(cuerpo)
    ) {
      throw AppError.unprocessable(["El cuerpo debe ser un objeto JSON"]);
    }

    // El validador devuelve una lista de mensajes; vacía significa válido
    const errores = validador(cuerpo, opciones);

    if (errores.length > 0) {
      throw AppError.unprocessable(errores);
    }

    next(); // Todo correcto: pasa al siguiente middleware o al controlador
  };
}
