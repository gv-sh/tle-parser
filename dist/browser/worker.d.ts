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
export {};
//# sourceMappingURL=worker.d.ts.map