/**
 * IndexedDB Cache for TLE Parser
 * Provides persistent caching of TLE data in the browser using IndexedDB
 *
 * @example
 * ```typescript
 * import { IndexedDBCache } from 'tle-parser/browser';
 *
 * const cache = new IndexedDBCache('my-tle-cache');
 * await cache.init();
 *
 * // Store TLE data
 * await cache.set('ISS', tleData, 3600); // Cache for 1 hour
 *
 * // Retrieve TLE data
 * const cachedData = await cache.get('ISS');
 *
 * // Clear cache
 * await cache.clear();
 * ```
 */
export interface CacheEntry<T = any> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
    expiresAt: number;
}
/**
 * IndexedDB-based cache for browser applications
 */
export declare class IndexedDBCache {
    private dbName;
    private storeName;
    private db;
    private version;
    /**
     * Create a new IndexedDB cache
     * @param dbName - Name of the IndexedDB database
     */
    constructor(dbName?: string);
    /**
     * Initialize the database
     */
    init(): Promise<void>;
    /**
     * Store a value in the cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
     */
    set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
    /**
     * Retrieve a value from the cache
     * @param key - Cache key
     * @returns Cached value or null if not found or expired
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Check if a key exists in the cache (and is not expired)
     * @param key - Cache key
     */
    has(key: string): Promise<boolean>;
    /**
     * Delete a specific cache entry
     * @param key - Cache key
     */
    delete(key: string): Promise<void>;
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Remove expired entries from the cache
     */
    cleanupExpired(): Promise<number>;
    /**
     * Get all keys in the cache
     */
    keys(): Promise<string[]>;
    /**
     * Get cache size (number of entries)
     */
    size(): Promise<number>;
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Ensure the database is initialized
     */
    private ensureInitialized;
}
//# sourceMappingURL=indexedDBCache.d.ts.map