const CACHE_NAME = "qaadi-cache-v1";
const CORE_ASSETS = ["/", "/api/health"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks)=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).then((res)=>{caches.open(CACHE_NAME).then(c=>c.put(req,res.clone()));return res;})
      .catch(()=>caches.match(req).then(r=>r||new Response(JSON.stringify({offline:true}),{headers:{"Content-Type":"application/json"},status:503}))));
    return;
  }
  e.respondWith(caches.match(req).then(c=>c||fetch(req).then(res=>{caches.open(CACHE_NAME).then(cache=>cache.put(req,res.clone()));return res;})
    .catch(()=>caches.match("/"))));
});
