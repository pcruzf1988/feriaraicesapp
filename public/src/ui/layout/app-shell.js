import { h } from "../../core/utils/dom.js";
import { createBottomNav } from "./bottom-nav.js";

// Builds the persistent app chrome: header (brand) + scrollable content outlet
// + fixed bottom navigation. Returns the root node, the content outlet where the
// router renders views, and the nav's setActive hook.
export function createAppShell({ navigate }) {
  const outlet = h("main", { class: "app-main", id: "view-outlet" });

  const header = h("header", { class: "app-header" }, [
    h("img", { class: "app-header__logo", src: "/assets/img/logo.png", alt: "" }),
    h("div", {}, [
      h("div", { class: "app-header__brand", text: "Feria Raíces" }),
      h("div", {
        class: "app-header__tagline",
        text: "directo del productor al consumidor",
      }),
    ]),
  ]);

  const { nav, setActive } = createBottomNav({ navigate });

  const root = h("div", { id: "app" }, [header, outlet, nav]);

  return { root, outlet, setActive };
}
