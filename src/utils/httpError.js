export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function assertValid(details) {
  if (Object.keys(details).length > 0) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "Los datos enviados no son válidos.",
      details,
    );
  }
}

export function parseId(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1) return null;
  return Number(value);
}
