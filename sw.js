self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Standard passthrough for Spotify API calls
    event.respondWith(fetch(event.request));
});
