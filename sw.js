// Service worker de Sysneted — cache del "shell" para uso offline.
// Al publicar cambios, sube el número de VERSION para renovar el cache.
const VERSION = "sysneted-v1";
const SHELL = [
  "./", "./index.html", "./manifest.json", "./vendor/qrcode.js",
  "./Logo_Final.png", "./icon-192.png", "./icon-512.png",
  "./Banner1.jpg", "./Banner2.jpg", "./Banner3.jpg", "./Banner4.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo GET del mismo origen; los envíos a Web3Forms (POST, otro origen) no se tocan.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // Páginas: red primero, cache si no hay conexión.
    e.respondWith(
      fetch(req).then((r) => {
        const copia = r.clone();
        caches.open(VERSION).then((c) => c.put("./index.html", copia));
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Recursos estáticos: cache primero, actualiza en segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      const red = fetch(req).then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
        return r;
      }).catch(() => hit);
      return hit || red;
    })
  );
});
