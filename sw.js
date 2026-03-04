const CACHE_NAME = 'ai-toolkit-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // сюда можно добавить пути к твоим CSS и JS файлам, если хочешь
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
