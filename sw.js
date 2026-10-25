// sw.js - Service Worker para PWA

// Evento de instalación
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    return self.clients.claim();
});

// Interceptor de peticiones de red
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});