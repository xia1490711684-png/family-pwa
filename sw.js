/**
 * Service Worker for 电视直播 PWA
 * Version: 2.0.0
 * 
 * 缓存策略：
 * - Shell 文件 (HTML/CSS/JS/图标): Cache-First
 * - channels.json: Stale-While-Revalidate
 * - 外部资源 (hls.js CDN): Network-First with Cache Fallback
 */

const CACHE_VERSION = 'tv-pwa-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Shell assets to precache
const SHELL_ASSETS = [
  './',
  './index.html',
  './player.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Install: Precache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('tv-pwa-') && !key.startsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and GET requests
  if (request.method !== 'GET') return;

  // Handle channels.json: Stale-While-Revalidate
  if (url.pathname.endsWith('channels.json')) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Handle same-origin assets: Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Handle external CDN (hls.js): Network-First
  if (url.hostname.includes('cdn.jsdelivr.net') || 
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
});

// Strategy: Cache First
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // For navigation, return cached index.html as fallback
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('离线不可用', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Strategy: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately, update in background
  if (cached) {
    fetchPromise; // Fire and forget
    return cached;
  }

  // No cache, wait for network
  const response = await fetchPromise;
  if (response) return response;

  // Fallback: empty channels
  return new Response(JSON.stringify({
    notice: '离线模式：无法加载频道列表',
    categories: [],
    channels: []
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// Strategy: Network First
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
