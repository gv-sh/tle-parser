"use strict";
/**
 * Service Worker for TLE Parser PWA Support
 * Enables offline caching and background sync for Progressive Web Apps
 *
 * To register this service worker:
 * ```typescript
 * if ('serviceWorker' in navigator) {
 *   navigator.serviceWorker.register('/sw.js')
 *     .then(reg => console.log('SW registered', reg))
 *     .catch(err => console.error('SW registration failed', err));
 * }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
const STATIC_CACHE_NAME = 'tle-parser-static-v1';
const DATA_CACHE_NAME = 'tle-parser-data-v1';
// Files to cache immediately on install
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json'
];
// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
    }).then(() => {
        return self.skipWaiting();
    }));
});
// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                console.log('[SW] Removing old cache:', cacheName);
                return caches.delete(cacheName);
            }
            return undefined;
        }));
    }).then(() => {
        return self.clients.claim();
    }));
});
// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    // Handle TLE data requests differently
    if (url.pathname.includes('/tle') || url.pathname.includes('.txt')) {
        event.respondWith(caches.open(DATA_CACHE_NAME).then((cache) => {
            return fetch(request).then((response) => {
                // Cache fresh TLE data
                cache.put(request, response.clone());
                return response;
            }).catch(() => {
                // Fallback to cached data if offline
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    throw new Error('No cached response available');
                });
            });
        }));
        return;
    }
    // Handle static files
    event.respondWith(caches.match(request).then((response) => {
        if (response) {
            return response;
        }
        return fetch(request).then((response) => {
            // Cache new static files
            if (request.method === 'GET') {
                caches.open(STATIC_CACHE_NAME).then((cache) => {
                    cache.put(request, response.clone());
                });
            }
            return response;
        });
    }));
});
// Message event - handle commands from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }));
    }
    if (event.data && event.data.type === 'CACHE_TLE') {
        const { url } = event.data;
        event.waitUntil(caches.open(DATA_CACHE_NAME).then((cache) => {
            return cache.add(url);
        }));
    }
});
// Background sync for TLE updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tle-data') {
        event.waitUntil(syncTLEData());
    }
});
/**
 * Sync TLE data in the background
 */
async function syncTLEData() {
    console.log('[SW] Syncing TLE data...');
    try {
        // Fetch updated TLE data from configured sources
        const response = await fetch('/api/tle/latest');
        if (response.ok) {
            const cache = await caches.open(DATA_CACHE_NAME);
            await cache.put('/api/tle/latest', response);
            console.log('[SW] TLE data synced successfully');
        }
    }
    catch (error) {
        console.error('[SW] Failed to sync TLE data:', error);
        throw error; // Retry sync
    }
}
//# sourceMappingURL=serviceWorker.js.map