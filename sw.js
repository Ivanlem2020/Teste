const CACHE_NAME = 'remedios-app-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// ESCUTA AS MENSAGENS ENVIADAS PELO INDEX.HTML
self.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'SCHEDULE_NOTIFICATION' || event.data.type === 'TRIGGER_ALARM')) {
        
        const title = event.data.title || '🚨 HORA DO REMÉDIO!';
        const body = event.data.body || 'Está na hora de tomar seu medicamento.';
        const medPhoto = event.data.photo || null; // Se enviar a foto do remédio

        const options = {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png', // Ícone da notificação
            badge: 'https://cdn-icons-png.flaticon.com/512/883/883407.png', // Ícone miniatura na barra
            image: medPhoto || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop', // Banner expandido
            vibrate: [500, 100, 500, 100, 500, 100, 1000, 200, 1000], // Padrão de alarme forte
            tag: 'urgente-remedio',
            renotify: true,
            requireInteraction: true, // Mantém presa na tela até o usuário clicar
            silent: false,
            actions: [
                { action: 'confirm', title: '✅ Já Tomei' },
                { action: 'open', title: '👁️ Abrir App' }
            ]
        };

        const delay = event.data.delay || 0;

        if (delay > 0) {
            setTimeout(() => {
                self.registration.showNotification(title, options);
            }, delay);
        } else {
            self.registration.showNotification(title, options);
        }
    }
});

// TRATAMENTO DOS CLIQUES NAS AÇÕES DA NOTIFICAÇÃO
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Se clicar em "Já Tomei" ou na notificação em si, abre o app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
