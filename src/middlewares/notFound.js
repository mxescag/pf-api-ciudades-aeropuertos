// Se registra DESPUÉS de todas las rutas: si ninguna respondió, llega aquí.
export function notFound(req, res) {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}
