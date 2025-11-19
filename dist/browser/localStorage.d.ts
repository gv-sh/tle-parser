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
export interface LocalStorageEntry<T = any> {
    value: T;
    timestamp: number;
    ttl: number;
    expiresAt: number;
}
/**
 * LocalStorage-based cache for browser applications
 * Simpler alternative to IndexedDB for smaller datasets
 */
export declare class LocalStorageCache {
    private prefix;
    /**
     * Create a new localStorage cache
     * @param prefix - Prefix for all cache keys (default: 'tle-cache-')
     */
    constructor(prefix?: string);
    /**
     * Store a value in the cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
     */
    set<T = any>(key: string, value: T, ttl?: number): void;
    /**
     * Retrieve a value from the cache
     * @param key - Cache key
     * @returns Cached value or null if not found or expired
     */
    get<T = any>(key: string): T | null;
    /**
     * Check if a key exists in the cache (and is not expired)
     * @param key - Cache key
     */
    has(key: string): boolean;
    /**
     * Delete a specific cache entry
     * @param key - Cache key
     */
    delete(key: string): void;
    /**
     * Clear all cache entries with this prefix
     */
    clear(): void;
    /**
     * Remove expired entries from the cache
     * @returns Number of entries removed
     */
    cleanupExpired(): number;
    /**
     * Get all cache keys (without prefix)
     */
    keys(): string[];
    /**
     * Get cache size (number of entries)
     */
    size(): number;
    /**
     * Get storage usage in bytes (approximate)
     */
    getStorageSize(): number;
    /**
     * Get formatted storage size
     */
    getFormattedStorageSize(): string;
    /**
     * Get all entries with metadata
     */
    getAllEntries<T = any>(): Array<{
        key: string;
        value: T;
        timestamp: number;
        ttl: number;
        expiresAt: number;
    }>;
    /**
     * Export cache to JSON
     */
    export(): string;
    /**
     * Import cache from JSON
     * @param json - JSON string to import
     * @param merge - If true, merge with existing cache; if false, replace
     */
    import(json: string, merge?: boolean): void;
}
//# sourceMappingURL=localStorage.d.ts.map