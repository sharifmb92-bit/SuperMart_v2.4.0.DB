const CACHE_NAME = 'supermart-v2-9-1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png'
];

// 1. Instalación e intercepción inmediata
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activación: Elimina la caché v2.4.0 y cualquier versión previa
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Estrategia Network-First para archivos HTML/JS (Garantiza siempre la última versión)
self.addEventListener('fetch', e => {
  // Ignorar peticiones que no sean GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Si hay red, actualiza la caché con la respuesta fresca de GitHub
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay red (modo offline), usa la copia en caché
        return caches.match(e.request);
      })
  );
});
