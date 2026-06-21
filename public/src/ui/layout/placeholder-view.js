import { h, icon } from "../../core/utils/dom.js";

// Generic placeholder for routes whose feature is not built yet. Keeps the shell
// navigable during early blocks without pretending functionality exists.
export function placeholderView({ title, subtitle, iconName = "seedling" }) {
  return h(
    "section",
    {
      style:
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "text-align:center;gap:8px;min-height:50vh;color:var(--color-muted);",
    },
    [
      h("i", { class: `ti ti-${iconName}`, style: "font-size:48px;color:var(--color-oliva);" }),
      h("h1", { style: "font-size:20px;color:var(--color-cacao);", text: title }),
      subtitle && h("p", { style: "font-size:13px;max-width:28ch;", text: subtitle }),
    ]
  );
}
