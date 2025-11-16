/**
 * Service Worker for Online Little Elf
 * 提供離線支援和快取功能
 */

const CACHE_NAME = 'online-little-elf-v2.1.0';
const RUNTIME_CACHE = 'runtime-cache-v2.1.0';

// 需要快取的靜態資源
const STATIC_CACHE_URLS = [
  '/',
  '/online-multiplayer-pacman-10players-fixed.html',
  '/manifest.json',
  // Firebase SDK (使用 CDN，離線時可能無法使用)
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// 安裝事件：快取靜態資源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // 強制立即啟用新的 Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// 啟用事件：清理舊快取
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 刪除舊版本的快取
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // 立即控制所有頁面
        return self.clients.claim();
      })
  );
});

// Fetch 事件：網路優先策略（適合即時遊戲）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase 請求：始終使用網路（即時資料）
  if (url.hostname.includes('firebase')) {
    event.respondWith(fetch(request));
    return;
  }

  // 靜態資源：快取優先策略
  if (request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'manifest') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            // 同時在背景更新快取
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            });
            return cachedResponse;
          }

          // 沒有快取，從網路獲取
          console.log('[Service Worker] Fetching from network:', request.url);
          return fetch(request).then((response) => {
            // 快取有效的回應
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          // 可以返回離線頁面
          return new Response('離線模式：無法連接到伺服器', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=UTF-8'
            })
          });
        })
    );
  }
});

// 訊息事件：處理來自頁面的訊息
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.addAll(urls);
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('[Service Worker] All caches cleared');
    });
  }
});

// 同步事件：背景同步（需要瀏覽器支援）
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-game-data') {
    event.waitUntil(
      // 這裡可以同步遊戲數據到 Firebase
      Promise.resolve()
    );
  }
});

// 推送通知事件（預留）
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const options = {
    body: event.data ? event.data.text() : '遊戲更新通知',
    icon: 'icon-192.png',
    badge: 'icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看',
        icon: 'icon-96.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: 'icon-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('線上多人小精靈', options)
  );
});

// 通知點擊事件
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/online-multiplayer-pacman-10players-fixed.html')
  );
});

console.log('[Service Worker] Loaded and ready');
