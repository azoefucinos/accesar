/**
 * Service Worker mínimo para AccesAR.
 * - Precachea el shell de la app (html, css, js, icons, manifest).
 * - Cache-first para assets estáticos.
 * - Network-first para API y navegación (con fallback a cache).
 *
 * No cachea las fotos de reportes (data URLs en DB) ni intenta
 * encolar POST/DELETE offline (eso requeriría Background Sync API,
 * fuera del alcance de este SW básico).
 */

const CACHE_VERSION = "accesar-v1";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/og-image.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // No fallar si algún asset no existe (ej: en dev no todos están)
      return Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((res) => (res.ok ? cache.put(url, res.clone()) : null))
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar requests no GET
  if (req.method !== "GET") return;

  // Ignorar requests de otros orígenes (ej: tiles de OSM, Nominatim)
  if (url.origin !== self.location.origin) return;

  // Ignorar chunks de hot reload en dev
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // API: network-first con fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Solo cachear responses exitosos
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => null);
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || new Response(
          JSON.stringify({ error: "Sin conexión" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )))
    );
    return;
  }

  // Navegación: network-first, fallback a cache, fallback a "/"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => null);
          return res;
        })
        .catch(() =>
          caches.match(req).then((c) => c || caches.match("/"))
        )
    );
    return;
  }

  // Assets estáticos: cache-first, fallback a network
  event.respondWith(
    caches.match(req).then((c) => c || fetch(req).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => null);
      }
      return res;
    }))
  );
});
