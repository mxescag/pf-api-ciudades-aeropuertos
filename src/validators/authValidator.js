/* Esto es un patrón. El email tendrá que cumplir este patrón.*/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(body) {
  const bd = body ?? {};
  /* Si bd.name es un string, guarda una cadena sin espacios. Si no, guarda una cadena vacía.*/
  const name = typeof bd.name === "string" ? bd.name.trim() : "";
  const email =
    typeof bd.email === "string" ? bd.email.trim().toLowerCase() : "";
  /* Si bd.password es cadena de texto, lo manetenemos. Si no, retorna una cadena vacía. */
  const password = typeof bd.password === "string" ? bd.password : "";

  /* Aquí se guardan los errores, si hubiesen. */
  const details = {};

  /* Comprobantes */
  if (name.length < 2 || name.length > 100) {
    details.name = "El nombre debe tener entre 2 y 100 caracteres.";
  }

  /* Comprueba que el email cumple el patrón de arriba. */
  if (!EMAIL_RE.test(email) || email.length > 254) {
    details.email = "El correo no tiene un formato válido.";
  }

  if (password.length < 8 || password.length > 72) {
    details.password = "La contraseña debe tener entre 8 y 72 caracteres.";
  }

  return {
    values: {
      name,
      email,
      password,
    },
    details,
  };
}

export function validateLogin(body) {
  const b = body ?? {};
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const details = {};
  if (!email) details.email = "El correo es obligatorio.";
  if (!password) details.password = "La contraseña es obligatoria.";
  return { values: { email, password }, details };
}
