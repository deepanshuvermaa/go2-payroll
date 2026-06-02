const CACHE_NAME = 'go2-payroll-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip non-GET, API calls, and video/range requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  if (e.request.headers.get('range')) return;

  e.respondWith(
    fetch(e.request).then(r => {
      // Only cache full responses (not 206 partial)
      if (r.status === 200) {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
