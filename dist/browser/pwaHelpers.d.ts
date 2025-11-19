/**
 * PWA Helper Functions for TLE Parser
 * Utilities for Progressive Web App features
 */
/**
 * Register the service worker
 * @param swUrl - URL to the service worker script
 * @returns ServiceWorkerRegistration or null
 */
export declare function registerServiceWorker(swUrl?: string): Promise<ServiceWorkerRegistration | null>;
/**
 * Unregister all service workers
 */
export declare function unregisterServiceWorker(): Promise<boolean>;
/**
 * Request permission for notifications (useful for TLE update alerts)
 */
export declare function requestNotificationPermission(): Promise<NotificationPermission>;
/**
 * Show a notification for TLE updates
 */
export declare function showTLEUpdateNotification(title: string, options?: NotificationOptions): Promise<void>;
/**
 * Register background sync for TLE data updates
 */
export declare function registerBackgroundSync(tag?: string): Promise<void>;
/**
 * Check if app is running in standalone mode (installed PWA)
 */
export declare function isStandalone(): boolean;
/**
 * Prompt user to install PWA (show install banner)
 */
export declare function setupInstallPrompt(): {
    prompt: () => Promise<void>;
    isInstallable: () => boolean;
};
/**
 * Clear all caches
 */
export declare function clearAllCaches(): Promise<void>;
/**
 * Get cache storage estimate
 */
export declare function getStorageEstimate(): Promise<StorageEstimate | null>;
/**
 * Request persistent storage
 */
export declare function requestPersistentStorage(): Promise<boolean>;
/**
 * Check if storage is persisted
 */
export declare function isStoragePersisted(): Promise<boolean>;
//# sourceMappingURL=pwaHelpers.d.ts.map