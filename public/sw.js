const CACHE_NAME = 'pokemon-inventory-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache API calls to pokemontcg.io
                if (!event.request.url.includes('api.pokemontcg.io')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
  
  // Clean up old caches
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});