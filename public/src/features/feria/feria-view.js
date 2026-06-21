import { h } from "../../core/utils/dom.js";
import { createChip } from "../../ui/components/chip.js";
import { createProductCard } from "../../ui/components/product-card.js";

// DEMO DATA — placeholder only, to showcase the design system in bloque 1.
// Real data comes from Firestore in bloque 5 (Consumidor / Feria).
const DEMO_PRODUCTS = [
  { id: "1", nombrePrincipal: "Maíz criollo", productorNombre: "Flia. Quispe", productorLocalidad: "Yavi", precio: 1200, unidad: "kg", disponibilidad: "disponible", fotos: [] },
  { id: "2", nombrePrincipal: "Quinoa orgánica", productorNombre: "Coop. Cumbres", productorLocalidad: "Tilcara", precio: 2500, unidad: "kg", disponibilidad: "poca", fotos: [] },
  { id: "3", nombrePrincipal: "Dulce de cayote", productorNombre: "Huerta Valle Verde", productorLocalidad: "Humahuaca", precio: 1800, unidad: "frasco", disponibilidad: "disponible", fotos: [] },
  { id: "4", nombrePrincipal: "Papa andina", productorNombre: "Flia. Mamaní", productorLocalidad: "Maimará", precio: 900, unidad: "kg", disponibilidad: "sin_stock", fotos: [] },
];

const DEMO_FILTERS = ["Verduras", "Frutas", "Hierbas", "Dulces", "Conservas", "Harinas"];

export function feriaView({ navigate } = {}) {
  const filters = h(
    "div",
    { class: "chip-row" },
    DEMO_FILTERS.map((label, i) => createChip({ label, selected: i === 0 }))
  );

  const grid = h(
    "div",
    { class: "product-grid" },
    DEMO_PRODUCTS.map((p) =>
      createProductCard(p, { onOpen: (prod) => navigate?.(`/producto/${prod.id}`) })
    )
  );

  return h("section", {}, [
    h("h1", { class: "display-heading", text: "La feria está abierta" }),
    h("p", { class: "section-subtitle", text: "Productos agroecológicos, directo del productor" }),
    h("div", { style: "margin: 16px 0;" }, [filters]),
    grid,
  ]);
}
