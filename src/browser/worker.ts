/**
 * Web Worker for TLE Parser
 * Enables background parsing of TLE data without blocking the main thread
 *
 * Usage in browser:
 * ```js
 * import Worker from 'tle-parser/dist/browser/worker.js';
 * const worker = new Worker();
 * worker.postMessage({ type: 'parse', tle: tleString });
 * worker.onmessage = (e) => console.log(e.data);
 * ```
 */

import { parseTLE } from '../index';
import { parseBatch } from '../advancedParser';
import type { ParsedTLE, TLEParseOptions } from '../types';

interface WorkerRequest {
  id: string;
  type: 'parse' | 'parseBatch' | 'validate';
  tle?: string;
  tles?: string[];
  options?: TLEParseOptions;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: ParsedTLE | ParsedTLE[];
  error?: string;
}

// Web Worker context
declare const self: Worker;

// Message handler
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, tle, tles, options } = event.data;

  try {
    let result: ParsedTLE | ParsedTLE[] | undefined;

    switch (type) {
      case 'parse':
        if (!tle) throw new Error('TLE string is required');
        result = parseTLE(tle, options);
        break;

      case 'parseBatch':
        if (!tles) throw new Error('TLE array is required');
        result = parseBatch(tles.join('\n'), options);
        break;

      case 'validate':
        if (!tle) throw new Error('TLE string is required');
        // Parse with strict validation
        result = parseTLE(tle, { ...options, validate: true, mode: 'strict' });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      id,
      success: true,
      result
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };

    self.postMessage(response);
  }
};

export {};
