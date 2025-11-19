/**
 * TLE Parser - Main Module
 * Comprehensive parser for Two-Line Element (TLE) satellite data
 * with full TypeScript support and strict type safety
 */
import { ERROR_CODES } from './errorCodes';
import type { ParsedTLE, TLEParseOptions, TLEValidateOptions, TLEError, TLEWarning, ChecksumValidationResult, LineValidationResult, SatelliteNumberValidationResult, ClassificationValidationResult, NumericRangeValidationResult, ITLEValidationError, ITLEFormatError, LegacyValidationResult } from './types';
export * from './types';
export { ERROR_CODES, isValidErrorCode, getErrorDescription, isWarningCode, isCriticalError } from './errorCodes';
export { TLEStateMachineParser, parseWithStateMachine, ParserState, RecoveryAction, ErrorSeverityEnum as ErrorSeverity } from './stateMachineParser';
export * from './advancedParser';
export * from './validation';
export * from './outputFormats';
export * from './dataSources';
export * from './cache';
export * from './rateLimiter';
export * from './constellations';
export * from './scheduler';
export * from './orbitalCalculations';
export { OrbitType, compareTLEs, generateTLEDiff, assessTLEStaleness, analyzeOrbitalDecay, calculateUpdateFrequency, detectAnomalies as detectTLEAnomalies, analyzeConstellation, calculateQualityMetrics, analyzeTrend, classifyOrbitType, calculateConjunctionProbability, validateAgainstRadar, groupIntoOrbitalFamilies } from './dataAnalysis';
export type { TLEComparison, TLEFieldDiff, TLEStaleness, OrbitalDecayAnalysis, TLEUpdateFrequencyStats, AnomalyDetection, ConstellationAnalysis, TLEQualityMetrics, TLETrendAnalysis, ConjunctionProbability, RadarValidationResult, OrbitalFamily } from './dataAnalysis';
export { tleToOMM, ommToTLE, ommToXML, tleToSTK, stkToFile, tleToKVN, kvnToText, tleToOEM, oemToText, extractKeplerianElements, tleToStateVector, keplerianToCartesian, tleToGPSAlmanac, transformCoordinateFrame, tleToStellarium, tleToCelestia, tleToPlanetarium, tleToCustomFormat, createCustomFormat, tleToLegacyFormat, reconstructTLE as reconstructTLEFromParsedObject, CoordinateFrame, PlanetariumFormat } from './formatConversion';
export type { OMMFormat, STKEphemerisFormat, KVNFormat, OEMFormat, GPSAlmanacFormat, StateVector, KeplerianElements, CustomFormat, CustomFormatField } from './formatConversion';
/**
 * Custom error class for TLE validation errors
 * Thrown when TLE validation fails with detailed error information
 */
export declare class TLEValidationError extends Error implements ITLEValidationError {
    readonly name: "TLEValidationError";
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
    /**
     * Create a new TLE validation error
     * @param message - Error message
     * @param errors - Array of validation errors
     * @param warnings - Array of validation warnings
     */
    constructor(message: string, errors: readonly TLEError[], warnings?: readonly TLEWarning[]);
}
/**
 * Custom error class for TLE format errors
 * Thrown for structural/format issues in TLE data
 */
export declare class TLEFormatError extends Error implements ITLEFormatError {
    readonly name: "TLEFormatError";
    readonly code: string;
    readonly details: Record<string, unknown>;
    /**
     * Create a new TLE format error
     * @param message - Error message
     * @param code - Error code from ERROR_CODES
     * @param details - Additional error details
     */
    constructor(message: string, code: string, details?: Record<string, unknown>);
}
/**
 * Normalize line endings in TLE string to handle CRLF, LF, and CR variations
 * Ensures consistent line ending handling across different platforms
 *
 * @param input - The input string with potentially mixed line endings
 * @returns String with normalized line endings (LF only)
 *
 * @example
 * ```typescript
 * const normalized = normalizeLineEndings("line1\r\nline2\rline3");
 * // Returns: "line1\nline2\nline3"
 * ```
 */
export declare function normalizeLineEndings(input: string): string;
/**
 * Parse and normalize TLE lines, handling various whitespace edge cases
 * Processes tabs, trims whitespace, and filters empty lines
 *
 * @param tleString - The raw TLE string
 * @returns Array of cleaned TLE lines
 *
 * @example
 * ```typescript
 * const lines = parseTLELines("  line1\t\n\nline2  \n");
 * // Returns: ["line1", "line2"]
 * ```
 */
export declare function parseTLELines(tleString: string): string[];
/**
 * Calculate the checksum for a TLE line according to NORAD specification
 * Digits are added to checksum, minus signs count as 1, everything else ignored
 *
 * @param line - The TLE line to calculate checksum for
 * @returns The calculated checksum (0-9)
 *
 * @example
 * ```typescript
 * const checksum = calculateChecksum("1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927");
 * // Returns: 7
 * ```
 */
export declare function calculateChecksum(line: string): number;
/**
 * Validate TLE checksum against calculated value
 *
 * @param line - The TLE line to validate
 * @returns Validation result with details
 */
export declare function validateChecksum(line: string): ChecksumValidationResult;
/**
 * Validate TLE line structure including length, line number, and checksum
 *
 * @param line - The TLE line to validate
 * @param expectedLineNumber - Expected line number (1 or 2)
 * @returns Validation result with structured errors array
 */
export declare function validateLineStructure(line: string, expectedLineNumber: number): LineValidationResult;
/**
 * Validate satellite number consistency between lines
 *
 * @param line1 - First TLE line
 * @param line2 - Second TLE line
 * @returns Validation result with structured error
 */
export declare function validateSatelliteNumber(line1: string, line2: string): SatelliteNumberValidationResult;
/**
 * Validate classification character (U, C, or S)
 *
 * @param line1 - First TLE line
 * @returns Validation result with structured error
 */
export declare function validateClassification(line1: string): ClassificationValidationResult;
/**
 * Validate numeric field is within expected range
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validation result with structured error
 */
export declare function validateNumericRange(value: string, fieldName: string, min: number, max: number): NumericRangeValidationResult;
/**
 * Check for deprecated or unusual classification values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export declare function checkClassificationWarnings(line1: string): TLEWarning[];
/**
 * Check for stale/old epoch data
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export declare function checkEpochWarnings(line1: string): TLEWarning[];
/**
 * Check for unusual orbital parameters
 *
 * @param line2 - Second TLE line
 * @returns Array of warnings
 */
export declare function checkOrbitalParameterWarnings(line2: string): TLEWarning[];
/**
 * Check for unusual drag and ephemeris values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export declare function checkDragAndEphemerisWarnings(line1: string): TLEWarning[];
/**
 * Validate TLE format compliance with comprehensive checks
 * Validates checksums for BOTH Line 1 and Line 2
 *
 * @param tleString - The TLE data string
 * @param options - Validation options
 * @returns Validation result with detailed structured errors and warnings
 * @throws {TypeError} - If input types are invalid
 * @throws {TLEFormatError} - If input is empty
 *
 * @example
 * ```typescript
 * const result = validateTLE(tleData, { mode: 'strict' });
 * if (result.isValid) {
 *   console.log('TLE is valid');
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export declare function validateTLE(tleString: string, options?: TLEValidateOptions): LegacyValidationResult;
/**
 * Parse TLE data with optional validation
 * Primary entry point for TLE parsing with full validation support
 *
 * @param tleString - The TLE data string (2 or 3 lines)
 * @param options - Parsing options
 * @returns Parsed TLE object with optional warnings and comments arrays
 * @throws {TypeError} - If input types are invalid
 * @throws {TLEValidationError} - If validation fails and validate option is true
 *
 * @example
 * ```typescript
 * const tle = parseTLE(`ISS (ZARYA)
 * 1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
 * 2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`);
 * console.log(tle.satelliteName); // "ISS (ZARYA)"
 * ```
 */
export declare function parseTLE(tleString: string, options?: TLEParseOptions): ParsedTLE;
declare const _default: {
    parseTLE: typeof parseTLE;
    validateTLE: typeof validateTLE;
    calculateChecksum: typeof calculateChecksum;
    validateChecksum: typeof validateChecksum;
    validateLineStructure: typeof validateLineStructure;
    validateSatelliteNumber: typeof validateSatelliteNumber;
    validateClassification: typeof validateClassification;
    validateNumericRange: typeof validateNumericRange;
    checkClassificationWarnings: typeof checkClassificationWarnings;
    checkEpochWarnings: typeof checkEpochWarnings;
    checkOrbitalParameterWarnings: typeof checkOrbitalParameterWarnings;
    checkDragAndEphemerisWarnings: typeof checkDragAndEphemerisWarnings;
    normalizeLineEndings: typeof normalizeLineEndings;
    parseTLELines: typeof parseTLELines;
    TLEValidationError: typeof TLEValidationError;
    TLEFormatError: typeof TLEFormatError;
    ERROR_CODES: typeof ERROR_CODES;
};
export default _default;
//# sourceMappingURL=index.d.ts.map