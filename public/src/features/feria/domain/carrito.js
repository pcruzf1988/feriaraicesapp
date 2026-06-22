// Pure cart domain — no storage, no DOM. A cart is grouped by producer (doc §5.2:
// "un carrito por vendedor, no se mezclan"). Each line is a snapshot of the product
// (doc §8 pedidos.items) so it stays stable even if the product later changes.
//
//   carts: [{ productorId, productorNombre, productorLocalidad,
//             items: [{ productoId, nombre, precio, unidad, cantidad }] }]
//
// All operations are immutable: they return a new array, never mutate the input.

// Adds `cantidad` units of `producto` to the matching producer group, creating the
// group and/or the line as needed. Adding an existing product sums its quantity.
export function addAlPedido(carts, producto, cantidad = 1) {
  const linea = {
    productoId: producto.id,
    nombre: producto.nombrePrincipal,
    precio: producto.precio,
    unidad: producto.unidad,
    cantidad,
  };

  const grupo = carts.find((c) => c.productorId === producto.productorId);
  if (!grupo) {
    return [
      ...carts,
      {
        productorId: producto.productorId,
        productorNombre: producto.productorNombre,
        productorLocalidad: producto.productorLocalidad,
        items: [linea],
      },
    ];
  }

  const yaEsta = grupo.items.some((i) => i.productoId === producto.id);
  const items = yaEsta
    ? grupo.items.map((i) =>
        i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
      )
    : [...grupo.items, linea];

  return carts.map((c) => (c.productorId === producto.productorId ? { ...c, items } : c));
}

// Rebuilds the carts array with `items` for one producer group, dropping the group
// entirely if it ends up empty. Shared by the quantity/removal operations.
function conItems(carts, productorId, items) {
  if (items.length === 0) return carts.filter((c) => c.productorId !== productorId);
  return carts.map((c) => (c.productorId === productorId ? { ...c, items } : c));
}

// Adds `delta` (±) to a line's quantity. A quantity of 0 or less removes the line,
// and an emptied group is dropped. Immutable.
export function cambiarCantidad(carts, productorId, productoId, delta) {
  const grupo = carts.find((c) => c.productorId === productorId);
  if (!grupo) return carts;
  const items = grupo.items
    .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
    .filter((i) => i.cantidad > 0);
  return conItems(carts, productorId, items);
}

// Removes a single line (and the group if it was the last one). Immutable.
export function quitarItem(carts, productorId, productoId) {
  const grupo = carts.find((c) => c.productorId === productorId);
  if (!grupo) return carts;
  const items = grupo.items.filter((i) => i.productoId !== productoId);
  return conItems(carts, productorId, items);
}

// Removes a whole producer group. Immutable.
export function quitarCarrito(carts, productorId) {
  return carts.filter((c) => c.productorId !== productorId);
}

// Estimated total for one producer group (referential, not a charge — doc §4.5).
export function totalCarrito(cart) {
  return cart.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
}

// Thousands separator with dots, no locale dependency (deterministic for tests).
function miles(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Pre-filled WhatsApp order message for one producer group (doc §5.3).
export function mensajeWhatsApp(cart, { consumidor, localidad } = {}) {
  const lineas = cart.items.map((i) => `• ${i.cantidad} × ${i.nombre}`).join("\n");
  return (
    `¡Hola ${cart.productorNombre}! 🌱 Te escribo desde Raíces.\n` +
    `Quiero hacerte este pedido:\n\n` +
    `${lineas}\n\n` +
    `Total estimado: $${miles(totalCarrito(cart))} (a confirmar con vos)\n` +
    `Mi nombre: ${consumidor || ""}\n` +
    `Localidad de entrega: ${localidad || ""}\n\n` +
    `¿Tenés disponible? ¿Cómo coordinamos el envío?`
  );
}

// Firestore `pedidos` doc (doc §8) for one producer group. Timestamps (creado,
// enviado) are added by the service adapter, not here.
export function buildPedido(cart, consumidorId) {
  return {
    consumidorId,
    productorId: cart.productorId,
    items: cart.items.map((i) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      precio: i.precio,
      unidad: i.unidad,
      cantidad: i.cantidad,
    })),
    estado: "enviado",
  };
}
