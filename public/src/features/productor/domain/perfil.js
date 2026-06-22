// Producer profile editing (4d) — pure. Builds the productores/{uid} update patch
// from the edit form. CRITICAL (security §8.1): the producer-owner update rule
// rejects any change to estado, plan or sellosVerificados, so this builder NEVER
// emits those fields — only what the producer is allowed to edit.

const trim = (v) => String(v ?? "").trim();

export function buildPerfilPatch({
  nombre,
  descripcion = "",
  portadaURL = "",
  videos = [],
  instagram = "",
  facebook = "",
  whatsapp,
  coopPertenece = false,
  coopNombre = "",
  sellosDeclarados = [],
  pais = "Argentina",
  provincia,
  localidad,
  lat = null,
  lng = null,
} = {}) {
  const redes = {};
  if (trim(instagram)) redes.instagram = trim(instagram);
  if (trim(facebook)) redes.facebook = trim(facebook);

  return {
    nombre: trim(nombre),
    descripcion,
    portadaURL,
    videos: videos.map(trim).filter(Boolean),
    redes,
    whatsapp: trim(whatsapp),
    cooperativa: coopPertenece ? { pertenece: true, nombre: trim(coopNombre) } : { pertenece: false },
    sellosDeclarados,
    ubicacion: { pais, provincia, localidad, lat, lng },
  };
}
