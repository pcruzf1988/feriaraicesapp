import { h, icon } from "../../core/utils/dom.js";

// Bottom navigation (mobile-first). Tabs reflect the consumer/public sitemap
// (doc §4.5). The producer and admin areas get their own nav later.
const TABS = [
  { path: "/feria", label: "Feria", iconName: "plant-2" },
  { path: "/recetas", label: "Recetas", iconName: "chef-hat" },
  { path: "/pedidos", label: "Mis pedidos", iconName: "basket" },
  { path: "/cuenta", label: "Cuenta", iconName: "user" },
];

export function createBottomNav({ navigate }) {
  const links = TABS.map((tab) =>
    h(
      "button",
      {
        class: "bottom-nav__item",
        type: "button",
        dataset: { path: tab.path },
        "aria-label": tab.label,
        onclick: () => navigate(tab.path),
      },
      [icon(tab.iconName, "bottom-nav__icon"), h("span", { text: tab.label })]
    )
  );

  const nav = h("nav", { class: "bottom-nav", "aria-label": "Navegación principal" }, links);

  // Highlights the tab matching the current path (prefix match).
  function setActive(path) {
    for (const link of links) {
      const tabPath = link.dataset.path;
      const active = path === tabPath || path.startsWith(tabPath + "/");
      link.classList.toggle("bottom-nav__item--active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    }
  }

  return { nav, setActive };
}
