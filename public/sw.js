// Rewritten after every Vite build by scripts/build-service-worker.mjs.
// Keeping the source readable makes the offline contract auditable, while the
// generated file has the exact fingerprinted CSS and JS URLs for that build.
const CACHE = 'webmcp-safety-check-__CACHE_VERSION__';
const SHELL = __PRECACHE_URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    // Vite's preview server (and some CDNs) adds `Vary: Origin` to static
    // assets. Precache requests do not carry the same request headers as a
    // module fetch, so ignore Vary after the URL/origin check above.
    const cached = await caches.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    } catch {
      // Only navigations may receive HTML. Returning the app shell for a
      // module request makes an offline reload fail with a MIME error.
      if (event.request.mode === 'navigate') return (await caches.match('/')) ?? Response.error();
      return Response.error();
    }
  })());
});
