// Producto domain — pure validation + assembly (doc §8). The denormalized
// producer fields are added separately by denormalizeProducto (already tested),
// composed in the service with the current producer profile.

const UNIDADES = ["kg", "unidad", "docena", "atado", "frasco", "litro", "bandeja"];
const DISPONIBILIDADES = ["disponible", "poca", "sin_stock"];

function isBlank(v) {
  return !v || String(v).trim() === "";
}

export function validateProducto({ nombrePrincipal, categoriaId, precio, unidad } = {}) {
  const errors = {};
  if (isBlank(nombrePrincipal)) errors.nombrePrincipal = "Poné el nombre del producto.";
  if (isBlank(categoriaId)) errors.categoriaId = "Elegí una categoría.";
  if (isBlank(unidad)) errors.unidad = "Elegí la unidad (kg, atado, frasco…).";
  if (!(Number(precio) > 0)) errors.precio = "El precio tiene que ser mayor a cero.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildProducto({
  productorId,
  nombrePrincipal,
  otrosNombres = [],
  categoriaId,
  descripcion = "",
  precio,
  unidad,
  disponibilidad = "disponible",
  fotos = [],
  creado,
} = {}) {
  return {
    productorId,
    nombrePrincipal: String(nombrePrincipal).trim(),
    otrosNombres,
    categoriaId,
    descripcion,
    fotos,
    precio: Number(precio) || 0,
    unidad,
    disponibilidad,
    vistas: 0,
    creado,
    actualizado: creado,
  };
}

export { UNIDADES, DISPONIBILIDADES };
