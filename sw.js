const CACHE_NAME = 'remedios-pwa-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './alarme.mp3'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});

const scheduledAlarms = new Map();

self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SCHEDULE_ALARM') {
        const { id, title, body, photo, delayMs } = event.data;
        
        if (scheduledAlarms.has(id)) {
            clearTimeout(scheduledAlarms.get(id));
        }

        const timerId = setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                icon: photo || 'https://via.placeholder.com/192/4a90e2/ffffff?text=💊',
                badge: 'https://via.placeholder.com/96/4a90e2/ffffff?text=💊',
                vibrate: [1000, 500, 1000, 500, 1000],
                sound: './alarme.mp3',
                tag: 'med-alarm-' + id,
                renotify: true,
                requireInteraction: true,
                data: { url: './' }
            });
            scheduledAlarms.delete(id);
        }, delayMs);

        scheduledAlarms.set(id, timerId);
    } else if (event.data.type === 'CANCEL_ALARM') {
        const { id } = event.data;
        if (scheduledAlarms.has(id)) {
            clearTimeout(scheduledAlarms.get(id));
            scheduledAlarms.delete(id);
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
