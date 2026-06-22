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
