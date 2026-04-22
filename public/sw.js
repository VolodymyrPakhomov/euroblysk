const CACHE_NAME = "euroblysk-v3";
const STATIC = ["/", "/products.json", "/settings.json", "/manifest.json", "/logo2.svg"];

// Install — кешуємо статику
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

// Activate — видаляємо старі кеші
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch стратегії:
// - products.json, settings.json → network-first (свіжі дані)
// - images → cache-first (не міняються)
// - все інше → stale-while-revalidate
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Ігноруємо не-GET і /api/
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // products.json та settings.json — network-first
  if (url.pathname === "/products.json" || url.pathname === "/settings.json") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Зображення — cache-first
  if (url.pathname.startsWith("/images/")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // App shell та решта — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
