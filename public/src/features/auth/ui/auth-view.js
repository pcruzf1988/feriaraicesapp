import { h, icon } from "../../../core/utils/dom.js";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
} from "../auth-service.js";
import { createRolePicker } from "./role-picker.js";

// Maps Firebase Auth error codes to friendly Spanish messages.
function friendlyError(err) {
  const code = err?.code ?? "";
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Probá ingresar.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No encontramos esa cuenta.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  };
  return map[code] ?? "No pudimos completar la acción. Probá de nuevo.";
}

// Auth screen (doc §4.5). `navigate` routes away on success; `query.next` (if any)
// is the path to return to after logging in.
export function authView({ navigate, query = {} } = {}) {
  const state = { mode: "login", rol: null, busy: false, error: null };
  const root = h("section", { class: "auth" });

  const goAfterAuth = () => navigate(query.next || "/feria");

  async function run(action) {
    if (state.busy) return;
    state.busy = true;
    state.error = null;
    paint();
    try {
      await action();
      goAfterAuth();
    } catch (err) {
      state.error = friendlyError(err);
      state.busy = false;
      paint();
    }
  }

  function fieldValue(name) {
    return root.querySelector(`[name="${name}"]`)?.value ?? "";
  }

  function onSubmitEmail(e) {
    e.preventDefault();
    const email = fieldValue("email");
    const password = fieldValue("password");
    if (state.mode === "register") {
      if (!state.rol) {
        state.error = "Elegí si sos consumidor o productor.";
        paint();
        return;
      }
      run(() =>
        registerWithEmail({ email, password, nombre: fieldValue("nombre"), rol: state.rol })
      );
    } else {
      run(() => loginWithEmail({ email, password }));
    }
  }

  function onGoogle() {
    if (state.mode === "register" && !state.rol) {
      state.error = "Elegí si sos consumidor o productor antes de continuar con Google.";
      paint();
      return;
    }
    run(() => loginWithGoogle({ rol: state.rol }));
  }

  function segmented() {
    return h("div", { class: "segmented" }, [
      h("button", {
        class: `segmented__btn ${state.mode === "login" ? "is-active" : ""}`,
        type: "button",
        onclick: () => { state.mode = "login"; state.error = null; paint(); },
        text: "Ingresar",
      }),
      h("button", {
        class: `segmented__btn ${state.mode === "register" ? "is-active" : ""}`,
        type: "button",
        onclick: () => { state.mode = "register"; state.error = null; paint(); },
        text: "Crear cuenta",
      }),
    ]);
  }

  function rolePicker() {
    return createRolePicker({
      selected: state.rol,
      onSelect: (rol) => { state.rol = rol; state.error = null; paint(); },
    });
  }

  function paint() {
    const isRegister = state.mode === "register";
    const form = h("form", { class: "auth-form", onsubmit: onSubmitEmail }, [
      isRegister && h("div", { class: "auth-label", text: "¿Cómo querés usar la feria?" }),
      isRegister && rolePicker(),
      isRegister && h("input", { class: "input", name: "nombre", type: "text", placeholder: "Tu nombre o el de tu familia/grupo", autocomplete: "name" }),
      h("input", { class: "input", name: "email", type: "email", placeholder: "Correo electrónico", autocomplete: "email", required: "true" }),
      h("input", { class: "input", name: "password", type: "password", placeholder: "Contraseña", autocomplete: isRegister ? "new-password" : "current-password", required: "true" }),
      state.error && h("div", { class: "auth-error", text: state.error }),
      h("button", {
        class: "btn btn--primary btn--block",
        type: "submit",
        disabled: state.busy ? "true" : null,
        text: state.busy ? "Un momento…" : isRegister ? "Crear cuenta" : "Ingresar",
      }),
      h("div", { class: "auth-divider", text: "o" }),
      h("button", {
        class: "btn btn--ghost btn--block",
        type: "button",
        disabled: state.busy ? "true" : null,
        onclick: onGoogle,
      }, [icon("brand-google"), "Continuar con Google"]),
    ]);

    root.replaceChildren(
      h("h1", { class: "display-heading", text: isRegister ? "Sumate a la feria" : "Bienvenido de vuelta" }),
      h("p", { class: "section-subtitle", text: "Directo del productor al consumidor" }),
      segmented(),
      form
    );
  }

  paint();
  return root;
}
