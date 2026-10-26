export function validateAirport(body) {
  const b = body ?? {};
  const iataCode =
    typeof b.iataCode === "string" ? b.iataCode.trim().toUpperCase() : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const cityIdRaw = b.cityId;
  const details = {};

  if (!/^[A-Z]{3}$/.test(iataCode))
    details.iataCode = "El código IATA debe tener 3 letras.";
  if (!name || name.length > 180)
    details.name = "El nombre es obligatorio (máx. 180 caracteres).";
  if (!Number.isInteger(cityIdRaw) || cityIdRaw < 1)
    details.cityId = "cityId debe ser un entero positivo.";

  return { values: { iataCode, name, cityId: cityIdRaw }, details };
}
