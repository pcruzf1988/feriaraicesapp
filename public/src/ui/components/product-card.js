import { h, icon } from "../../core/utils/dom.js";

const AVAIL_LABEL = {
  disponible: "Disponible",
  poca: "Poca",
  sin_stock: "Sin stock",
};

// Formats a price as Argentine pesos (no decimals for whole numbers).
function formatPrice(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

// Product card for the feria grid.
// `product` follows the Firestore `productos/{id}` shape (doc §8): it carries the
// denormalized producer fields (productorNombre, productorLocalidad) so the card
// renders with a single read. Per doc §5.1 we show the producer's LOCALITY, never
// a distance label.
export function createProductCard(product, { onOpen } = {}) {
  const {
    nombrePrincipal,
    productorNombre,
    productorLocalidad,
    precio,
    unidad,
    disponibilidad = "disponible",
    fotos = [],
  } = product;

  const media = h("div", { class: "product-card__media" }, [
    fotos[0]
      ? h("img", { src: fotos[0], alt: nombrePrincipal, loading: "lazy" })
      : icon("basket"),
  ]);

  const body = h("div", { class: "product-card__body" }, [
    h("div", { class: "product-card__name", text: nombrePrincipal }),
    h("div", { class: "product-card__producer" }, [
      icon("map-pin", "ti--xs"),
      `${productorNombre ?? ""}${productorLocalidad ? " · " + productorLocalidad : ""}`,
    ]),
    h("div", { class: "product-card__footer" }, [
      h("span", { class: "product-card__price" }, [
        formatPrice(precio),
        unidad ? h("span", { class: "product-card__unit", text: ` /${unidad}` }) : null,
      ]),
      h("span", {
        class: `badge-avail badge-avail--${disponibilidad}`,
        text: AVAIL_LABEL[disponibilidad] ?? "",
      }),
    ]),
  ]);

  return h(
    "article",
    {
      class: "product-card",
      role: "button",
      tabindex: "0",
      onclick: () => onOpen?.(product),
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(product);
        }
      },
    },
    [media, body]
  );
}
