self.addEventListener("install", evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open("ImageAnalyser")
    .then(cache => cache.addAll([
      "/",
      "/img/favicon.png",
      "/img/icon-512.png",
      "/img/mask-icon.png",
      "/jscript/jscript.js",
      "/jscript/application.js",
      "/css/style.css",
      "/css/fonts.css",
      "/fonts/Roboto-Regular.ttf",
      "/manifest.json",
      "/index.html"
    ]))
    .catch(err => console.error(err)) 
  );
});
 
self.addEventListener("activate", () =>
  self.clients.claim()
);

self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => {
      return res || fetch(evt.request)
    })
  );
});
