import { h, icon } from "../../core/utils/dom.js";
import { listRecetas } from "./feria-service.js";

// Recetas — public list (doc §4.5). Each card links to /receta/:id.
export function recetasView({ navigate } = {}) {
  const root = h("section", { class: "recetas" });
  const grid = h("div", { class: "recetas-list" });
  root.replaceChildren(
    h("h1", { class: "recetas__title", text: "Recetas con identidad" }),
    grid,
  );
  grid.replaceChildren(h("p", { class: "admin-muted", text: "Cargando recetas…" }));

  (async function load() {
    let recetas = [];
    try {
      recetas = await listRecetas();
    } catch (err) {
      console.error("[recetas] load falló:", err?.code, err);
    }
    if (!recetas.length) {
      grid.replaceChildren(h("p", { class: "admin-muted", text: "Todavía no hay recetas." }));
      return;
    }
    grid.replaceChildren(...recetas.map(card));
  })();

  function card(r) {
    return h("button", { class: "receta-card", type: "button", onclick: () => navigate(`/receta/${r.id}`) }, [
      h("div", { class: "receta-card__media" }, [
        r.portadaURL ? h("img", { src: r.portadaURL, alt: r.titulo }) : icon("chef-hat"),
      ]),
      h("div", { class: "receta-card__body" }, [
        h("div", { class: "receta-card__title", text: r.titulo }),
        r.descripcion ? h("div", { class: "receta-card__desc", text: r.descripcion }) : null,
      ]),
    ]);
  }

  return root;
}
