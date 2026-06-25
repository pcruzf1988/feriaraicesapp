// Returns the URL only if it uses a safe http(s) scheme, otherwise null.
// Guards against javascript:/data:/vbscript: hrefs (XSS) when rendering
// user/admin-supplied links (e.g. recipe and producer videos).
export function urlHttpSegura(url) {
  const trimmed = String(url ?? "").trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}
