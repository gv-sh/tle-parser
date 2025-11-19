/**
 * Advanced Parser Tests
 * Comprehensive tests for advanced parsing features
 */

import {
  parseBatch,
  splitTLEs,
  parseTLEAsync,
  parseBatchAsync,
  validateTLEAsync,
  applyFilter,
  createTLEParserStream,
  parseFromFile,
  parseFromURL,
  parseFromStream,
  parseFromCompressed,
  createMiddlewareParser,
  createCachedParser,
  getProfileOptions,
  parseWithProfile,
  createIncrementalParser,
  parseWithProvider,
  getProviderOptions,
  TLECache,
  type TLEFilter,
  type ParserMiddleware,
  type MiddlewarePlugin,
  type ParserProfile,
  type TLEProvider
} from '../src/advancedParser';
import { parseTLE } from '../src/index';
import { Readable, Writable } from 'stream';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
import { createGzip } from 'zlib';

// Test TLE data
const ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

const HUBBLE_TLE = `HST
1 20580U 90037B   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 20580  28.4699  17.5172 0002638 321.8014 173.1085 15.09719417427069`;

const STARLINK_TLE = `STARLINK-1007
1 44713U 19074A   20308.51472028  .00001107  00000-0  93929-4 0  9992
2 44713  53.0531 223.4111 0001384  94.2001 265.9345 15.06394709 60379`;

const MULTI_TLE = `${ISS_TLE}

${HUBBLE_TLE}

${STARLINK_TLE}`;

describe('Advanced Parser - Batch Parsing', () => {
  describe('splitTLEs', () => {
    it('should split multiple TLEs correctly', () => {
      const sets = splitTLEs(MULTI_TLE);
      expect(sets).toHaveLength(3);
    });

    it('should handle 2-line TLEs', () => {
      const twoLineTLE = `1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;
      const sets = splitTLEs(twoLineTLE);
      expect(sets).toHaveLength(1);
    });

    it('should handle 3-line TLEs', () => {
      const sets = splitTLEs(ISS_TLE);
      expect(sets).toHaveLength(1);
    });

    it('should skip comment lines', () => {
      const withComments = `# This is a comment
${ISS_TLE}
# Another comment
${HUBBLE_TLE}`;
      const sets = splitTLEs(withComments);
      expect(sets).toHaveLength(2);
    });
  });

  describe('parseBatch', () => {
    it('should parse multiple TLEs', () => {
      const results = parseBatch(MULTI_TLE);
      expect(results).toHaveLength(3);
      expect(results[0].satelliteName).toBe('ISS (ZARYA)');
      expect(results[1].satelliteName).toBe('HST');
      expect(results[2].satelliteName).toBe('STARLINK-1007');
    });

    it('should continue on error when continueOnError is true', () => {
      const invalidTLE = `${ISS_TLE}

INVALID TLE
1 99999U 99999A   99999.99999999  .99999999  99999-9  99999-9 0  9999
2 99999  99.9999 999.9999 9999999 999.9999 999.9999 99.999999999999

${HUBBLE_TLE}`;

      const results = parseBatch(invalidTLE, { continueOnError: true });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw on error when continueOnError is false', () => {
      const invalidTLE = `INVALID
1 XXXXX 99999A   99999.99999999  .99999999  99999-9  99999-9 0  9999`;

      expect(() => {
        parseBatch(invalidTLE, { continueOnError: false });
      }).toThrow();
    });

    it('should call onTLE callback for each TLE', () => {
      const callback = jest.fn();
      parseBatch(MULTI_TLE, { onTLE: callback });
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should call onError callback for errors', () => {
      const errorCallback = jest.fn();
      const invalidTLE = `INVALID
1 XXXXX`;

      parseBatch(invalidTLE, {
        continueOnError: true,
        onError: errorCallback
      });

      expect(errorCallback).toHaveBeenCalled();
    });

    it('should respect limit option', () => {
      const results = parseBatch(MULTI_TLE, { limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should respect skip option', () => {
      const results = parseBatch(MULTI_TLE, { skip: 1 });
      expect(results).toHaveLength(2);
      expect(results[0].satelliteName).toBe('HST');
    });
  });
});

describe('Advanced Parser - Async Support', () => {
  it('should parse TLE asynchronously', async () => {
    const result = await parseTLEAsync(ISS_TLE);
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse batch asynchronously', async () => {
    const results = await parseBatchAsync(MULTI_TLE);
    expect(results).toHaveLength(3);
  });

  it('should validate TLE asynchronously', async () => {
    const result = await validateTLEAsync(ISS_TLE);
    expect(result.isValid).toBe(true);
  });
});

describe('Advanced Parser - Filtering', () => {
  const issData = parseTLE(ISS_TLE);
  const hubbleData = parseTLE(HUBBLE_TLE);
  const starlinkData = parseTLE(STARLINK_TLE);

  describe('applyFilter', () => {
    it('should filter by satellite number (string)', () => {
      const filter: TLEFilter = { satelliteNumber: '25544' };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(hubbleData, filter)).toBe(false);
    });

    it('should filter by satellite number (array)', () => {
      const filter: TLEFilter = { satelliteNumber: ['25544', '20580'] };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(hubbleData, filter)).toBe(true);
      expect(applyFilter(starlinkData, filter)).toBe(false);
    });

    it('should filter by satellite number (function)', () => {
      const filter: TLEFilter = {
        satelliteNumber: (satNum) => parseInt(satNum) < 30000
      };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(starlinkData, filter)).toBe(false);
    });

    it('should filter by satellite name (partial match)', () => {
      const filter: TLEFilter = { satelliteName: 'STARLINK' };
      expect(applyFilter(starlinkData, filter)).toBe(true);
      expect(applyFilter(issData, filter)).toBe(false);
    });

    it('should filter by satellite name (array)', () => {
      const filter: TLEFilter = { satelliteName: ['ISS', 'HST'] };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(hubbleData, filter)).toBe(true);
      expect(applyFilter(starlinkData, filter)).toBe(false);
    });

    it('should filter by satellite name (function)', () => {
      const filter: TLEFilter = {
        satelliteName: (name) => name.includes('STARLINK')
      };
      expect(applyFilter(starlinkData, filter)).toBe(true);
      expect(applyFilter(issData, filter)).toBe(false);
    });

    it('should filter by classification', () => {
      const filter: TLEFilter = { classification: 'U' };
      expect(applyFilter(issData, filter)).toBe(true);
    });

    it('should filter by classification (array)', () => {
      const filter: TLEFilter = { classification: ['U', 'C'] };
      expect(applyFilter(issData, filter)).toBe(true);
    });

    it('should filter by inclination range', () => {
      const filter: TLEFilter = {
        inclinationRange: { min: 50, max: 60 }
      };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(hubbleData, filter)).toBe(false);
    });

    it('should filter by custom function', () => {
      const filter: TLEFilter = {
        custom: (tle) => {
          const meanMotion = parseFloat(tle.meanMotion || '0');
          return meanMotion > 15;
        }
      };
      expect(applyFilter(issData, filter)).toBe(true);
    });

    it('should combine multiple filters (AND logic)', () => {
      const filter: TLEFilter = {
        satelliteName: 'ISS',
        inclinationRange: { min: 50, max: 60 }
      };
      expect(applyFilter(issData, filter)).toBe(true);
      expect(applyFilter(hubbleData, filter)).toBe(false);
    });
  });

  describe('parseBatch with filters', () => {
    it('should filter during batch parse', () => {
      const filter: TLEFilter = { satelliteName: 'STARLINK' };
      const results = parseBatch(MULTI_TLE, { filter });
      expect(results).toHaveLength(1);
      expect(results[0].satelliteName).toBe('STARLINK-1007');
    });
  });
});

describe('Advanced Parser - Streaming', () => {
  it('should create a parser stream', (done) => {
    const stream = createTLEParserStream();
    const results: any[] = [];

    stream.on('data', (tle) => {
      results.push(tle);
    });

    stream.on('end', () => {
      expect(results).toHaveLength(3);
      done();
    });

    stream.write(MULTI_TLE);
    stream.end();
  });

  it('should handle streaming with filters', (done) => {
    const stream = createTLEParserStream({
      filter: { satelliteName: 'ISS' }
    });
    const results: any[] = [];

    stream.on('data', (tle) => {
      results.push(tle);
    });

    stream.on('end', () => {
      expect(results).toHaveLength(1);
      expect(results[0].satelliteName).toBe('ISS (ZARYA)');
      done();
    });

    stream.write(MULTI_TLE);
    stream.end();
  });

  it('should call onTLE callback', (done) => {
    const callback = jest.fn();
    const stream = createTLEParserStream({ onTLE: callback });

    stream.on('end', () => {
      expect(callback).toHaveBeenCalledTimes(3);
      done();
    });

    stream.write(MULTI_TLE);
    stream.end();
  });

  it('should handle errors gracefully with continueOnError', (done) => {
    const stream = createTLEParserStream({ continueOnError: true });
    const results: any[] = [];

    stream.on('data', (tle) => {
      results.push(tle);
    });

    stream.on('end', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
      done();
    });

    const invalidData = `${ISS_TLE}

INVALID TLE
1 XXXXX

${HUBBLE_TLE}`;

    stream.write(invalidData);
    stream.end();
  });
});

describe('Advanced Parser - Middleware & Plugins', () => {
  it('should create middleware parser', () => {
    const parser = createMiddlewareParser();
    expect(parser).toBeDefined();
  });

  it('should execute middleware chain', async () => {
    const parser = createMiddlewareParser();
    const executionOrder: string[] = [];

    const middleware1: ParserMiddleware = async (ctx, next) => {
      executionOrder.push('middleware1-before');
      const result = await next();
      executionOrder.push('middleware1-after');
      return result;
    };

    const middleware2: ParserMiddleware = async (ctx, next) => {
      executionOrder.push('middleware2-before');
      const result = await next();
      executionOrder.push('middleware2-after');
      return result;
    };

    parser.use(middleware1).use(middleware2);

    const result = await parser.parse(ISS_TLE);
    expect(result.satelliteName).toBe('ISS (ZARYA)');
    expect(executionOrder).toEqual([
      'middleware1-before',
      'middleware2-before',
      'middleware2-after',
      'middleware1-after'
    ]);
  });

  it('should support plugins', async () => {
    const parser = createMiddlewareParser();
    const pluginCalls: string[] = [];

    const plugin: MiddlewarePlugin = {
      name: 'test-plugin',
      onBatchStart: async () => {
        pluginCalls.push('batch-start');
      },
      onTLEParsed: async () => {
        pluginCalls.push('tle-parsed');
      },
      onBatchEnd: async () => {
        pluginCalls.push('batch-end');
      }
    };

    parser.plugin(plugin);

    await parser.parseBatch(MULTI_TLE);
    expect(pluginCalls).toContain('batch-start');
    expect(pluginCalls).toContain('tle-parsed');
    expect(pluginCalls).toContain('batch-end');
  });

  it('should modify context in middleware', async () => {
    const parser = createMiddlewareParser();

    const middleware: ParserMiddleware = async (ctx, next) => {
      ctx.metadata = { processed: true };
      return next();
    };

    parser.use(middleware);

    const result = await parser.parse(ISS_TLE);
    expect(result).toBeDefined();
  });
});

describe('Advanced Parser - Caching', () => {
  it('should create cached parser', () => {
    const cachedParser = createCachedParser();
    expect(cachedParser).toBeDefined();
    expect(cachedParser.parse).toBeDefined();
    expect(cachedParser.cache).toBeDefined();
  });

  it('should cache parsed results', () => {
    const cachedParser = createCachedParser();

    const result1 = cachedParser.parse(ISS_TLE);
    const result2 = cachedParser.parse(ISS_TLE);

    expect(result1).toBe(result2); // Same object reference
    expect(cachedParser.cache.size()).toBe(1);
  });

  it('should cache async results', async () => {
    const cachedParser = createCachedParser();

    const result1 = await cachedParser.parseAsync(ISS_TLE);
    const result2 = await cachedParser.parseAsync(ISS_TLE);

    expect(result1).toBe(result2);
  });

  it('should respect maxSize limit', () => {
    const cache = new TLECache({ maxSize: 2 });

    cache.set('tle1', parseTLE(ISS_TLE));
    cache.set('tle2', parseTLE(HUBBLE_TLE));
    cache.set('tle3', parseTLE(STARLINK_TLE));

    expect(cache.size()).toBe(2);
  });

  it('should respect TTL', (done) => {
    const cache = new TLECache({ ttl: 100 }); // 100ms TTL
    const parsed = parseTLE(ISS_TLE);

    cache.set('test', parsed);
    expect(cache.get('test')).toBe(parsed);

    setTimeout(() => {
      expect(cache.get('test')).toBeNull();
      done();
    }, 150);
  });

  it('should clear cache', () => {
    const cache = new TLECache();
    cache.set('tle1', parseTLE(ISS_TLE));
    cache.set('tle2', parseTLE(HUBBLE_TLE));

    expect(cache.size()).toBe(2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

describe('Advanced Parser - Profiles', () => {
  const profiles: ParserProfile[] = [
    'strict',
    'permissive',
    'fast',
    'realtime',
    'batch',
    'recovery',
    'legacy'
  ];

  it('should get options for each profile', () => {
    profiles.forEach((profile) => {
      const options = getProfileOptions(profile);
      expect(options).toBeDefined();
    });
  });

  it('should parse with strict profile', () => {
    const result = parseWithProfile(ISS_TLE, 'strict');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse with permissive profile', () => {
    const result = parseWithProfile(ISS_TLE, 'permissive');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse with fast profile (no validation)', () => {
    const result = parseWithProfile(ISS_TLE, 'fast');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should have different options for different profiles', () => {
    const strictOptions = getProfileOptions('strict');
    const fastOptions = getProfileOptions('fast');

    expect(strictOptions.validate).toBe(true);
    expect(fastOptions.validate).toBe(false);
  });
});

describe('Advanced Parser - Incremental Parser', () => {
  it('should create incremental parser', () => {
    const parser = createIncrementalParser((tle) => {});
    expect(parser).toBeDefined();
  });

  it('should parse TLEs incrementally', (done) => {
    const results: any[] = [];
    const parser = createIncrementalParser((tle) => {
      results.push(tle);
    });

    // Push data in chunks
    const lines = MULTI_TLE.split('\n');
    lines.forEach((line) => {
      parser.push(line + '\n');
    });

    parser.flush();

    setTimeout(() => {
      expect(results.length).toBeGreaterThanOrEqual(1);
      done();
    }, 100);
  });

  it('should handle partial data', () => {
    const results: any[] = [];
    const parser = createIncrementalParser((tle) => {
      results.push(tle);
    });

    // Push first part
    parser.push('ISS (ZARYA)\n');
    parser.push('1 25544U 98067A   08264.51782528 -.00002182');

    // No complete TLE yet
    expect(results).toHaveLength(0);

    // Complete the TLE
    parser.push('  00000-0 -11606-4 0  2927\n');
    parser.push('2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537\n');

    setTimeout(() => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    }, 50);
  });
});

describe('Advanced Parser - Provider Support', () => {
  const providers: TLEProvider[] = ['celestrak', 'spacetrack', 'amsat', 'custom'];

  it('should get options for each provider', () => {
    providers.forEach((provider) => {
      const options = getProviderOptions(provider);
      expect(options).toBeDefined();
    });
  });

  it('should parse with CelesTrak provider', () => {
    const result = parseWithProvider(ISS_TLE, 'celestrak');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse with Space-Track provider', () => {
    const result = parseWithProvider(ISS_TLE, 'spacetrack');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse with AMSAT provider (permissive)', () => {
    const result = parseWithProvider(ISS_TLE, 'amsat');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });

  it('should parse with custom provider', () => {
    const result = parseWithProvider(ISS_TLE, 'custom');
    expect(result.satelliteName).toBe('ISS (ZARYA)');
  });
});

describe('Advanced Parser - Multi-Source (Integration)', () => {
  const testFile = '/tmp/test-tle.txt';
  const testGzFile = '/tmp/test-tle.txt.gz';

  beforeAll(() => {
    // Create test file
    writeFileSync(testFile, MULTI_TLE);

    // Create compressed test file
    const gzip = createGzip();
    const input = createReadStream(testFile);
    const output = require('fs').createWriteStream(testGzFile);
    input.pipe(gzip).pipe(output);
  });

  afterAll(() => {
    // Clean up test files
    try {
      unlinkSync(testFile);
      unlinkSync(testGzFile);
    } catch (e) {
      // Ignore errors
    }
  });

  it('should parse from file', async () => {
    const results = await parseFromFile(testFile);
    expect(results).toHaveLength(3);
  });

  it('should parse from stream', async () => {
    const stream = Readable.from([MULTI_TLE]);
    const results = await parseFromStream(stream);
    expect(results).toHaveLength(3);
  });

  // Note: URL parsing requires network, skip in unit tests
  it.skip('should parse from URL', async () => {
    const results = await parseFromURL('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Advanced Parser - Edge Cases', () => {
  it('should handle empty input for batch parse', () => {
    const results = parseBatch('');
    expect(results).toHaveLength(0);
  });

  it('should handle whitespace-only input', () => {
    const results = parseBatch('   \n\n   ');
    expect(results).toHaveLength(0);
  });

  it('should handle mixed line endings', () => {
    const mixed = ISS_TLE.replace(/\n/g, '\r\n');
    const results = parseBatch(mixed);
    expect(results).toHaveLength(1);
  });

  it('should handle TLEs with comments', () => {
    const withComments = `# Comment 1
${ISS_TLE}
# Comment 2
${HUBBLE_TLE}`;
    const results = parseBatch(withComments);
    expect(results).toHaveLength(2);
  });
});
