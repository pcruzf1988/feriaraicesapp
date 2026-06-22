import { h, icon } from "../../../core/utils/dom.js";
import { logout } from "../auth-service.js";
import { ROLE_SHORT } from "./role-labels.js";

// "Mi cuenta" — reads the current session snapshot. The route is auth-guarded, so
// an anonymous visitor is redirected to /ingreso before reaching this view.
export function cuentaView({ session, navigate } = {}) {
  const { profile, user, rol, isAdmin } = session ?? {};
  const nombre = profile?.nombre ?? user?.displayName ?? "—";
  const email = profile?.email ?? user?.email ?? "—";

  async function onLogout() {
    await logout();
    navigate("/feria");
  }

  return h("section", { class: "account" }, [
    h("h1", { style: "font-size:20px;margin-bottom:4px;", text: "Mi cuenta" }),
    h("div", { class: "account-card" }, [
      h("div", { class: "account-row" }, [icon("user", "account-row__icon"), h("span", { text: nombre })]),
      h("div", { class: "account-row" }, [icon("mail", "account-row__icon"), h("span", { text: email })]),
      h("div", { class: "account-row" }, [
        icon("badge", "account-row__icon"),
        h("span", { text: isAdmin ? "Administrador" : (ROLE_SHORT[rol] ?? "—") }),
      ]),
    ]),
    isAdmin &&
      h("button", {
        class: "btn btn--accent btn--block",
        type: "button",
        style: "margin-top:16px;",
        onclick: () => navigate("/admin"),
      }, [icon("shield-cog"), "Ir al panel de administración"]),
    rol === "productor" &&
      h("button", {
        class: "btn btn--accent btn--block",
        type: "button",
        style: "margin-top:16px;",
        onclick: () => navigate("/productor"),
      }, [icon("plant-2"), "Ir a mi panel de productor"]),
    h("button", {
      class: "btn btn--ghost btn--block",
      type: "button",
      style: "margin-top:16px;",
      onclick: onLogout,
    }, [icon("logout"), "Cerrar sesión"]),
  ]);
}
