"use strict";
/**
 * TLE Parser - Browser Module
 * Browser-specific features and utilities
 *
 * @module browser
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconstructTLE = exports.parseBatch = exports.validateTLE = exports.parseTLE = void 0;
// Export all browser features
__exportStar(require("./workerClient"), exports);
__exportStar(require("./indexedDBCache"), exports);
__exportStar(require("./localStorage"), exports);
__exportStar(require("./fileAPI"), exports);
__exportStar(require("./pwaHelpers"), exports);
// Re-export main parser functions for convenience
var index_1 = require("../index");
Object.defineProperty(exports, "parseTLE", { enumerable: true, get: function () { return index_1.parseTLE; } });
Object.defineProperty(exports, "validateTLE", { enumerable: true, get: function () { return index_1.validateTLE; } });
var advancedParser_1 = require("../advancedParser");
Object.defineProperty(exports, "parseBatch", { enumerable: true, get: function () { return advancedParser_1.parseBatch; } });
var outputFormats_1 = require("../outputFormats");
Object.defineProperty(exports, "reconstructTLE", { enumerable: true, get: function () { return outputFormats_1.reconstructTLE; } });
//# sourceMappingURL=index.js.map