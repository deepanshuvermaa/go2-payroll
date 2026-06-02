const CACHE_NAME = 'go2-payroll-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Skip: non-GET, API, videos, range requests, chrome-extension
  if (e.request.method !== 'GET') return;
  if (url.includes('/api/')) return;
  if (url.includes('.mp4')) return;
  if (e.request.headers.get('range')) return;
  if (!url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request).then(r => {
      if (r.status === 200 && r.type === 'basic') {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {});
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
