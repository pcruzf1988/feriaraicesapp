// Cart persistence (localStorage) — works for anonymous visitors too and survives
// reloads, mirroring ref-localidad.js. The cart shape and all mutations live in the
// pure domain (domain/carrito.js); this module only loads, saves, and notifies.
// In bloque 5d this is where "Mis pedidos" reads from, and sending moves a group
// into Firestore `pedidos` (doc §8).

import { addAlPedido } from "./domain/carrito.js";

const KEY = "feria-carrito";
const listeners = new Set();

export function getCarrito() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(carts) {
  localStorage.setItem(KEY, JSON.stringify(carts));
  listeners.forEach((fn) => fn(carts));
}

// Adds a product to the cart and persists it. Returns the new cart.
export function agregarAlPedido(producto, cantidad = 1) {
  const next = addAlPedido(getCarrito(), producto, cantidad);
  save(next);
  return next;
}

// Total number of units across every producer group (for a nav badge, etc.).
export function contarItems(carts = getCarrito()) {
  return carts.reduce((acc, c) => acc + c.items.reduce((a, i) => a + i.cantidad, 0), 0);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
