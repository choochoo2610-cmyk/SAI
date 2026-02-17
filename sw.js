self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open("sai-cache").then(cache=>{
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./audioEngine.js",
        "./analyticsEngine.js",
        "./aiEngine.js"
      ]);
    })
  );
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(res=>res||fetch(e.request))
  );
});
