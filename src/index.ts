/**
 * TLE Parser - Main Module
 * Comprehensive parser for Two-Line Element (TLE) satellite data
 * with full TypeScript support and strict type safety
 */

import * as fs from 'fs';
import * as path from 'path';
import { ERROR_CODES } from './errorCodes';
import type {
  ParsedTLE,
  TLEParseOptions,
  TLEValidateOptions,
  TLEError,
  TLEWarning,
  ChecksumValidationResult,
  LineValidationResult,
  SatelliteNumberValidationResult,
  ClassificationValidationResult,
  NumericRangeValidationResult,
  ITLEValidationError,
  ITLEFormatError,
  LegacyValidationResult
} from './types';

// Re-export types for consumers
export * from './types';
export { ERROR_CODES, isValidErrorCode, getErrorDescription, isWarningCode, isCriticalError } from './errorCodes';
export {
  TLEStateMachineParser,
  parseWithStateMachine,
  ParserState,
  RecoveryAction,
  ErrorSeverityEnum as ErrorSeverity
} from './stateMachineParser';

// ============================================================================
// TLE CONFIGURATION LOADING
// ============================================================================

/**
 * TLE field configuration mapping field names to [start, end] positions
 */
interface TLEConfigMapping {
  readonly [key: string]: readonly [number, number];
}

// Load the TLE configuration with proper error handling
const tleConfigPath = path.join(__dirname, 'tleConfig.json');
let tleConfig: TLEConfigMapping;

try {
  const configData = fs.readFileSync(tleConfigPath, 'utf-8');
  tleConfig = JSON.parse(configData) as TLEConfigMapping;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new Error(`TLE configuration file not found: ${tleConfigPath}`);
  } else if (error instanceof SyntaxError) {
    throw new Error(`Invalid TLE configuration JSON: ${error.message}`);
  }
  throw error;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Custom error class for TLE validation errors
 * Thrown when TLE validation fails with detailed error information
 */
export class TLEValidationError extends Error implements ITLEValidationError {
  public readonly name = 'TLEValidationError' as const;
  public readonly errors: readonly TLEError[];
  public readonly warnings: readonly TLEWarning[];

  /**
   * Create a new TLE validation error
   * @param message - Error message
   * @param errors - Array of validation errors
   * @param warnings - Array of validation warnings
   */
  constructor(message: string, errors: readonly TLEError[], warnings: readonly TLEWarning[] = []) {
    super(message);
    this.errors = errors;
    this.warnings = warnings;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error class for TLE format errors
 * Thrown for structural/format issues in TLE data
 */
export class TLEFormatError extends Error implements ITLEFormatError {
  public readonly name = 'TLEFormatError' as const;
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  /**
   * Create a new TLE format error
   * @param message - Error message
   * @param code - Error code from ERROR_CODES
   * @param details - Additional error details
   */
  constructor(message: string, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// LINE ENDING NORMALIZATION
// ============================================================================

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
export function normalizeLineEndings(input: string): string {
  // Replace CRLF with LF, then replace any remaining CR with LF
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

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
export function parseTLELines(tleString: string): string[] {
  // First normalize line endings
  const normalized = normalizeLineEndings(tleString);

  // Split into lines, trim each line, and filter out empty lines
  const lines = normalized
    .split('\n')
    .map(line => {
      // Replace tabs with spaces for consistency
      const spacedLine = line.replace(/\t/g, ' ');
      return spacedLine.trim();
    })
    .filter(line => line.length > 0);

  return lines;
}

// ============================================================================
// CHECKSUM CALCULATION AND VALIDATION
// ============================================================================

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
export function calculateChecksum(line: string): number {
  let checksum = 0;
  // Process all characters except the last one (which is the checksum itself)
  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i];
    if (char && char >= '0' && char <= '9') {
      checksum += parseInt(char, 10);
    } else if (char === '-') {
      checksum += 1;
    }
    // Ignore all other characters (letters, spaces, periods, plus signs)
  }
  return checksum % 10;
}

/**
 * Validate TLE checksum against calculated value
 *
 * @param line - The TLE line to validate
 * @returns Validation result with details
 */
export function validateChecksum(line: string): ChecksumValidationResult {
  if (line.length !== 69) {
    return {
      isValid: false,
      expected: null,
      actual: null,
      error: {
        code: ERROR_CODES.INVALID_LINE_LENGTH,
        message: 'Line length must be 69 characters',
        field: 'line_length',
        expected: 69,
        actual: line.length,
        severity: 'error'
      }
    };
  }

  const expected = calculateChecksum(line);
  const actual = parseInt(line[68] || '', 10);

  if (isNaN(actual)) {
    return {
      isValid: false,
      expected,
      actual: null,
      error: {
        code: ERROR_CODES.INVALID_CHECKSUM_CHARACTER,
        message: 'Checksum position must contain a digit',
        field: 'checksum',
        position: 68,
        value: line[68],
        severity: 'error'
      }
    };
  }

  const isValid = expected === actual;
  return {
    isValid,
    expected,
    actual,
    error: isValid
      ? null
      : {
          code: ERROR_CODES.CHECKSUM_MISMATCH,
          message: `Checksum mismatch: expected ${expected}, got ${actual}`,
          field: 'checksum',
          expected,
          actual,
          severity: 'error'
        }
  };
}

// ============================================================================
// LINE STRUCTURE VALIDATION
// ============================================================================

/**
 * Validate TLE line structure including length, line number, and checksum
 *
 * @param line - The TLE line to validate
 * @param expectedLineNumber - Expected line number (1 or 2)
 * @returns Validation result with structured errors array
 */
export function validateLineStructure(line: string, expectedLineNumber: number): LineValidationResult {
  const errors: TLEError[] = [];

  // Check line length
  if (line.length !== 69) {
    errors.push({
      code: ERROR_CODES.INVALID_LINE_LENGTH,
      message: `Line ${expectedLineNumber} must be exactly 69 characters (got ${line.length})`,
      line: expectedLineNumber,
      field: 'line_length',
      expected: 69,
      actual: line.length,
      severity: 'error'
    });
    return { isValid: false, errors };
  }

  // Check line number
  const lineNumber = line[0];
  if (lineNumber !== expectedLineNumber.toString()) {
    errors.push({
      code: ERROR_CODES.INVALID_LINE_NUMBER,
      message: `Line ${expectedLineNumber} must start with '${expectedLineNumber}' (got '${lineNumber}')`,
      line: expectedLineNumber,
      field: 'line_number',
      expected: expectedLineNumber.toString(),
      actual: lineNumber,
      severity: 'error'
    });
  }

  // Check checksum
  const checksumResult = validateChecksum(line);
  if (!checksumResult.isValid && checksumResult.error) {
    errors.push({
      ...checksumResult.error,
      line: expectedLineNumber,
      message: `Line ${expectedLineNumber}: ${checksumResult.error.message}`
    } as TLEError);
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// FIELD VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate satellite number consistency between lines
 *
 * @param line1 - First TLE line
 * @param line2 - Second TLE line
 * @returns Validation result with structured error
 */
export function validateSatelliteNumber(line1: string, line2: string): SatelliteNumberValidationResult {
  const satNum1 = line1.substring(2, 7).trim();
  const satNum2 = line2.substring(2, 7).trim();

  if (satNum1 !== satNum2) {
    return {
      isValid: false,
      error: {
        code: ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
        message: `Satellite numbers must match (Line 1: ${satNum1}, Line 2: ${satNum2})`,
        field: 'satellite_number',
        line1Value: satNum1,
        line2Value: satNum2,
        severity: 'error'
      }
    };
  }

  // Validate it's a valid number
  if (!/^\d+$/.test(satNum1)) {
    return {
      isValid: false,
      error: {
        code: ERROR_CODES.INVALID_SATELLITE_NUMBER,
        message: `Satellite number must be numeric (got '${satNum1}')`,
        field: 'satellite_number',
        value: satNum1,
        severity: 'error'
      }
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate classification character (U, C, or S)
 *
 * @param line1 - First TLE line
 * @returns Validation result with structured error
 */
export function validateClassification(line1: string): ClassificationValidationResult {
  const classification = line1[7];
  const validClassifications = ['U', 'C', 'S'];

  if (!validClassifications.includes(classification || '')) {
    return {
      isValid: false,
      error: {
        code: ERROR_CODES.INVALID_CLASSIFICATION,
        message: `Classification must be U, C, or S (got '${classification}')`,
        field: 'classification',
        expected: validClassifications,
        actual: classification,
        severity: 'error'
      }
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate numeric field is within expected range
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validation result with structured error
 */
export function validateNumericRange(
  value: string,
  fieldName: string,
  min: number,
  max: number
): NumericRangeValidationResult {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: {
        code: ERROR_CODES.INVALID_NUMBER_FORMAT,
        message: `${fieldName} must be numeric (got '${value}')`,
        field: fieldName,
        value: value,
        severity: 'error'
      }
    };
  }

  if (numValue < min || numValue > max) {
    return {
      isValid: false,
      error: {
        code: ERROR_CODES.VALUE_OUT_OF_RANGE,
        message: `${fieldName} must be between ${min} and ${max} (got ${numValue})`,
        field: fieldName,
        value: numValue,
        min: min,
        max: max,
        severity: 'error'
      }
    };
  }

  return { isValid: true, error: null };
}

// ============================================================================
// WARNING DETECTION FUNCTIONS
// ============================================================================

/**
 * Check for deprecated or unusual classification values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export function checkClassificationWarnings(line1: string): TLEWarning[] {
  const warnings: TLEWarning[] = [];
  const classification = line1[7];

  if (classification === 'C' || classification === 'S') {
    warnings.push({
      code: ERROR_CODES.CLASSIFIED_DATA_WARNING,
      message: `Classification '${classification}' is unusual in public TLE data (typically 'U' for unclassified)`,
      field: 'classification',
      value: classification,
      severity: 'warning'
    });
  }

  return warnings;
}

/**
 * Check for stale/old epoch data
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export function checkEpochWarnings(line1: string): TLEWarning[] {
  const warnings: TLEWarning[] = [];

  // Extract epoch year and day
  const epochYear = parseInt(line1.substring(18, 20), 10);
  const epochDay = parseFloat(line1.substring(20, 32));

  if (isNaN(epochYear) || isNaN(epochDay)) {
    return warnings; // Skip if invalid format
  }

  // Convert two-digit year to full year
  // Years 57-99 are interpreted as 1957-1999, years 00-56 as 2000-2056
  const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear;

  // Warn about deprecated epoch year range (1900s)
  if (fullYear < 2000) {
    warnings.push({
      code: ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
      message: `Epoch year ${fullYear} is in the deprecated 1900s range (two-digit year: ${epochYear})`,
      field: 'epochYear',
      value: epochYear,
      fullYear: fullYear,
      severity: 'warning'
    });
  }

  // Calculate the epoch date
  const epochDate = new Date(fullYear, 0, 1); // January 1st of the epoch year
  epochDate.setDate(epochDate.getDate() + epochDay - 1);

  // Check if TLE is stale (older than 30 days)
  const now = new Date();
  const daysSinceEpoch = (now.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceEpoch > 30) {
    warnings.push({
      code: ERROR_CODES.STALE_TLE_WARNING,
      message: `TLE epoch is ${Math.floor(daysSinceEpoch)} days old (epoch: ${
        epochDate.toISOString().split('T')[0]
      }). TLE data may be stale.`,
      field: 'epoch',
      daysSinceEpoch: Math.floor(daysSinceEpoch),
      epochDate: epochDate.toISOString().split('T')[0],
      severity: 'warning'
    });
  }

  return warnings;
}

/**
 * Check for unusual orbital parameters
 *
 * @param line2 - Second TLE line
 * @returns Array of warnings
 */
export function checkOrbitalParameterWarnings(line2: string): TLEWarning[] {
  const warnings: TLEWarning[] = [];

  // Eccentricity (stored as decimal without leading "0.")
  const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim());

  if (!isNaN(eccentricity) && eccentricity > 0.25) {
    warnings.push({
      code: ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
      message: `Eccentricity ${eccentricity.toFixed(7)} is unusually high. This indicates a highly elliptical orbit.`,
      field: 'eccentricity',
      value: eccentricity,
      severity: 'warning'
    });
  }

  // Mean Motion (revolutions per day)
  const meanMotion = parseFloat(line2.substring(52, 63).trim());

  if (!isNaN(meanMotion) && meanMotion < 1.0) {
    warnings.push({
      code: ERROR_CODES.LOW_MEAN_MOTION_WARNING,
      message: `Mean motion ${meanMotion.toFixed(8)} rev/day is unusually low. This indicates a very high orbit.`,
      field: 'meanMotion',
      value: meanMotion,
      severity: 'warning'
    });
  }

  // Revolution number near rollover
  const revolutionNumber = parseInt(line2.substring(63, 68).trim(), 10);

  if (!isNaN(revolutionNumber) && revolutionNumber > 90000) {
    warnings.push({
      code: ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
      message: `Revolution number ${revolutionNumber} is approaching rollover limit (99999). Counter may reset soon.`,
      field: 'revolutionNumber',
      value: revolutionNumber,
      severity: 'warning'
    });
  }

  return warnings;
}

/**
 * Check for unusual drag and ephemeris values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
export function checkDragAndEphemerisWarnings(line1: string): TLEWarning[] {
  const warnings: TLEWarning[] = [];

  // B* drag term (ballistic coefficient)
  const bStar = line1.substring(53, 61).trim();

  // Check for near-zero or exactly zero drag
  if (bStar === '00000-0' || bStar === '00000+0' || bStar === '00000 0') {
    warnings.push({
      code: ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
      message: 'B* drag term is zero or near-zero, which is unusual for most satellites in LEO',
      field: 'bStar',
      value: bStar,
      severity: 'warning'
    });
  }

  // First derivative of mean motion
  const firstDerivative = parseFloat(line1.substring(33, 43).trim());

  if (!isNaN(firstDerivative) && firstDerivative < 0) {
    warnings.push({
      code: ERROR_CODES.NEGATIVE_DECAY_WARNING,
      message: `First derivative of mean motion is negative (${firstDerivative}), indicating orbital decay`,
      field: 'firstDerivative',
      value: firstDerivative,
      severity: 'warning'
    });
  }

  // Ephemeris type (should typically be 0 for SGP4/SDP4)
  const ephemerisType = line1.substring(62, 63).trim();

  if (ephemerisType !== '0' && ephemerisType !== '') {
    warnings.push({
      code: ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
      message: `Ephemeris type '${ephemerisType}' is non-standard (expected '0' for SGP4/SDP4)`,
      field: 'ephemerisType',
      value: ephemerisType,
      severity: 'warning'
    });
  }

  return warnings;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

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
export function validateTLE(tleString: string, options: TLEValidateOptions = {}): LegacyValidationResult {
  // Input validation
  if (typeof tleString !== 'string') {
    throw new TypeError('TLE data must be a string');
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError('Options must be an object');
  }

  if (tleString.length === 0) {
    throw new TLEFormatError('TLE string cannot be empty', ERROR_CODES.EMPTY_INPUT, { inputLength: 0 });
  }

  const { strictChecksums = true, validateRanges = true, mode = 'strict' } = options;

  // Validate mode parameter
  if (mode !== 'strict' && mode !== 'permissive') {
    throw new TypeError('Mode must be either "strict" or "permissive"');
  }

  const errors: TLEError[] = [];
  const warnings: TLEWarning[] = [];

  // Normalize line endings (handle CRLF, LF, CR)
  const normalizedTLE = normalizeLineEndings(tleString);

  // Parse lines and filter out comment lines (starting with #)
  const tleLines = normalizedTLE
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  // Check number of lines (can be 2 or 3, where line 0 is satellite name)
  if (tleLines.length < 2) {
    errors.push({
      code: ERROR_CODES.INVALID_LINE_COUNT,
      message: 'TLE must contain at least 2 lines',
      field: 'line_count',
      expected: '2 or 3',
      actual: tleLines.length,
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  if (tleLines.length > 3) {
    errors.push({
      code: ERROR_CODES.INVALID_LINE_COUNT,
      message: `TLE must contain 2 or 3 lines (got ${tleLines.length})`,
      field: 'line_count',
      expected: '2 or 3',
      actual: tleLines.length,
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Determine if there's a satellite name line (line 0)
  let line1Index = 0;
  let line2Index = 1;

  if (tleLines.length === 3) {
    // First line is satellite name
    line1Index = 1;
    line2Index = 2;

    const firstLine = tleLines[0];
    // Validate satellite name line (should not start with 1 or 2)
    if (firstLine && (firstLine[0] === '1' || firstLine[0] === '2')) {
      warnings.push({
        code: ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
        message: 'Line 0 starts with "1" or "2", might be incorrectly formatted',
        field: 'satellite_name',
        value: firstLine,
        severity: 'warning'
      });
    }

    if (firstLine && firstLine.length > 24) {
      warnings.push({
        code: ERROR_CODES.SATELLITE_NAME_TOO_LONG,
        message: 'Satellite name (Line 0) should be 24 characters or less',
        field: 'satellite_name',
        expected: 24,
        actual: firstLine.length,
        severity: 'warning'
      });
    }
  }

  const line1 = tleLines[line1Index];
  const line2 = tleLines[line2Index];

  if (!line1 || !line2) {
    errors.push({
      code: ERROR_CODES.INVALID_LINE_COUNT,
      message: 'Missing required TLE lines',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Validate line structures
  const line1Result = validateLineStructure(line1, 1);
  if (!line1Result.isValid) {
    // In permissive mode, checksum errors become warnings
    if (mode === 'permissive') {
      const criticalErrors = line1Result.errors.filter(
        e =>
          e.code !== ERROR_CODES.CHECKSUM_MISMATCH &&
          e.code !== ERROR_CODES.INVALID_CHECKSUM_CHARACTER
      );
      const checksumErrors = line1Result.errors.filter(
        e =>
          e.code === ERROR_CODES.CHECKSUM_MISMATCH ||
          e.code === ERROR_CODES.INVALID_CHECKSUM_CHARACTER
      );

      errors.push(...criticalErrors);
      warnings.push(...(checksumErrors.map(e => ({ ...e, severity: 'warning' as const }))));

      // Only return early for critical errors in permissive mode
      if (criticalErrors.length > 0) {
        return { isValid: false, errors, warnings };
      }
    } else {
      // Strict mode: all errors are critical
      errors.push(...line1Result.errors);
      if (strictChecksums) {
        return { isValid: false, errors, warnings };
      }
    }
  }

  const line2Result = validateLineStructure(line2, 2);
  if (!line2Result.isValid) {
    // In permissive mode, checksum errors become warnings
    if (mode === 'permissive') {
      const criticalErrors = line2Result.errors.filter(
        e =>
          e.code !== ERROR_CODES.CHECKSUM_MISMATCH &&
          e.code !== ERROR_CODES.INVALID_CHECKSUM_CHARACTER
      );
      const checksumErrors = line2Result.errors.filter(
        e =>
          e.code === ERROR_CODES.CHECKSUM_MISMATCH ||
          e.code === ERROR_CODES.INVALID_CHECKSUM_CHARACTER
      );

      errors.push(...criticalErrors);
      warnings.push(...(checksumErrors.map(e => ({ ...e, severity: 'warning' as const }))));

      // Only return early for critical errors in permissive mode
      if (criticalErrors.length > 0) {
        return { isValid: false, errors, warnings };
      }
    } else {
      // Strict mode: all errors are critical
      errors.push(...line2Result.errors);
      if (strictChecksums) {
        return { isValid: false, errors, warnings };
      }
    }
  }

  // Validate satellite number consistency
  const satNumResult = validateSatelliteNumber(line1, line2);
  if (!satNumResult.isValid && satNumResult.error) {
    if (mode === 'permissive') {
      // In permissive mode, satellite number mismatch is a warning
      warnings.push({ ...satNumResult.error, severity: 'warning' });
    } else {
      errors.push(satNumResult.error);
    }
  }

  // Validate classification
  const classResult = validateClassification(line1);
  if (!classResult.isValid && classResult.error) {
    if (mode === 'permissive') {
      // In permissive mode, invalid classification is a warning
      warnings.push({ ...classResult.error, severity: 'warning' });
    } else {
      errors.push(classResult.error);
    }
  }

  // Validate ranges if requested
  if (validateRanges && line1.length === 69 && line2.length === 69) {
    const rangeValidations: Array<{
      value: string;
      name: string;
      min: number;
      max: number;
      optional?: boolean;
      warningOnly?: boolean;
    }> = [
      { value: line1.substring(2, 7).trim(), name: 'Satellite Number', min: 1, max: 99999 },
      { value: line1.substring(9, 11).trim(), name: 'International Designator Year', min: 0, max: 99, optional: true },
      { value: line1.substring(11, 14).trim(), name: 'International Designator Launch Number', min: 1, max: 999, optional: true },
      { value: line1.substring(62, 63).trim(), name: 'Ephemeris Type', min: 0, max: 9, optional: true },
      { value: line1.substring(64, 68).trim(), name: 'Element Set Number', min: 0, max: 9999, optional: true },
      { value: line1.substring(18, 20).trim(), name: 'Epoch Year', min: 0, max: 99 },
      { value: line1.substring(20, 32).trim(), name: 'Epoch Day', min: 1, max: 366.99999999 },
      { value: line2.substring(8, 16).trim(), name: 'Inclination', min: 0, max: 180 },
      { value: line2.substring(17, 25).trim(), name: 'Right Ascension', min: 0, max: 360 },
      { value: '0.' + line2.substring(26, 33).trim(), name: 'Eccentricity', min: 0, max: 1 },
      { value: line2.substring(34, 42).trim(), name: 'Argument of Perigee', min: 0, max: 360 },
      { value: line2.substring(43, 51).trim(), name: 'Mean Anomaly', min: 0, max: 360 },
      { value: line2.substring(52, 63).trim(), name: 'Mean Motion', min: 0, max: 20, warningOnly: true },
      { value: line2.substring(63, 68).trim(), name: 'Revolution Number', min: 0, max: 99999, optional: true }
    ];

    for (const { value, name, min, max, optional, warningOnly } of rangeValidations) {
      if (optional && value.length === 0) continue;

      const result = validateNumericRange(value, name, min, max);
      if (!result.isValid && result.error) {
        if (warningOnly || mode === 'permissive') {
          warnings.push({ ...result.error, severity: 'warning' });
        } else {
          errors.push(result.error);
        }
      }
    }
  }

  // Check for deprecated and unusual values (warnings only)
  if (line1.length === 69) {
    warnings.push(...checkClassificationWarnings(line1));
    warnings.push(...checkEpochWarnings(line1));
    warnings.push(...checkDragAndEphemerisWarnings(line1));
  }

  if (line2.length === 69) {
    warnings.push(...checkOrbitalParameterWarnings(line2));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

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
export function parseTLE(tleString: string, options: TLEParseOptions = {}): ParsedTLE {
  // Input validation
  if (typeof tleString !== 'string') {
    throw new TypeError('TLE data must be a string');
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError('Options must be an object');
  }

  const {
    validate = true,
    strictChecksums = true,
    validateRanges = true,
    includeWarnings = true,
    includeComments = true,
    mode = 'strict'
  } = options;

  // Validate if requested
  let validationWarnings: readonly TLEWarning[] = [];
  if (validate) {
    const validation = validateTLE(tleString, { strictChecksums, validateRanges, mode });
    if (!validation.isValid) {
      // Create detailed error message
      const errorMessages = validation.errors.map(err => (typeof err === 'string' ? err : err.message));
      const errorMsg = 'TLE validation failed:\n' + errorMessages.join('\n');

      // Throw custom validation error with structured data
      throw new TLEValidationError(errorMsg, validation.errors, validation.warnings);
    }

    // Store warnings for later inclusion in result
    validationWarnings = validation.warnings;
  }

  // Normalize line endings (handle CRLF, LF, CR)
  const normalizedTLE = normalizeLineEndings(tleString);

  // Parse all lines and separate comments from TLE data
  const allLines = normalizedTLE
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  const comments = allLines.filter(line => line.startsWith('#'));
  const tleLines = allLines.filter(line => !line.startsWith('#'));

  // Determine line indices
  let line1Index = 0;
  let line2Index = 1;
  let satelliteName: string | null = null;

  if (tleLines.length === 3) {
    satelliteName = tleLines[0] || null;
    line1Index = 1;
    line2Index = 2;
  }

  const line1 = tleLines[line1Index];
  const line2 = tleLines[line2Index];

  if (!line1 || !line2) {
    throw new TLEFormatError('Missing required TLE lines', ERROR_CODES.INVALID_LINE_COUNT);
  }

  const tleObject: Partial<ParsedTLE> & { satelliteName: string | null } = {
    satelliteName: satelliteName
  };

  // Line 2 fields (fields that come from the second line)
  const line2Fields = [
    'lineNumber2',
    'satelliteNumber2',
    'inclination',
    'rightAscension',
    'eccentricity',
    'argumentOfPerigee',
    'meanAnomaly',
    'meanMotion',
    'revolutionNumber',
    'checksum2'
  ];

  for (const [key, value] of Object.entries(tleConfig)) {
    const [start, end] = value;
    const line = line2Fields.includes(key) ? line2 : line1;
    (tleObject as any)[key] = line.substring(start, end).trim();
  }

  // Include warnings in the result if requested and available
  if (includeWarnings && validationWarnings.length > 0) {
    (tleObject as any).warnings = validationWarnings;
  }

  // Include comments in the result if requested and available
  if (includeComments && comments.length > 0) {
    (tleObject as any).comments = comments;
  }

  return tleObject as ParsedTLE;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  parseTLE,
  validateTLE,
  calculateChecksum,
  validateChecksum,
  validateLineStructure,
  validateSatelliteNumber,
  validateClassification,
  validateNumericRange,
  checkClassificationWarnings,
  checkEpochWarnings,
  checkOrbitalParameterWarnings,
  checkDragAndEphemerisWarnings,
  normalizeLineEndings,
  parseTLELines,
  TLEValidationError,
  TLEFormatError,
  ERROR_CODES
};
