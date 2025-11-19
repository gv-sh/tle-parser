"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const advancedParser_1 = require("../advancedParser");
// Message handler
self.onmessage = async (event) => {
    const { id, type, tle, tles, options } = event.data;
    try {
        let result;
        switch (type) {
            case 'parse':
                if (!tle)
                    throw new Error('TLE string is required');
                result = (0, index_1.parseTLE)(tle, options);
                break;
            case 'parseBatch':
                if (!tles)
                    throw new Error('TLE array is required');
                result = (0, advancedParser_1.parseBatch)(tles.join('\n'), options);
                break;
            case 'validate':
                if (!tle)
                    throw new Error('TLE string is required');
                // Parse with strict validation
                result = (0, index_1.parseTLE)(tle, { ...options, validate: true, mode: 'strict' });
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
        const response = {
            id,
            success: true,
            result
        };
        self.postMessage(response);
    }
    catch (error) {
        const response = {
            id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
        self.postMessage(response);
    }
};
//# sourceMappingURL=worker.js.map