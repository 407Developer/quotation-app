const CACHE_NAME = "quotation-app-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/js/calc.js",
  "/js/model.js",
  "/js/rules.js",
  "/js/state.js",
  "/js/storage.js",
  "/js/ui.js",
  "/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
