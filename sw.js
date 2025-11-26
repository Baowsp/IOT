// sw.js - Phiên bản đã sửa lỗi

const CACHE_NAME = 'smart-home-pwa-v2'; // Đổi tên cache để trình duyệt biết có cập nhật

// Danh sách file cần cache (Bao gồm cả thư viện online)
const FILES_TO_CACHE = [
  './smart_home_app.html', // Đảm bảo tên file HTML của bạn đúng y hệt thế này
  './manifest.json',
  
  // Cache luôn các thư viện CDN để app không bị vỡ giao diện khi Offline
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://cdn.socket.io/4.7.2/socket.io.min.js'
];

self.addEventListener('install', (event) => {
  console.log('SW: Đang cài đặt...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dùng {cache: 'reload'} để ép trình duyệt tải mới nhất từ mạng về lưu
      return cache.addAll(FILES_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Đang kích hoạt...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('SW: Xóa cache cũ', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // --- SỬA LỖI Ở ĐÂY: Phải khai báo biến url trước khi dùng ---
  const url = new URL(event.request.url);

  // Bỏ qua Socket.IO và các API Server (Port 3000, 5000)
  // Logic: Nếu đường dẫn chứa socket.io HOẶC port là 3000/5000 -> Không cache
  if (url.pathname.includes('/socket.io/') || url.port === '3000' || url.port === '5000' || url.pathname.includes('/stream')) {
    return; // Trả về để mạng tự xử lý
  }

  // Chiến lược: Cache First (Ưu tiên Cache) cho file tĩnh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});