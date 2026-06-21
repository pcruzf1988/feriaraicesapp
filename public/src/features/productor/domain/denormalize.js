// Copies the producer fields a product needs to be listed and sorted without
// extra reads (doc §8 denormalization). Reused by the seed script and by the
// producer "Mis productos" flow (block 4), and kept in sync whenever the producer
// profile changes or is approved.
//
// Pure: returns a NEW object, never mutates the input.

export function denormalizeProducto(producto, productor) {
  const ubicacion = productor.ubicacion ?? {};
  return {
    ...producto,
    productorNombre: productor.nombre,
    productorLocalidad: ubicacion.localidad,
    productorLat: ubicacion.lat,
    productorLng: ubicacion.lng,
    productorAprobado: productor.estado === "aprobado",
  };
}
