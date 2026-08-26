const CACHE_NAME = 'remedios-pwa-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Tenta salvar o MP3 sem travar o instalador caso ele falhe
            cache.add('./alarme.mp3').catch(err => console.log('Áudio opcional não encontrado no cache inicial:', err));
            return cache.addAll(ASSETS);
        })
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
    // Ignora requisições para a API do Cloudinary ou JSONBin do cache local
    if (event.request.url.includes('cloudinary.com') || event.request.url.includes('jsonbin.io')) {
        return;
    }

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
                icon: photo || 'https://raw.githubusercontent.com/google/material-design-icons/master/png/health/medication/materialicons/192pt/2x/baseline_medication_black_192pt_2x.png',
                badge: 'https://raw.githubusercontent.com/google/material-design-icons/master/png/health/medication/materialicons/192pt/2x/baseline_medication_black_192pt_2x.png',
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
