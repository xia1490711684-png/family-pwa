/* Simple PWA service worker: offline shell + update-friendly caching */
const CACHE_NAME = 'tv-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './player.html',
  './channels.json',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // channels.json: stale-while-revalidate
  if (url.pathname.endsWith('/channels.json') || url.pathname.endsWith('channels.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((resp) => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => null);
      return cached || (await fetchPromise) || new Response(JSON.stringify({channels: []}), {headers: {'Content-Type':'application/json'}});
    })());
    return;
  }

  // Other assets: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      if (resp && resp.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, resp.clone());
      }
      return resp;
    } catch (e) {
      // If offline and requesting a page, return index
      if (req.mode === 'navigate') {
        const cachedIndex = await caches.match('./index.html');
        if (cachedIndex) return cachedIndex;
      }
      return new Response('Offline', {status: 503, headers: {'Content-Type':'text/plain'}});
    }
  })());
});
