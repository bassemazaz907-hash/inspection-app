const CACHE = "inspection-v5";
const CORE = ["/", "/index.html", "/admin.html", "/reports.html", "/css/style.css", "/js/theme.js", "/js/app.js", "/js/admin.js", "/js/reports.js", "/js/pwa.js", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/app-icon.png"];

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
  if (url.origin !== self.location.origin) return;

  // API requests: network-first with short timeout, no cache
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/events") return;
    event.respondWith(
      Promise.race([
        fetch(req),
        new Promise((_, reject) => setTimeout(() => reject(), 4000))
      ]).catch(() => caches.match(req)).then(r => r || new Response(JSON.stringify({error:"offline"}), {headers:{"Content-Type":"application/json"}}))
    );
    return;
  }

  // Static assets: cache-first, instant serve
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) {
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
