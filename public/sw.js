// 句读 — Service Worker
// 缓存策略：Network First（优先网络，失败时用缓存）

const CACHE_NAME = 'jvdu-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求：Network First 策略
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;
  // 跳过词典 API（不需要缓存）
  if (event.request.url.includes('api.dictionaryapi.dev')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 网络成功 → 更新缓存
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => {
        // 网络失败 → 尝试缓存
        return caches.match(event.request);
      })
  );
});
