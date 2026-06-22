import { h, icon } from "../../core/utils/dom.js";
import { formatRelativo } from "../../core/utils/fecha.js";
import {
  getProducto,
  getProductor,
  listCategorias,
  listRecetasDeProducto,
  contarVista,
} from "./feria-service.js";
import { agregarAlPedido } from "./carrito-store.js";

const AVAIL_LABEL = { disponible: "Disponible", poca: "Pocas unidades", sin_stock: "Sin stock por ahora" };

function formatPrecio(value) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value ?? 0);
}

// Firestore Timestamp → Date (or null). Tolerates plain Dates/millis already.
function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

// Ficha de producto (route /producto/:id, public — doc §4.5). Async view: reads the
// product, its category, its producer and the recipes it appears in, then renders.
export async function fichaView({ id, navigate } = {}) {
  let producto = null, categorias = [], recetas = [], productor = null;
  try {
    [producto, categorias] = await Promise.all([getProducto(id), listCategorias()]);
    if (producto) {
      [recetas, productor] = await Promise.all([
        listRecetasDeProducto(id),
        getProductor(producto.productorId),
      ]);
      contarVista(id); // best-effort, not awaited
    }
  } catch (err) {
    console.error("[ficha] load falló:", err?.code, err);
  }

  if (!producto) {
    return h("section", {}, [
      backButton(navigate),
      h("p", { class: "admin-muted", style: "margin-top:24px;", text: "No encontramos este producto. Puede que ya no esté publicado." }),
    ]);
  }

  return renderFicha(producto, { categorias, recetas, productor, navigate });
}

function backButton(navigate) {
  return h("button", { class: "wizard-back", type: "button", onclick: () => navigate("/feria") }, [
    icon("chevron-left"), "Volver a la feria",
  ]);
}

function renderFicha(p, { categorias, recetas, productor, navigate }) {
  const categoria = categorias.find((c) => c.id === p.categoriaId)?.nombre;
  const fotos = p.fotos?.length ? p.fotos : [];
  const actualizado = formatRelativo(toDate(p.actualizado) || toDate(p.creado));

  // Gallery: a main image the thumbnails swap into.
  const mainMedia = h("div", { class: "detalle-media" }, [
    fotos[0] ? h("img", { src: fotos[0], alt: p.nombrePrincipal }) : icon("basket"),
  ]);
  const thumbs = fotos.length > 1
    ? h("div", { class: "detalle-thumbs" }, fotos.map((src, i) =>
        h("button", {
          class: "detalle-thumb", type: "button",
          onclick: () => mainMedia.replaceChildren(h("img", { src, alt: p.nombrePrincipal })),
        }, [h("img", { src, alt: `${p.nombrePrincipal} ${i + 1}` })])))
    : null;

  const otros = p.otrosNombres?.length
    ? h("p", { class: "detalle-otros", text: `También conocido como ${p.otrosNombres.join(", ")}` })
    : null;

  return h("section", { class: "detalle" }, [
    backButton(navigate),
    mainMedia,
    thumbs,

    h("div", { class: "detalle-head" }, [
      categoria ? h("span", { class: "chip chip--selected", text: categoria }) : null,
      h("h1", { class: "detalle-title", text: p.nombrePrincipal }),
      otros,
    ]),

    h("div", { class: "detalle-pricing" }, [
      h("span", { class: "detalle-price" }, [
        formatPrecio(p.precio),
        p.unidad ? h("span", { class: "detalle-unit", text: ` /${p.unidad}` }) : null,
      ]),
      h("span", { class: `badge-avail badge-avail--${p.disponibilidad || "disponible"}`,
        text: AVAIL_LABEL[p.disponibilidad] ?? "Disponible" }),
    ]),
    actualizado ? h("p", { class: "detalle-updated", text: `Disponibilidad actualizada ${actualizado}` }) : null,

    p.descripcion ? h("p", { class: "detalle-desc", text: p.descripcion }) : null,

    productor ? productorCard(productor, p, navigate) : null,

    recetas.length ? recetasBlock(recetas) : null,

    addBar(p),
  ]);
}

function productorCard(productor, producto, navigate) {
  const loc = productor.ubicacion?.localidad || producto.productorLocalidad;
  return h("button", {
    class: "detalle-productor", type: "button",
    onclick: () => navigate(`/perfil/${productor.id}`),
  }, [
    h("div", { class: "detalle-productor__avatar" },
      [productor.portadaURL ? h("img", { src: productor.portadaURL, alt: productor.nombre }) : icon("plant-2")]),
    h("div", { class: "detalle-productor__info" }, [
      h("span", { class: "detalle-productor__label", text: "Producido por" }),
      h("span", { class: "detalle-productor__name", text: productor.nombre }),
      loc ? h("span", { class: "detalle-productor__loc" }, [icon("map-pin", "ti--xs"), loc]) : null,
    ]),
    icon("chevron-right"),
  ]);
}

function recetasBlock(recetas) {
  return h("div", { class: "detalle-recetas" }, [
    h("h2", { class: "detalle-subtitle", text: "Se puede usar en estas recetas" }),
    h("div", { class: "chip-row" }, recetas.map((r) =>
      h("span", { class: "chip" }, [icon("chef-hat", "ti--sm"), r.titulo]))),
  ]);
}

function addBar(producto) {
  const sinStock = producto.disponibilidad === "sin_stock";
  const btn = h("button", {
    class: "btn btn--primary btn--block",
    type: "button",
    disabled: sinStock ? "true" : null,
    onclick: () => {
      agregarAlPedido(producto);
      btn.replaceChildren(icon("check"), "Agregado a tu pedido");
      btn.classList.add("btn--accent");
      setTimeout(() => {
        btn.replaceChildren(icon("basket"), "Agregar al pedido");
        btn.classList.remove("btn--accent");
      }, 1600);
    },
  }, [icon("basket"), sinStock ? "Sin stock por ahora" : "Agregar al pedido"]);

  return h("div", { class: "detalle-addbar" }, [btn]);
}
