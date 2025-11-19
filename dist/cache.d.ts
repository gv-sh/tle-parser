/**
 * Caching Layer with TTL Support
 * Provides LRU cache with time-to-live and optional persistence
 */
/**
 * Cache configuration
 */
export interface CacheConfig {
    /** Maximum number of entries */
    maxSize?: number;
    /** Default TTL in milliseconds */
    defaultTTL?: number;
    /** Enable persistence to disk */
    persistent?: boolean;
    /** Cache directory path */
    cacheDir?: string;
    /** Cache file name */
    cacheFile?: string;
}
/**
 * LRU Cache with TTL support
 */
export declare class TTLCache<T = any> {
    private cache;
    private accessOrder;
    private readonly maxSize;
    private readonly defaultTTL;
    private readonly persistent;
    private readonly cacheDir;
    private readonly cacheFile;
    private persistTimer;
    constructor(config?: CacheConfig);
    /**
     * Get value from cache
     */
    get(key: string): T | undefined;
    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete entry from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Clean expired entries
     */
    cleanExpired(): number;
    /**
     * Get all keys
     */
    keys(): string[];
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    };
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
    /**
     * Save cache to disk
     */
    saveToDisk(): Promise<void>;
    /**
     * Load cache from disk
     */
    loadFromDisk(): Promise<void>;
    /**
     * Destroy cache and cleanup
     */
    destroy(): void;
}
/**
 * Global cache instance for TLE data
 */
export declare const tleCache: TTLCache<any>;
/**
 * Cache key generator for TLE sources
 */
export declare function generateCacheKey(source: string, params?: Record<string, any>): string;
//# sourceMappingURL=cache.d.ts.map