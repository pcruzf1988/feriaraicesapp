// Pure helpers for the public recipes feature (doc §4.4 / §4.5).

// Returns the products that the recipe links to AND are currently visible
// (existing among the fetched ones + productorAprobado), preserving the order
// declared in receta.productosCompatibles.
export function productosCompatiblesVisibles(receta, productos) {
  const ids = receta?.productosCompatibles ?? [];
  const byId = new Map((productos ?? []).map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p) => p && p.productorAprobado === true);
}

// Trims instruction lines and drops empty ones.
export function pasosLimpios(instrucciones) {
  return (instrucciones ?? []).map((s) => String(s).trim()).filter(Boolean);
}
