import { h, icon } from "../../../core/utils/dom.js";
import { createCrudSection } from "./crud-section.js";
import { createSolicitudesSection } from "./solicitudes-section.js";
import { createProductoresSection } from "./productores-section.js";
import { createDashboardSection } from "./dashboard-section.js";
import { validateCategoria, validateSello, validateReceta } from "../domain/validate.js";
import { logout } from "../../auth/auth-service.js";

const TABS = [
  { key: "panel", label: "Inicio", iconName: "layout-dashboard" },
  { key: "solicitudes", label: "Solicitudes", iconName: "user-plus" },
  { key: "productores", label: "Productores", iconName: "plant-2" },
  { key: "categorias", label: "Categorías", iconName: "tag" },
  { key: "sellos", label: "Sellos", iconName: "certificate" },
  { key: "recetas", label: "Recetas", iconName: "chef-hat" },
];

function sectionFor(key) {
  switch (key) {
    case "solicitudes":
      return createSolicitudesSection();
    case "productores":
      return createProductoresSection();
    case "categorias":
      return createCrudSection({
        title: "Categorías",
        coll: "categorias",
        orderField: "orden",
        validate: validateCategoria,
        itemTitle: (c) => c.nombre,
        fields: [
          { name: "nombre", label: "Nombre", type: "text", placeholder: "Ej. Verduras" },
          { name: "orden", label: "Orden (para ordenar la lista)", type: "number", placeholder: "0" },
        ],
      });
    case "sellos":
      return createCrudSection({
        title: "Sellos",
        coll: "sellos",
        validate: validateSello,
        itemTitle: (s) => s.nombre,
        itemSubtitle: (s) => s.descripcion,
        fields: [
          { name: "nombre", label: "Nombre", type: "text", placeholder: "Ej. Agroecológico SPG" },
          { name: "descripcion", label: "Descripción", type: "textarea", placeholder: "Qué significa este sello" },
          { name: "comoSeObtiene", label: "Cómo se obtiene", type: "textarea", placeholder: "El proceso para conseguirlo" },
        ],
      });
    case "recetas":
      return createCrudSection({
        title: "Recetas",
        coll: "recetas",
        validate: validateReceta,
        itemTitle: (r) => r.titulo,
        itemSubtitle: (r) => r.descripcion,
        fields: [
          { name: "titulo", label: "Título", type: "text", placeholder: "Ej. Humita en chala" },
          { name: "descripcion", label: "Descripción", type: "textarea", placeholder: "De qué trata la receta" },
          { name: "instrucciones", label: "Pasos (uno por línea)", type: "lines", placeholder: "Rallá el maíz…\nRehogá la cebolla…" },
        ],
      });
    default:
      return createDashboardSection();
  }
}

// Admin panel (block 3c). Master-data CRUD: categorías, sellos, recetas.
// Guarded by requiresAdmin (the custom claim), with its own layout (no bottom nav).
export function adminView({ navigate } = {}) {
  const state = { active: "panel" };
  const root = h("div", { class: "admin" });

  async function onLogout() {
    await logout();
    navigate("/feria");
  }

  function paint() {
    const tabs = h("nav", { class: "admin-tabs" },
      TABS.map((t) =>
        h("button", {
          class: `admin-tabs__btn ${state.active === t.key ? "is-active" : ""}`,
          type: "button",
          onclick: () => { state.active = t.key; paint(); },
        }, [icon(t.iconName), h("span", { text: t.label })])
      )
    );

    const topbar = h("header", { class: "admin-topbar" }, [
      h("div", { class: "admin-brand" }, [
        h("img", { class: "admin-brand__logo", src: "/assets/img/logo.png", alt: "" }),
        h("span", { class: "admin-brand__name", text: "Feria Raíces · Admin" }),
      ]),
      h("div", { class: "admin-topbar__actions" }, [
        h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => navigate("/feria") }, [icon("arrow-left"), "Feria"]),
        h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: onLogout }, [icon("logout"), "Salir"]),
      ]),
    ]);

    root.replaceChildren(topbar, tabs, h("div", { class: "admin-content" }, [sectionFor(state.active)]));
  }

  paint();
  return root;
}
