"use strict";
/**
 * Web Worker Client for TLE Parser
 * Provides a Promise-based API for using the TLE parser in a Web Worker
 *
 * @example
 * ```typescript
 * import { TLEWorkerClient } from 'tle-parser/browser';
 *
 * const client = new TLEWorkerClient();
 * const result = await client.parse(tleString);
 * console.log(result);
 *
 * // Clean up when done
 * client.terminate();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TLEWorkerClient = void 0;
/**
 * Client for interacting with TLE Parser Web Worker
 */
class TLEWorkerClient {
    /**
     * Create a new TLE Worker Client
     * @param workerUrl - Optional custom worker script URL
     */
    constructor(workerUrl) {
        this.worker = null;
        this.pendingRequests = new Map();
        this.requestCounter = 0;
        if (typeof Worker === 'undefined') {
            throw new Error('Web Workers are not supported in this environment');
        }
        // Use provided URL or default worker bundle
        // In browser environments, the bundler will handle this URL resolution
        const url = workerUrl || './worker.js';
        this.worker = new Worker(url, { type: 'module' });
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
    }
    /**
     * Parse a single TLE string
     */
    parse(tle, options) {
        return this.sendRequest({
            type: 'parse',
            tle,
            options
        });
    }
    /**
     * Parse multiple TLE strings
     */
    parseBatch(tles, options) {
        return this.sendRequest({
            type: 'parseBatch',
            tles,
            options
        });
    }
    /**
     * Validate a TLE string (strict mode)
     */
    validate(tle, options) {
        return this.sendRequest({
            type: 'validate',
            tle,
            options
        });
    }
    /**
     * Terminate the worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        // Reject all pending requests
        for (const [, { reject }] of this.pendingRequests) {
            reject(new Error('Worker terminated'));
        }
        this.pendingRequests.clear();
    }
    /**
     * Check if worker is ready
     */
    isReady() {
        return this.worker !== null;
    }
    /**
     * Send a request to the worker
     */
    sendRequest(request) {
        if (!this.worker) {
            return Promise.reject(new Error('Worker is not initialized'));
        }
        const id = `req_${++this.requestCounter}`;
        const fullRequest = { id, ...request };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage(fullRequest);
        });
    }
    /**
     * Handle messages from the worker
     */
    handleMessage(event) {
        const { id, success, result, error } = event.data;
        const pending = this.pendingRequests.get(id);
        if (!pending) {
            console.warn(`Received response for unknown request: ${id}`);
            return;
        }
        this.pendingRequests.delete(id);
        if (success) {
            pending.resolve(result);
        }
        else {
            pending.reject(new Error(error || 'Unknown error'));
        }
    }
    /**
     * Handle worker errors
     */
    handleError(error) {
        console.error('Worker error:', error);
        // Reject all pending requests
        for (const [, { reject }] of this.pendingRequests) {
            reject(new Error('Worker error: ' + error.message));
        }
        this.pendingRequests.clear();
    }
}
exports.TLEWorkerClient = TLEWorkerClient;
//# sourceMappingURL=workerClient.js.map