/**
 * Caching Layer with TTL Support
 * Provides LRU cache with time-to-live and optional persistence
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

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
export class TTLCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly persistent: boolean;
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private persistTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 100;
    this.defaultTTL = config.defaultTTL || 3600000; // 1 hour default
    this.persistent = config.persistent || false;
    this.cacheDir = config.cacheDir || join(homedir(), '.tle-parser', 'cache');
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
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

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
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
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
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
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
  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
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
  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Save cache to disk
   */
  async saveToDisk(): Promise<void> {
    if (!this.persistent) return;

    try {
      // Ensure cache directory exists
      if (!existsSync(this.cacheDir)) {
        await mkdir(this.cacheDir, { recursive: true });
      }

      const data = {
        entries: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder,
        timestamp: Date.now()
      };

      const cachePath = join(this.cacheDir, this.cacheFile);
      await writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      // Ignore persistence errors
      console.error('Failed to save cache to disk:', error);
    }
  }

  /**
   * Load cache from disk
   */
  async loadFromDisk(): Promise<void> {
    if (!this.persistent) return;

    try {
      const cachePath = join(this.cacheDir, this.cacheFile);

      if (!existsSync(cachePath)) {
        return;
      }

      const content = await readFile(cachePath, 'utf8');
      const data = JSON.parse(content);

      // Restore cache entries
      this.cache.clear();
      for (const [key, entry] of data.entries) {
        this.cache.set(key, entry as CacheEntry<T>);
      }

      // Restore access order
      this.accessOrder = data.accessOrder || [];

      // Clean expired entries
      this.cleanExpired();
    } catch (error) {
      // Ignore load errors
      console.error('Failed to load cache from disk:', error);
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
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

/**
 * Global cache instance for TLE data
 */
export const tleCache = new TTLCache({
  maxSize: 1000,
  defaultTTL: 3600000, // 1 hour
  persistent: true,
  cacheFile: 'tle-data.json'
});

/**
 * Cache key generator for TLE sources
 */
export function generateCacheKey(
  source: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return sortedParams ? `${source}:${sortedParams}` : source;
}
