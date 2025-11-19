"use strict";
/**
 * Advanced TLE Parser Features
 * Provides advanced parsing capabilities including batch, async, streaming,
 * filtering, caching, and multi-source support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalParser = exports.TLECache = exports.MiddlewareParser = exports.TLEParserStream = void 0;
exports.parseBatch = parseBatch;
exports.splitTLEs = splitTLEs;
exports.parseTLEAsync = parseTLEAsync;
exports.parseBatchAsync = parseBatchAsync;
exports.validateTLEAsync = validateTLEAsync;
exports.applyFilter = applyFilter;
exports.createTLEParserStream = createTLEParserStream;
exports.parseFromFile = parseFromFile;
exports.parseFromURL = parseFromURL;
exports.parseFromStream = parseFromStream;
exports.parseFromCompressed = parseFromCompressed;
exports.createMiddlewareParser = createMiddlewareParser;
exports.createCachedParser = createCachedParser;
exports.getProfileOptions = getProfileOptions;
exports.parseWithProfile = parseWithProfile;
exports.createIncrementalParser = createIncrementalParser;
exports.parseParallel = parseParallel;
exports.getProviderOptions = getProviderOptions;
exports.parseWithProvider = parseWithProvider;
const index_1 = require("./index");
const fs_1 = require("fs");
const util_1 = require("util");
const stream_1 = require("stream");
const zlib_1 = require("zlib");
const readFileAsync = (0, util_1.promisify)(fs_1.readFile);
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
function parseBatch(input, options = {}) {
    const { filter, continueOnError = false, limit, skip = 0, onTLE, onError, ...parseOptions } = options;
    const results = [];
    const tleSets = splitTLEs(input);
    let processed = 0;
    for (let i = 0; i < tleSets.length; i++) {
        // Apply skip
        if (i < skip)
            continue;
        // Apply limit
        if (limit !== undefined && processed >= limit)
            break;
        const rawTLE = tleSets[i];
        if (!rawTLE)
            continue;
        try {
            const parsed = (0, index_1.parseTLE)(rawTLE, parseOptions);
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
        }
        catch (error) {
            if (onError) {
                onError(error, i, rawTLE);
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
function splitTLEs(input) {
    const normalized = (0, index_1.normalizeLineEndings)(input);
    const lines = normalized
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    const tleSets = [];
    let currentSet = [];
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
        }
        else if (line[0] === '2') {
            // Add line 2 to current set
            currentSet.push(line);
        }
        else {
            // This is a satellite name (line 0)
            // If we have a complete set, save it first
            if (currentSet.length >= 2) {
                tleSets.push(currentSet.join('\n'));
                currentSet = [line];
            }
            else if (currentSet.length === 0) {
                // Start new set with name
                currentSet = [line];
            }
            else {
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
async function parseTLEAsync(tleString, options = {}) {
    return Promise.resolve((0, index_1.parseTLE)(tleString, options));
}
/**
 * Asynchronously parse multiple TLEs
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseBatchAsync(input, options = {}) {
    return Promise.resolve(parseBatch(input, options));
}
/**
 * Asynchronously validate a TLE
 *
 * @param tleString - TLE data string
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
async function validateTLEAsync(tleString, options = {}) {
    return Promise.resolve((0, index_1.validateTLE)(tleString, options));
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
function applyFilter(tle, filter) {
    // Filter by satellite number
    if (filter.satelliteNumber !== undefined) {
        const satNum = tle.satelliteNumber1 || '';
        if (typeof filter.satelliteNumber === 'function') {
            if (!filter.satelliteNumber(satNum))
                return false;
        }
        else if (Array.isArray(filter.satelliteNumber)) {
            if (!filter.satelliteNumber.includes(satNum))
                return false;
        }
        else {
            if (satNum !== filter.satelliteNumber)
                return false;
        }
    }
    // Filter by satellite name
    if (filter.satelliteName !== undefined && tle.satelliteName) {
        const name = tle.satelliteName;
        if (typeof filter.satelliteName === 'function') {
            if (!filter.satelliteName(name))
                return false;
        }
        else if (Array.isArray(filter.satelliteName)) {
            if (!filter.satelliteName.some(n => name.includes(n)))
                return false;
        }
        else {
            if (!name.includes(filter.satelliteName))
                return false;
        }
    }
    // Filter by international designator
    if (filter.intlDesignator !== undefined) {
        const intl = `${tle.internationalDesignatorYear || ''}${tle.internationalDesignatorLaunchNumber || ''}${tle.internationalDesignatorPiece || ''}`.trim();
        if (typeof filter.intlDesignator === 'function') {
            if (!filter.intlDesignator(intl))
                return false;
        }
        else if (Array.isArray(filter.intlDesignator)) {
            if (!filter.intlDesignator.includes(intl))
                return false;
        }
        else {
            if (intl !== filter.intlDesignator)
                return false;
        }
    }
    // Filter by classification
    if (filter.classification !== undefined) {
        const classification = tle.classification;
        if (Array.isArray(filter.classification)) {
            if (!filter.classification.includes(classification))
                return false;
        }
        else {
            if (classification !== filter.classification)
                return false;
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
class TLEParserStream extends stream_1.Transform {
    constructor(options = {}) {
        super({
            objectMode: true,
            highWaterMark: options.highWaterMark || 16
        });
        this.buffer = '';
        this.index = 0;
        this.options = options;
    }
    _transform(chunk, _encoding, callback) {
        this.buffer += chunk.toString();
        // Try to extract complete TLE sets
        const lines = this.buffer.split('\n');
        // Keep the last incomplete line in buffer
        this.buffer = lines.pop() || '';
        let currentSet = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
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
            }
            else if (trimmed[0] === '2') {
                currentSet.push(trimmed);
                // We have a complete TLE
                if (currentSet.length >= 2) {
                    this.processTLE(currentSet.join('\n'));
                    currentSet = [];
                }
            }
            else {
                // Satellite name
                if (currentSet.length >= 2) {
                    this.processTLE(currentSet.join('\n'));
                }
                currentSet = [trimmed];
            }
        }
        callback();
    }
    _flush(callback) {
        // Process any remaining data
        if (this.buffer.trim().length > 0) {
            const lines = this.buffer.split('\n').filter(l => l.trim().length > 0);
            if (lines.length >= 2) {
                this.processTLE(lines.join('\n'));
            }
        }
        callback();
    }
    processTLE(rawTLE) {
        const { continueOnError = true, filter, onTLE, onError, ...parseOptions } = this.options;
        try {
            const parsed = (0, index_1.parseTLE)(rawTLE, parseOptions);
            // Apply filters
            if (filter && !applyFilter(parsed, filter)) {
                return;
            }
            this.push(parsed);
            if (onTLE) {
                onTLE(parsed, this.index);
            }
            this.index++;
        }
        catch (error) {
            if (onError) {
                onError(error, this.index, rawTLE);
            }
            if (!continueOnError) {
                this.destroy(error);
            }
            this.index++;
        }
    }
}
exports.TLEParserStream = TLEParserStream;
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
function createTLEParserStream(options = {}) {
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
async function parseFromFile(filePath, options = {}) {
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
async function parseFromURL(url, options = {}) {
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
    }
    finally {
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
async function parseFromStream(stream, options = {}) {
    return new Promise((resolve, reject) => {
        const results = [];
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
            .on('data', () => { }) // Results collected via onTLE callback
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
async function parseFromCompressed(filePath, options = {}) {
    const fileStream = (0, fs_1.createReadStream)(filePath);
    const gunzip = (0, zlib_1.createGunzip)();
    return parseFromStream(fileStream.pipe(gunzip), options);
}
// ============================================================================
// MIDDLEWARE AND PLUGIN SYSTEM
// ============================================================================
/**
 * Parser with middleware support
 */
class MiddlewareParser {
    constructor() {
        this.middlewares = [];
        this.plugins = [];
    }
    /**
     * Add middleware to the parser
     */
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }
    /**
     * Add plugin to the parser
     */
    plugin(plugin) {
        this.plugins.push(plugin);
        if (plugin.middleware) {
            this.use(plugin.middleware);
        }
        return this;
    }
    /**
     * Parse TLE with middleware chain
     */
    async parse(rawTLE, options = {}) {
        const context = {
            rawTLE,
            options,
            metadata: {}
        };
        // Execute middleware chain
        const execute = async (index) => {
            if (index >= this.middlewares.length) {
                // Base parser
                return (0, index_1.parseTLE)(context.rawTLE, context.options);
            }
            const middleware = this.middlewares[index];
            if (!middleware) {
                return (0, index_1.parseTLE)(context.rawTLE, context.options);
            }
            return middleware(context, () => execute(index + 1));
        };
        return execute(0);
    }
    /**
     * Parse multiple TLEs with plugin support
     */
    async parseBatch(input, options = {}) {
        // Call plugin batch start hooks
        for (const plugin of this.plugins) {
            if (plugin.onBatchStart) {
                await plugin.onBatchStart(options);
            }
        }
        const results = [];
        const tleSets = splitTLEs(input);
        for (let i = 0; i < tleSets.length; i++) {
            const rawTLE = tleSets[i];
            if (!rawTLE)
                continue;
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
            }
            catch (error) {
                // Call plugin error hooks
                for (const plugin of this.plugins) {
                    if (plugin.onError) {
                        await plugin.onError(error, i);
                    }
                }
                if (options.onError) {
                    options.onError(error, i, rawTLE);
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
exports.MiddlewareParser = MiddlewareParser;
/**
 * Create a new parser with middleware support
 */
function createMiddlewareParser() {
    return new MiddlewareParser();
}
// ============================================================================
// CACHING
// ============================================================================
/**
 * LRU Cache for parsed TLEs
 */
class TLECache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 1000;
        this.ttl = options.ttl || 3600000; // 1 hour default
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    }
    defaultKeyGenerator(rawTLE, options) {
        return `${rawTLE}:${JSON.stringify(options)}`;
    }
    get(rawTLE, options = {}) {
        const key = this.keyGenerator(rawTLE, options);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
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
    set(rawTLE, tle, options = {}) {
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
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
exports.TLECache = TLECache;
/**
 * Create a cached parser
 */
function createCachedParser(cacheOptions = {}) {
    const cache = new TLECache(cacheOptions);
    return {
        parse: (rawTLE, options = {}) => {
            const cached = cache.get(rawTLE, options);
            if (cached)
                return cached;
            const parsed = (0, index_1.parseTLE)(rawTLE, options);
            cache.set(rawTLE, parsed, options);
            return parsed;
        },
        parseAsync: async (rawTLE, options = {}) => {
            const cached = cache.get(rawTLE, options);
            if (cached)
                return cached;
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
function getProfileOptions(profile) {
    const profiles = {
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
function parseWithProfile(rawTLE, profile) {
    return (0, index_1.parseTLE)(rawTLE, getProfileOptions(profile));
}
// ============================================================================
// INCREMENTAL PARSER
// ============================================================================
/**
 * Incremental parser for real-time feeds
 */
class IncrementalParser {
    constructor(onTLE, options = {}) {
        this.buffer = '';
        this.currentSet = [];
        this.onTLE = onTLE;
        this.options = options;
    }
    /**
     * Add data to the parser
     */
    push(data) {
        this.buffer += data;
        this.processBuffer();
    }
    /**
     * Flush remaining data
     */
    flush() {
        if (this.currentSet.length >= 2) {
            this.emitTLE(this.currentSet.join('\n'));
            this.currentSet = [];
        }
    }
    processBuffer() {
        const lines = this.buffer.split('\n');
        // Keep last incomplete line
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            if (trimmed.startsWith('#')) {
                this.currentSet.push(trimmed);
                continue;
            }
            if (trimmed[0] === '1') {
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                }
                this.currentSet = [trimmed];
            }
            else if (trimmed[0] === '2') {
                this.currentSet.push(trimmed);
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                    this.currentSet = [];
                }
            }
            else {
                // Satellite name
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                }
                this.currentSet = [trimmed];
            }
        }
    }
    emitTLE(rawTLE) {
        try {
            const parsed = (0, index_1.parseTLE)(rawTLE, this.options);
            this.onTLE(parsed);
        }
        catch (error) {
            // Silently ignore parse errors in incremental mode
        }
    }
}
exports.IncrementalParser = IncrementalParser;
/**
 * Create an incremental parser
 */
function createIncrementalParser(onTLE, options = {}) {
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
async function parseParallel(input, options = {}, _workerCount) {
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
function getProviderOptions(provider) {
    const providerOptions = {
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
function parseWithProvider(rawTLE, provider) {
    return (0, index_1.parseTLE)(rawTLE, getProviderOptions(provider));
}
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = {
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
//# sourceMappingURL=advancedParser.js.map