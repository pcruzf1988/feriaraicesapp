// Feria Raíces — Service Worker (app-shell strategy).
//
// Scope of caching, on purpose:
//   - We precache the static app shell (HTML/CSS/JS/icons) so the app opens
//     offline and loads instantly.
//   - We DO NOT cache Firebase/Firestore/Storage requests or Google Fonts/Tabler
//     from the SW: dynamic data must stay fresh, and those cross-origin requests
//     simply pass through to the network. Offline data caching (if ever needed)
//     belongs to Firestore's own persistence layer, not here.
//
// Bump CACHE_VERSION whenever the shell asset list changes to invalidate old caches.

const CACHE_VERSION = "feria-raices-v15";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/src/main.js",
  "/src/styles/design-tokens.css",
  "/src/styles/base.css",
  "/src/styles/components.css",
  "/assets/img/logo.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET. Everything else (Firebase, fonts, CDNs,
  // POST/PUT) goes straight to the network, untouched.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // SPA navigations: network-first, fall back to cached shell, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match("/index.html"))
        .then((res) => res || caches.match("/offline.html"))
    );
    return;
  }

  // Static same-origin assets: cache-first, revalidate in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
