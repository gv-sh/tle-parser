"use strict";
/**
 * Caching Layer with TTL Support
 * Provides LRU cache with time-to-live and optional persistence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tleCache = exports.TTLCache = void 0;
exports.generateCacheKey = generateCacheKey;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
/**
 * LRU Cache with TTL support
 */
class TTLCache {
    constructor(config = {}) {
        this.cache = new Map();
        this.accessOrder = [];
        this.persistTimer = null;
        this.maxSize = config.maxSize || 100;
        this.defaultTTL = config.defaultTTL || 3600000; // 1 hour default
        this.persistent = config.persistent || false;
        this.cacheDir = config.cacheDir || (0, path_1.join)((0, os_1.homedir)(), '.tle-parser', 'cache');
        this.cacheFile = config.cacheFile || 'tle-cache.json';
        if (this.persistent) {
            this.loadFromDisk().catch(() => {
                // Ignore errors on initial load
            });
            // Auto-save every 5 minutes
            this.persistTimer = setInterval(() => {
                this.saveToDisk().catch(() => {
                    // Ignore persistence errors
                });
            }, 300000);
        }
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            return undefined;
        }
        // Update access order (LRU)
        this.updateAccessOrder(key);
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        const entry = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        };
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder[0];
            if (oldestKey) {
                this.delete(oldestKey);
            }
        }
        this.cache.set(key, entry);
        this.updateAccessOrder(key);
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Delete entry from cache
     */
    delete(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        return this.cache.delete(key);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get cache size
     */
    size() {
        // Clean expired entries first
        this.cleanExpired();
        return this.cache.size;
    }
    /**
     * Clean expired entries
     */
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Get all keys
     */
    keys() {
        this.cleanExpired();
        return Array.from(this.cache.keys());
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const size = this.size();
        const oldest = this.accessOrder[0] || null;
        const newest = this.accessOrder[this.accessOrder.length - 1] || null;
        return {
            size,
            maxSize: this.maxSize,
            hitRate: 0, // Would need hit/miss tracking
            oldestEntry: oldest,
            newestEntry: newest
        };
    }
    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        this.accessOrder.push(key);
    }
    /**
     * Save cache to disk
     */
    async saveToDisk() {
        if (!this.persistent)
            return;
        try {
            // Ensure cache directory exists
            if (!(0, fs_1.existsSync)(this.cacheDir)) {
                await (0, promises_1.mkdir)(this.cacheDir, { recursive: true });
            }
            const data = {
                entries: Array.from(this.cache.entries()),
                accessOrder: this.accessOrder,
                timestamp: Date.now()
            };
            const cachePath = (0, path_1.join)(this.cacheDir, this.cacheFile);
            await (0, promises_1.writeFile)(cachePath, JSON.stringify(data, null, 2), 'utf8');
        }
        catch (error) {
            // Ignore persistence errors
            console.error('Failed to save cache to disk:', error);
        }
    }
    /**
     * Load cache from disk
     */
    async loadFromDisk() {
        if (!this.persistent)
            return;
        try {
            const cachePath = (0, path_1.join)(this.cacheDir, this.cacheFile);
            if (!(0, fs_1.existsSync)(cachePath)) {
                return;
            }
            const content = await (0, promises_1.readFile)(cachePath, 'utf8');
            const data = JSON.parse(content);
            // Restore cache entries
            this.cache.clear();
            for (const [key, entry] of data.entries) {
                this.cache.set(key, entry);
            }
            // Restore access order
            this.accessOrder = data.accessOrder || [];
            // Clean expired entries
            this.cleanExpired();
        }
        catch (error) {
            // Ignore load errors
            console.error('Failed to load cache from disk:', error);
        }
    }
    /**
     * Destroy cache and cleanup
     */
    destroy() {
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
            this.persistTimer = null;
        }
        if (this.persistent) {
            this.saveToDisk().catch(() => {
                // Ignore persistence errors
            });
        }
        this.clear();
    }
}
exports.TTLCache = TTLCache;
/**
 * Global cache instance for TLE data
 */
exports.tleCache = new TTLCache({
    maxSize: 1000,
    defaultTTL: 3600000, // 1 hour
    persistent: true,
    cacheFile: 'tle-data.json'
});
/**
 * Cache key generator for TLE sources
 */
function generateCacheKey(source, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return sortedParams ? `${source}:${sortedParams}` : source;
}
//# sourceMappingURL=cache.js.map