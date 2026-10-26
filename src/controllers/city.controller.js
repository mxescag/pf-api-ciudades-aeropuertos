import * as cities from "../repositories/city.repository.js";
import * as airports from "../repositories/airport.repository.js";
import { validateCity } from "../validators/cityValidator.js";
import { HttpError, assertValid, parseId } from "../utils/httpError.js";

const notFound = () => new HttpError(404, "NOT_FOUND", "Ciudad no encontrada.");

export async function list(req, res) {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  res.json(await cities.findAll(search));
}

export async function listWithAirports(req, res) {
  res.json(await cities.findWithAirports());
}

export async function listAirports(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await cities.findById(id))) throw notFound();
  res.json(await airports.findByCity(id));
}

export async function create(req, res) {
  const { values, details } = validateCity(req.body);
  assertValid(details);
  const id = await cities.create(values);
  res.status(201).json({ id, ...values });
}

export async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await cities.findById(id))) throw notFound();

  const { values, details } = validateCity(req.body);
  assertValid(details);
  await cities.update(id, values);
  res.json({ id, ...values });
}
