/**
 * TLE Data Sources Module
 * Implements fetchers for CelesTrak, Space-Track.org, and other TLE data sources
 * with authentication, caching, rate limiting, and failover support
 */
import type { ParsedTLE } from './types';
import type { BatchParseOptions } from './advancedParser';
/**
 * TLE data source type
 */
export type TLESourceType = 'celestrak' | 'spacetrack' | 'amsat' | 'custom';
/**
 * Data source configuration
 */
export interface DataSourceConfig {
    /** Source type */
    type: TLESourceType;
    /** Base URL */
    baseUrl: string;
    /** API key or credentials */
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
        token?: string;
    };
    /** Rate limit configuration */
    rateLimit?: {
        maxRequests: number;
        intervalMs: number;
    };
    /** Enable caching */
    enableCache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Custom headers */
    headers?: Record<string, string>;
}
/**
 * Fetch options for TLE data
 */
export interface FetchOptions {
    /** Satellite catalog number(s) */
    catalogNumber?: number | number[];
    /** Constellation name */
    constellation?: string;
    /** Satellite name pattern */
    namePattern?: string;
    /** International designator */
    intlDesignator?: string;
    /** Specific group (e.g., 'stations', 'visual', 'active') */
    group?: string;
    /** Custom query parameters */
    queryParams?: Record<string, string>;
    /** Force refresh (bypass cache) */
    forceRefresh?: boolean;
    /** Parse options */
    parseOptions?: BatchParseOptions;
}
/**
 * Fetch result with metadata
 */
export interface FetchResult {
    /** Parsed TLE data */
    data: ParsedTLE[];
    /** Source name */
    source: string;
    /** Timestamp of fetch */
    timestamp: Date;
    /** Whether data was from cache */
    cached: boolean;
    /** Number of TLEs fetched */
    count: number;
    /** Data freshness (age in milliseconds) */
    age: number;
}
/**
 * CelesTrak TLE data source
 * Public API, no authentication required
 * Documentation: https://celestrak.org/NORAD/documentation/
 */
export declare class CelesTrakSource {
    private baseUrl;
    private rateLimiter;
    private cache;
    private config;
    constructor(config?: Partial<DataSourceConfig>);
    /**
     * Fetch TLE data from CelesTrak
     */
    fetch(options?: FetchOptions): Promise<FetchResult>;
    /**
     * Build URL with query parameters
     */
    private buildUrl;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    };
}
/**
 * Space-Track.org TLE data source
 * Requires authentication
 * Documentation: https://www.space-track.org/documentation
 */
export declare class SpaceTrackSource {
    private baseUrl;
    private authUrl;
    private queryUrl;
    private rateLimiter;
    private cache;
    private config;
    private sessionCookie;
    private lastAuth;
    private authTTL;
    constructor(config?: Partial<DataSourceConfig>);
    /**
     * Authenticate with Space-Track.org
     */
    private authenticate;
    /**
     * Fetch TLE data from Space-Track.org
     */
    fetch(options?: FetchOptions): Promise<FetchResult>;
    /**
     * Build query URL
     */
    private buildUrl;
    /**
     * Convert Space-Track JSON to TLE format
     */
    private jsonToTLE;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    };
    /**
     * Logout and clear session
     */
    logout(): void;
}
/**
 * AMSAT amateur radio satellite data source
 * Public API, no authentication required
 */
export declare class AMSATSource {
    private baseUrl;
    private rateLimiter;
    private cache;
    private config;
    constructor(config?: Partial<DataSourceConfig>);
    /**
     * Fetch TLE data from AMSAT
     */
    fetch(options?: FetchOptions): Promise<FetchResult>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    };
}
/**
 * Custom TLE data source
 * For user-defined URLs
 */
export declare class CustomSource {
    private rateLimiter;
    private cache;
    private config;
    constructor(config: DataSourceConfig);
    /**
     * Fetch TLE data from custom source
     */
    fetch(options?: FetchOptions): Promise<FetchResult>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    };
}
/**
 * Data source manager with failover support
 */
export declare class DataSourceManager {
    private sources;
    private primarySource;
    private failoverOrder;
    /**
     * Register a data source
     */
    register(name: string, source: CelesTrakSource | SpaceTrackSource | AMSATSource | CustomSource, options?: {
        primary?: boolean;
        failover?: boolean;
    }): void;
    /**
     * Fetch TLE data with failover
     */
    fetch(sourceName: string | null, options?: FetchOptions): Promise<FetchResult>;
    /**
     * Get a specific source
     */
    getSource(name: string): CelesTrakSource | SpaceTrackSource | AMSATSource | CustomSource | undefined;
    /**
     * List all registered sources
     */
    listSources(): string[];
    /**
     * Clear all caches
     */
    clearAllCaches(): void;
}
/**
 * Validate TLE freshness
 */
export interface FreshnessValidation {
    isFresh: boolean;
    age: number;
    epochDate: Date;
    message: string;
}
/**
 * Check if TLE data is fresh
 */
export declare function validateFreshness(tle: ParsedTLE, maxAgeMs?: number): FreshnessValidation;
/**
 * Filter TLEs by freshness
 */
export declare function filterByFreshness(tles: ParsedTLE[], maxAgeMs?: number): ParsedTLE[];
//# sourceMappingURL=dataSources.d.ts.map