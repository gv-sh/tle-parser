/**
 * Tests for Week 5 Data Acquisition Features
 */

import { RateLimiter, RateLimiterManager } from '../src/rateLimiter';
import { TTLCache, generateCacheKey } from '../src/cache';
import {
  listConstellations,
  getConstellation,
  createConstellationFilter,
  matchesConstellation,
  filterByConstellation
} from '../src/constellations';
import { validateFreshness, filterByFreshness } from '../src/dataSources';
import { parseInterval, SCHEDULE_INTERVALS } from '../src/scheduler';
import type { ParsedTLE } from '../src/types';

// ============================================================================
// RATE LIMITER TESTS
// ============================================================================

describe('RateLimiter', () => {
  test('should enforce rate limits', async () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      intervalMs: 1000
    });

    const start = Date.now();

    // First two requests should be immediate
    await limiter.acquire();
    await limiter.acquire();

    // Third request should wait
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // Should have waited at least 1000ms
    expect(elapsed).toBeGreaterThanOrEqual(1000);
  });

  test('should track status correctly', async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      intervalMs: 1000
    });

    const status = limiter.getStatus();
    expect(status.tokens).toBe(5);
    expect(status.maxRequests).toBe(5);
    expect(status.queueLength).toBe(0);
  });

  test('should execute functions with rate limiting', async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      intervalMs: 100
    });

    let count = 0;
    const fn = async () => {
      count++;
      return count;
    };

    const result = await limiter.execute(fn);
    expect(result).toBe(1);
  });
});

describe('RateLimiterManager', () => {
  test('should manage multiple rate limiters', () => {
    const manager = new RateLimiterManager();

    manager.register('source1', { maxRequests: 10, intervalMs: 1000 });
    manager.register('source2', { maxRequests: 20, intervalMs: 1000 });

    expect(manager.get('source1')).toBeDefined();
    expect(manager.get('source2')).toBeDefined();
  });

  test('should throw error for unregistered source', async () => {
    const manager = new RateLimiterManager();

    await expect(manager.acquire('nonexistent')).rejects.toThrow(
      'No rate limiter registered for source: nonexistent'
    );
  });
});

// ============================================================================
// CACHE TESTS
// ============================================================================

describe('TTLCache', () => {
  test('should store and retrieve values', () => {
    const cache = new TTLCache<string>({
      maxSize: 10,
      defaultTTL: 1000
    });

    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should expire values after TTL', async () => {
    const cache = new TTLCache<string>({
      maxSize: 10,
      defaultTTL: 100 // 100ms
    });

    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get('key1')).toBeUndefined();
  });

  test('should enforce max size with LRU', () => {
    const cache = new TTLCache<string>({
      maxSize: 2,
      defaultTTL: 10000
    });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3'); // Should evict key1

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
  });

  test('should clean expired entries', () => {
    const cache = new TTLCache<string>({
      maxSize: 10,
      defaultTTL: 0 // Expire immediately
    });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const cleaned = cache.cleanExpired();
    expect(cleaned).toBe(2);
    expect(cache.size()).toBe(0);
  });
});

describe('generateCacheKey', () => {
  test('should generate cache keys', () => {
    const key1 = generateCacheKey('source1', { param1: 'value1' });
    const key2 = generateCacheKey('source1', { param1: 'value1' });
    const key3 = generateCacheKey('source1', { param2: 'value2' });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  test('should sort parameters for consistency', () => {
    const key1 = generateCacheKey('source1', { b: '2', a: '1' });
    const key2 = generateCacheKey('source1', { a: '1', b: '2' });

    expect(key1).toBe(key2);
  });
});

// ============================================================================
// CONSTELLATION TESTS
// ============================================================================

describe('Constellations', () => {
  test('should list all constellations', () => {
    const constellations = listConstellations();
    expect(constellations).toContain('starlink');
    expect(constellations).toContain('oneweb');
    expect(constellations).toContain('gps');
    expect(constellations).toContain('galileo');
    expect(constellations).toContain('glonass');
    expect(constellations).toContain('beidou');
    expect(constellations).toContain('iss');
    expect(constellations).toContain('amateur');
  });

  test('should get constellation by name', () => {
    const starlink = getConstellation('starlink');
    expect(starlink).toBeDefined();
    expect(starlink?.name).toBe('Starlink');
  });

  test('should create constellation filter', () => {
    const filter = createConstellationFilter('starlink');
    expect(filter).toBeDefined();
    expect(filter?.satelliteName).toBeDefined();
  });

  test('should match Starlink satellites', () => {
    const tle: Partial<ParsedTLE> = {
      satelliteName: 'STARLINK-1234',
      satelliteNumber1: '12345'
    } as ParsedTLE;

    const matches = matchesConstellation(tle as ParsedTLE, 'starlink');
    expect(matches).toBe(true);
  });

  test('should match ISS by catalog number', () => {
    const tle: Partial<ParsedTLE> = {
      satelliteName: 'ISS (ZARYA)',
      satelliteNumber1: '25544'
    } as ParsedTLE;

    const matches = matchesConstellation(tle as ParsedTLE, 'iss');
    expect(matches).toBe(true);
  });

  test('should filter TLEs by constellation', () => {
    const tles: ParsedTLE[] = [
      {
        satelliteName: 'STARLINK-1234',
        satelliteNumber1: '12345'
      } as ParsedTLE,
      {
        satelliteName: 'ISS (ZARYA)',
        satelliteNumber1: '25544'
      } as ParsedTLE,
      {
        satelliteName: 'NOAA 19',
        satelliteNumber1: '33591'
      } as ParsedTLE
    ];

    const starlink = filterByConstellation(tles, 'starlink');
    expect(starlink).toHaveLength(1);
    expect(starlink[0].satelliteName).toBe('STARLINK-1234');
  });
});

// ============================================================================
// FRESHNESS VALIDATION TESTS
// ============================================================================

describe('TLE Freshness Validation', () => {
  test('should validate fresh TLE', () => {
    // Create a TLE with recent epoch (today)
    const now = new Date();
    const year = now.getFullYear() % 100; // Two-digit year
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );

    const tle: Partial<ParsedTLE> = {
      epochYear: year.toString().padStart(2, '0'),
      epoch: dayOfYear.toString()
    } as ParsedTLE;

    const validation = validateFreshness(tle as ParsedTLE, 86400000); // 1 day
    expect(validation.isFresh).toBe(true);
  });

  test('should identify stale TLE', () => {
    // Create a TLE with old epoch (2020)
    const tle: Partial<ParsedTLE> = {
      epochYear: '20',
      epoch: '100'
    } as ParsedTLE;

    const validation = validateFreshness(tle as ParsedTLE, 86400000); // 1 day
    expect(validation.isFresh).toBe(false);
    expect(validation.age).toBeGreaterThan(0);
  });

  test('should filter TLEs by freshness', () => {
    const now = new Date();
    const year = now.getFullYear() % 100;
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );

    const tles: ParsedTLE[] = [
      {
        epochYear: year.toString().padStart(2, '0'),
        epoch: dayOfYear.toString()
      } as ParsedTLE,
      {
        epochYear: '20',
        epoch: '100'
      } as ParsedTLE
    ];

    const fresh = filterByFreshness(tles, 86400000); // 1 day
    expect(fresh).toHaveLength(1);
  });
});

// ============================================================================
// SCHEDULER TESTS
// ============================================================================

describe('Scheduler', () => {
  test('should parse interval strings', () => {
    expect(parseInterval('100ms')).toBe(100);
    expect(parseInterval('5s')).toBe(5000);
    expect(parseInterval('10m')).toBe(600000);
    expect(parseInterval('2h')).toBe(7200000);
    expect(parseInterval('1d')).toBe(86400000);
    expect(parseInterval('1w')).toBe(604800000);
  });

  test('should throw error for invalid interval', () => {
    expect(() => parseInterval('invalid')).toThrow('Invalid interval format');
  });

  test('should have predefined schedule intervals', () => {
    expect(SCHEDULE_INTERVALS.HOURLY).toBe(3600000);
    expect(SCHEDULE_INTERVALS.DAILY).toBe(86400000);
    expect(SCHEDULE_INTERVALS.WEEKLY).toBe(604800000);
  });
});
