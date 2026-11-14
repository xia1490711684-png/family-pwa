const CACHE_NAME = 'mihome-cam-shell-pro-v45';
const SHELL_ASSETS = ['./', './index.html', './apple-touch-icon.png', './header-badge-128.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window' });
    for (const w of wins) {
      try { await w.navigate(w.url); } catch (e) {}
    }
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.endsWith('sw.js') ||
    url.pathname.endsWith('go.html') ||
    url.pathname.endsWith('endpoints.json') ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/hls')
  ) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    let bgNet = null;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      bgNet = fetch(req, { cache: 'no-cache' }).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
        return resp;
      });
      if (!cached) return bgNet;
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3500));
      const fresh = await Promise.race([bgNet.catch(() => null), timeoutPromise]);
      return fresh || cached;
    })());
    if (bgNet) event.waitUntil(bgNet.catch(() => {}));
  }
});
