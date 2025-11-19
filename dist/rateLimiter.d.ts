/**
 * Rate Limiter for API Compliance
 * Implements token bucket algorithm with per-source rate limits
 */
/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    /** Maximum number of requests per interval */
    maxRequests: number;
    /** Time interval in milliseconds */
    intervalMs: number;
    /** Maximum queue size (0 = unlimited) */
    maxQueueSize?: number;
}
/**
 * Rate limiter using token bucket algorithm
 */
export declare class RateLimiter {
    private config;
    private tokens;
    private lastRefill;
    private queue;
    private processing;
    constructor(config: RateLimitConfig);
    /**
     * Refill tokens based on elapsed time
     */
    private refillTokens;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Acquire a token to make a request
     * Returns a promise that resolves when a token is available
     */
    acquire(): Promise<void>;
    /**
     * Execute a function with rate limiting
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Get current rate limiter status
     */
    getStatus(): {
        tokens: number;
        queueLength: number;
        maxRequests: number;
        intervalMs: number;
    };
    /**
     * Clear the queue
     */
    clearQueue(): void;
    /**
     * Reset the rate limiter
     */
    reset(): void;
}
/**
 * Multi-source rate limiter manager
 */
export declare class RateLimiterManager {
    private limiters;
    /**
     * Register a rate limiter for a source
     */
    register(source: string, config: RateLimitConfig): void;
    /**
     * Get rate limiter for a source
     */
    get(source: string): RateLimiter | undefined;
    /**
     * Acquire a token for a source
     */
    acquire(source: string): Promise<void>;
    /**
     * Execute a function with rate limiting for a source
     */
    execute<T>(source: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Get status for all rate limiters
     */
    getAllStatus(): Map<string, ReturnType<RateLimiter['getStatus']>>;
    /**
     * Reset all rate limiters
     */
    resetAll(): void;
}
//# sourceMappingURL=rateLimiter.d.ts.map