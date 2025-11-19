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
  ttl: number; // Time to live in seconds
  expiresAt: number;
}

/**
 * IndexedDB-based cache for browser applications
 */
export class IndexedDBCache {
  private dbName: string;
  private storeName: string = 'tle-cache';
  private db: IDBDatabase | null = null;
  private version: number = 1;

  /**
   * Create a new IndexedDB cache
   * @param dbName - Name of the IndexedDB database
   */
  constructor(dbName: string = 'tle-parser-cache') {
    this.dbName = dbName;

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported in this environment');
    }
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB: ' + request.error?.message));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
          objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  /**
   * Store a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set<T = any>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.ensureInitialized();

    const timestamp = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp,
      ttl,
      expiresAt: timestamp + (ttl * 1000)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store cache entry: ' + request.error?.message));
    });
  }

  /**
   * Retrieve a value from the cache
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  async get<T = any>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Delete expired entry
          this.delete(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };

      request.onerror = () => reject(new Error('Failed to retrieve cache entry: ' + request.error?.message));
    });
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   * @param key - Cache key
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete a specific cache entry
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete cache entry: ' + request.error?.message));
    });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear cache: ' + request.error?.message));
    });
  }

  /**
   * Remove expired entries from the cache
   */
  async cleanupExpired(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('expiresAt');

      // Query all entries that expire before now
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(new Error('Failed to cleanup expired entries: ' + request.error?.message));
    });
  }

  /**
   * Get all keys in the cache
   */
  async keys(): Promise<string[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error('Failed to get cache keys: ' + request.error?.message));
    });
  }

  /**
   * Get cache size (number of entries)
   */
  async size(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get cache size: ' + request.error?.message));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Ensure the database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}
