"use strict";
/**
 * PWA Helper Functions for TLE Parser
 * Utilities for Progressive Web App features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServiceWorker = registerServiceWorker;
exports.unregisterServiceWorker = unregisterServiceWorker;
exports.requestNotificationPermission = requestNotificationPermission;
exports.showTLEUpdateNotification = showTLEUpdateNotification;
exports.registerBackgroundSync = registerBackgroundSync;
exports.isStandalone = isStandalone;
exports.setupInstallPrompt = setupInstallPrompt;
exports.clearAllCaches = clearAllCaches;
exports.getStorageEstimate = getStorageEstimate;
exports.requestPersistentStorage = requestPersistentStorage;
exports.isStoragePersisted = isStoragePersisted;
/**
 * Register the service worker
 * @param swUrl - URL to the service worker script
 * @returns ServiceWorkerRegistration or null
 */
async function registerServiceWorker(swUrl = '/sw.js') {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers are not supported in this browser');
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('Service Worker registered:', registration);
        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('New service worker available');
                        // Optionally notify the user about the update
                    }
                });
            }
        });
        return registration;
    }
    catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}
/**
 * Unregister all service workers
 */
async function unregisterServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const results = await Promise.all(registrations.map(registration => registration.unregister()));
        return results.every(result => result === true);
    }
    catch (error) {
        console.error('Failed to unregister service workers:', error);
        return false;
    }
}
/**
 * Request permission for notifications (useful for TLE update alerts)
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Notifications are not supported in this browser');
        return 'denied';
    }
    if (Notification.permission === 'granted') {
        return 'granted';
    }
    if (Notification.permission !== 'denied') {
        return await Notification.requestPermission();
    }
    return Notification.permission;
}
/**
 * Show a notification for TLE updates
 */
async function showTLEUpdateNotification(title, options) {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            ...options
        });
    }
}
/**
 * Register background sync for TLE data updates
 */
async function registerBackgroundSync(tag = 'sync-tle-data') {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
        console.warn('Background Sync is not supported in this browser');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
    }
    catch (error) {
        console.error('Background sync registration failed:', error);
    }
}
/**
 * Check if app is running in standalone mode (installed PWA)
 */
function isStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true);
}
/**
 * Prompt user to install PWA (show install banner)
 */
function setupInstallPrompt() {
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('Install prompt available');
    });
    return {
        prompt: async () => {
            if (!deferredPrompt) {
                throw new Error('Install prompt not available');
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install prompt outcome:', outcome);
            deferredPrompt = null;
        },
        isInstallable: () => deferredPrompt !== null
    };
}
/**
 * Clear all caches
 */
async function clearAllCaches() {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
    }
}
/**
 * Get cache storage estimate
 */
async function getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
    }
    return null;
}
/**
 * Request persistent storage
 */
async function requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
        return await navigator.storage.persist();
    }
    return false;
}
/**
 * Check if storage is persisted
 */
async function isStoragePersisted() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
        return await navigator.storage.persisted();
    }
    return false;
}
//# sourceMappingURL=pwaHelpers.js.map