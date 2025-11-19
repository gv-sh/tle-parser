"use strict";
/**
 * LocalStorage Persistence for TLE Parser
 * Provides simple key-value storage for TLE data using localStorage
 *
 * @example
 * ```typescript
 * import { LocalStorageCache } from 'tle-parser/browser';
 *
 * const cache = new LocalStorageCache('tle-');
 *
 * // Store TLE data
 * cache.set('ISS', tleData, 3600); // Cache for 1 hour
 *
 * // Retrieve TLE data
 * const cachedData = cache.get('ISS');
 *
 * // Clear cache
 * cache.clear();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageCache = void 0;
/**
 * LocalStorage-based cache for browser applications
 * Simpler alternative to IndexedDB for smaller datasets
 */
class LocalStorageCache {
    /**
     * Create a new localStorage cache
     * @param prefix - Prefix for all cache keys (default: 'tle-cache-')
     */
    constructor(prefix = 'tle-cache-') {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not supported in this environment');
        }
        this.prefix = prefix;
    }
    /**
     * Store a value in the cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
     */
    set(key, value, ttl = 3600) {
        const timestamp = Date.now();
        const entry = {
            value,
            timestamp,
            ttl,
            expiresAt: timestamp + (ttl * 1000)
        };
        try {
            const serialized = JSON.stringify(entry);
            localStorage.setItem(this.prefix + key, serialized);
        }
        catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                // Storage quota exceeded, try to clean up expired entries
                this.cleanupExpired();
                // Try again
                try {
                    const serialized = JSON.stringify(entry);
                    localStorage.setItem(this.prefix + key, serialized);
                }
                catch {
                    throw new Error('localStorage quota exceeded and cleanup failed');
                }
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Retrieve a value from the cache
     * @param key - Cache key
     * @returns Cached value or null if not found or expired
     */
    get(key) {
        const item = localStorage.getItem(this.prefix + key);
        if (!item) {
            return null;
        }
        try {
            const entry = JSON.parse(item);
            // Check if expired
            if (Date.now() > entry.expiresAt) {
                this.delete(key);
                return null;
            }
            return entry.value;
        }
        catch (error) {
            // Invalid data, remove it
            this.delete(key);
            return null;
        }
    }
    /**
     * Check if a key exists in the cache (and is not expired)
     * @param key - Cache key
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Delete a specific cache entry
     * @param key - Cache key
     */
    delete(key) {
        localStorage.removeItem(this.prefix + key);
    }
    /**
     * Clear all cache entries with this prefix
     */
    clear() {
        const keys = this.keys();
        keys.forEach(key => this.delete(key));
    }
    /**
     * Remove expired entries from the cache
     * @returns Number of entries removed
     */
    cleanupExpired() {
        const keys = this.keys();
        let deletedCount = 0;
        keys.forEach(key => {
            const value = this.get(key);
            if (value === null) {
                deletedCount++;
            }
        });
        return deletedCount;
    }
    /**
     * Get all cache keys (without prefix)
     */
    keys() {
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                allKeys.push(key.substring(this.prefix.length));
            }
        }
        return allKeys;
    }
    /**
     * Get cache size (number of entries)
     */
    size() {
        return this.keys().length;
    }
    /**
     * Get storage usage in bytes (approximate)
     */
    getStorageSize() {
        const keys = this.keys();
        let totalSize = 0;
        keys.forEach(key => {
            const item = localStorage.getItem(this.prefix + key);
            if (item) {
                totalSize += item.length * 2; // UTF-16 uses 2 bytes per character
            }
        });
        return totalSize;
    }
    /**
     * Get formatted storage size
     */
    getFormattedStorageSize() {
        const bytes = this.getStorageSize();
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    /**
     * Get all entries with metadata
     */
    getAllEntries() {
        const keys = this.keys();
        const entries = [];
        keys.forEach(key => {
            const item = localStorage.getItem(this.prefix + key);
            if (item) {
                try {
                    const entry = JSON.parse(item);
                    entries.push({ key, ...entry });
                }
                catch {
                    // Skip invalid entries
                }
            }
        });
        return entries;
    }
    /**
     * Export cache to JSON
     */
    export() {
        const entries = this.getAllEntries();
        return JSON.stringify(entries, null, 2);
    }
    /**
     * Import cache from JSON
     * @param json - JSON string to import
     * @param merge - If true, merge with existing cache; if false, replace
     */
    import(json, merge = false) {
        if (!merge) {
            this.clear();
        }
        try {
            const entries = JSON.parse(json);
            entries.forEach(entry => {
                const { key, value, ttl } = entry;
                this.set(key, value, ttl);
            });
        }
        catch (error) {
            throw new Error('Failed to import cache: invalid JSON format');
        }
    }
}
exports.LocalStorageCache = LocalStorageCache;
//# sourceMappingURL=localStorage.js.map