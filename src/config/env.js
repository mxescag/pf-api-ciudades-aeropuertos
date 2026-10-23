// Centraliza la lectura de variables de entorno. El resto de la app importa
// `config` y nunca toca `process.env` directamente.

const NODE_ENV = process.env.NODE_ENV ?? "development";

// process.env siempre guarda texto: hay que convertirlo a número
const PORT = Number(process.env.PORT ?? 3000);

// Falla al arrancar (no más tarde) si la configuración es incorrecta
if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error(`PORT no válido: ${process.env.PORT}`);
}

// Object.freeze impide modificar la configuración por accidente
export const config = Object.freeze({
  env: NODE_ENV,
  isProduction: NODE_ENV === "production",
  port: PORT,
  apiPrefix: process.env.API_PREFIX ?? "/api",
});
