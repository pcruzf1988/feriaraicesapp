// Composition root: wires the app shell, the router (with auth guards), and the
// routes together, then registers the service worker.

import { createRouter } from "./core/router/router.js";
import { createAppShell } from "./ui/layout/app-shell.js";
import { feriaView } from "./features/feria/feria-view.js";
import { fichaView } from "./features/feria/ficha-view.js";
import { perfilView } from "./features/feria/perfil-view.js";
import { placeholderView } from "./ui/layout/placeholder-view.js";
import { session } from "./features/auth/auth-store.js";
import { decideNavigation } from "./features/auth/domain/navigation.js";
import { authView } from "./features/auth/ui/auth-view.js";
import { onboardingView } from "./features/auth/ui/onboarding-view.js";
import { cuentaView } from "./features/auth/ui/cuenta-view.js";
import { adminView } from "./features/admin/ui/admin-view.js";
import { productorHome } from "./features/productor/ui/productor-home.js";
import { misProductosView } from "./features/productor/ui/mis-productos-view.js";

let router;
const navigate = (path) => router.navigate(path);

const { root, outlet, setActive } = createAppShell({ navigate });
document.body.replaceChildren(root);

const routes = {
  "/": () => feriaView({ navigate }),
  "/feria": () => feriaView({ navigate }),
  "/recetas": () =>
    placeholderView({ title: "Recetas con identidad", subtitle: "Llegan en el bloque 5.", iconName: "chef-hat" }),
  "/producto/:id": ({ params }) => fichaView({ id: params.id, navigate }),
  "/ingreso": {
    render: ({ query }) => authView({ navigate, query }),
    meta: {},
  },
  "/onboarding": {
    render: () => onboardingView({ navigate }),
    meta: { onboarding: true },
  },
  "/pedidos": {
    render: () =>
      placeholderView({ title: "Mis pedidos", subtitle: "Tus carritos por productor vivirán acá (bloque 5).", iconName: "basket" }),
    meta: { requiresAuth: true, roles: ["consumidor"] },
  },
  "/cuenta": {
    render: () => cuentaView({ session: session.get(), navigate }),
    meta: { requiresAuth: true },
  },
  "/admin": {
    render: () => adminView({ navigate }),
    meta: { requiresAdmin: true },
  },
  "/productor": {
    render: () => productorHome({ navigate }),
    meta: { requiresAuth: true, roles: ["productor"] },
  },
  "/productor/productos": {
    render: () => misProductosView({ navigate }),
    meta: { requiresAuth: true, roles: ["productor"] },
  },
  "/perfil/:uid": ({ params }) => perfilView({ uid: params.uid, navigate }),
  "*": () =>
    placeholderView({ title: "No encontramos esa página", subtitle: "Volvé a la feria desde el menú de abajo.", iconName: "mood-confuzed" }),
};

router = createRouter({
  routes,
  outlet,
  guard: ({ meta }) => decideNavigation({ meta, session: session.get() }),
  onNavigate: ({ path }) => {
    setActive(path);
    // The admin panel has its own layout — hide the consumer chrome.
    document.body.classList.toggle("admin-mode", path.startsWith("/admin"));
  },
  loadingNode: () =>
    placeholderView({ title: "Cargando…", subtitle: "Un segundo.", iconName: "loader-2" }),
});

// Re-render the current route whenever the session changes so guards re-evaluate
// (e.g. a logged-in user on /cuenta moves past the loading state after Firebase
// restores the session, and views reflect login/logout).
session.subscribe(() => router.render());

router.start();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((err) => {
      console.warn("[PWA] Service worker registration failed:", err);
    });
  });
}
