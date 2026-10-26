export function validateCity(body) {
  const b = body ?? {};
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const country = typeof b.country === "string" ? b.country.trim() : "";
  const details = {};
  if (!name || name.length > 120)
    details.name = "El nombre es obligatorio (máx. 120 caracteres).";
  if (!country || country.length > 120)
    details.country = "El país es obligatorio (máx. 120 caracteres).";
  return { values: { name, country }, details };
}
