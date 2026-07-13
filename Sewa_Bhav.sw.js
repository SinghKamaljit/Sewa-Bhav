// Sewa Bhav — Service Worker
// Offline-first: the app shell is cached so the app opens instantly with no connection.
// The config.json is the one thing that must stay fresh (it's how an owner's published
// changes reach every guest device), so it's deliberately network-first with a cache fallback.

const CACHE_NAME = 'sewa-bhav-v1';
const APP_SHELL = [
  './',
  './index.html',
  './Sewa_Bhav.manifest.json',
  './Sewa_Bhav-icon-192.png',
  './Sewa_Bhav-icon-512.png',
  './Sewa_Bhav-figure.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // config.json: try the network first (so a freshly published config reaches guests
  // right away), falling back to whatever was last cached if offline.
  if (url.pathname.endsWith('Sewa_Bhav.config.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first for instant, offline-capable loads.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
