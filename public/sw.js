const BASE = self.registration.scope;
const CACHE = 'zenura-stock-picker-shell-v4';
const CORE = ['.', 'index.html', 'manifest.webmanifest', 'icons/icon.svg'].map(path => new URL(path, BASE).toString());

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('zenura-stock-picker-') && key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(BASE)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(
          caches.open(CACHE)
            .then(cache => cache.put(event.request, copy))
            .catch(() => undefined)
        );
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await caches.match(new URL('index.html', BASE).toString())) || Response.error();
      }
      return Response.error();
    }
  })());
});
