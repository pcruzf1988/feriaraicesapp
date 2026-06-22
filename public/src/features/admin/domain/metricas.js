// Pure admin metrics (doc §10) — market analysis to help value producers and
// improve their income. No Firestore, no DOM: the service reads the collections,
// these functions aggregate them, and the dashboard renders the result.

// Top products by ficha views (doc §10 "productos más vistos"). Never-viewed
// products are excluded.
export function productosMasVistos(productos, n = 5) {
  return [...productos]
    .filter((p) => (p.vistas ?? 0) > 0)
    .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))
    .slice(0, n);
}

// Most-ordered products (doc §10) from the order intents (pedidos estado "enviado").
// Counts how many orders included each product and the total units requested.
export function productosMasPedidos(pedidos, n = 5) {
  const map = new Map();
  for (const ped of pedidos) {
    for (const it of ped.items ?? []) {
      const cur = map.get(it.productoId) ?? { productoId: it.productoId, nombre: it.nombre, pedidos: 0, unidades: 0 };
      cur.pedidos += 1;
      cur.unidades += it.cantidad ?? 0;
      map.set(it.productoId, cur);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.pedidos - a.pedidos || b.unidades - a.unidades)
    .slice(0, n);
}

// Consumers grouped by province (doc §10 "origen de los consumidores"). Uses the
// reference locality, falling back to the home locality; ignores anyone who
// declared neither.
export function origenConsumidores(usuarios) {
  const map = new Map();
  for (const u of usuarios) {
    if (u.rol !== "consumidor") continue;
    const loc = u.localidadReferencia ?? u.localidadOrigen;
    if (!loc?.provincia) continue;
    map.set(loc.provincia, (map.get(loc.provincia) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([provincia, total]) => ({ provincia, total }))
    .sort((a, b) => b.total - a.total);
}

// Self-declared demographics (doc §10), aggregated and anonymous — only counts
// users who actually filled each field.
export function demografia(usuarios) {
  const rangoEtario = {};
  const genero = {};
  for (const u of usuarios) {
    if (u.rangoEtario) rangoEtario[u.rangoEtario] = (rangoEtario[u.rangoEtario] ?? 0) + 1;
    if (u.genero) genero[u.genero] = (genero[u.genero] ?? 0) + 1;
  }
  return { rangoEtario, genero };
}

// Producer counts by estado (doc §10 "activos vs pendientes").
export function resumenProductores(productores) {
  const r = { aprobado: 0, pendiente: 0, rechazado: 0 };
  for (const p of productores) {
    if (p.estado in r) r[p.estado] += 1;
  }
  return r;
}
