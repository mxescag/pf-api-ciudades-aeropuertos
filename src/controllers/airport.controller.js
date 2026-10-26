import * as airports from "../repositories/airport.repository.js";
import * as cities from "../repositories/city.repository.js";
import { validateAirport } from "../validators/airportValidator.js";
import { HttpError, assertValid, parseId } from "../utils/httpError.js";

const notFound = () =>
  new HttpError(404, "NOT_FOUND", "Aeropuerto no encontrado.");
const duplicated = () =>
  new HttpError(409, "IATA_TAKEN", "El código IATA ya existe.");

export async function list(req, res) {
  let cityId;
  if (req.query.cityId !== undefined) {
    cityId = parseId(req.query.cityId);
    if (!cityId) return res.json([]); // cityId no válido: no hay coincidencias
  }
  res.json(await airports.findAll(cityId));
}

export async function getOne(req, res) {
  const id = parseId(req.params.id);
  const airport = id && (await airports.findById(id));
  if (!airport) throw notFound();
  res.json(airport);
}

export async function create(req, res) {
  const { values, details } = validateAirport(req.body);
  assertValid(details);

  if (!(await cities.findById(values.cityId))) {
    throw new HttpError(404, "CITY_NOT_FOUND", "La ciudad indicada no existe.");
  }
  try {
    const id = await airports.create(values);
    res.status(201).json({ id, ...values });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw duplicated();
    throw err;
  }
}

export async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await airports.findBasicById(id))) throw notFound();

  const { values, details } = validateAirport(req.body);
  assertValid(details);

  if (!(await cities.findById(values.cityId))) {
    throw new HttpError(404, "CITY_NOT_FOUND", "La ciudad indicada no existe.");
  }
  try {
    await airports.update(id, values);
    res.json({ id, ...values });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw duplicated();
    throw err;
  }
}
