// Bump this version string every time you update the app files.
// The browser detects the change, installs the new worker, and clears old caches.
const CACHE_VERSION = 'btb-v6';
const ASSETS = ['/index.html'];

// On install: cache fresh assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activate immediately, don't wait
  );
});

// On activate: delete every old cache version
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

// On fetch: network-first for HTML (always get latest UI),
// cache-first for everything else (fonts, images)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch index.html fresh from network, fall back to cache if offline
  if (url.pathname.endsWith('index.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Update cache with the fresh version
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
