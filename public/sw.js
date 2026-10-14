// ASAP ISEP Service Worker - Offline Cache
const CACHE_NAME = 'asap-isep-cache-v1';
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // Fallback if offline
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        })
      );
    })
  );
});
