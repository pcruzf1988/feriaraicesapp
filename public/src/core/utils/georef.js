// Georef (datos.gob.ar) — the ARGENTINA geo adapter. Implements the shape the
// country-agnostic `geo.js` port expects:
//   getRegions() -> [string]            (provincias — static, no network)
//   getLocalities(region) -> [{ nombre, lat, lng }]   (Georef, cached)

// The 24 provinces are STATIC reference data — never fetched (avoids needless
// API calls and Georef rate-limits). Names match Georef exactly so locality
// queries by `provincia` resolve.
const PROVINCIAS_AR = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán",
];

const BASE = "https://apis.datos.gob.ar/georef/api";

export async function getRegions() {
  return PROVINCIAS_AR;
}

export async function getLocalities(provincia) {
  const cacheKey = `geo-loc:Argentina:${provincia}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached) return cached;
  } catch {
    /* ignore cache read errors */
  }

  const url =
    `${BASE}/localidades?provincia=${encodeURIComponent(provincia)}` +
    `&campos=nombre,centroide&max=2000&orden=nombre`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Georef ${res.status}`);
  const json = await res.json();
  const localities = (json.localidades ?? []).map((l) => ({
    nombre: l.nombre,
    lat: l.centroide.lat,
    lng: l.centroide.lon,
  }));

  try {
    localStorage.setItem(cacheKey, JSON.stringify(localities));
  } catch {
    /* storage full / unavailable — fine, just skip caching */
  }
  return localities;
}
