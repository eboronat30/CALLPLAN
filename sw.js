// Service worker de Territorio · Servier (Call Plan)
// Guarda la app en la caché del móvil para que funcione sin cobertura.

// Nombre de la caché. Si algún día quieres forzar una limpieza total, cambia el número.
const CACHE = 'callplan-v1';

// Archivos que se guardan al instalar la app.
const ARCHIVOS = ['./', './index.html'];

// 1) INSTALACIÓN: la primera vez, descarga y guarda los archivos básicos.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting(); // activa el service worker nuevo sin esperar
});

// 2) ACTIVACIÓN: borra cachés de versiones antiguas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
  );
  self.clients.claim(); // toma el control de la app abierta
});

// 3) PETICIONES: primero intenta internet; si no hay cobertura, usa la copia guardada.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // solo gestiona lecturas

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        // Si ha ido bien, guarda una copia fresca para la próxima vez sin conexión.
        if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copia));
        }
        return respuesta;
      })
      .catch(() =>
        // Sin conexión: devuelve lo guardado; si es una página, cae al index.html.
        caches
          .match(event.request)
          .then((guardado) => guardado || caches.match('./index.html'))
      )
  );
});
