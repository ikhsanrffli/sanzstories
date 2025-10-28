// sw.js
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Dicoding Story';
    const options = {
      body: data.options?.body || 'Ada cerita baru!',
      icon: '/icon-192.png', // opsional
      badge: '/badge.png'    // opsional
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});