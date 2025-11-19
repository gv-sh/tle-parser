/**
 * Error codes for structured error handling in TLE parser
 * Provides type-safe error identification for validation and parsing operations
 */

/**
 * Comprehensive enumeration of all TLE parser error codes
 * Used for structured error reporting and handling
 */
export enum ERROR_CODES {
  // ============================================================================
  // INPUT VALIDATION ERRORS
  // ============================================================================

  /** Input data type is invalid (not a string) */
  INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE',

  /** Input string is empty or contains only whitespace */
  EMPTY_INPUT = 'EMPTY_INPUT',

  // ============================================================================
  // STRUCTURE ERRORS
  // ============================================================================

  /** TLE does not contain exactly 2 or 3 lines */
  INVALID_LINE_COUNT = 'INVALID_LINE_COUNT',

  /** TLE line is not exactly 69 characters */
  INVALID_LINE_LENGTH = 'INVALID_LINE_LENGTH',

  /** Line number is not 1 or 2 as expected */
  INVALID_LINE_NUMBER = 'INVALID_LINE_NUMBER',

  // ============================================================================
  // CHECKSUM ERRORS
  // ============================================================================

  /** Calculated checksum does not match the checksum in the TLE */
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',

  /** Checksum character is not a valid digit (0-9) */
  INVALID_CHECKSUM_CHARACTER = 'INVALID_CHECKSUM_CHARACTER',

  // ============================================================================
  // FIELD VALIDATION ERRORS
  // ============================================================================

  /** Satellite catalog numbers on line 1 and line 2 do not match */
  SATELLITE_NUMBER_MISMATCH = 'SATELLITE_NUMBER_MISMATCH',

  /** Satellite catalog number is invalid or out of range */
  INVALID_SATELLITE_NUMBER = 'INVALID_SATELLITE_NUMBER',

  /** Classification character is not U, C, or S */
  INVALID_CLASSIFICATION = 'INVALID_CLASSIFICATION',

  /** Field value is outside the valid range */
  VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',

  /** Field contains non-numeric characters where numbers are expected */
  INVALID_NUMBER_FORMAT = 'INVALID_NUMBER_FORMAT',

  /** Satellite name exceeds maximum allowed length */
  SATELLITE_NAME_TOO_LONG = 'SATELLITE_NAME_TOO_LONG',

  /** Satellite name contains unusual or non-standard characters */
  SATELLITE_NAME_FORMAT_WARNING = 'SATELLITE_NAME_FORMAT_WARNING',

  // ============================================================================
  // WARNING CODES - Unusual but potentially valid values
  // ============================================================================

  /** TLE contains classified satellite data (classification C or S) */
  CLASSIFIED_DATA_WARNING = 'CLASSIFIED_DATA_WARNING',

  /** TLE epoch is significantly old (data may be stale) */
  STALE_TLE_WARNING = 'STALE_TLE_WARNING',

  /** Eccentricity is unusually high (near 1.0, highly elliptical orbit) */
  HIGH_ECCENTRICITY_WARNING = 'HIGH_ECCENTRICITY_WARNING',

  /** Mean motion is unusually low (very high altitude orbit) */
  LOW_MEAN_MOTION_WARNING = 'LOW_MEAN_MOTION_WARNING',

  /** Epoch year is in the far past (potentially deprecated data) */
  DEPRECATED_EPOCH_YEAR_WARNING = 'DEPRECATED_EPOCH_YEAR_WARNING',

  /** Revolution number may have rolled over (exceeded 99999) */
  REVOLUTION_NUMBER_ROLLOVER_WARNING = 'REVOLUTION_NUMBER_ROLLOVER_WARNING',

  /** Drag coefficient (BSTAR) is near zero */
  NEAR_ZERO_DRAG_WARNING = 'NEAR_ZERO_DRAG_WARNING',

  /** Ephemeris type is not standard (not 0 or blank) */
  NON_STANDARD_EPHEMERIS_WARNING = 'NON_STANDARD_EPHEMERIS_WARNING',

  /** First derivative (mean motion decay) is negative */
  NEGATIVE_DECAY_WARNING = 'NEGATIVE_DECAY_WARNING'
}

/**
 * Const object for backward compatibility with existing JavaScript code
 * Provides the same interface as the original ERROR_CODES object
 *
 * @deprecated Use the ERROR_CODES enum instead for better type safety
 */
export const ERROR_CODES_CONST = {
  INVALID_INPUT_TYPE: ERROR_CODES.INVALID_INPUT_TYPE,
  EMPTY_INPUT: ERROR_CODES.EMPTY_INPUT,
  INVALID_LINE_COUNT: ERROR_CODES.INVALID_LINE_COUNT,
  INVALID_LINE_LENGTH: ERROR_CODES.INVALID_LINE_LENGTH,
  INVALID_LINE_NUMBER: ERROR_CODES.INVALID_LINE_NUMBER,
  CHECKSUM_MISMATCH: ERROR_CODES.CHECKSUM_MISMATCH,
  INVALID_CHECKSUM_CHARACTER: ERROR_CODES.INVALID_CHECKSUM_CHARACTER,
  SATELLITE_NUMBER_MISMATCH: ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
  INVALID_SATELLITE_NUMBER: ERROR_CODES.INVALID_SATELLITE_NUMBER,
  INVALID_CLASSIFICATION: ERROR_CODES.INVALID_CLASSIFICATION,
  VALUE_OUT_OF_RANGE: ERROR_CODES.VALUE_OUT_OF_RANGE,
  INVALID_NUMBER_FORMAT: ERROR_CODES.INVALID_NUMBER_FORMAT,
  SATELLITE_NAME_TOO_LONG: ERROR_CODES.SATELLITE_NAME_TOO_LONG,
  SATELLITE_NAME_FORMAT_WARNING: ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
  CLASSIFIED_DATA_WARNING: ERROR_CODES.CLASSIFIED_DATA_WARNING,
  STALE_TLE_WARNING: ERROR_CODES.STALE_TLE_WARNING,
  HIGH_ECCENTRICITY_WARNING: ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
  LOW_MEAN_MOTION_WARNING: ERROR_CODES.LOW_MEAN_MOTION_WARNING,
  DEPRECATED_EPOCH_YEAR_WARNING: ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
  REVOLUTION_NUMBER_ROLLOVER_WARNING: ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
  NEAR_ZERO_DRAG_WARNING: ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
  NON_STANDARD_EPHEMERIS_WARNING: ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
  NEGATIVE_DECAY_WARNING: ERROR_CODES.NEGATIVE_DECAY_WARNING
} as const;

/**
 * Type representing all valid error code string values
 */
export type ErrorCodeValue = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Type guard to check if a string is a valid error code
 * @param code - The string to check
 * @returns True if the string is a valid error code
 */
export function isValidErrorCode(code: string): code is ErrorCodeValue {
  return Object.values(ERROR_CODES).includes(code as ERROR_CODES);
}

/**
 * Helper function to get a human-readable description of an error code
 * @param code - The error code to describe
 * @returns A human-readable description of the error code
 */
export function getErrorDescription(code: ERROR_CODES | string): string {
  const descriptions: Record<string, string> = {
    [ERROR_CODES.INVALID_INPUT_TYPE]: 'Input data must be a string',
    [ERROR_CODES.EMPTY_INPUT]: 'Input string is empty or contains only whitespace',
    [ERROR_CODES.INVALID_LINE_COUNT]: 'TLE must contain exactly 2 or 3 lines',
    [ERROR_CODES.INVALID_LINE_LENGTH]: 'TLE line must be exactly 69 characters',
    [ERROR_CODES.INVALID_LINE_NUMBER]: 'Line number must be 1 or 2',
    [ERROR_CODES.CHECKSUM_MISMATCH]: 'Calculated checksum does not match',
    [ERROR_CODES.INVALID_CHECKSUM_CHARACTER]: 'Checksum must be a digit 0-9',
    [ERROR_CODES.SATELLITE_NUMBER_MISMATCH]: 'Satellite numbers on line 1 and line 2 must match',
    [ERROR_CODES.INVALID_SATELLITE_NUMBER]: 'Satellite catalog number is invalid',
    [ERROR_CODES.INVALID_CLASSIFICATION]: 'Classification must be U, C, or S',
    [ERROR_CODES.VALUE_OUT_OF_RANGE]: 'Field value is outside valid range',
    [ERROR_CODES.INVALID_NUMBER_FORMAT]: 'Field contains invalid numeric format',
    [ERROR_CODES.SATELLITE_NAME_TOO_LONG]: 'Satellite name exceeds maximum length',
    [ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING]: 'Satellite name contains unusual characters',
    [ERROR_CODES.CLASSIFIED_DATA_WARNING]: 'TLE contains classified satellite data',
    [ERROR_CODES.STALE_TLE_WARNING]: 'TLE epoch is significantly old',
    [ERROR_CODES.HIGH_ECCENTRICITY_WARNING]: 'Eccentricity is unusually high',
    [ERROR_CODES.LOW_MEAN_MOTION_WARNING]: 'Mean motion is unusually low',
    [ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING]: 'Epoch year is in the far past',
    [ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING]: 'Revolution number may have rolled over',
    [ERROR_CODES.NEAR_ZERO_DRAG_WARNING]: 'Drag coefficient is near zero',
    [ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING]: 'Ephemeris type is non-standard',
    [ERROR_CODES.NEGATIVE_DECAY_WARNING]: 'Mean motion decay is negative'
  };

  return descriptions[code] || 'Unknown error code';
}

/**
 * Check if an error code represents a warning (non-critical issue)
 * @param code - The error code to check
 * @returns True if the error code is a warning
 */
export function isWarningCode(code: ERROR_CODES | string): boolean {
  const warningCodes = [
    ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
    ERROR_CODES.CLASSIFIED_DATA_WARNING,
    ERROR_CODES.STALE_TLE_WARNING,
    ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
    ERROR_CODES.LOW_MEAN_MOTION_WARNING,
    ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
    ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
    ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
    ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
    ERROR_CODES.NEGATIVE_DECAY_WARNING
  ];

  return warningCodes.includes(code as ERROR_CODES);
}

/**
 * Check if an error code represents a critical error
 * @param code - The error code to check
 * @returns True if the error code is critical
 */
export function isCriticalError(code: ERROR_CODES | string): boolean {
  return !isWarningCode(code);
}
