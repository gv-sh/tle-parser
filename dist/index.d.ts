import { Transform } from 'stream';

/**
 * Error codes for structured error handling in TLE parser
 * Provides type-safe error identification for validation and parsing operations
 */
/**
 * Comprehensive enumeration of all TLE parser error codes
 * Used for structured error reporting and handling
 */
declare enum ERROR_CODES {
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
 * Type representing all valid error code string values
 */
type ErrorCodeValue = typeof ERROR_CODES[keyof typeof ERROR_CODES];
/**
 * Type guard to check if a string is a valid error code
 * @param code - The string to check
 * @returns True if the string is a valid error code
 */
declare function isValidErrorCode(code: string): code is ErrorCodeValue;
/**
 * Helper function to get a human-readable description of an error code
 * @param code - The error code to describe
 * @returns A human-readable description of the error code
 */
declare function getErrorDescription(code: ERROR_CODES | string): string;
/**
 * Check if an error code represents a warning (non-critical issue)
 * @param code - The error code to check
 * @returns True if the error code is a warning
 */
declare function isWarningCode(code: ERROR_CODES | string): boolean;
/**
 * Check if an error code represents a critical error
 * @param code - The error code to check
 * @returns True if the error code is critical
 */
declare function isCriticalError(code: ERROR_CODES | string): boolean;

/**
 * Comprehensive TypeScript type definitions for TLE Parser
 * Provides type-safe parsing of Two-Line Element (TLE) satellite data
 */
/**
 * Brand type for creating nominal types
 * @template T - The base type
 * @template Brand - A unique string literal type to brand the type
 */
type Brand<T, Brand extends string> = T & {
    readonly __brand: Brand;
};
/**
 * Satellite catalog number (NORAD ID)
 * Valid range: 1-99999
 */
type SatelliteNumber = Brand<number, 'SatelliteNumber'>;
/**
 * Valid TLE checksum digit (0-9)
 */
type Checksum = Brand<number, 'Checksum'>;
/**
 * Classification character (U, C, S)
 */
type Classification = Brand<string, 'Classification'>;
/**
 * International Designator Year (0-99)
 */
type InternationalDesignatorYear = Brand<number, 'InternationalDesignatorYear'>;
/**
 * International Designator Launch Number (1-999)
 */
type InternationalDesignatorLaunchNumber = Brand<number, 'InternationalDesignatorLaunchNumber'>;
/**
 * Epoch Year (0-99, two-digit year)
 */
type EpochYear = Brand<number, 'EpochYear'>;
/**
 * Epoch Day (1.0-366.99999999)
 */
type EpochDay = Brand<number, 'EpochDay'>;
/**
 * Ephemeris Type (0-9, single digit)
 */
type EphemerisType = Brand<number, 'EphemerisType'>;
/**
 * Element Set Number (0-9999)
 */
type ElementSetNumber = Brand<number, 'ElementSetNumber'>;
/**
 * Orbital Inclination in degrees (0-180)
 */
type Inclination = Brand<number, 'Inclination'>;
/**
 * Right Ascension of Ascending Node in degrees (0-360)
 */
type RightAscension = Brand<number, 'RightAscension'>;
/**
 * Eccentricity (0-0.99999999, stored without leading decimal point)
 */
type Eccentricity = Brand<number, 'Eccentricity'>;
/**
 * Argument of Perigee in degrees (0-360)
 */
type ArgumentOfPerigee = Brand<number, 'ArgumentOfPerigee'>;
/**
 * Mean Anomaly in degrees (0-360)
 */
type MeanAnomaly = Brand<number, 'MeanAnomaly'>;
/**
 * Mean Motion in revolutions per day
 */
type MeanMotion = Brand<number, 'MeanMotion'>;
/**
 * Revolution Number at Epoch
 */
type RevolutionNumber = Brand<number, 'RevolutionNumber'>;
/**
 * Classification types for satellites
 */
type ClassificationType = 'U' | 'C' | 'S';
/**
 * Validation mode for TLE parsing
 */
type ValidationMode = 'strict' | 'permissive';
/**
 * Error severity levels
 */
type ErrorSeverity = 'error' | 'warning' | 'info';
/**
 * TLE error codes - comprehensive enumeration of all possible error conditions
 */
declare enum TLEErrorCode {
    INVALID_LINE_COUNT = "INVALID_LINE_COUNT",
    INVALID_LINE_LENGTH = "INVALID_LINE_LENGTH",
    INVALID_LINE_NUMBER = "INVALID_LINE_NUMBER",
    SATELLITE_NUMBER_MISMATCH = "SATELLITE_NUMBER_MISMATCH",
    CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH",
    INVALID_CHECKSUM_CHARACTER = "INVALID_CHECKSUM_CHARACTER",
    INVALID_CLASSIFICATION = "INVALID_CLASSIFICATION",
    INVALID_SATELLITE_NUMBER = "INVALID_SATELLITE_NUMBER",
    INVALID_INTL_DESIGNATOR_YEAR = "INVALID_INTL_DESIGNATOR_YEAR",
    INVALID_INTL_DESIGNATOR_LAUNCH = "INVALID_INTL_DESIGNATOR_LAUNCH",
    INVALID_EPOCH_YEAR = "INVALID_EPOCH_YEAR",
    INVALID_EPOCH_DAY = "INVALID_EPOCH_DAY",
    INVALID_EPHEMERIS_TYPE = "INVALID_EPHEMERIS_TYPE",
    INVALID_ELEMENT_SET_NUMBER = "INVALID_ELEMENT_SET_NUMBER",
    INVALID_INCLINATION = "INVALID_INCLINATION",
    INVALID_RIGHT_ASCENSION = "INVALID_RIGHT_ASCENSION",
    INVALID_ECCENTRICITY = "INVALID_ECCENTRICITY",
    INVALID_ARG_OF_PERIGEE = "INVALID_ARG_OF_PERIGEE",
    INVALID_MEAN_ANOMALY = "INVALID_MEAN_ANOMALY",
    INVALID_MEAN_MOTION = "INVALID_MEAN_MOTION",
    INVALID_REVOLUTION_NUMBER = "INVALID_REVOLUTION_NUMBER",
    UNUSUAL_CLASSIFICATION = "UNUSUAL_CLASSIFICATION",
    OLD_EPOCH = "OLD_EPOCH",
    EXTREME_ECCENTRICITY = "EXTREME_ECCENTRICITY",
    EXTREME_INCLINATION = "EXTREME_INCLINATION",
    HIGH_MEAN_MOTION = "HIGH_MEAN_MOTION",
    LOW_MEAN_MOTION = "LOW_MEAN_MOTION",
    PARSE_ERROR = "PARSE_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR"
}
/**
 * TLE validation or parsing error
 */
interface TLEError {
    /** Error code from TLEErrorCode enum */
    readonly code: TLEErrorCode | string;
    /** Human-readable error message */
    readonly message: string;
    /** Line number where error occurred (1 or 2) */
    readonly line?: number;
    /** Field name where error occurred */
    readonly field?: string;
    /** Expected value */
    readonly expected?: unknown;
    /** Actual value found */
    readonly actual?: unknown;
    /** Error severity level */
    readonly severity: ErrorSeverity;
    /** Character position in line (optional) */
    readonly position?: number;
    /** Additional context or details */
    readonly details?: Record<string, unknown>;
    /** Allow additional properties for extensibility */
    readonly [key: string]: unknown;
}
/**
 * TLE validation warning
 */
interface TLEWarning {
    /** Error code from TLEErrorCode enum */
    readonly code: TLEErrorCode | string;
    /** Human-readable warning message */
    readonly message: string;
    /** Line number where warning occurred (1 or 2) */
    readonly line?: number;
    /** Field name where warning occurred */
    readonly field?: string;
    /** Expected value */
    readonly expected?: unknown;
    /** Actual value found */
    readonly actual?: unknown;
    /** Warning severity level (always 'warning') */
    readonly severity: 'warning';
    /** Character position in line (optional) */
    readonly position?: number;
    /** Additional context or details */
    readonly details?: Record<string, unknown>;
    /** Allow additional properties for extensibility */
    readonly [key: string]: unknown;
}
/**
 * Parsed TLE object with all standard fields
 * All numeric fields are returned as strings to preserve exact formatting
 */
interface ParsedTLE {
    /** Satellite name (if 3-line format used) */
    readonly satelliteName: string | null;
    /** Line 1 identifier (should be "1") */
    readonly lineNumber1: string;
    /** NORAD catalog number (5 digits) */
    readonly satelliteNumber1: string;
    /** Classification (U=Unclassified, C=Classified, S=Secret) */
    readonly classification: string;
    /** International Designator - Launch Year (2 digits) */
    readonly internationalDesignatorYear: string;
    /** International Designator - Launch Number (3 digits) */
    readonly internationalDesignatorLaunchNumber: string;
    /** International Designator - Piece of Launch (3 chars) */
    readonly internationalDesignatorPiece: string;
    /** Epoch Year (2 digits) */
    readonly epochYear: string;
    /** Epoch Day and fractional portion */
    readonly epoch: string;
    /** First derivative of mean motion (ballistic coefficient) */
    readonly firstDerivative: string;
    /** Second derivative of mean motion (decimal point assumed) */
    readonly secondDerivative: string;
    /** Drag term / radiation pressure coefficient (B* or BSTAR) */
    readonly bStar: string;
    /** Ephemeris type (0=SGP, 2=SGP4, etc.) */
    readonly ephemerisType: string;
    /** Element set number */
    readonly elementSetNumber: string;
    /** Line 1 checksum */
    readonly checksum1: string;
    /** Line 2 identifier (should be "2") */
    readonly lineNumber2: string;
    /** NORAD catalog number (should match line 1) */
    readonly satelliteNumber2: string;
    /** Inclination in degrees */
    readonly inclination: string;
    /** Right Ascension of Ascending Node in degrees */
    readonly rightAscension: string;
    /** Eccentricity (decimal point assumed) */
    readonly eccentricity: string;
    /** Argument of Perigee in degrees */
    readonly argumentOfPerigee: string;
    /** Mean Anomaly in degrees */
    readonly meanAnomaly: string;
    /** Mean Motion in revolutions per day */
    readonly meanMotion: string;
    /** Revolution number at epoch */
    readonly revolutionNumber: string;
    /** Line 2 checksum */
    readonly checksum2: string;
    /** Validation warnings (if includeWarnings=true) */
    readonly warnings?: readonly TLEWarning[];
    /** Comment lines from TLE file (if includeComments=true) */
    readonly comments?: readonly string[];
}
/**
 * Extended parsed TLE object with typed numeric conversions
 * For library consumers who want strongly-typed numeric values
 */
interface ParsedTLEWithNumbers extends ParsedTLE {
    /** Numeric conversions of TLE fields */
    readonly numeric: {
        readonly satelliteNumber: number;
        readonly internationalDesignatorYear: number;
        readonly internationalDesignatorLaunchNumber: number;
        readonly epochYear: number;
        readonly epochDay: number;
        readonly firstDerivative: number;
        readonly secondDerivative: number;
        readonly bStar: number;
        readonly ephemerisType: number;
        readonly elementSetNumber: number;
        readonly inclination: number;
        readonly rightAscension: number;
        readonly eccentricity: number;
        readonly argumentOfPerigee: number;
        readonly meanAnomaly: number;
        readonly meanMotion: number;
        readonly revolutionNumber: number;
    };
}
/**
 * Options for TLE parsing and validation
 */
interface TLEParseOptions {
    /** Whether to validate the TLE data (default: true) */
    readonly validate?: boolean;
    /** Require valid checksums in strict mode (default: true) */
    readonly strictChecksums?: boolean;
    /** Validate field value ranges (default: true) */
    readonly validateRanges?: boolean;
    /** Include warnings in the result (default: true) */
    readonly includeWarnings?: boolean;
    /** Include comment lines in the result (default: true) */
    readonly includeComments?: boolean;
    /** Validation mode: 'strict' or 'permissive' (default: 'strict') */
    readonly mode?: ValidationMode;
}
/**
 * Options for TLE validation only (no parsing)
 */
interface TLEValidateOptions {
    /** Require valid checksums (default: true) */
    readonly strictChecksums?: boolean;
    /** Validate field value ranges (default: true) */
    readonly validateRanges?: boolean;
    /** Validation mode: 'strict' or 'permissive' (default: 'strict') */
    readonly mode?: ValidationMode;
}
/**
 * Successful validation result
 */
interface ValidationSuccess {
    readonly success: true;
    readonly isValid: true;
    readonly errors: readonly [];
    readonly warnings: readonly TLEWarning[];
}
/**
 * Failed validation result
 */
interface ValidationFailure {
    readonly success: false;
    readonly isValid: false;
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
}
/**
 * Discriminated union for validation results
 * Use the 'success' field to narrow the type
 */
type ValidationResult = ValidationSuccess | ValidationFailure;
/**
 * Legacy validation result format (for backward compatibility)
 */
interface LegacyValidationResult {
    readonly isValid: boolean;
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
}
/**
 * Successful parse result
 */
interface ParseSuccess<T extends ParsedTLE = ParsedTLE> {
    readonly success: true;
    readonly data: T;
    readonly warnings: readonly TLEWarning[];
}
/**
 * Failed parse result
 */
interface ParseFailure {
    readonly success: false;
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
}
/**
 * Discriminated union for parse results
 * Use the 'success' field to narrow the type
 */
type ParseResult<T extends ParsedTLE = ParsedTLE> = ParseSuccess<T> | ParseFailure;
/**
 * Parser state in the state machine
 */
declare enum ParserState$1 {
    INITIAL = "INITIAL",
    READING_NAME = "READING_NAME",
    READING_LINE1 = "READING_LINE1",
    READING_LINE2 = "READING_LINE2",
    COMPLETE = "COMPLETE",
    ERROR = "ERROR",
    RECOVERING = "RECOVERING"
}
/**
 * Recovery action for error handling
 */
declare enum RecoveryAction$1 {
    /** Continue parsing despite the error */
    CONTINUE = "CONTINUE",
    /** Skip the current field */
    SKIP_FIELD = "SKIP_FIELD",
    /** Use a default value for the field */
    USE_DEFAULT = "USE_DEFAULT",
    /** Attempt to fix the issue automatically */
    ATTEMPT_FIX = "ATTEMPT_FIX",
    /** Cannot recover, abort parsing */
    ABORT = "ABORT"
}
/**
 * State machine parser context
 */
interface ParserContext {
    readonly state: ParserState$1;
    readonly currentLine: number;
    readonly partialData: Partial<ParsedTLE>;
    readonly errors: TLEError[];
    readonly warnings: TLEWarning[];
}
/**
 * State machine parser result with recovery information
 */
interface StateMachineParseResult {
    readonly success: boolean;
    readonly data: ParsedTLE | null;
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
    readonly recoveryActions: readonly RecoveryAction$1[];
    readonly partialData?: Partial<ParsedTLE>;
}
/**
 * TLE validation error class interface
 */
interface ITLEValidationError extends Error {
    readonly name: 'TLEValidationError';
    readonly errors: readonly TLEError[];
    readonly warnings: readonly TLEWarning[];
}
/**
 * TLE format error class interface
 */
interface ITLEFormatError extends Error {
    readonly name: 'TLEFormatError';
    readonly code: TLEErrorCode | string;
    readonly details: Record<string, unknown>;
}
/**
 * Result of checksum validation
 */
interface ChecksumValidationResult {
    readonly isValid: boolean;
    readonly expected: number | null;
    readonly actual: number | null;
    readonly error: TLEError | null;
}
/**
 * Result of line structure validation
 */
interface LineValidationResult {
    readonly isValid: boolean;
    readonly errors: readonly TLEError[];
}
/**
 * Result of satellite number validation
 */
interface SatelliteNumberValidationResult {
    readonly isValid: boolean;
    readonly error: TLEError | null;
}
/**
 * Result of classification validation
 */
interface ClassificationValidationResult {
    readonly isValid: boolean;
    readonly error: TLEError | null;
}
/**
 * Result of numeric range validation
 */
interface NumericRangeValidationResult {
    readonly isValid: boolean;
    readonly error: TLEError | null;
}
/**
 * Generic parser function type
 * @template TOptions - The options type for parsing
 * @template TResult - The result type from parsing
 */
type Parser<TOptions = TLEParseOptions, TResult = ParsedTLE> = (input: string, options?: TOptions) => TResult;
/**
 * Generic validator function type
 * @template TOptions - The options type for validation
 */
type Validator<TOptions = TLEValidateOptions> = (input: string, options?: TOptions) => ValidationResult | LegacyValidationResult;
/**
 * Field extractor function type
 * @template T - The type of the extracted value
 */
type FieldExtractor<T = string> = (line: string, start: number, end: number) => T;
/**
 * Custom field parser for extending TLE parsing
 * @template TField - The field type to parse
 */
interface FieldParser<TField = unknown> {
    readonly name: string;
    readonly extract: FieldExtractor<TField>;
    readonly validate?: (value: TField) => ValidationResult;
}
/**
 * Extended TLE object with custom fields
 * @template TCustomFields - Additional custom fields to include
 */
type ExtendedParsedTLE<TCustomFields extends Record<string, unknown> = Record<string, never>> = ParsedTLE & TCustomFields;
/**
 * Parser plugin interface for extending functionality
 */
interface ParserPlugin<TOptions = unknown, TResult = unknown> {
    readonly name: string;
    readonly version: string;
    readonly preProcess?: (input: string, options: TOptions) => string;
    readonly postProcess?: (result: ParsedTLE, options: TOptions) => TResult;
    readonly validate?: Validator<TOptions>;
}
/**
 * Type guard to check if a validation result is successful
 */
declare function isValidationSuccess(result: ValidationResult): result is ValidationSuccess;
/**
 * Type guard to check if a validation result is a failure
 */
declare function isValidationFailure(result: ValidationResult): result is ValidationFailure;
/**
 * Type guard to check if a parse result is successful
 */
declare function isParseSuccess<T extends ParsedTLE = ParsedTLE>(result: ParseResult<T>): result is ParseSuccess<T>;
/**
 * Type guard to check if a parse result is a failure
 */
declare function isParseFailure<T extends ParsedTLE = ParsedTLE>(result: ParseResult<T>): result is ParseFailure;
/**
 * Type guard to check if an error is a TLE error
 */
declare function isTLEError(error: unknown): error is TLEError;
/**
 * Type guard to check if an error is a TLE warning
 */
declare function isTLEWarning(error: unknown): error is TLEWarning;
/**
 * Type guard to check if a value is a valid classification
 */
declare function isValidClassification(value: string): value is ClassificationType;
/**
 * Type guard to check if an object is a ParsedTLE
 */
declare function isParsedTLE(obj: unknown): obj is ParsedTLE;
/**
 * Make all properties in T mutable (opposite of Readonly)
 */
type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
/**
 * Make specific properties in T optional
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * Make specific properties in T required
 */
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
/**
 * Extract only the string fields from ParsedTLE
 */
type TLEStringFields = {
    [K in keyof ParsedTLE]: ParsedTLE[K] extends string | null ? K : never;
}[keyof ParsedTLE];
/**
 * Extract only the optional array fields from ParsedTLE
 */
type TLEArrayFields = {
    [K in keyof ParsedTLE]: ParsedTLE[K] extends readonly unknown[] | undefined ? K : never;
}[keyof ParsedTLE];

/**
 * State machine parser for TLE data with advanced error recovery
 * Provides robust parsing of malformed TLE data with detailed error reporting
 */

/**
 * Parser states for the state machine
 */
declare enum ParserState {
    INITIAL = "INITIAL",
    DETECTING_FORMAT = "DETECTING_FORMAT",
    PARSING_NAME = "PARSING_NAME",
    PARSING_LINE1 = "PARSING_LINE1",
    PARSING_LINE2 = "PARSING_LINE2",
    VALIDATING = "VALIDATING",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR"
}
/**
 * Error severity levels for issue reporting
 */
declare enum ErrorSeverityEnum {
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Recovery action types for error handling
 */
declare enum RecoveryAction {
    /** Continue parsing despite the error */
    CONTINUE = "CONTINUE",
    /** Skip the current field */
    SKIP_FIELD = "SKIP_FIELD",
    /** Use a default value for the field */
    USE_DEFAULT = "USE_DEFAULT",
    /** Attempt to fix the issue automatically */
    ATTEMPT_FIX = "ATTEMPT_FIX",
    /** Cannot recover, abort parsing */
    ABORT = "ABORT"
}
/**
 * Options for the state machine parser
 */
interface StateMachineParserOptions {
    /** Attempt to recover from errors (default: true) */
    readonly attemptRecovery?: boolean;
    /** Maximum number of recovery attempts (default: 10) */
    readonly maxRecoveryAttempts?: number;
    /** Include partial results even with errors (default: true) */
    readonly includePartialResults?: boolean;
    /** Strict mode - fail fast on errors (default: false) */
    readonly strictMode?: boolean;
}
/**
 * Complete parser result with context
 */
interface CompleteParseResult extends StateMachineParseResult {
    readonly state: ParserState;
    readonly context: {
        readonly lineCount: number;
        readonly hasName: boolean;
        readonly recoveryAttempts: number;
    };
}
/**
 * State machine parser for TLE data with error recovery
 * Provides robust parsing with detailed error reporting and recovery capabilities
 */
declare class TLEStateMachineParser {
    private options;
    private state;
    private errors;
    private warnings;
    private recoveryActions;
    private parsedData;
    private context;
    /**
     * Create a new state machine parser
     * @param options - Parser configuration options
     */
    constructor(options?: StateMachineParserOptions);
    /**
     * Reset the parser state to initial conditions
     */
    private reset;
    /**
     * Add an error or warning to the collection
     * @param severity - Issue severity level
     * @param code - Error code
     * @param message - Human-readable message
     * @param details - Additional details about the issue
     * @returns The created issue
     */
    private addIssue;
    /**
     * Record a recovery action taken during parsing
     * @param action - Type of recovery action
     * @param description - Description of what was done
     * @param context - Additional context information
     */
    private recordRecovery;
    /**
     * Transition to a new parser state
     * @param newState - The state to transition to
     * @param reason - Reason for the transition
     * @returns State transition record
     */
    private transition;
    /**
     * Parse TLE string with state machine and error recovery
     * @param tleString - The TLE data to parse
     * @returns Complete parse result with data, errors, warnings, and recovery information
     */
    parse(tleString: string): CompleteParseResult;
    /**
     * Detect the format of the TLE data (2 or 3 lines)
     * @param tleString - The raw TLE string
     */
    private detectFormat;
    /**
     * Execute the state machine until completion or error
     */
    private executeStateMachine;
    /**
     * Parse satellite name line
     */
    private parseSatelliteName;
    /**
     * Parse TLE Line 1
     */
    private parseLine1;
    /**
     * Parse TLE Line 2
     */
    private parseLine2;
    /**
     * Validate cross-field relationships
     */
    private validateCrossFields;
    /**
     * Validate a numeric field is within range
     * @param fieldName - Name of the field to validate
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @param displayName - Human-readable field name
     * @param warningOnly - If true, generate warning instead of error
     */
    private validateNumericField;
    /**
     * Safely parse a field from a line
     * @param fieldName - Name of the field to parse
     * @param line - The line containing the field
     * @param start - Start position of the field
     * @param end - End position of the field
     * @param displayName - Human-readable field name
     */
    private parseFieldSafe;
    /**
     * Calculate checksum for a TLE line
     * @param line - The TLE line to calculate checksum for
     * @returns The calculated checksum (0-9)
     */
    private calculateChecksum;
    /**
     * Get the final parse result
     * @returns Complete parse result with all information
     */
    private getResult;
}
/**
 * Parse TLE using state machine with error recovery
 * Convenience function that creates a parser and parses in one call
 *
 * @param tleString - The TLE data string to parse
 * @param options - Parser configuration options
 * @returns Complete parse result with data, errors, warnings, and recovery actions
 *
 * @example
 * ```typescript
 * const result = parseWithStateMachine(tleData, { attemptRecovery: true });
 * if (result.success) {
 *   console.log('Parsed TLE:', result.data);
 * } else {
 *   console.error('Parse errors:', result.errors);
 * }
 * ```
 */
declare function parseWithStateMachine(tleString: string, options?: StateMachineParserOptions): StateMachineParseResult;

/**
 * Filter criteria for TLE parsing
 */
interface TLEFilter {
    /** Filter by satellite number */
    satelliteNumber?: string | string[] | ((satNum: string) => boolean);
    /** Filter by satellite name (partial match supported) */
    satelliteName?: string | string[] | ((name: string) => boolean);
    /** Filter by international designator */
    intlDesignator?: string | string[] | ((intl: string) => boolean);
    /** Filter by classification */
    classification?: 'U' | 'C' | 'S' | ('U' | 'C' | 'S')[];
    /** Filter by epoch date range */
    epochRange?: {
        start?: Date;
        end?: Date;
    };
    /** Filter by inclination range */
    inclinationRange?: {
        min?: number;
        max?: number;
    };
    /** Custom filter function */
    custom?: (tle: ParsedTLE) => boolean;
}
/**
 * Batch parse options
 */
interface BatchParseOptions extends TLEParseOptions {
    /** Filter criteria */
    filter?: TLEFilter;
    /** Continue on error (skip invalid TLEs) */
    continueOnError?: boolean;
    /** Maximum number of TLEs to parse */
    limit?: number;
    /** Skip first N TLEs */
    skip?: number;
    /** Callback for each parsed TLE */
    onTLE?: (tle: ParsedTLE, index: number) => void;
    /** Callback for each error */
    onError?: (error: Error, index: number, rawTLE: string) => void;
}
/**
 * Streaming parser options
 */
interface StreamParserOptions extends BatchParseOptions {
    /** Chunk size for processing */
    chunkSize?: number;
    /** High water mark for stream */
    highWaterMark?: number;
}
/**
 * Multi-source parsing options
 */
interface MultiSourceOptions extends BatchParseOptions {
    /** Source type */
    sourceType?: 'string' | 'file' | 'url' | 'stream';
    /** Encoding for file/stream sources */
    encoding?: 'utf8' | 'ascii' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';
    /** HTTP headers for URL sources */
    headers?: Record<string, string>;
    /** Timeout for URL requests (ms) */
    timeout?: number;
}
/**
 * Parser middleware function
 */
type ParserMiddleware = (context: MiddlewareContext, next: () => Promise<ParsedTLE>) => Promise<ParsedTLE>;
/**
 * Parser context passed to middleware
 */
interface MiddlewareContext {
    rawTLE: string;
    options: TLEParseOptions;
    index?: number;
    metadata?: Record<string, any>;
}
/**
 * Middleware plugin interface
 */
interface MiddlewarePlugin {
    name: string;
    version?: string;
    middleware?: ParserMiddleware;
    onBatchStart?: (options: BatchParseOptions) => void | Promise<void>;
    onBatchEnd?: (results: ParsedTLE[]) => void | Promise<void>;
    onTLEParsed?: (tle: ParsedTLE, index: number) => void | Promise<void>;
    onError?: (error: Error, index: number) => void | Promise<void>;
}
/**
 * Cache options
 */
interface CacheOptions {
    /** Maximum cache size (number of entries) */
    maxSize?: number;
    /** TTL in milliseconds */
    ttl?: number;
    /** Custom cache key generator */
    keyGenerator?: (rawTLE: string, options: TLEParseOptions) => string;
}
/**
 * Parser profile presets
 */
type ParserProfile = 'strict' | 'permissive' | 'fast' | 'realtime' | 'batch' | 'recovery' | 'legacy';
/**
 * Provider-specific variations
 */
type TLEProvider = 'celestrak' | 'spacetrack' | 'amsat' | 'custom';
/**
 * Parse multiple TLEs from a single string
 * Splits input into individual TLE sets and parses each one
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Array of parsed TLEs
 *
 * @example
 * ```typescript
 * const tles = parseBatch(multiTLEString, {
 *   continueOnError: true,
 *   filter: { satelliteName: 'STARLINK' }
 * });
 * ```
 */
declare function parseBatch(input: string, options?: BatchParseOptions): ParsedTLE[];
/**
 * Split input string into individual TLE sets
 * Handles 2-line and 3-line TLE formats
 *
 * @param input - Input string containing multiple TLEs
 * @returns Array of TLE strings
 */
declare function splitTLEs(input: string): string[];
/**
 * Asynchronously parse a single TLE
 *
 * @param tleString - TLE data string
 * @param options - Parse options
 * @returns Promise resolving to parsed TLE
 */
declare function parseTLEAsync(tleString: string, options?: TLEParseOptions): Promise<ParsedTLE>;
/**
 * Asynchronously parse multiple TLEs
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseBatchAsync(input: string, options?: BatchParseOptions): Promise<ParsedTLE[]>;
/**
 * Asynchronously validate a TLE
 *
 * @param tleString - TLE data string
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
declare function validateTLEAsync(tleString: string, options?: TLEValidateOptions): Promise<LegacyValidationResult>;
/**
 * Apply filter criteria to a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param filter - Filter criteria
 * @returns True if TLE matches filter
 */
declare function applyFilter(tle: ParsedTLE, filter: TLEFilter): boolean;
/**
 * Transform stream for parsing TLEs
 */
declare class TLEParserStream extends Transform {
    private buffer;
    private index;
    private options;
    constructor(options?: StreamParserOptions);
    _transform(chunk: any, _encoding: string, callback: any): void;
    _flush(callback: any): void;
    private processTLE;
}
/**
 * Create a TLE parser stream
 *
 * @param options - Stream parser options
 * @returns Transform stream that parses TLEs
 *
 * @example
 * ```typescript
 * const fs = require('fs');
 * const parser = createTLEParserStream({ continueOnError: true });
 *
 * fs.createReadStream('tles.txt')
 *   .pipe(parser)
 *   .on('data', (tle) => console.log(tle.satelliteName));
 * ```
 */
declare function createTLEParserStream(options?: StreamParserOptions): TLEParserStream;
/**
 * Parse TLE from a file
 *
 * @param filePath - Path to TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseFromFile(filePath: string, options?: MultiSourceOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from a URL
 *
 * @param url - URL to fetch TLE data from
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseFromURL(url: string, options?: MultiSourceOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from a stream
 *
 * @param stream - Readable stream containing TLE data
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseFromStream(stream: NodeJS.ReadableStream, options?: StreamParserOptions): Promise<ParsedTLE[]>;
/**
 * Parse TLE from compressed file (.gz)
 *
 * @param filePath - Path to compressed TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseFromCompressed(filePath: string, options?: StreamParserOptions): Promise<ParsedTLE[]>;
/**
 * Parser with middleware support
 */
declare class MiddlewareParser {
    private middlewares;
    private plugins;
    /**
     * Add middleware to the parser
     */
    use(middleware: ParserMiddleware): this;
    /**
     * Add plugin to the parser
     */
    plugin(plugin: MiddlewarePlugin): this;
    /**
     * Parse TLE with middleware chain
     */
    parse(rawTLE: string, options?: TLEParseOptions): Promise<ParsedTLE>;
    /**
     * Parse multiple TLEs with plugin support
     */
    parseBatch(input: string, options?: BatchParseOptions): Promise<ParsedTLE[]>;
}
/**
 * Create a new parser with middleware support
 */
declare function createMiddlewareParser(): MiddlewareParser;
/**
 * LRU Cache for parsed TLEs
 */
declare class TLECache {
    private cache;
    private maxSize;
    private ttl;
    private keyGenerator;
    constructor(options?: CacheOptions);
    private defaultKeyGenerator;
    get(rawTLE: string, options?: TLEParseOptions): ParsedTLE | null;
    set(rawTLE: string, tle: ParsedTLE, options?: TLEParseOptions): void;
    clear(): void;
    size(): number;
}
/**
 * Create a cached parser
 */
declare function createCachedParser(cacheOptions?: CacheOptions): {
    parse: (rawTLE: string, options?: TLEParseOptions) => ParsedTLE;
    parseAsync: (rawTLE: string, options?: TLEParseOptions) => Promise<ParsedTLE>;
    cache: TLECache;
};
/**
 * Get parser options for a specific profile
 */
declare function getProfileOptions(profile: ParserProfile): TLEParseOptions;
/**
 * Parse with a specific profile
 */
declare function parseWithProfile(rawTLE: string, profile: ParserProfile): ParsedTLE;
/**
 * Incremental parser for real-time feeds
 */
declare class IncrementalParser {
    private buffer;
    private currentSet;
    private onTLE;
    private options;
    constructor(onTLE: (tle: ParsedTLE) => void, options?: TLEParseOptions);
    /**
     * Add data to the parser
     */
    push(data: string): void;
    /**
     * Flush remaining data
     */
    flush(): void;
    private processBuffer;
    private emitTLE;
}
/**
 * Create an incremental parser
 */
declare function createIncrementalParser(onTLE: (tle: ParsedTLE) => void, options?: TLEParseOptions): IncrementalParser;
/**
 * Parse TLEs in parallel using worker threads
 * Note: This requires a worker script to be created
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @param workerCount - Number of worker threads (default: CPU count)
 * @returns Promise resolving to array of parsed TLEs
 */
declare function parseParallel(input: string, options?: BatchParseOptions, _workerCount?: number): Promise<ParsedTLE[]>;
/**
 * Get provider-specific parsing options
 */
declare function getProviderOptions(provider: TLEProvider): TLEParseOptions;
/**
 * Parse with provider-specific options
 */
declare function parseWithProvider(rawTLE: string, provider: TLEProvider): ParsedTLE;

/**
 * Comprehensive TLE Validation and Normalization Module
 *
 * This module provides advanced validation, normalization, and data quality
 * assessment for Two-Line Element (TLE) sets.
 */

/**
 * Valid orbital parameter ranges based on TLE specifications and physical constraints
 */
declare const ORBITAL_PARAMETER_RANGES: {
    readonly meanMotion: {
        readonly min: 0;
        readonly max: 20;
        readonly typical: {
            readonly min: 10;
            readonly max: 17;
        };
    };
    readonly eccentricity: {
        readonly min: 0;
        readonly max: 0.999999;
        readonly typical: {
            readonly min: 0;
            readonly max: 0.25;
        };
    };
    readonly inclination: {
        readonly min: 0;
        readonly max: 180;
        readonly typical: {
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly rightAscension: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly argumentOfPerigee: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly meanAnomaly: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly bStar: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.001;
            readonly max: 0.001;
        };
    };
    readonly meanMotionFirstDerivative: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.001;
            readonly max: 0.001;
        };
    };
    readonly meanMotionSecondDerivative: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.00001;
            readonly max: 0.00001;
        };
    };
    readonly revolutionNumber: {
        readonly min: 0;
        readonly max: 99999;
    };
    readonly elementSetNumber: {
        readonly min: 0;
        readonly max: 999;
    };
    readonly ephemerisType: {
        readonly min: 0;
        readonly max: 9;
    };
};
/**
 * NORAD satellite number ranges
 */
declare const SATELLITE_NUMBER_RANGES: {
    readonly min: 1;
    readonly max: 999999;
    readonly historical5Digit: 99999;
    readonly modern6Digit: 999999;
};
/**
 * Epoch date validation constraints
 */
declare const EPOCH_CONSTRAINTS: {
    readonly minYear: 57;
    readonly maxYear: 99;
    readonly minDayOfYear: 1;
    readonly maxDayOfYear: 366.99999999;
    readonly warningAgeThreshold: 7;
    readonly criticalAgeThreshold: 30;
    readonly maxFutureDays: 30;
};
/**
 * International Designator format constraints
 */
declare const DESIGNATOR_CONSTRAINTS: {
    readonly yearMin: 57;
    readonly yearMax: 99;
    readonly launchNumberMin: 1;
    readonly launchNumberMax: 999;
    readonly piecePattern: RegExp;
};
/**
 * Data quality score weights
 */
declare const QUALITY_SCORE_WEIGHTS: {
    readonly checksumValid: 20;
    readonly fieldFormatValid: 15;
    readonly parametersInRange: 15;
    readonly parametersInTypicalRange: 10;
    readonly epochRecent: 15;
    readonly noAnomalies: 10;
    readonly designatorValid: 5;
    readonly consistencyChecks: 10;
};
interface EpochDate {
    /** Full year (e.g., 2024) */
    year: number;
    /** Two-digit year (e.g., 24) */
    twoDigitYear: number;
    /** Day of year with fractional part */
    dayOfYear: number;
    /** ISO 8601 date string */
    isoDate: string;
    /** JavaScript Date object */
    date: Date;
    /** Julian Date */
    julianDate: number;
    /** Modified Julian Date */
    modifiedJulianDate: number;
}
interface ValidationRule<T = any> {
    /** Rule identifier */
    name: string;
    /** Rule description */
    description: string;
    /** Rule severity */
    severity: ErrorSeverity;
    /** Validation function */
    validate: (value: T, context?: any) => ValidationRuleResult;
    /** Whether rule is enabled */
    enabled: boolean;
    /** Custom error message template */
    errorMessage?: string;
}
interface ValidationRuleResult {
    /** Whether validation passed */
    valid: boolean;
    /** Error message if validation failed */
    message?: string;
    /** Additional context */
    context?: Record<string, any>;
}
interface FieldSanitizationResult {
    /** Sanitized value */
    value: string;
    /** Whether value was modified */
    modified: boolean;
    /** Description of modifications */
    modifications?: string[];
}
interface AnomalyDetectionResult {
    /** Whether anomaly was detected */
    hasAnomaly: boolean;
    /** Anomaly type */
    type?: string;
    /** Anomaly description */
    description?: string;
    /** Anomaly severity */
    severity?: ErrorSeverity;
    /** Anomaly score (0-1, higher = more anomalous) */
    score?: number;
}
interface DataQualityScore {
    /** Overall quality score (0-100) */
    overall: number;
    /** Component scores */
    components: {
        checksumScore: number;
        formatScore: number;
        rangeScore: number;
        epochScore: number;
        anomalyScore: number;
        consistencyScore: number;
    };
    /** Quality grade (A-F) */
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    /** Quality assessment */
    assessment: string;
}
interface ValidationReport {
    /** Whether TLE is valid */
    isValid: boolean;
    /** Data quality score */
    qualityScore: DataQualityScore;
    /** All errors found */
    errors: TLEError[];
    /** All warnings found */
    warnings: TLEWarning[];
    /** Anomalies detected */
    anomalies: AnomalyDetectionResult[];
    /** Fields that were sanitized */
    sanitizedFields: string[];
    /** Validation timestamp */
    timestamp: Date;
    /** Validation rules applied */
    rulesApplied: string[];
    /** Summary statistics */
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        warningCount: number;
        errorCount: number;
    };
}
interface ValidationOptions {
    /** Enable strict validation mode */
    strict?: boolean;
    /** Validate checksums */
    validateChecksums?: boolean;
    /** Validate orbital parameter ranges */
    validateRanges?: boolean;
    /** Validate epoch dates */
    validateEpoch?: boolean;
    /** Detect anomalies */
    detectAnomalies?: boolean;
    /** Calculate quality score */
    calculateQuality?: boolean;
    /** Custom validation rules */
    customRules?: ValidationRule[];
    /** Enable field sanitization */
    sanitizeFields?: boolean;
    /** Reference date for temporal validation (defaults to now) */
    referenceDate?: Date;
    /** Allow future epochs */
    allowFutureEpochs?: boolean;
    /** Maximum allowed epoch age in days */
    maxEpochAge?: number;
}
/**
 * Convert TLE epoch to full date information
 *
 * @param epochYear - Two-digit year from TLE
 * @param epochDay - Day of year with fractional part
 * @returns Complete epoch date information
 */
declare function convertEpochToDate(epochYear: number, epochDay: number): EpochDate;
/**
 * Validate epoch date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @returns Validation result with any errors/warnings
 */
declare function validateEpochDate(epochYear: number, epochDay: number): ValidationRuleResult;
/**
 * Calculate age of TLE epoch relative to reference date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param referenceDate - Reference date (defaults to now)
 * @returns Age in days (positive = past, negative = future)
 */
declare function calculateEpochAge(epochYear: number, epochDay: number, referenceDate?: Date): number;
/**
 * Validate epoch age (staleness or future date check)
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param options - Validation options
 * @returns Validation result with warnings for stale or future epochs
 */
declare function validateEpochAge(epochYear: number, epochDay: number, options?: {
    referenceDate?: Date;
    allowFuture?: boolean;
    maxAge?: number;
}): ValidationRuleResult;
/**
 * Validate a numeric orbital parameter against its valid range
 *
 * @param paramName - Parameter name
 * @param value - Parameter value
 * @param checkTypical - Whether to also check typical range
 * @returns Validation result
 */
declare function validateOrbitalParameter(paramName: keyof typeof ORBITAL_PARAMETER_RANGES, value: number, checkTypical?: boolean): ValidationRuleResult;
/**
 * Validate all orbital parameters in a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param checkTypical - Whether to check typical ranges
 * @returns Array of validation results for parameters outside range
 */
declare function validateAllOrbitalParameters(tle: ParsedTLE, checkTypical?: boolean): ValidationRuleResult[];
/**
 * Normalize TLE assumed decimal point notation to standard scientific notation
 *
 * TLE format uses assumed decimal point:
 * - " 12345-3" represents 0.12345e-3 = 0.00012345
 * - "-12345-3" represents -0.12345e-3 = -0.00012345
 *
 * @param value - TLE field value
 * @returns Normalized numeric value
 */
declare function normalizeAssumedDecimalNotation(value: string): number;
/**
 * Normalize a TLE field that may contain scientific notation
 *
 * @param value - Raw field value
 * @param fieldType - Type of field ('assumedDecimal' | 'standard' | 'integer')
 * @returns Normalized numeric value
 */
declare function normalizeScientificNotation(value: string, fieldType?: 'assumedDecimal' | 'standard' | 'integer'): number;
/**
 * Parse and validate international designator format
 *
 * Format: YYLLLPPP where:
 * - YY: Last two digits of launch year
 * - LLL: Launch number of the year (1-999)
 * - PPP: Piece of the launch (A-ZZZ)
 *
 * @param designator - International designator string
 * @returns Validation result with parsed components
 */
declare function validateInternationalDesignator(designator: string): ValidationRuleResult;
/**
 * Detect anomalies in orbital parameters
 *
 * @param tle - Parsed TLE object
 * @returns Array of detected anomalies
 */
declare function detectAnomalies(tle: ParsedTLE): AnomalyDetectionResult[];
/**
 * Calculate data quality score for a TLE
 *
 * @param tle - Parsed TLE object
 * @param validationResults - Results from validation checks
 * @returns Quality score and assessment
 */
declare function calculateQualityScore(tle: ParsedTLE, validationResults: {
    checksumValid: boolean;
    formatValid: boolean;
    rangeErrors: ValidationRuleResult[];
    rangeResults: ValidationRuleResult[];
    epochAge: number;
    anomalies: AnomalyDetectionResult[];
}): DataQualityScore;
/**
 * Sanitize a TLE field by removing/normalizing invalid characters
 *
 * @param value - Raw field value
 * @param fieldName - Name of the field
 * @returns Sanitized value with modification details
 */
declare function sanitizeField(value: string, fieldName: string): FieldSanitizationResult;
/**
 * Sanitize all fields in a TLE
 *
 * @param tle - Parsed TLE object
 * @returns Map of field names to sanitization results
 */
declare function sanitizeAllFields(tle: ParsedTLE): Map<string, FieldSanitizationResult>;
/**
 * Default validation rules
 */
declare const DEFAULT_VALIDATION_RULES: ValidationRule[];
/**
 * Create a custom validation rule
 *
 * @param name - Rule name
 * @param description - Rule description
 * @param validateFn - Validation function
 * @param options - Additional options
 * @returns Validation rule
 */
declare function createValidationRule<T = any>(name: string, description: string, validateFn: (value: T, context?: any) => ValidationRuleResult, options?: {
    severity?: ErrorSeverity;
    enabled?: boolean;
    errorMessage?: string;
}): ValidationRule<T>;
/**
 * Validation rule manager
 */
declare class ValidationRuleManager {
    private rules;
    constructor(initialRules?: ValidationRule[]);
    /**
     * Add or update a validation rule
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove a validation rule
     */
    removeRule(name: string): boolean;
    /**
     * Enable a validation rule
     */
    enableRule(name: string): boolean;
    /**
     * Disable a validation rule
     */
    disableRule(name: string): boolean;
    /**
     * Get all enabled rules
     */
    getEnabledRules(): ValidationRule[];
    /**
     * Get rule by name
     */
    getRule(name: string): ValidationRule | undefined;
    /**
     * Get all rules
     */
    getAllRules(): ValidationRule[];
}
/**
 * Generate a comprehensive validation report for a TLE
 *
 * @param tle - Parsed TLE object
 * @param tleLines - Original TLE lines for checksum validation
 * @param options - Validation options
 * @returns Comprehensive validation report
 */
declare function generateValidationReport(tle: ParsedTLE, tleLines: {
    line1: string;
    line2: string;
}, options?: ValidationOptions): ValidationReport;

/**
 * TLE Output Formats & Serialization
 * Supports JSON, CSV, XML, YAML, and human-readable formats
 * Includes TLE reconstruction capabilities
 */

interface OutputOptions {
    /** Output format type */
    format?: 'json' | 'csv' | 'xml' | 'yaml' | 'human' | 'tle';
    /** Pretty print (for JSON, XML, YAML) */
    pretty?: boolean;
    /** Include warnings in output */
    includeWarnings?: boolean;
    /** Include comments in output */
    includeComments?: boolean;
    /** Verbosity level (compact, normal, verbose) */
    verbosity?: 'compact' | 'normal' | 'verbose';
    /** Use colors for human-readable output */
    colors?: boolean;
}
interface CSVOptions extends OutputOptions {
    /** Include header row */
    includeHeader?: boolean;
    /** CSV delimiter */
    delimiter?: string;
    /** Quote fields */
    quote?: boolean;
}
interface TLEReconstructionOptions {
    /** Include satellite name line (3-line format) */
    includeName?: boolean;
    /** Preserve original formatting (spaces/padding) */
    preserveFormatting?: boolean;
}
declare const Colors: {
    readonly reset: "\u001B[0m";
    readonly bright: "\u001B[1m";
    readonly dim: "\u001B[2m";
    readonly black: "\u001B[30m";
    readonly red: "\u001B[31m";
    readonly green: "\u001B[32m";
    readonly yellow: "\u001B[33m";
    readonly blue: "\u001B[34m";
    readonly magenta: "\u001B[35m";
    readonly cyan: "\u001B[36m";
    readonly white: "\u001B[37m";
    readonly bgBlack: "\u001B[40m";
    readonly bgRed: "\u001B[41m";
    readonly bgGreen: "\u001B[42m";
    readonly bgYellow: "\u001B[43m";
    readonly bgBlue: "\u001B[44m";
    readonly bgMagenta: "\u001B[45m";
    readonly bgCyan: "\u001B[46m";
    readonly bgWhite: "\u001B[47m";
};
/**
 * Format TLE as JSON
 *
 * @param tle - Parsed TLE object
 * @param options - Output options
 * @returns JSON string
 *
 * @example
 * ```typescript
 * const json = formatAsJSON(parsedTLE, { pretty: true });
 * console.log(json);
 * ```
 */
declare function formatAsJSON(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE as CSV
 *
 * @param tle - Parsed TLE object or array
 * @param options - CSV output options
 * @returns CSV string
 *
 * @example
 * ```typescript
 * const csv = formatAsCSV([tle1, tle2], { includeHeader: true });
 * console.log(csv);
 * ```
 */
declare function formatAsCSV(tle: ParsedTLE | ParsedTLE[], options?: CSVOptions): string;
/**
 * Format TLE as XML
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns XML string
 *
 * @example
 * ```typescript
 * const xml = formatAsXML(parsedTLE, { pretty: true });
 * console.log(xml);
 * ```
 */
declare function formatAsXML(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE as YAML
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns YAML string
 *
 * @example
 * ```typescript
 * const yaml = formatAsYAML(parsedTLE);
 * console.log(yaml);
 * ```
 */
declare function formatAsYAML(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE in human-readable format
 *
 * @param tle - Parsed TLE object
 * @param options - Output options
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const human = formatAsHuman(parsedTLE, { colors: true });
 * console.log(human);
 * ```
 */
declare function formatAsHuman(tle: ParsedTLE, options?: OutputOptions): string;
/**
 * Reconstruct TLE string from parsed object
 *
 * @param tle - Parsed TLE object
 * @param options - Reconstruction options
 * @returns Reconstructed TLE string (2-line or 3-line format)
 *
 * @example
 * ```typescript
 * const tleString = reconstructTLE(parsedTLE, { includeName: true });
 * console.log(tleString);
 * ```
 */
declare function reconstructTLE(tle: ParsedTLE, options?: TLEReconstructionOptions): string;
/**
 * Format TLE in specified output format
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const output = formatTLE(parsedTLE, { format: 'json', pretty: true });
 * console.log(output);
 * ```
 */
declare function formatTLE(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;

/**
 * TLE Parser - Main Module
 * Comprehensive parser for Two-Line Element (TLE) satellite data
 * with full TypeScript support and strict type safety
 */

/**
 * Custom error class for TLE validation errors
 * Thrown when TLE validation fails with detailed error information
 */
declare class TLEValidationError extends Error implements ITLEValidationError {
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
declare class TLEFormatError extends Error implements ITLEFormatError {
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
declare function normalizeLineEndings(input: string): string;
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
declare function parseTLELines(tleString: string): string[];
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
declare function calculateChecksum(line: string): number;
/**
 * Validate TLE checksum against calculated value
 *
 * @param line - The TLE line to validate
 * @returns Validation result with details
 */
declare function validateChecksum(line: string): ChecksumValidationResult;
/**
 * Validate TLE line structure including length, line number, and checksum
 *
 * @param line - The TLE line to validate
 * @param expectedLineNumber - Expected line number (1 or 2)
 * @returns Validation result with structured errors array
 */
declare function validateLineStructure(line: string, expectedLineNumber: number): LineValidationResult;
/**
 * Validate satellite number consistency between lines
 *
 * @param line1 - First TLE line
 * @param line2 - Second TLE line
 * @returns Validation result with structured error
 */
declare function validateSatelliteNumber(line1: string, line2: string): SatelliteNumberValidationResult;
/**
 * Validate classification character (U, C, or S)
 *
 * @param line1 - First TLE line
 * @returns Validation result with structured error
 */
declare function validateClassification(line1: string): ClassificationValidationResult;
/**
 * Validate numeric field is within expected range
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validation result with structured error
 */
declare function validateNumericRange(value: string, fieldName: string, min: number, max: number): NumericRangeValidationResult;
/**
 * Check for deprecated or unusual classification values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
declare function checkClassificationWarnings(line1: string): TLEWarning[];
/**
 * Check for stale/old epoch data
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
declare function checkEpochWarnings(line1: string): TLEWarning[];
/**
 * Check for unusual orbital parameters
 *
 * @param line2 - Second TLE line
 * @returns Array of warnings
 */
declare function checkOrbitalParameterWarnings(line2: string): TLEWarning[];
/**
 * Check for unusual drag and ephemeris values
 *
 * @param line1 - First TLE line
 * @returns Array of warnings
 */
declare function checkDragAndEphemerisWarnings(line1: string): TLEWarning[];
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
declare function validateTLE(tleString: string, options?: TLEValidateOptions): LegacyValidationResult;
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
declare function parseTLE(tleString: string, options?: TLEParseOptions): ParsedTLE;
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

export { Colors, DEFAULT_VALIDATION_RULES, DESIGNATOR_CONSTRAINTS, EPOCH_CONSTRAINTS, ERROR_CODES, ErrorSeverityEnum as ErrorSeverity, IncrementalParser, MiddlewareParser, ORBITAL_PARAMETER_RANGES, ParserState, QUALITY_SCORE_WEIGHTS, RecoveryAction, SATELLITE_NUMBER_RANGES, TLECache, TLEErrorCode, TLEFormatError, TLEParserStream, TLEStateMachineParser, TLEValidationError, ValidationRuleManager, applyFilter, calculateChecksum, calculateEpochAge, calculateQualityScore, checkClassificationWarnings, checkDragAndEphemerisWarnings, checkEpochWarnings, checkOrbitalParameterWarnings, convertEpochToDate, createCachedParser, createIncrementalParser, createMiddlewareParser, createTLEParserStream, createValidationRule, _default as default, detectAnomalies, formatAsCSV, formatAsHuman, formatAsJSON, formatAsXML, formatAsYAML, formatTLE, generateValidationReport, getErrorDescription, getProfileOptions, getProviderOptions, isCriticalError, isParseFailure, isParseSuccess, isParsedTLE, isTLEError, isTLEWarning, isValidClassification, isValidErrorCode, isValidationFailure, isValidationSuccess, isWarningCode, normalizeAssumedDecimalNotation, normalizeLineEndings, normalizeScientificNotation, parseBatch, parseBatchAsync, parseFromCompressed, parseFromFile, parseFromStream, parseFromURL, parseParallel, parseTLE, parseTLEAsync, parseTLELines, parseWithProfile, parseWithProvider, parseWithStateMachine, reconstructTLE, sanitizeAllFields, sanitizeField, splitTLEs, validateAllOrbitalParameters, validateChecksum, validateClassification, validateEpochAge, validateEpochDate, validateInternationalDesignator, validateLineStructure, validateNumericRange, validateOrbitalParameter, validateSatelliteNumber, validateTLE, validateTLEAsync };
export type { AnomalyDetectionResult, ArgumentOfPerigee, BatchParseOptions, CSVOptions, CacheOptions, Checksum, ChecksumValidationResult, Classification, ClassificationType, ClassificationValidationResult, DataQualityScore, Eccentricity, ElementSetNumber, EphemerisType, EpochDate, EpochDay, EpochYear, ExtendedParsedTLE, FieldExtractor, FieldParser, FieldSanitizationResult, ITLEFormatError, ITLEValidationError, Inclination, InternationalDesignatorLaunchNumber, InternationalDesignatorYear, LegacyValidationResult, LineValidationResult, MeanAnomaly, MeanMotion, MiddlewareContext, MiddlewarePlugin, MultiSourceOptions, Mutable, NumericRangeValidationResult, OutputOptions, ParseFailure, ParseResult, ParseSuccess, ParsedTLE, ParsedTLEWithNumbers, Parser, ParserContext, ParserMiddleware, ParserPlugin, ParserProfile, PartialBy, RequiredBy, RevolutionNumber, RightAscension, SatelliteNumber, SatelliteNumberValidationResult, StateMachineParseResult, StreamParserOptions, TLEArrayFields, TLEError, TLEFilter, TLEParseOptions, TLEProvider, TLEReconstructionOptions, TLEStringFields, TLEValidateOptions, TLEWarning, ValidationFailure, ValidationMode, ValidationOptions, ValidationReport, ValidationResult, ValidationRule, ValidationRuleResult, ValidationSuccess, Validator };
