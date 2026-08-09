const CACHE = "inspection-v3";
const CORE = ["/", "/index.html", "/admin.html", "/css/style.css", "/js/theme.js", "/js/app.js", "/js/admin.js", "/js/pwa.js", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) {
        // stale-while-revalidate: اخدم من الكاش فوراً وحدّث في الخلفية
        fetch(req).then((fresh) => {
          if (fresh && fresh.ok) cache.put(req, fresh);
        }).catch(() => {});
        return cached;
      }
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        if (req.mode === "navigate") return cache.match("/index.html");
        return new Response("", { status: 408 });
      }
    })
  );
});
