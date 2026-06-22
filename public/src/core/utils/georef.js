// Georef (datos.gob.ar) — the ARGENTINA geo adapter. Public open-data API, no key.
// Exposes the shape the country-agnostic `geo.js` port expects:
//   getRegions() -> [string]            (provincias)
//   getLocalities(region) -> [{ nombre, lat, lng }]

const BASE = "https://apis.datos.gob.ar/georef/api";

export async function getRegions() {
  const res = await fetch(`${BASE}/provincias?campos=nombre&max=30&orden=nombre`);
  const json = await res.json();
  return (json.provincias ?? []).map((p) => p.nombre);
}

export async function getLocalities(provincia) {
  const url =
    `${BASE}/localidades?provincia=${encodeURIComponent(provincia)}` +
    `&campos=nombre,centroide&max=2000&orden=nombre`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.localidades ?? []).map((l) => ({
    nombre: l.nombre,
    lat: l.centroide.lat,
    lng: l.centroide.lon,
  }));
}
