// Product search + filters (doc §4.2 / §4.5). Pure. Search matches the main name
// AND the regional alternate names ("otros nombres"), accent- and case-insensitive
// so "maiz" finds "Maíz". Category and availability are exact matches. All active
// filters combine with AND.

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function filtrarProductos(productos, { q = "", categoriaId = "", disponibilidad = "" } = {}) {
  const needle = norm(q).trim();

  return productos.filter((p) => {
    if (categoriaId && p.categoriaId !== categoriaId) return false;
    if (disponibilidad && p.disponibilidad !== disponibilidad) return false;
    if (needle) {
      const haystack = [p.nombrePrincipal, ...(p.otrosNombres ?? [])].map(norm);
      if (!haystack.some((name) => name.includes(needle))) return false;
    }
    return true;
  });
}
