// Minimaler Service Worker -- sorgt dafür, dass die App installierbar ist
// und die Oberfläche auch bei wackliger Verbindung sofort lädt.
// ISBN-Suche, Cloud-Speicherung und Kamera brauchen weiterhin eine aktive
// Internetverbindung -- nur die App-Oberfläche selbst wird zwischengespeichert.

const CACHE_NAME = 'kartei-shell-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Nur die eigene App-Oberfläche aus dem Cache bedienen -- alle externen
  // Anfragen (Worker, Google Books, Fonts, etc.) gehen immer normal ins Netz.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
