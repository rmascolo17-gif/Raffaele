const CACHE = 'cronomax-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/index-DRZhOiPQ.js',
  '/assets/index-bVGjyIa6.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  // API calls: network-first
  if (request.url.includes('openrouter') || request.url.includes('api.')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      return caches.open(CACHE).then((cache) => {
        cache.put(request, res.clone());
        return res;
      });
    }))
  );
});
