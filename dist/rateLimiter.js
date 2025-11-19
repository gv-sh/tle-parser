"use strict";
/**
 * Rate Limiter for API Compliance
 * Implements token bucket algorithm with per-source rate limits
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterManager = exports.RateLimiter = void 0;
/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
    constructor(config) {
        this.config = config;
        this.queue = [];
        this.processing = false;
        this.tokens = config.maxRequests;
        this.lastRefill = Date.now();
    }
    /**
     * Refill tokens based on elapsed time
     */
    refillTokens() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = (elapsed / this.config.intervalMs) * this.config.maxRequests;
        if (tokensToAdd >= 1) {
            this.tokens = Math.min(this.config.maxRequests, this.tokens + Math.floor(tokensToAdd));
            this.lastRefill = now;
        }
    }
    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            this.refillTokens();
            if (this.tokens >= 1) {
                const item = this.queue.shift();
                if (item) {
                    this.tokens -= 1;
                    item.resolve();
                }
            }
            else {
                // Wait until next refill
                const waitTime = this.config.intervalMs - (Date.now() - this.lastRefill);
                if (waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        this.processing = false;
    }
    /**
     * Acquire a token to make a request
     * Returns a promise that resolves when a token is available
     */
    async acquire() {
        this.refillTokens();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return Promise.resolve();
        }
        // Check queue size limit
        if (this.config.maxQueueSize && this.queue.length >= this.config.maxQueueSize) {
            throw new Error('Rate limiter queue is full');
        }
        // Queue the request
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                timestamp: Date.now()
            });
            this.processQueue();
        });
    }
    /**
     * Execute a function with rate limiting
     */
    async execute(fn) {
        await this.acquire();
        return fn();
    }
    /**
     * Get current rate limiter status
     */
    getStatus() {
        this.refillTokens();
        return {
            tokens: this.tokens,
            queueLength: this.queue.length,
            maxRequests: this.config.maxRequests,
            intervalMs: this.config.intervalMs
        };
    }
    /**
     * Clear the queue
     */
    clearQueue() {
        for (const item of this.queue) {
            item.reject(new Error('Rate limiter queue cleared'));
        }
        this.queue = [];
    }
    /**
     * Reset the rate limiter
     */
    reset() {
        this.tokens = this.config.maxRequests;
        this.lastRefill = Date.now();
        this.clearQueue();
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Multi-source rate limiter manager
 */
class RateLimiterManager {
    constructor() {
        this.limiters = new Map();
    }
    /**
     * Register a rate limiter for a source
     */
    register(source, config) {
        this.limiters.set(source, new RateLimiter(config));
    }
    /**
     * Get rate limiter for a source
     */
    get(source) {
        return this.limiters.get(source);
    }
    /**
     * Acquire a token for a source
     */
    async acquire(source) {
        const limiter = this.limiters.get(source);
        if (!limiter) {
            throw new Error(`No rate limiter registered for source: ${source}`);
        }
        return limiter.acquire();
    }
    /**
     * Execute a function with rate limiting for a source
     */
    async execute(source, fn) {
        const limiter = this.limiters.get(source);
        if (!limiter) {
            throw new Error(`No rate limiter registered for source: ${source}`);
        }
        return limiter.execute(fn);
    }
    /**
     * Get status for all rate limiters
     */
    getAllStatus() {
        const status = new Map();
        for (const [source, limiter] of this.limiters) {
            status.set(source, limiter.getStatus());
        }
        return status;
    }
    /**
     * Reset all rate limiters
     */
    resetAll() {
        for (const limiter of this.limiters.values()) {
            limiter.reset();
        }
    }
}
exports.RateLimiterManager = RateLimiterManager;
//# sourceMappingURL=rateLimiter.js.map