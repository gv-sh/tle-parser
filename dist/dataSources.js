"use strict";
/**
 * TLE Data Sources Module
 * Implements fetchers for CelesTrak, Space-Track.org, and other TLE data sources
 * with authentication, caching, rate limiting, and failover support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceManager = exports.CustomSource = exports.AMSATSource = exports.SpaceTrackSource = exports.CelesTrakSource = void 0;
exports.validateFreshness = validateFreshness;
exports.filterByFreshness = filterByFreshness;
const advancedParser_1 = require("./advancedParser");
const rateLimiter_1 = require("./rateLimiter");
const cache_1 = require("./cache");
// ============================================================================
// CELESTRAK DATA SOURCE
// ============================================================================
/**
 * CelesTrak TLE data source
 * Public API, no authentication required
 * Documentation: https://celestrak.org/NORAD/documentation/
 */
class CelesTrakSource {
    constructor(config = {}) {
        this.baseUrl = 'https://celestrak.org/NORAD/elements/gp.php';
        this.config = {
            type: 'celestrak',
            baseUrl: config.baseUrl || this.baseUrl,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 20,
                intervalMs: 60000 // 20 requests per minute
            },
            ...config
        };
        this.rateLimiter = new rateLimiter_1.RateLimiter(this.config.rateLimit);
        this.cache = new cache_1.TTLCache({
            maxSize: 100,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'celestrak-cache.json'
        });
    }
    /**
     * Fetch TLE data from CelesTrak
     */
    async fetch(options = {}) {
        const cacheKey = this.generateCacheKey(options);
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = (0, advancedParser_1.parseBatch)(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'celestrak',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Build URL with query parameters
        const url = this.buildUrl(options);
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(url, {
                    headers: this.config.headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`CelesTrak fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = (0, advancedParser_1.parseBatch)(content, options.parseOptions || {});
        return {
            data,
            source: 'celestrak',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Build URL with query parameters
     */
    buildUrl(options) {
        const params = new URLSearchParams();
        if (options.catalogNumber) {
            const numbers = Array.isArray(options.catalogNumber)
                ? options.catalogNumber
                : [options.catalogNumber];
            params.append('CATNR', numbers.join(','));
            params.append('FORMAT', 'TLE');
        }
        else if (options.group) {
            params.append('GROUP', options.group);
            params.append('FORMAT', 'TLE');
        }
        else if (options.namePattern) {
            params.append('NAME', options.namePattern);
            params.append('FORMAT', 'TLE');
        }
        else if (options.intlDesignator) {
            params.append('INTDES', options.intlDesignator);
            params.append('FORMAT', 'TLE');
        }
        else {
            // Default to active satellites
            params.append('GROUP', 'active');
            params.append('FORMAT', 'TLE');
        }
        // Add custom query parameters
        if (options.queryParams) {
            for (const [key, value] of Object.entries(options.queryParams)) {
                params.append(key, value);
            }
        }
        return `${this.config.baseUrl}?${params.toString()}`;
    }
    /**
     * Generate cache key
     */
    generateCacheKey(options) {
        return (0, cache_1.generateCacheKey)('celestrak', {
            catalog: options.catalogNumber,
            group: options.group,
            name: options.namePattern,
            intl: options.intlDesignator
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
exports.CelesTrakSource = CelesTrakSource;
// ============================================================================
// SPACE-TRACK.ORG DATA SOURCE
// ============================================================================
/**
 * Space-Track.org TLE data source
 * Requires authentication
 * Documentation: https://www.space-track.org/documentation
 */
class SpaceTrackSource {
    constructor(config = {}) {
        this.baseUrl = 'https://www.space-track.org';
        this.authUrl = 'https://www.space-track.org/ajaxauth/login';
        this.queryUrl = 'https://www.space-track.org/basicspacedata/query';
        this.sessionCookie = null;
        this.lastAuth = 0;
        this.authTTL = 7200000; // 2 hours
        if (!config.credentials?.username || !config.credentials?.password) {
            throw new Error('Space-Track.org requires username and password credentials');
        }
        this.config = {
            type: 'spacetrack',
            baseUrl: config.baseUrl || this.baseUrl,
            credentials: config.credentials,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 1800000, // 30 minutes
            timeout: config.timeout || 60000,
            rateLimit: config.rateLimit || {
                maxRequests: 20,
                intervalMs: 60000 // 20 requests per minute
            },
            ...config
        };
        this.rateLimiter = new rateLimiter_1.RateLimiter(this.config.rateLimit);
        this.cache = new cache_1.TTLCache({
            maxSize: 100,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'spacetrack-cache.json'
        });
    }
    /**
     * Authenticate with Space-Track.org
     */
    async authenticate() {
        // Check if we have a valid session
        if (this.sessionCookie &&
            Date.now() - this.lastAuth < this.authTTL) {
            return;
        }
        const formData = new URLSearchParams();
        formData.append('identity', this.config.credentials.username);
        formData.append('password', this.config.credentials.password);
        const response = await fetch(this.authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        if (!response.ok) {
            throw new Error(`Space-Track authentication failed: ${response.status} ${response.statusText}`);
        }
        // Extract session cookie
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
            const match = cookies.match(/chocolatechip=([^;]+)/);
            if (match && match[1]) {
                this.sessionCookie = match[1];
                this.lastAuth = Date.now();
            }
        }
        if (!this.sessionCookie) {
            throw new Error('Failed to obtain Space-Track session cookie');
        }
    }
    /**
     * Fetch TLE data from Space-Track.org
     */
    async fetch(options = {}) {
        const cacheKey = this.generateCacheKey(options);
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = (0, advancedParser_1.parseBatch)(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'spacetrack',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Authenticate first
        await this.authenticate();
        // Build query URL
        const url = this.buildUrl(options);
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(url, {
                    headers: {
                        Cookie: `chocolatechip=${this.sessionCookie}`,
                        ...this.config.headers
                    },
                    signal: controller.signal
                });
                if (!response.ok) {
                    // Try re-authenticating once
                    if (response.status === 401) {
                        this.sessionCookie = null;
                        await this.authenticate();
                        const retryResponse = await fetch(url, {
                            headers: {
                                Cookie: `chocolatechip=${this.sessionCookie}`,
                                ...this.config.headers
                            },
                            signal: controller.signal
                        });
                        if (!retryResponse.ok) {
                            throw new Error(`Space-Track fetch failed: ${retryResponse.status} ${retryResponse.statusText}`);
                        }
                        return await retryResponse.text();
                    }
                    throw new Error(`Space-Track fetch failed: ${response.status} ${response.statusText}`);
                }
                const text = await response.text();
                // Space-Track returns JSON, convert to TLE format
                try {
                    const json = JSON.parse(text);
                    return this.jsonToTLE(json);
                }
                catch {
                    // If not JSON, assume it's already TLE format
                    return text;
                }
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = (0, advancedParser_1.parseBatch)(content, options.parseOptions || {});
        return {
            data,
            source: 'spacetrack',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Build query URL
     */
    buildUrl(options) {
        let query = '/class/gp/';
        if (options.catalogNumber) {
            const numbers = Array.isArray(options.catalogNumber)
                ? options.catalogNumber
                : [options.catalogNumber];
            query += `NORAD_CAT_ID/${numbers.join(',')}/`;
        }
        if (options.intlDesignator) {
            query += `INTLDES/${options.intlDesignator}/`;
        }
        // Order by epoch descending and limit to latest
        query += 'orderby/EPOCH%20desc/limit/1000/format/tle';
        return `${this.queryUrl}${query}`;
    }
    /**
     * Convert Space-Track JSON to TLE format
     */
    jsonToTLE(json) {
        if (!Array.isArray(json))
            return '';
        return json
            .map(item => {
            const lines = [];
            // Add name if available
            if (item.OBJECT_NAME) {
                lines.push(item.OBJECT_NAME);
            }
            // Add TLE lines
            if (item.TLE_LINE1)
                lines.push(item.TLE_LINE1);
            if (item.TLE_LINE2)
                lines.push(item.TLE_LINE2);
            return lines.join('\n');
        })
            .join('\n');
    }
    /**
     * Generate cache key
     */
    generateCacheKey(options) {
        return (0, cache_1.generateCacheKey)('spacetrack', {
            catalog: options.catalogNumber,
            intl: options.intlDesignator
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Logout and clear session
     */
    logout() {
        this.sessionCookie = null;
        this.lastAuth = 0;
    }
}
exports.SpaceTrackSource = SpaceTrackSource;
// ============================================================================
// AMSAT DATA SOURCE
// ============================================================================
/**
 * AMSAT amateur radio satellite data source
 * Public API, no authentication required
 */
class AMSATSource {
    constructor(config = {}) {
        this.baseUrl = 'https://www.amsat.org/tle/current/nasabare.txt';
        this.config = {
            type: 'amsat',
            baseUrl: config.baseUrl || this.baseUrl,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 10,
                intervalMs: 60000 // 10 requests per minute
            },
            ...config
        };
        this.rateLimiter = new rateLimiter_1.RateLimiter(this.config.rateLimit);
        this.cache = new cache_1.TTLCache({
            maxSize: 10,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'amsat-cache.json'
        });
    }
    /**
     * Fetch TLE data from AMSAT
     */
    async fetch(options = {}) {
        const cacheKey = 'amsat:all';
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = (0, advancedParser_1.parseBatch)(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'amsat',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(this.config.baseUrl, {
                    headers: this.config.headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`AMSAT fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = (0, advancedParser_1.parseBatch)(content, options.parseOptions || {});
        return {
            data,
            source: 'amsat',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
exports.AMSATSource = AMSATSource;
// ============================================================================
// CUSTOM DATA SOURCE
// ============================================================================
/**
 * Custom TLE data source
 * For user-defined URLs
 */
class CustomSource {
    constructor(config) {
        if (!config.baseUrl) {
            throw new Error('Custom source requires a base URL');
        }
        this.config = {
            ...config,
            type: 'custom',
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000,
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 10,
                intervalMs: 60000
            }
        };
        this.rateLimiter = new rateLimiter_1.RateLimiter(this.config.rateLimit);
        this.cache = new cache_1.TTLCache({
            maxSize: 50,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'custom-cache.json'
        });
    }
    /**
     * Fetch TLE data from custom source
     */
    async fetch(options = {}) {
        const url = options.queryParams?.url || this.config.baseUrl;
        const cacheKey = (0, cache_1.generateCacheKey)('custom', { url });
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = (0, advancedParser_1.parseBatch)(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'custom',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const headers = {
                    ...this.config.headers
                };
                if (this.config.credentials?.apiKey) {
                    headers['Authorization'] = `Bearer ${this.config.credentials.apiKey}`;
                }
                const response = await fetch(url, {
                    headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`Custom source fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = (0, advancedParser_1.parseBatch)(content, options.parseOptions || {});
        return {
            data,
            source: 'custom',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
exports.CustomSource = CustomSource;
// ============================================================================
// DATA SOURCE MANAGER WITH FAILOVER
// ============================================================================
/**
 * Data source manager with failover support
 */
class DataSourceManager {
    constructor() {
        this.sources = new Map();
        this.primarySource = null;
        this.failoverOrder = [];
    }
    /**
     * Register a data source
     */
    register(name, source, options = {}) {
        this.sources.set(name, source);
        if (options.primary) {
            this.primarySource = name;
        }
        if (options.failover !== false) {
            this.failoverOrder.push(name);
        }
    }
    /**
     * Fetch TLE data with failover
     */
    async fetch(sourceName, options = {}) {
        // Determine which source to use
        const targetSource = sourceName || this.primarySource;
        if (!targetSource) {
            throw new Error('No data source specified and no primary source configured');
        }
        const sourceOrder = [targetSource, ...this.failoverOrder.filter(s => s !== targetSource)];
        let lastError = null;
        // Try each source in order
        for (const name of sourceOrder) {
            const source = this.sources.get(name);
            if (!source)
                continue;
            try {
                return await source.fetch(options);
            }
            catch (error) {
                lastError = error;
                console.error(`Failed to fetch from ${name}:`, error);
                // Continue to next source
            }
        }
        throw new Error(`All data sources failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * Get a specific source
     */
    getSource(name) {
        return this.sources.get(name);
    }
    /**
     * List all registered sources
     */
    listSources() {
        return Array.from(this.sources.keys());
    }
    /**
     * Clear all caches
     */
    clearAllCaches() {
        for (const source of this.sources.values()) {
            source.clearCache();
        }
    }
}
exports.DataSourceManager = DataSourceManager;
/**
 * Check if TLE data is fresh
 */
function validateFreshness(tle, maxAgeMs = 259200000 // 3 days default
) {
    // Parse epoch from TLE
    const epochYear = parseInt(tle.epochYear, 10);
    const epochDay = parseFloat(tle.epoch);
    // Convert two-digit year to full year
    const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
    // Calculate epoch date
    const epochDate = new Date(fullYear, 0, 1);
    epochDate.setDate(epochDay);
    const age = Date.now() - epochDate.getTime();
    const isFresh = age <= maxAgeMs;
    const ageInDays = Math.floor(age / 86400000);
    const message = isFresh
        ? `TLE is fresh (${ageInDays} days old)`
        : `TLE is stale (${ageInDays} days old)`;
    return {
        isFresh,
        age,
        epochDate,
        message
    };
}
/**
 * Filter TLEs by freshness
 */
function filterByFreshness(tles, maxAgeMs = 259200000) {
    return tles.filter(tle => {
        const validation = validateFreshness(tle, maxAgeMs);
        return validation.isFresh;
    });
}
//# sourceMappingURL=dataSources.js.map