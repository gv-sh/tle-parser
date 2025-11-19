/**
 * Advanced TLE Parser Features
 * Provides advanced parsing capabilities including batch, async, streaming,
 * filtering, caching, and multi-source support
 */
import type { ParsedTLE, TLEParseOptions, TLEValidateOptions } from './types';
import { Transform } from 'stream';
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
export type ParserMiddleware = (context: MiddlewareContext, next: () => Promise<ParsedTLE>) => Promise<ParsedTLE>;
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
export type ParserProfile = 'strict' | 'permissive' | 'fast' | 'realtime' | 'batch' | 'recovery' | 'legacy';
/**
 * Provider-specific variations
 */
export type TLEProvider = 'celestrak' | 'spacetrack' | 'amsat' | 'custom';
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
export declare function parseBatch(input: string, options?: BatchParseOptions): ParsedTLE[];
/**
 * Split input string into individual TLE sets
 * Handles 2-line and 3-line TLE formats
 *
 * @param input - Input string containing multiple TLEs
 * @returns Array of TLE strings
 */
export declare function splitTLEs(input: string): string[];
/**
 * Asynchronously parse a single TLE
 *
 * @param tleString - TLE data string
 * @param options - Parse options
 * @returns Promise resolving to parsed TLE
 */
export declare function parseTLEAsync(tleString: string, options?: TLEParseOptions): Promise<ParsedTLE>;
/**
 * Asynchronously parse multiple TLEs
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseBatchAsync(input: string, options?: BatchParseOptions): Promise<ParsedTLE[]>;
/**
 * Asynchronously validate a TLE
 *
 * @param tleString - TLE data string
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
export declare function validateTLEAsync(tleString: string, options?: TLEValidateOptions): Promise<import("./types").LegacyValidationResult>;
/**
 * Apply filter criteria to a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param filter - Filter criteria
 * @returns True if TLE matches filter
 */
export declare function applyFilter(tle: ParsedTLE, filter: TLEFilter): boolean;
/**
 * Transform stream for parsing TLEs
 */
export declare class TLEParserStream extends Transform {
    private buffer;
    private index;
    private options;
    constructor(options?: StreamParserOptions);
    _transform(chunk: any, _encoding: string, callback: any): void;
    _flush(callback: any): void;
    private processTLE;
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
export declare function createTLEParserStream(options?: StreamParserOptions): TLEParserStream;
/**
 * Parse TLE from a file
 *
 * @param filePath - Path to TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseFromFile(filePath: string, options?: MultiSourceOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from a URL
 *
 * @param url - URL to fetch TLE data from
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseFromURL(url: string, options?: MultiSourceOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from a stream
 *
 * @param stream - Readable stream containing TLE data
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseFromStream(stream: NodeJS.ReadableStream, options?: StreamParserOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from compressed file (.gz)
 *
 * @param filePath - Path to compressed TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseFromCompressed(filePath: string, options?: StreamParserOptions): Promise<ParsedTLE[]>;
/**
 * Parser with middleware support
 */
export declare class MiddlewareParser {
    private middlewares;
    private plugins;
    /**
     * Add middleware to the parser
     */
    use(middleware: ParserMiddleware): this;
    /**
     * Add plugin to the parser
     */
    plugin(plugin: MiddlewarePlugin): this;
    /**
     * Parse TLE with middleware chain
     */
    parse(rawTLE: string, options?: TLEParseOptions): Promise<ParsedTLE>;
    /**
     * Parse multiple TLEs with plugin support
     */
    parseBatch(input: string, options?: BatchParseOptions): Promise<ParsedTLE[]>;
}
/**
 * Create a new parser with middleware support
 */
export declare function createMiddlewareParser(): MiddlewareParser;
/**
 * LRU Cache for parsed TLEs
 */
export declare class TLECache {
    private cache;
    private maxSize;
    private ttl;
    private keyGenerator;
    constructor(options?: CacheOptions);
    private defaultKeyGenerator;
    get(rawTLE: string, options?: TLEParseOptions): ParsedTLE | null;
    set(rawTLE: string, tle: ParsedTLE, options?: TLEParseOptions): void;
    clear(): void;
    size(): number;
}
/**
 * Create a cached parser
 */
export declare function createCachedParser(cacheOptions?: CacheOptions): {
    parse: (rawTLE: string, options?: TLEParseOptions) => ParsedTLE;
    parseAsync: (rawTLE: string, options?: TLEParseOptions) => Promise<ParsedTLE>;
    cache: TLECache;
};
/**
 * Get parser options for a specific profile
 */
export declare function getProfileOptions(profile: ParserProfile): TLEParseOptions;
/**
 * Parse with a specific profile
 */
export declare function parseWithProfile(rawTLE: string, profile: ParserProfile): ParsedTLE;
/**
 * Incremental parser for real-time feeds
 */
export declare class IncrementalParser {
    private buffer;
    private currentSet;
    private onTLE;
    private options;
    constructor(onTLE: (tle: ParsedTLE) => void, options?: TLEParseOptions);
    /**
     * Add data to the parser
     */
    push(data: string): void;
    /**
     * Flush remaining data
     */
    flush(): void;
    private processBuffer;
    private emitTLE;
}
/**
 * Create an incremental parser
 */
export declare function createIncrementalParser(onTLE: (tle: ParsedTLE) => void, options?: TLEParseOptions): IncrementalParser;
/**
 * Parse TLEs in parallel using worker threads
 * Note: This requires a worker script to be created
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @param workerCount - Number of worker threads (default: CPU count)
 * @returns Promise resolving to array of parsed TLEs
 */
export declare function parseParallel(input: string, options?: BatchParseOptions, _workerCount?: number): Promise<ParsedTLE[]>;
/**
 * Get provider-specific parsing options
 */
export declare function getProviderOptions(provider: TLEProvider): TLEParseOptions;
/**
 * Parse with provider-specific options
 */
export declare function parseWithProvider(rawTLE: string, provider: TLEProvider): ParsedTLE;
declare const _default: {
    parseBatch: typeof parseBatch;
    splitTLEs: typeof splitTLEs;
    parseTLEAsync: typeof parseTLEAsync;
    parseBatchAsync: typeof parseBatchAsync;
    validateTLEAsync: typeof validateTLEAsync;
    applyFilter: typeof applyFilter;
    TLEParserStream: typeof TLEParserStream;
    createTLEParserStream: typeof createTLEParserStream;
    parseFromFile: typeof parseFromFile;
    parseFromURL: typeof parseFromURL;
    parseFromStream: typeof parseFromStream;
    parseFromCompressed: typeof parseFromCompressed;
    MiddlewareParser: typeof MiddlewareParser;
    createMiddlewareParser: typeof createMiddlewareParser;
    TLECache: typeof TLECache;
    createCachedParser: typeof createCachedParser;
    getProfileOptions: typeof getProfileOptions;
    parseWithProfile: typeof parseWithProfile;
    IncrementalParser: typeof IncrementalParser;
    createIncrementalParser: typeof createIncrementalParser;
    parseParallel: typeof parseParallel;
    getProviderOptions: typeof getProviderOptions;
    parseWithProvider: typeof parseWithProvider;
};
export default _default;
//# sourceMappingURL=advancedParser.d.ts.map