const CACHE_NAME = 'stock-board-v2'; // 改成 v2 強制更新
const urlsToCache = [
  '/stock-one/',
  '/stock-one/index.html',
  '/stock-one/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // 刪除舊的 v1 快取
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // 絕對不快取 Yahoo 報價或 API
  if (event.request.url.includes('yahoo') || event.request.url.includes('api')) {
    return;
  }

  // 網路優先策略：先抓最新資料，斷網才給快取
  event.respondWith(
    fetch(event.request).then(networkResponse => {
      // 確保回應是正常的，才進行快取
      if (networkResponse && networkResponse.status === 200) {
        // 必須在這裡立刻 clone
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // 如果沒有網路，就從快取裡拿
      return caches.match(event.request);
    })
  );
});
