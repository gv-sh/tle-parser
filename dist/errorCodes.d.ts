/**
 * Error codes for structured error handling in TLE parser
 * Provides type-safe error identification for validation and parsing operations
 */
/**
 * Comprehensive enumeration of all TLE parser error codes
 * Used for structured error reporting and handling
 */
export declare enum ERROR_CODES {
    /** Input data type is invalid (not a string) */
    INVALID_INPUT_TYPE = "INVALID_INPUT_TYPE",
    /** Input string is empty or contains only whitespace */
    EMPTY_INPUT = "EMPTY_INPUT",
    /** TLE does not contain exactly 2 or 3 lines */
    INVALID_LINE_COUNT = "INVALID_LINE_COUNT",
    /** TLE line is not exactly 69 characters */
    INVALID_LINE_LENGTH = "INVALID_LINE_LENGTH",
    /** Line number is not 1 or 2 as expected */
    INVALID_LINE_NUMBER = "INVALID_LINE_NUMBER",
    /** Calculated checksum does not match the checksum in the TLE */
    CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH",
    /** Checksum character is not a valid digit (0-9) */
    INVALID_CHECKSUM_CHARACTER = "INVALID_CHECKSUM_CHARACTER",
    /** Satellite catalog numbers on line 1 and line 2 do not match */
    SATELLITE_NUMBER_MISMATCH = "SATELLITE_NUMBER_MISMATCH",
    /** Satellite catalog number is invalid or out of range */
    INVALID_SATELLITE_NUMBER = "INVALID_SATELLITE_NUMBER",
    /** Classification character is not U, C, or S */
    INVALID_CLASSIFICATION = "INVALID_CLASSIFICATION",
    /** Field value is outside the valid range */
    VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE",
    /** Field contains non-numeric characters where numbers are expected */
    INVALID_NUMBER_FORMAT = "INVALID_NUMBER_FORMAT",
    /** Satellite name exceeds maximum allowed length */
    SATELLITE_NAME_TOO_LONG = "SATELLITE_NAME_TOO_LONG",
    /** Satellite name contains unusual or non-standard characters */
    SATELLITE_NAME_FORMAT_WARNING = "SATELLITE_NAME_FORMAT_WARNING",
    /** TLE contains classified satellite data (classification C or S) */
    CLASSIFIED_DATA_WARNING = "CLASSIFIED_DATA_WARNING",
    /** TLE epoch is significantly old (data may be stale) */
    STALE_TLE_WARNING = "STALE_TLE_WARNING",
    /** Eccentricity is unusually high (near 1.0, highly elliptical orbit) */
    HIGH_ECCENTRICITY_WARNING = "HIGH_ECCENTRICITY_WARNING",
    /** Mean motion is unusually low (very high altitude orbit) */
    LOW_MEAN_MOTION_WARNING = "LOW_MEAN_MOTION_WARNING",
    /** Epoch year is in the far past (potentially deprecated data) */
    DEPRECATED_EPOCH_YEAR_WARNING = "DEPRECATED_EPOCH_YEAR_WARNING",
    /** Revolution number may have rolled over (exceeded 99999) */
    REVOLUTION_NUMBER_ROLLOVER_WARNING = "REVOLUTION_NUMBER_ROLLOVER_WARNING",
    /** Drag coefficient (BSTAR) is near zero */
    NEAR_ZERO_DRAG_WARNING = "NEAR_ZERO_DRAG_WARNING",
    /** Ephemeris type is not standard (not 0 or blank) */
    NON_STANDARD_EPHEMERIS_WARNING = "NON_STANDARD_EPHEMERIS_WARNING",
    /** First derivative (mean motion decay) is negative */
    NEGATIVE_DECAY_WARNING = "NEGATIVE_DECAY_WARNING"
}
/**
 * Const object for backward compatibility with existing JavaScript code
 * Provides the same interface as the original ERROR_CODES object
 *
 * @deprecated Use the ERROR_CODES enum instead for better type safety
 */
export declare const ERROR_CODES_CONST: {
    readonly INVALID_INPUT_TYPE: ERROR_CODES.INVALID_INPUT_TYPE;
    readonly EMPTY_INPUT: ERROR_CODES.EMPTY_INPUT;
    readonly INVALID_LINE_COUNT: ERROR_CODES.INVALID_LINE_COUNT;
    readonly INVALID_LINE_LENGTH: ERROR_CODES.INVALID_LINE_LENGTH;
    readonly INVALID_LINE_NUMBER: ERROR_CODES.INVALID_LINE_NUMBER;
    readonly CHECKSUM_MISMATCH: ERROR_CODES.CHECKSUM_MISMATCH;
    readonly INVALID_CHECKSUM_CHARACTER: ERROR_CODES.INVALID_CHECKSUM_CHARACTER;
    readonly SATELLITE_NUMBER_MISMATCH: ERROR_CODES.SATELLITE_NUMBER_MISMATCH;
    readonly INVALID_SATELLITE_NUMBER: ERROR_CODES.INVALID_SATELLITE_NUMBER;
    readonly INVALID_CLASSIFICATION: ERROR_CODES.INVALID_CLASSIFICATION;
    readonly VALUE_OUT_OF_RANGE: ERROR_CODES.VALUE_OUT_OF_RANGE;
    readonly INVALID_NUMBER_FORMAT: ERROR_CODES.INVALID_NUMBER_FORMAT;
    readonly SATELLITE_NAME_TOO_LONG: ERROR_CODES.SATELLITE_NAME_TOO_LONG;
    readonly SATELLITE_NAME_FORMAT_WARNING: ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING;
    readonly CLASSIFIED_DATA_WARNING: ERROR_CODES.CLASSIFIED_DATA_WARNING;
    readonly STALE_TLE_WARNING: ERROR_CODES.STALE_TLE_WARNING;
    readonly HIGH_ECCENTRICITY_WARNING: ERROR_CODES.HIGH_ECCENTRICITY_WARNING;
    readonly LOW_MEAN_MOTION_WARNING: ERROR_CODES.LOW_MEAN_MOTION_WARNING;
    readonly DEPRECATED_EPOCH_YEAR_WARNING: ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING;
    readonly REVOLUTION_NUMBER_ROLLOVER_WARNING: ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING;
    readonly NEAR_ZERO_DRAG_WARNING: ERROR_CODES.NEAR_ZERO_DRAG_WARNING;
    readonly NON_STANDARD_EPHEMERIS_WARNING: ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING;
    readonly NEGATIVE_DECAY_WARNING: ERROR_CODES.NEGATIVE_DECAY_WARNING;
};
/**
 * Type representing all valid error code string values
 */
export type ErrorCodeValue = typeof ERROR_CODES[keyof typeof ERROR_CODES];
/**
 * Type guard to check if a string is a valid error code
 * @param code - The string to check
 * @returns True if the string is a valid error code
 */
export declare function isValidErrorCode(code: string): code is ErrorCodeValue;
/**
 * Helper function to get a human-readable description of an error code
 * @param code - The error code to describe
 * @returns A human-readable description of the error code
 */
export declare function getErrorDescription(code: ERROR_CODES | string): string;
/**
 * Check if an error code represents a warning (non-critical issue)
 * @param code - The error code to check
 * @returns True if the error code is a warning
 */
export declare function isWarningCode(code: ERROR_CODES | string): boolean;
/**
 * Check if an error code represents a critical error
 * @param code - The error code to check
 * @returns True if the error code is critical
 */
export declare function isCriticalError(code: ERROR_CODES | string): boolean;
//# sourceMappingURL=errorCodes.d.ts.map