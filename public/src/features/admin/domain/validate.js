// Pure validation for the admin master-data forms. Returns { valid, errors }
// where errors maps a field name to a human message (Spanish, shown in the UI).

function isBlank(value) {
  return !value || String(value).trim() === "";
}

export function validateCategoria({ nombre } = {}) {
  const errors = {};
  if (isBlank(nombre)) errors.nombre = "El nombre es obligatorio.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSello({ nombre } = {}) {
  const errors = {};
  if (isBlank(nombre)) errors.nombre = "El nombre del sello es obligatorio.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateReceta({ titulo } = {}) {
  const errors = {};
  if (isBlank(titulo)) errors.titulo = "El título es obligatorio.";
  return { valid: Object.keys(errors).length === 0, errors };
}
