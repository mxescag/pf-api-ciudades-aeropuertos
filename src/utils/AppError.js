// Error con código de estado HTTP. Los controladores lo lanzan con `throw`
// y errorHandler lo convierte en la respuesta JSON.
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status; // Código HTTP: 404, 409, 422...
    this.details = details; // Opcional: lista de problemas concretos
  }

  // Atajos para los errores más habituales
  static notFound(message = "Recurso no encontrado") {
    return new AppError(404, message);
  }

  static conflict(message = "El recurso ya existe") {
    return new AppError(409, message);
  }

  static unprocessable(details, message = "Datos no válidos") {
    return new AppError(422, message, details);
  }
} // Error con código de estado HTTP. Los controladores lo lanzan con `throw`
// y errorHandler lo convierte en la respuesta JSON.
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status; // Código HTTP: 404, 409, 422...
    this.details = details; // Opcional: lista de problemas concretos
  }

  // Atajos para los errores más habituales
  static notFound(message = "Recurso no encontrado") {
    return new AppError(404, message);
  }

  static conflict(message = "El recurso ya existe") {
    return new AppError(409, message);
  }

  static unprocessable(details, message = "Datos no válidos") {
    return new AppError(422, message, details);
  }
}
