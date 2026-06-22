// Closeness logic (doc §5.1). Pure. Distance via haversine between the consumer's
// reference locality and each product's denormalized producer coords. Products are
// grouped into bands (Local / Regional / Nacional) used ONLY for ordering — bands
// are never shown as labels, and far products are NEVER hidden. Within a band the
// order is random (fairness: no fixed visibility advantage).

const R_KM = 6371; // Earth radius
const LOCAL_MAX = 50; // km, adjustable
const REGIONAL_MAX = 300; // km, adjustable

const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

// 0 = Local (<=50km), 1 = Regional (<=300km), 2 = Nacional (>300km).
export function closenessRank(km) {
  if (km <= LOCAL_MAX) return 0;
  if (km <= REGIONAL_MAX) return 1;
  return 2;
}

// Default in-place-safe Fisher–Yates shuffle (new array).
function defaultShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function coordsOf(producto) {
  const { productorLat, productorLng } = producto;
  if (productorLat == null || productorLng == null) return null;
  return { lat: productorLat, lng: productorLng };
}

// Orders products by closeness band, shuffled within each band. Products without
// coordinates go last. With no reference coords, returns all products shuffled.
export function orderByCloseness(productos, refCoords, shuffle = defaultShuffle) {
  if (!refCoords) return shuffle(productos);

  // rank 0..2 by band, 3 for unknown coords (always last)
  const bands = [[], [], [], []];
  for (const p of productos) {
    const c = coordsOf(p);
    const rank = c ? closenessRank(haversineKm(refCoords, c)) : 3;
    bands[rank].push(p);
  }
  return bands.flatMap((group) => shuffle(group));
}
