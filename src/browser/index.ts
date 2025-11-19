/**
 * TLE Parser - Browser Module
 * Browser-specific features and utilities
 *
 * @module browser
 */

// Export all browser features
export * from './workerClient';
export * from './indexedDBCache';
export * from './localStorage';
export * from './fileAPI';
export * from './pwaHelpers';

// Re-export main parser functions for convenience
export {
  parseTLE,
  validateTLE
} from '../index';
export { parseBatch } from '../advancedParser';
export { reconstructTLE } from '../outputFormats';
