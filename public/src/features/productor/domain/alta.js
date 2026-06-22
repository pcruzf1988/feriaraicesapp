// Producer onboarding (alta) domain — pure. Validates the essential step and
// builds the productores/{uid} document for a minimal publishable profile.
//
// Security note (§8.1): the create rule requires estado == 'pendiente' and
// sellosVerificados.size() == 0, so the builder forces those and ignores any
// attempt by the caller to preset estado/plan/sellosVerificados.

function isBlank(v) {
  return !v || String(v).trim() === "";
}

export function validateAltaEsencial({ nombre, provincia, localidad, whatsapp } = {}) {
  const errors = {};
  if (isBlank(nombre)) errors.nombre = "Decinos el nombre del productor o familia.";
  if (isBlank(provincia)) errors.provincia = "Elegí tu provincia.";
  if (isBlank(localidad)) errors.localidad = "Elegí tu localidad.";
  if (isBlank(whatsapp)) errors.whatsapp = "Necesitamos tu WhatsApp de contacto.";
  else if (!/\d{6,}/.test(String(whatsapp).replace(/\D/g, ""))) {
    errors.whatsapp = "Ese WhatsApp no parece válido.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildProductorDoc({
  nombre,
  pais = "Argentina",
  provincia,
  localidad,
  lat,
  lng,
  whatsapp,
  descripcion = "",
  portadaURL = "",
  sellosDeclarados = [],
  cooperativa = { pertenece: false },
  creado,
} = {}) {
  return {
    estado: "pendiente",
    plan: "gratis",
    nombre: String(nombre).trim(),
    descripcion,
    portadaURL,
    videos: [],
    redes: {},
    whatsapp: String(whatsapp).trim(),
    cooperativa,
    // pais stored alongside region/locality so the model survives the trinational
    // rollout (Argentina now; Bolivia/Brasil later — doc §7.1) without rework.
    ubicacion: { pais, provincia, localidad, lat, lng },
    sellosDeclarados,
    sellosVerificados: [],
    creado,
    actualizado: creado,
  };
}
