import { h, icon } from "../../core/utils/dom.js";
import { getReceta, getProducto } from "./feria-service.js";
import { productosCompatiblesVisibles, pasosLimpios } from "./domain/recetas.js";

// Ficha de receta (route /receta/:id, public — doc §4.5).
export async function recetaView({ id, navigate } = {}) {
  let receta = null, productos = [];
  try {
    receta = await getReceta(id);
    if (receta?.productosCompatibles?.length) {
      const fetched = await Promise.all(receta.productosCompatibles.map(getProducto));
      productos = productosCompatiblesVisibles(receta, fetched.filter(Boolean));
    }
  } catch (err) {
    console.error("[receta] load falló:", err?.code, err);
  }

  if (!receta) {
    return h("section", {}, [
      backButton(navigate),
      h("p", { class: "admin-muted", style: "margin-top:24px;", text: "No encontramos esta receta." }),
    ]);
  }
  return renderReceta(receta, productos, navigate);
}

function backButton(navigate) {
  return h("button", { class: "wizard-back", type: "button", onclick: () => navigate("/recetas") }, [
    icon("chevron-left"), "Volver a recetas",
  ]);
}

function renderReceta(r, productos, navigate) {
  const pasos = pasosLimpios(r.instrucciones);
  return h("section", { class: "detalle" }, [
    backButton(navigate),
    r.portadaURL ? h("div", { class: "receta-hero" }, [h("img", { src: r.portadaURL, alt: r.titulo })]) : null,
    h("div", { class: "detalle-head" }, [h("h1", { class: "detalle-title", text: r.titulo })]),
    r.descripcion ? h("p", { class: "detalle-desc", text: r.descripcion }) : null,
    r.video
      ? h("a", { class: "perfil-video", href: r.video, target: "_blank", rel: "noopener" },
          [icon("brand-youtube"), h("span", { text: "Ver video" })])
      : null,
    pasos.length ? pasosBlock(pasos) : null,
    productos.length ? productosBlock(productos, navigate) : null,
  ]);
}

function pasosBlock(pasos) {
  return h("div", { class: "receta-pasos" }, [
    h("h2", { class: "detalle-subtitle", text: "Pasos" }),
    h("ol", { class: "receta-pasos__list" }, pasos.map((p) => h("li", { text: p }))),
  ]);
}

function productosBlock(productos, navigate) {
  return h("div", { class: "detalle-recetas" }, [
    h("h2", { class: "detalle-subtitle", text: "Se usa en estos productos" }),
    h("div", { class: "chip-row" }, productos.map((p) =>
      h("button", { class: "chip", type: "button", onclick: () => navigate(`/producto/${p.id}`) },
        [icon("basket", "ti--sm"), p.nombrePrincipal]))),
  ]);
}
