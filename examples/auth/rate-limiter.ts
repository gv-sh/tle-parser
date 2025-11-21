/**
 * Rate Limiting Middleware
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      windowMs: config.windowMs || 60000, // 1 minute
      maxRequests: config.maxRequests || 100,
      message: config.message || 'Too many requests, please try again later',
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skip: config.skip || (() => false),
      handler: config.handler || this.defaultHandler,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private defaultKeyGenerator(req: Request): string {
    return (req.header('X-API-Key') || req.ip || 'unknown').toString();
  }

  private defaultHandler(req: Request, res: Response): void {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: this.config.message,
        retryAfter: this.getRetryAfter(req),
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getRetryAfter(req: Request): number {
    const key = this.config.keyGenerator(req);
    const entry = this.store.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.ceil((entry.resetTime - now) / 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.config.skip(req)) {
        return next();
      }

      const key = this.config.keyGenerator(req);
      const now = Date.now();
      const entry = this.store.get(key);

      if (!entry || now > entry.resetTime) {
        // Create new entry
        this.store.set(key, {
          count: 1,
          resetTime: now + this.config.windowMs,
        });

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', this.config.maxRequests - 1);
        res.setHeader('X-RateLimit-Reset', new Date(now + this.config.windowMs).toISOString());

        return next();
      }

      if (entry.count >= this.config.maxRequests) {
        // Rate limit exceeded
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
        res.setHeader('Retry-After', this.getRetryAfter(req));

        return this.config.handler(req, res);
      }

      // Increment count
      entry.count++;

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.config.maxRequests - entry.count);
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

      next();
    };
  }
}

/**
 * Redis-based rate limiter (for production)
 */
export class RedisRateLimiter {
  private redis: any; // Redis client
  private config: Required<RateLimitConfig>;

  constructor(redisClient: any, config: RateLimitConfig = {}) {
    this.redis = redisClient;
    this.config = {
      windowMs: config.windowMs || 60000,
      maxRequests: config.maxRequests || 100,
      message: config.message || 'Too many requests',
      keyGenerator: config.keyGenerator || ((req: Request) => req.ip || 'unknown'),
      skip: config.skip || (() => false),
      handler: config.handler || this.defaultHandler,
    };
  }

  private defaultHandler(req: Request, res: Response): void {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: this.config.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (this.config.skip(req)) {
        return next();
      }

      const key = `ratelimit:${this.config.keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      try {
        // Remove old entries
        await this.redis.zremrangebyscore(key, 0, windowStart);

        // Count requests in window
        const count = await this.redis.zcard(key);

        if (count >= this.config.maxRequests) {
          return this.config.handler(req, res);
        }

        // Add new request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));

        // Add headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', this.config.maxRequests - count - 1);

        next();
      } catch (error: any) {
        console.error('Rate limiter error:', error);
        next(); // Fail open
      }
    };
  }
}

/**
 * Example usage
 */
export function createRateLimiter(type: 'memory' | 'redis' = 'memory', redisClient?: any) {
  if (type === 'redis' && redisClient) {
    return new RedisRateLimiter(redisClient, {
      windowMs: 60000,
      maxRequests: 100,
    });
  }

  return new RateLimiter({
    windowMs: 60000,
    maxRequests: 100,
  });
}
