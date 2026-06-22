import { h } from "../../../core/utils/dom.js";
import { createRolePicker } from "./role-picker.js";
import { completeProfile } from "../auth-service.js";
import { session } from "../auth-store.js";

// Onboarding: shown to anyone who is authenticated but has no role yet (e.g. a new
// Google user). Picking a role creates their usuarios/{uid} doc and unblocks the app.
export function onboardingView({ navigate } = {}) {
  const state = { rol: null, busy: false, error: null };
  const root = h("section", { class: "auth" });

  async function confirm() {
    if (!state.rol) {
      state.error = "Elegí una opción para continuar.";
      paint();
      return;
    }
    if (state.busy) return;
    state.busy = true;
    state.error = null;
    paint();
    try {
      await completeProfile({ rol: state.rol });
      await session.refresh();
      // A new producer goes straight to their alta wizard; buyers to the feria.
      navigate(state.rol === "productor" ? "/productor" : "/feria");
    } catch (err) {
      console.error("[onboarding] completeProfile/refresh falló:", err?.code, err);
      state.error = "No pudimos guardar tu elección. Probá de nuevo.";
      state.busy = false;
      paint();
    }
  }

  function paint() {
    root.replaceChildren(
      h("h1", { class: "display-heading", text: "¿Cómo querés usar la feria?" }),
      h("p", { class: "section-subtitle", text: "Elegí una opción para terminar de entrar." }),
      h("div", { style: "margin-top:16px;" }, [
        createRolePicker({
          selected: state.rol,
          onSelect: (rol) => { state.rol = rol; state.error = null; paint(); },
        }),
      ]),
      state.error && h("div", { class: "auth-error", text: state.error }),
      h("button", {
        class: "btn btn--primary btn--block",
        type: "button",
        style: "margin-top:16px;",
        disabled: state.busy ? "true" : null,
        onclick: confirm,
        text: state.busy ? "Guardando…" : "Continuar",
      })
    );
  }

  paint();
  return root;
}
