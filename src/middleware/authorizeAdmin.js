import { HttpError } from "../utils/httpError.js";

export function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "No tienes permisos para esta operación.",
    );
  }
  next();
}
