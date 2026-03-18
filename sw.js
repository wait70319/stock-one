const CACHE_NAME = 'stock-board-v1';
// 注意：GitHub Pages 的路徑必須包含 repository 名稱
const urlsToCache = [
  '/stock-one/',
  '/stock-one/index.html',
  '/stock-one/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // 強制立即接管並更新
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // 清除舊版本的快取
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // 排除 Yahoo 報價或任何 API 請求，絕對不快取動態數據
  if (event.request.url.includes('yahoo') || event.request.url.includes('api')) {
    return;
  }

  // Stale-While-Revalidate 策略：先給快取求快，背景再偷偷更新
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          console.log('目前處於離線狀態，使用快取畫面');
        });

        return cachedResponse || fetchPromise;
      })
  );
});
