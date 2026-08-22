// CreatiHub Service Worker — Phase 7 PWA
// Caches the app shell for offline use and enables installable PWA

const CACHE_NAME = 'creatihub-v1-' + new Date().toISOString().slice(0, 10);
const APP_SHELL = [
  '/',
  '/index.html',
  '/services.html',
  '/order.html',
  '/dashboard.html',
  '/auth.html',
  '/admin.html',
  '/css/style.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache resources individually so one failure doesn't break everything
      return Promise.allSettled(
        APP_SHELL.map((url) =>
          fetch(url, { cache: 'no-store' })
            .then((resp) => {
              if (resp.ok) return cache.put(url, resp);
            })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('creatihub-v1-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for navigation (HTML pages) and API calls
  if (req.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          // Cache successful navigation responses
          if (resp.ok && req.mode === 'navigate') {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          }
          return resp;
        })
        .catch(() => {
          // Fall back to cache for navigation, or cached index for API failures
          if (req.mode === 'navigate') {
            return caches.match(req).then((cached) => cached || caches.match('/index.html'));
          }
          return new Response(JSON.stringify({ error: 'You are offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images, icons)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          if (resp.ok && resp.type === 'basic') {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});
