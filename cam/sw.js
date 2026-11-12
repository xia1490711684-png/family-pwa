const CACHE_NAME = 'mihome-cam-shell-v23';
const SHELL_ASSETS = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('endpoints.json') || url.pathname.includes('/api/') || url.pathname.includes('/hls')) return;

  // For HTML shell & icon: serve cached copy immediately if network takes >600ms, and refresh cache in background
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.png') || url.pathname.endsWith('hls.min.js')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      const netPromise = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
        return resp;
      });
      if (cached) {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(cached), 600));
        return Promise.race([netPromise.catch(() => cached), timeoutPromise]);
      }
      return netPromise;
    })());
  }
});
