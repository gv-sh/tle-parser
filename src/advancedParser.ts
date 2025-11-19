/**
 * Advanced TLE Parser Features
 * Provides advanced parsing capabilities including batch, async, streaming,
 * filtering, caching, and multi-source support
 */

import { parseTLE, validateTLE, normalizeLineEndings } from './index';
import type { ParsedTLE, TLEParseOptions, TLEValidateOptions } from './types';
import { readFile, createReadStream } from 'fs';
import { promisify } from 'util';
import { Transform } from 'stream';
import { createGunzip } from 'zlib';

const readFileAsync = promisify(readFile);

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Filter criteria for TLE parsing
 */
export interface TLEFilter {
  /** Filter by satellite number */
  satelliteNumber?: string | string[] | ((satNum: string) => boolean);
  /** Filter by satellite name (partial match supported) */
  satelliteName?: string | string[] | ((name: string) => boolean);
  /** Filter by international designator */
  intlDesignator?: string | string[] | ((intl: string) => boolean);
  /** Filter by classification */
  classification?: 'U' | 'C' | 'S' | ('U' | 'C' | 'S')[];
  /** Filter by epoch date range */
  epochRange?: {
    start?: Date;
    end?: Date;
  };
  /** Filter by inclination range */
  inclinationRange?: {
    min?: number;
    max?: number;
  };
  /** Custom filter function */
  custom?: (tle: ParsedTLE) => boolean;
}

/**
 * Batch parse options
 */
export interface BatchParseOptions extends TLEParseOptions {
  /** Filter criteria */
  filter?: TLEFilter;
  /** Continue on error (skip invalid TLEs) */
  continueOnError?: boolean;
  /** Maximum number of TLEs to parse */
  limit?: number;
  /** Skip first N TLEs */
  skip?: number;
  /** Callback for each parsed TLE */
  onTLE?: (tle: ParsedTLE, index: number) => void;
  /** Callback for each error */
  onError?: (error: Error, index: number, rawTLE: string) => void;
}

/**
 * Streaming parser options
 */
export interface StreamParserOptions extends BatchParseOptions {
  /** Chunk size for processing */
  chunkSize?: number;
  /** High water mark for stream */
  highWaterMark?: number;
}

/**
 * Multi-source parsing options
 */
export interface MultiSourceOptions extends BatchParseOptions {
  /** Source type */
  sourceType?: 'string' | 'file' | 'url' | 'stream';
  /** Encoding for file/stream sources */
  encoding?: 'utf8' | 'ascii' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';
  /** HTTP headers for URL sources */
  headers?: Record<string, string>;
  /** Timeout for URL requests (ms) */
  timeout?: number;
}

/**
 * Parser middleware function
 */
export type ParserMiddleware = (
  context: MiddlewareContext,
  next: () => Promise<ParsedTLE>
) => Promise<ParsedTLE>;

/**
 * Parser context passed to middleware
 */
export interface MiddlewareContext {
  rawTLE: string;
  options: TLEParseOptions;
  index?: number;
  metadata?: Record<string, any>;
}

/**
 * Middleware plugin interface
 */
export interface MiddlewarePlugin {
  name: string;
  version?: string;
  middleware?: ParserMiddleware;
  onBatchStart?: (options: BatchParseOptions) => void | Promise<void>;
  onBatchEnd?: (results: ParsedTLE[]) => void | Promise<void>;
  onTLEParsed?: (tle: ParsedTLE, index: number) => void | Promise<void>;
  onError?: (error: Error, index: number) => void | Promise<void>;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Maximum cache size (number of entries) */
  maxSize?: number;
  /** TTL in milliseconds */
  ttl?: number;
  /** Custom cache key generator */
  keyGenerator?: (rawTLE: string, options: TLEParseOptions) => string;
}

/**
 * Parser profile presets
 */
export type ParserProfile =
  | 'strict'           // Strict validation, all checks enabled
  | 'permissive'       // Permissive mode, warnings instead of errors
  | 'fast'             // Skip validation for speed
  | 'realtime'         // Optimized for real-time feeds
  | 'batch'            // Optimized for batch processing
  | 'recovery'         // Maximum error recovery
  | 'legacy';          // Support legacy/non-standard formats

/**
 * Provider-specific variations
 */
export type TLEProvider =
  | 'celestrak'        // CelesTrak format
  | 'spacetrack'       // Space-Track.org format
  | 'amsat'            // AMSAT format
  | 'custom';          // Custom provider

// ============================================================================
// BATCH PARSING
// ============================================================================

/**
 * Parse multiple TLEs from a single string
 * Splits input into individual TLE sets and parses each one
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Array of parsed TLEs
 *
 * @example
 * ```typescript
 * const tles = parseBatch(multiTLEString, {
 *   continueOnError: true,
 *   filter: { satelliteName: 'STARLINK' }
 * });
 * ```
 */
export function parseBatch(input: string, options: BatchParseOptions = {}): ParsedTLE[] {
  const {
    filter,
    continueOnError = false,
    limit,
    skip = 0,
    onTLE,
    onError,
    ...parseOptions
  } = options;

  const results: ParsedTLE[] = [];
  const tleSets = splitTLEs(input);

  let processed = 0;
  for (let i = 0; i < tleSets.length; i++) {
    // Apply skip
    if (i < skip) continue;

    // Apply limit
    if (limit !== undefined && processed >= limit) break;

    const rawTLE = tleSets[i];
    if (!rawTLE) continue;

    try {
      const parsed = parseTLE(rawTLE, parseOptions);

      // Apply filters
      if (filter && !applyFilter(parsed, filter)) {
        continue;
      }

      results.push(parsed);
      processed++;

      // Call callback
      if (onTLE) {
        onTLE(parsed, i);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error, i, rawTLE);
      }

      if (!continueOnError) {
        throw error;
      }
    }
  }

  return results;
}

/**
 * Split input string into individual TLE sets
 * Handles 2-line and 3-line TLE formats
 *
 * @param input - Input string containing multiple TLEs
 * @returns Array of TLE strings
 */
export function splitTLEs(input: string): string[] {
  const normalized = normalizeLineEndings(input);
  const lines = normalized
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const tleSets: string[] = [];
  let currentSet: string[] = [];

  for (const line of lines) {
    // Skip comment lines
    if (line.startsWith('#')) {
      if (currentSet.length > 0) {
        currentSet.push(line);
      }
      continue;
    }

    // Line starting with '1' begins a new TLE set
    if (line[0] === '1') {
      // Save previous set if it has both lines
      if (currentSet.length >= 2) {
        tleSets.push(currentSet.join('\n'));
      }
      currentSet = [line];
    } else if (line[0] === '2') {
      // Add line 2 to current set
      currentSet.push(line);
    } else {
      // This is a satellite name (line 0)
      // If we have a complete set, save it first
      if (currentSet.length >= 2) {
        tleSets.push(currentSet.join('\n'));
        currentSet = [line];
      } else if (currentSet.length === 0) {
        // Start new set with name
        currentSet = [line];
      } else {
        // Add to current set
        currentSet.push(line);
      }
    }
  }

  // Add final set
  if (currentSet.length >= 2) {
    tleSets.push(currentSet.join('\n'));
  }

  return tleSets;
}

// ============================================================================
// ASYNC PARSING
// ============================================================================

/**
 * Asynchronously parse a single TLE
 *
 * @param tleString - TLE data string
 * @param options - Parse options
 * @returns Promise resolving to parsed TLE
 */
export async function parseTLEAsync(
  tleString: string,
  options: TLEParseOptions = {}
): Promise<ParsedTLE> {
  return Promise.resolve(parseTLE(tleString, options));
}

/**
 * Asynchronously parse multiple TLEs
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseBatchAsync(
  input: string,
  options: BatchParseOptions = {}
): Promise<ParsedTLE[]> {
  return Promise.resolve(parseBatch(input, options));
}

/**
 * Asynchronously validate a TLE
 *
 * @param tleString - TLE data string
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
export async function validateTLEAsync(
  tleString: string,
  options: TLEValidateOptions = {}
) {
  return Promise.resolve(validateTLE(tleString, options));
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Apply filter criteria to a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param filter - Filter criteria
 * @returns True if TLE matches filter
 */
export function applyFilter(tle: ParsedTLE, filter: TLEFilter): boolean {
  // Filter by satellite number
  if (filter.satelliteNumber !== undefined) {
    const satNum = tle.satelliteNumber1 || '';

    if (typeof filter.satelliteNumber === 'function') {
      if (!filter.satelliteNumber(satNum)) return false;
    } else if (Array.isArray(filter.satelliteNumber)) {
      if (!filter.satelliteNumber.includes(satNum)) return false;
    } else {
      if (satNum !== filter.satelliteNumber) return false;
    }
  }

  // Filter by satellite name
  if (filter.satelliteName !== undefined && tle.satelliteName) {
    const name = tle.satelliteName;

    if (typeof filter.satelliteName === 'function') {
      if (!filter.satelliteName(name)) return false;
    } else if (Array.isArray(filter.satelliteName)) {
      if (!filter.satelliteName.some(n => name.includes(n))) return false;
    } else {
      if (!name.includes(filter.satelliteName)) return false;
    }
  }

  // Filter by international designator
  if (filter.intlDesignator !== undefined) {
    const intl = `${tle.internationalDesignatorYear || ''}${tle.internationalDesignatorLaunchNumber || ''}${tle.internationalDesignatorPiece || ''}`.trim();

    if (typeof filter.intlDesignator === 'function') {
      if (!filter.intlDesignator(intl)) return false;
    } else if (Array.isArray(filter.intlDesignator)) {
      if (!filter.intlDesignator.includes(intl)) return false;
    } else {
      if (intl !== filter.intlDesignator) return false;
    }
  }

  // Filter by classification
  if (filter.classification !== undefined) {
    const classification = tle.classification;

    if (Array.isArray(filter.classification)) {
      if (!filter.classification.includes(classification as any)) return false;
    } else {
      if (classification !== filter.classification) return false;
    }
  }

  // Filter by epoch range
  if (filter.epochRange) {
    const epochYear = parseInt(tle.epochYear || '0', 10);
    const epochStr = tle.epoch || '0';
    const epochDay = parseFloat(epochStr);
    const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear;
    const epochDate = new Date(fullYear, 0, 1);
    epochDate.setDate(epochDate.getDate() + epochDay - 1);

    if (filter.epochRange.start && epochDate < filter.epochRange.start) {
      return false;
    }
    if (filter.epochRange.end && epochDate > filter.epochRange.end) {
      return false;
    }
  }

  // Filter by inclination range
  if (filter.inclinationRange) {
    const inclination = parseFloat(tle.inclination || '0');

    if (filter.inclinationRange.min !== undefined && inclination < filter.inclinationRange.min) {
      return false;
    }
    if (filter.inclinationRange.max !== undefined && inclination > filter.inclinationRange.max) {
      return false;
    }
  }

  // Custom filter
  if (filter.custom && !filter.custom(tle)) {
    return false;
  }

  return true;
}

// ============================================================================
// STREAMING PARSER
// ============================================================================

/**
 * Transform stream for parsing TLEs
 */
export class TLEParserStream extends Transform {
  private buffer: string = '';
  private index: number = 0;
  private options: BatchParseOptions;

  constructor(options: StreamParserOptions = {}) {
    super({
      objectMode: true,
      highWaterMark: options.highWaterMark || 16
    });
    this.options = options;
  }

  _transform(chunk: any, _encoding: string, callback: any) {
    this.buffer += chunk.toString();

    // Try to extract complete TLE sets
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';

    let currentSet: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      if (trimmed.startsWith('#')) {
        currentSet.push(trimmed);
        continue;
      }

      if (trimmed[0] === '1') {
        // Start of new TLE
        if (currentSet.length >= 2) {
          this.processTLE(currentSet.join('\n'));
        }
        currentSet = [trimmed];
      } else if (trimmed[0] === '2') {
        currentSet.push(trimmed);
        // We have a complete TLE
        if (currentSet.length >= 2) {
          this.processTLE(currentSet.join('\n'));
          currentSet = [];
        }
      } else {
        // Satellite name
        if (currentSet.length >= 2) {
          this.processTLE(currentSet.join('\n'));
        }
        currentSet = [trimmed];
      }
    }

    callback();
  }

  _flush(callback: any) {
    // Process any remaining data
    if (this.buffer.trim().length > 0) {
      const lines = this.buffer.split('\n').filter(l => l.trim().length > 0);
      if (lines.length >= 2) {
        this.processTLE(lines.join('\n'));
      }
    }
    callback();
  }

  private processTLE(rawTLE: string) {
    const { continueOnError = true, filter, onTLE, onError, ...parseOptions } = this.options;

    try {
      const parsed = parseTLE(rawTLE, parseOptions);

      // Apply filters
      if (filter && !applyFilter(parsed, filter)) {
        return;
      }

      this.push(parsed);

      if (onTLE) {
        onTLE(parsed, this.index);
      }

      this.index++;
    } catch (error) {
      if (onError) {
        onError(error as Error, this.index, rawTLE);
      }

      if (!continueOnError) {
        this.destroy(error as Error);
      }

      this.index++;
    }
  }
}

/**
 * Create a TLE parser stream
 *
 * @param options - Stream parser options
 * @returns Transform stream that parses TLEs
 *
 * @example
 * ```typescript
 * const fs = require('fs');
 * const parser = createTLEParserStream({ continueOnError: true });
 *
 * fs.createReadStream('tles.txt')
 *   .pipe(parser)
 *   .on('data', (tle) => console.log(tle.satelliteName));
 * ```
 */
export function createTLEParserStream(options: StreamParserOptions = {}): TLEParserStream {
  return new TLEParserStream(options);
}

// ============================================================================
// MULTI-SOURCE PARSING
// ============================================================================

/**
 * Parse TLE from a file
 *
 * @param filePath - Path to TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseFromFile(
  filePath: string,
  options: MultiSourceOptions = {}
): Promise<ParsedTLE[]> {
  const { encoding = 'utf8', ...batchOptions } = options;
  const content = await readFileAsync(filePath, { encoding });
  return parseBatch(content, batchOptions);
}

/**
 * Parse TLE from a URL
 *
 * @param url - URL to fetch TLE data from
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseFromURL(
  url: string,
  options: MultiSourceOptions = {}
): Promise<ParsedTLE[]> {
  const { headers, timeout = 30000, ...batchOptions } = options;

  // Use fetch API (available in Node 18+)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    return parseBatch(content, batchOptions);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse TLE from a stream
 *
 * @param stream - Readable stream containing TLE data
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseFromStream(
  stream: NodeJS.ReadableStream,
  options: StreamParserOptions = {}
): Promise<ParsedTLE[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedTLE[] = [];
    const parser = createTLEParserStream({
      ...options,
      onTLE: (tle, index) => {
        results.push(tle);
        if (options.onTLE) {
          options.onTLE(tle, index);
        }
      }
    });

    stream
      .pipe(parser)
      .on('data', () => {}) // Results collected via onTLE callback
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Parse TLE from compressed file (.gz)
 *
 * @param filePath - Path to compressed TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseFromCompressed(
  filePath: string,
  options: StreamParserOptions = {}
): Promise<ParsedTLE[]> {
  const fileStream = createReadStream(filePath);
  const gunzip = createGunzip();

  return parseFromStream(fileStream.pipe(gunzip), options);
}

// ============================================================================
// MIDDLEWARE AND PLUGIN SYSTEM
// ============================================================================

/**
 * Parser with middleware support
 */
export class MiddlewareParser {
  private middlewares: ParserMiddleware[] = [];
  private plugins: MiddlewarePlugin[] = [];

  /**
   * Add middleware to the parser
   */
  use(middleware: ParserMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Add plugin to the parser
   */
  plugin(plugin: MiddlewarePlugin): this {
    this.plugins.push(plugin);
    if (plugin.middleware) {
      this.use(plugin.middleware);
    }
    return this;
  }

  /**
   * Parse TLE with middleware chain
   */
  async parse(rawTLE: string, options: TLEParseOptions = {}): Promise<ParsedTLE> {
    const context: MiddlewareContext = {
      rawTLE,
      options,
      metadata: {}
    };

    // Execute middleware chain
    const execute = async (index: number): Promise<ParsedTLE> => {
      if (index >= this.middlewares.length) {
        // Base parser
        return parseTLE(context.rawTLE, context.options);
      }

      const middleware = this.middlewares[index];
      if (!middleware) {
        return parseTLE(context.rawTLE, context.options);
      }
      return middleware(context, () => execute(index + 1));
    };

    return execute(0);
  }

  /**
   * Parse multiple TLEs with plugin support
   */
  async parseBatch(input: string, options: BatchParseOptions = {}): Promise<ParsedTLE[]> {
    // Call plugin batch start hooks
    for (const plugin of this.plugins) {
      if (plugin.onBatchStart) {
        await plugin.onBatchStart(options);
      }
    }

    const results: ParsedTLE[] = [];
    const tleSets = splitTLEs(input);

    for (let i = 0; i < tleSets.length; i++) {
      const rawTLE = tleSets[i];
      if (!rawTLE) continue;

      try {
        // Parse with middleware
        const parsed = await this.parse(rawTLE, options);

        // Apply filters
        if (options.filter && !applyFilter(parsed, options.filter)) {
          continue;
        }

        results.push(parsed);

        // Call plugin TLE parsed hooks
        for (const plugin of this.plugins) {
          if (plugin.onTLEParsed) {
            await plugin.onTLEParsed(parsed, i);
          }
        }

        if (options.onTLE) {
          options.onTLE(parsed, i);
        }
      } catch (error) {
        // Call plugin error hooks
        for (const plugin of this.plugins) {
          if (plugin.onError) {
            await plugin.onError(error as Error, i);
          }
        }

        if (options.onError) {
          options.onError(error as Error, i, rawTLE);
        }

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    // Call plugin batch end hooks
    for (const plugin of this.plugins) {
      if (plugin.onBatchEnd) {
        await plugin.onBatchEnd(results);
      }
    }

    return results;
  }
}

/**
 * Create a new parser with middleware support
 */
export function createMiddlewareParser(): MiddlewareParser {
  return new MiddlewareParser();
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * LRU Cache for parsed TLEs
 */
export class TLECache {
  private cache: Map<string, { tle: ParsedTLE; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;
  private keyGenerator: (rawTLE: string, options: TLEParseOptions) => string;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  private defaultKeyGenerator(rawTLE: string, options: TLEParseOptions): string {
    return `${rawTLE}:${JSON.stringify(options)}`;
  }

  get(rawTLE: string, options: TLEParseOptions = {}): ParsedTLE | null {
    const key = this.keyGenerator(rawTLE, options);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.tle;
  }

  set(rawTLE: string, tle: ParsedTLE, options: TLEParseOptions = {}): void {
    const key = this.keyGenerator(rawTLE, options);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      tle,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Create a cached parser
 */
export function createCachedParser(cacheOptions: CacheOptions = {}) {
  const cache = new TLECache(cacheOptions);

  return {
    parse: (rawTLE: string, options: TLEParseOptions = {}): ParsedTLE => {
      const cached = cache.get(rawTLE, options);
      if (cached) return cached;

      const parsed = parseTLE(rawTLE, options);
      cache.set(rawTLE, parsed, options);
      return parsed;
    },

    parseAsync: async (rawTLE: string, options: TLEParseOptions = {}): Promise<ParsedTLE> => {
      const cached = cache.get(rawTLE, options);
      if (cached) return cached;

      const parsed = await parseTLEAsync(rawTLE, options);
      cache.set(rawTLE, parsed, options);
      return parsed;
    },

    cache
  };
}

// ============================================================================
// PARSER PROFILES
// ============================================================================

/**
 * Get parser options for a specific profile
 */
export function getProfileOptions(profile: ParserProfile): TLEParseOptions {
  const profiles: Record<ParserProfile, TLEParseOptions> = {
    strict: {
      validate: true,
      strictChecksums: true,
      validateRanges: true,
      mode: 'strict',
      includeWarnings: true,
      includeComments: true
    },
    permissive: {
      validate: true,
      strictChecksums: false,
      validateRanges: false,
      mode: 'permissive',
      includeWarnings: true,
      includeComments: true
    },
    fast: {
      validate: false,
      includeWarnings: false,
      includeComments: false
    },
    realtime: {
      validate: true,
      strictChecksums: false,
      validateRanges: false,
      mode: 'permissive',
      includeWarnings: false,
      includeComments: false
    },
    batch: {
      validate: true,
      strictChecksums: true,
      validateRanges: true,
      mode: 'strict',
      includeWarnings: false,
      includeComments: false
    },
    recovery: {
      validate: false,
      includeWarnings: true,
      includeComments: true
    },
    legacy: {
      validate: true,
      strictChecksums: false,
      validateRanges: false,
      mode: 'permissive',
      includeWarnings: true,
      includeComments: true
    }
  };

  return profiles[profile];
}

/**
 * Parse with a specific profile
 */
export function parseWithProfile(
  rawTLE: string,
  profile: ParserProfile
): ParsedTLE {
  return parseTLE(rawTLE, getProfileOptions(profile));
}

// ============================================================================
// INCREMENTAL PARSER
// ============================================================================

/**
 * Incremental parser for real-time feeds
 */
export class IncrementalParser {
  private buffer: string = '';
  private currentSet: string[] = [];
  private onTLE: (tle: ParsedTLE) => void;
  private options: TLEParseOptions;

  constructor(
    onTLE: (tle: ParsedTLE) => void,
    options: TLEParseOptions = {}
  ) {
    this.onTLE = onTLE;
    this.options = options;
  }

  /**
   * Add data to the parser
   */
  push(data: string): void {
    this.buffer += data;
    this.processBuffer();
  }

  /**
   * Flush remaining data
   */
  flush(): void {
    if (this.currentSet.length >= 2) {
      this.emitTLE(this.currentSet.join('\n'));
      this.currentSet = [];
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');

    // Keep last incomplete line
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      if (trimmed.startsWith('#')) {
        this.currentSet.push(trimmed);
        continue;
      }

      if (trimmed[0] === '1') {
        if (this.currentSet.length >= 2) {
          this.emitTLE(this.currentSet.join('\n'));
        }
        this.currentSet = [trimmed];
      } else if (trimmed[0] === '2') {
        this.currentSet.push(trimmed);
        if (this.currentSet.length >= 2) {
          this.emitTLE(this.currentSet.join('\n'));
          this.currentSet = [];
        }
      } else {
        // Satellite name
        if (this.currentSet.length >= 2) {
          this.emitTLE(this.currentSet.join('\n'));
        }
        this.currentSet = [trimmed];
      }
    }
  }

  private emitTLE(rawTLE: string): void {
    try {
      const parsed = parseTLE(rawTLE, this.options);
      this.onTLE(parsed);
    } catch (error) {
      // Silently ignore parse errors in incremental mode
    }
  }
}

/**
 * Create an incremental parser
 */
export function createIncrementalParser(
  onTLE: (tle: ParsedTLE) => void,
  options: TLEParseOptions = {}
): IncrementalParser {
  return new IncrementalParser(onTLE, options);
}

// ============================================================================
// PARALLEL PARSING
// ============================================================================

/**
 * Parse TLEs in parallel using worker threads
 * Note: This requires a worker script to be created
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @param workerCount - Number of worker threads (default: CPU count)
 * @returns Promise resolving to array of parsed TLEs
 */
export async function parseParallel(
  input: string,
  options: BatchParseOptions = {},
  _workerCount?: number
): Promise<ParsedTLE[]> {
  // Note: Parallel parsing with worker threads would require a separate worker file
  // For now, we fall back to batch parsing
  // In a real implementation, you would:
  // 1. Split TLEs into chunks
  // 2. Create worker threads
  // 3. Distribute work across workers
  // 4. Collect and merge results

  // Fallback to optimized batch parsing
  return parseBatch(input, options);
}

// ============================================================================
// PROVIDER-SPECIFIC VARIATIONS
// ============================================================================

/**
 * Get provider-specific parsing options
 */
export function getProviderOptions(provider: TLEProvider): TLEParseOptions {
  const providerOptions: Record<TLEProvider, TLEParseOptions> = {
    celestrak: {
      validate: true,
      strictChecksums: true,
      validateRanges: true,
      mode: 'strict',
      includeWarnings: true,
      includeComments: true
    },
    spacetrack: {
      validate: true,
      strictChecksums: true,
      validateRanges: true,
      mode: 'strict',
      includeWarnings: true,
      includeComments: true
    },
    amsat: {
      validate: true,
      strictChecksums: false,
      validateRanges: false,
      mode: 'permissive',
      includeWarnings: true,
      includeComments: true
    },
    custom: {
      validate: false,
      includeWarnings: true,
      includeComments: true
    }
  };

  return providerOptions[provider];
}

/**
 * Parse with provider-specific options
 */
export function parseWithProvider(
  rawTLE: string,
  provider: TLEProvider
): ParsedTLE {
  return parseTLE(rawTLE, getProviderOptions(provider));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Batch parsing
  parseBatch,
  splitTLEs,

  // Async parsing
  parseTLEAsync,
  parseBatchAsync,
  validateTLEAsync,

  // Filtering
  applyFilter,

  // Streaming
  TLEParserStream,
  createTLEParserStream,

  // Multi-source
  parseFromFile,
  parseFromURL,
  parseFromStream,
  parseFromCompressed,

  // Middleware
  MiddlewareParser,
  createMiddlewareParser,

  // Caching
  TLECache,
  createCachedParser,

  // Profiles
  getProfileOptions,
  parseWithProfile,

  // Incremental
  IncrementalParser,
  createIncrementalParser,

  // Parallel
  parseParallel,

  // Providers
  getProviderOptions,
  parseWithProvider
};
