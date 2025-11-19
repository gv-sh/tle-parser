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
import type { ParsedTLE, TLEParseOptions } from '../types';
/**
 * Client for interacting with TLE Parser Web Worker
 */
export declare class TLEWorkerClient {
    private worker;
    private pendingRequests;
    private requestCounter;
    /**
     * Create a new TLE Worker Client
     * @param workerUrl - Optional custom worker script URL
     */
    constructor(workerUrl?: string);
    /**
     * Parse a single TLE string
     */
    parse(tle: string, options?: TLEParseOptions): Promise<ParsedTLE>;
    /**
     * Parse multiple TLE strings
     */
    parseBatch(tles: string[], options?: TLEParseOptions): Promise<ParsedTLE[]>;
    /**
     * Validate a TLE string (strict mode)
     */
    validate(tle: string, options?: TLEParseOptions): Promise<ParsedTLE>;
    /**
     * Terminate the worker
     */
    terminate(): void;
    /**
     * Check if worker is ready
     */
    isReady(): boolean;
    /**
     * Send a request to the worker
     */
    private sendRequest;
    /**
     * Handle messages from the worker
     */
    private handleMessage;
    /**
     * Handle worker errors
     */
    private handleError;
}
//# sourceMappingURL=workerClient.d.ts.map