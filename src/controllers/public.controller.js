// Importa todas las funciones del repositorio encargado de consultar ciudades.
import * as cities from "../repositories/city.repository.js";
// Importa todas las funciones del repositorio encargado de consultar aeropuertos.
import * as airports from "../repositories/airport.repository.js";
// Importa todas las funciones del repositorio encargado de consultar vuelos.
import * as flights from "../repositories/flight.repository.js";
// Importa el error HTTP y las utilidades para validar y convertir identificadores.
import { HttpError, assertValid, parseId } from "../utils/httpError.js";

// Indica el origen de los datos que se devuelve en las respuestas de la API.
const DATA_SOURCE = "OpenFlights (dataset histórico)";
// Convierte una ciudad de la base de datos al formato público de la API.
const cityInfo = (c) => ({ cityId: c.id, city: c.name, country: c.country });

// Valida los parámetros necesarios para buscar rutas entre dos ciudades.
function parseSearchParams(query, withMaxStops) {
  // Objeto donde se acumulan los errores de validación encontrados.
  const details = {};
  // Convierte el identificador de la ciudad de origen a un entero válido.
  const fromCityId = parseId(query.fromCityId);
  // Convierte el identificador de la ciudad de destino a un entero válido.
  const toCityId = parseId(query.toCityId);

  // Si el identificador de origen no es válido, registra el error correspondiente.
  if (!fromCityId)
    details.fromCityId = "fromCityId debe ser un entero positivo.";
  // Si el identificador de destino no es válido, registra el error correspondiente.
  if (!toCityId) details.toCityId = "toCityId debe ser un entero positivo.";
  // Comprueba que origen y destino no sean la misma ciudad.
  if (fromCityId && toCityId && fromCityId === toCityId) {
    // Asocia el error al parámetro de destino.
    details.toCityId = "El origen y el destino deben ser distintos.";
  }

  // Por defecto, una búsqueda permite cero escalas.
  let maxStops = 0;
  // Solo valida maxStops cuando la operación lo admite y el parámetro se ha enviado.
  if (withMaxStops && query.maxStops !== undefined) {
    // Acepta únicamente los valores de texto del 0 al 3.
    if (/^[0-3]$/.test(String(query.maxStops)))
      // Convierte el valor validado de texto a número.
      maxStops = Number(query.maxStops);
    // Si el valor no cumple la expresión regular, registra un error.
    else details.maxStops = "maxStops debe ser un entero entre 0 y 3.";
  }

  // Lanza un error HTTP si se ha encontrado algún problema de validación.
  assertValid(details);
  // Devuelve los parámetros ya convertidos y validados.
  return { fromCityId, toCityId, maxStops };
}

// Carga las ciudades de origen y destino y comprueba que existan.
async function loadCities(fromCityId, toCityId) {
  // Busca ambas ciudades en paralelo para reducir el tiempo total de consulta.
  const [from, to] = await Promise.all([
    // Busca la ciudad de origen por su identificador.
    cities.findById(fromCityId),
    // Busca la ciudad de destino por su identificador.
    cities.findById(toCityId),
  ]);
  // Si no existe la ciudad de origen, responde con un error 404.
  if (!from)
    throw new HttpError(
      // Código HTTP de recurso no encontrado.
      404,
      // Código interno que identifica el tipo de error.
      "CITY_NOT_FOUND",
      // Mensaje que recibirá el cliente.
      "La ciudad de origen no existe.",
    );
  // Si no existe la ciudad de destino, responde con un error 404.
  if (!to)
    throw new HttpError(
      // Código HTTP de recurso no encontrado.
      404,
      // Código interno que identifica el tipo de error.
      "CITY_NOT_FOUND",
      // Mensaje que recibirá el cliente.
      "La ciudad de destino no existe.",
    );
  // Devuelve las dos ciudades encontradas.
  return { from, to };
}

// Controlador que devuelve todas las ciudades, opcionalmente filtradas por texto.
export async function searchCities(req, res) {
  // Usa el parámetro search si es texto y elimina los espacios sobrantes.
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  // Busca las ciudades y envía el resultado como JSON.
  res.json(await cities.findAll(search));
}

// Controlador que devuelve los aeropuertos pertenecientes a una ciudad.
export async function cityAirports(req, res) {
  // Convierte el parámetro id de la URL a un identificador válido.
  const id = parseId(req.params.id);
  // Comprueba que el identificador sea válido y que la ciudad exista.
  if (!id || !(await cities.findById(id))) {
    // Si no se cumple alguna condición, devuelve un error 404.
    throw new HttpError(404, "NOT_FOUND", "Ciudad no encontrada.");
  }
  // Busca los aeropuertos de la ciudad y los envía como JSON.
  res.json(await airports.findByCity(id));
}

// Controlador que busca únicamente rutas directas entre dos ciudades.
export async function searchDirect(req, res) {
  // Extrae y valida los identificadores recibidos en la query string.
  const { fromCityId, toCityId } = parseSearchParams(req.query, false);
  // Carga las ciudades y confirma que existen.
  const { from, to } = await loadCities(fromCityId, toCityId);

  // Busca en la base de datos los vuelos directos entre ambas ciudades.
  const rows = await flights.findDirect(fromCityId, toCityId);
  // Adapta cada fila de la base de datos al formato de ruta de la API.
  const routes = rows.map((r) => ({
    // Una ruta directa no tiene escalas.
    stops: 0,
    // Una ruta directa está formada por un único tramo.
    legs: [
      {
        // Nombre de la aerolínea que opera el tramo.
        airline: r.airline,
        // Información del aeropuerto de salida.
        from: {
          // Código IATA del aeropuerto de salida.
          iataCode: r.fromIata,
          // Nombre del aeropuerto de salida.
          airport: r.fromAirport,
          // Ciudad del aeropuerto de salida.
          city: r.fromCity,
        },
        // Información del aeropuerto de llegada.
        to: { iataCode: r.toIata, airport: r.toAirport, city: r.toCity },
      },
    ],
  }));

  // Envía la respuesta final con las ciudades, las rutas y los metadatos.
  res.json({
    // Datos públicos de la ciudad de origen.
    from: cityInfo(from),
    // Datos públicos de la ciudad de destino.
    to: cityInfo(to),
    // Lista de rutas directas encontradas.
    routes,
    // Número total de rutas encontradas.
    count: routes.length,
    // Fuente declarada de los datos utilizados.
    dataSource: DATA_SOURCE,
  });
}
