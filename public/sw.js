// Service worker: guarda la app en el dispositivo para que funcione sin internet.
// El build pone la versión en CACHE en cada publicación; al cambiar, se borra lo viejo.
const CACHE = 'verita-__VERSION__';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('verita-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // La página: primero internet (para tener siempre la última versión); sin conexión, la guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Íconos, manifiesto y fuentes de Google: primero lo guardado, y se actualiza por detrás
  const propio  = url.origin === self.location.origin;
  const fuentes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!propio && !fuentes) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const guardado = await c.match(req);
    const red = fetch(req)
      .then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; })
      .catch(() => guardado);
    return guardado || red;
  }));
});
