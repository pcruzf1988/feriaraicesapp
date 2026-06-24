// Minimal hash-based router for a no-build vanilla SPA.
//
// WHY HASH (#/feria) AND NOT THE HISTORY API:
// the History API needs the server to rewrite every path to index.html. When
// this PWA is wrapped with Capacitor it runs from file:// — there is no server
// to rewrite anything, so History routing breaks. Hash routing behaves
// identically on the web, as an installed PWA, and inside Capacitor.
//
// A route value is either:
//   "/feria": (ctx) => HTMLElement                      // public
//   "/pedidos": { render: (ctx) => HTMLElement, meta }  // guarded
// where meta is { requiresAuth?, roles?, requiresAdmin? } (consumed by `guard`).
// A "*" route is the fallback (404).
//
// `guard({ meta, path, params, query })` (optional) decides access and returns:
//   { action: "render" } | { action: "wait" } | { action: "redirect", to }
// Keeping the decision outside the router lets it stay pure of auth logic.

export function createRouter({ routes, outlet, guard, onNavigate, loadingNode }) {
  function parseHash() {
    const raw = window.location.hash.slice(1) || "/";
    const [path, queryString = ""] = raw.split("?");
    const query = Object.fromEntries(new URLSearchParams(queryString));
    return { path: path || "/", query };
  }

  // Matches "/perfil/:id" against "/perfil/abc" → { id: "abc" }, or null.
  function matchRoute(pattern, path) {
    const pp = pattern.split("/").filter(Boolean);
    const ap = path.split("/").filter(Boolean);
    if (pp.length !== ap.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
      else if (pp[i] !== ap[i]) return null;
    }
    return params;
  }

  function normalize(value) {
    return typeof value === "function"
      ? { render: value, meta: {} }
      : { render: value.render, meta: value.meta ?? {} };
  }

  function resolve(path) {
    for (const pattern of Object.keys(routes)) {
      if (pattern === "*") continue;
      const params = matchRoute(pattern, path);
      if (params) return { ...normalize(routes[pattern]), params };
    }
    return routes["*"] ? { ...normalize(routes["*"]), params: {} } : null;
  }

  async function render() {
    const { path, query } = parseHash();
    const resolved = resolve(path);
    if (!resolved) return;
    const { render: view, meta, params } = resolved;
    const ctx = { path, params, query };

    const decision = guard ? guard({ meta, ...ctx }) : { action: "render" };

    if (decision.action === "redirect") {
      navigate(decision.to);
      return;
    }
    if (decision.action === "wait") {
      if (loadingNode) outlet.replaceChildren(loadingNode());
      return;
    }

    const node = await view(ctx);
    outlet.replaceChildren(node);
    // .app-main is the scroll container now (body is locked), so reset it.
    outlet.scrollTop = 0;
    onNavigate?.(ctx);
  }

  function navigate(path) {
    if (window.location.hash === `#${path}`) render();
    else window.location.hash = path;
  }

  function start() {
    window.addEventListener("hashchange", render);
    render();
  }

  return { start, navigate, render, parseHash };
}
