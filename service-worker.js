const CACHE_NAME = "task-reward-app-v1";
const URLS_TO_CACHE = [
  "index.html",
  "rewards.html",
  "archive.html",
  "app.js",
  "rewards.js",
  "archive.js",
  "manifest.json"
  // CSSファイルを作ったらここに追加
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
