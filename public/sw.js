const CACHE_NAME = "qaadi-cache-v1";
const CORE_ASSETS = ["/"];
const OPTIONAL_CORE_ASSETS = ["/manifest.webmanifest", "/favicon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const assets = [...CORE_ASSETS];
      const optionalAssets = await Promise.all(
        OPTIONAL_CORE_ASSETS.map(async (asset) => {
          try {
            const res = await fetch(asset, { method: "HEAD" });
            return res.ok ? asset : null;
          } catch {
            return null;
          }
        })
      );
      assets.push(...optionalAssets.filter(Boolean));
      await Promise.all(
        assets.map((asset) => cache.add(asset).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.pathname === "/api/health") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((r) =>
              r ||
              new Response(JSON.stringify({ offline: true }), {
                headers: { "Content-Type": "application/json" },
                status: 503,
              })
            )
        )
    );
    return;
  }
  e.respondWith(
    caches
      .match(req)
      .then(
        (c) =>
          c ||
          fetch(req)
            .then((res) => {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(req, res.clone()));
              return res;
            })
            .catch(() => caches.match("/"))
      )
  );
});
