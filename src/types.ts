/**
 * Comprehensive TypeScript type definitions for TLE Parser
 * Provides type-safe parsing of Two-Line Element (TLE) satellite data
 */

// ============================================================================
// BRANDED TYPES - For validated values with compile-time type safety
// ============================================================================

/**
 * Brand type for creating nominal types
 * @template T - The base type
 * @template Brand - A unique string literal type to brand the type
 */
type Brand<T, Brand extends string> = T & { readonly __brand: Brand };

/**
 * Satellite catalog number (NORAD ID)
 * Valid range: 1-99999
 */
export type SatelliteNumber = Brand<number, 'SatelliteNumber'>;

/**
 * Valid TLE checksum digit (0-9)
 */
export type Checksum = Brand<number, 'Checksum'>;

/**
 * Classification character (U, C, S)
 */
export type Classification = Brand<string, 'Classification'>;

/**
 * International Designator Year (0-99)
 */
export type InternationalDesignatorYear = Brand<number, 'InternationalDesignatorYear'>;

/**
 * International Designator Launch Number (1-999)
 */
export type InternationalDesignatorLaunchNumber = Brand<number, 'InternationalDesignatorLaunchNumber'>;

/**
 * Epoch Year (0-99, two-digit year)
 */
export type EpochYear = Brand<number, 'EpochYear'>;

/**
 * Epoch Day (1.0-366.99999999)
 */
export type EpochDay = Brand<number, 'EpochDay'>;

/**
 * Ephemeris Type (0-9, single digit)
 */
export type EphemerisType = Brand<number, 'EphemerisType'>;

/**
 * Element Set Number (0-9999)
 */
export type ElementSetNumber = Brand<number, 'ElementSetNumber'>;

/**
 * Orbital Inclination in degrees (0-180)
 */
export type Inclination = Brand<number, 'Inclination'>;

/**
 * Right Ascension of Ascending Node in degrees (0-360)
 */
export type RightAscension = Brand<number, 'RightAscension'>;

/**
 * Eccentricity (0-0.99999999, stored without leading decimal point)
 */
export type Eccentricity = Brand<number, 'Eccentricity'>;

/**
 * Argument of Perigee in degrees (0-360)
 */
export type ArgumentOfPerigee = Brand<number, 'ArgumentOfPerigee'>;

/**
 * Mean Anomaly in degrees (0-360)
 */
export type MeanAnomaly = Brand<number, 'MeanAnomaly'>;

/**
 * Mean Motion in revolutions per day
 */
export type MeanMotion = Brand<number, 'MeanMotion'>;

/**
 * Revolution Number at Epoch
 */
export type RevolutionNumber = Brand<number, 'RevolutionNumber'>;

// ============================================================================
// CORE TLE FIELD TYPES
// ============================================================================

/**
 * Classification types for satellites
 */
export type ClassificationType = 'U' | 'C' | 'S';

/**
 * Validation mode for TLE parsing
 */
export type ValidationMode = 'strict' | 'permissive';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * TLE error codes - comprehensive enumeration of all possible error conditions
 */
export enum TLEErrorCode {
  // Structure errors
  INVALID_LINE_COUNT = 'INVALID_LINE_COUNT',
  INVALID_LINE_LENGTH = 'INVALID_LINE_LENGTH',
  INVALID_LINE_NUMBER = 'INVALID_LINE_NUMBER',
  SATELLITE_NUMBER_MISMATCH = 'SATELLITE_NUMBER_MISMATCH',

  // Checksum errors
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',
  INVALID_CHECKSUM_CHARACTER = 'INVALID_CHECKSUM_CHARACTER',

  // Field validation errors
  INVALID_CLASSIFICATION = 'INVALID_CLASSIFICATION',
  INVALID_SATELLITE_NUMBER = 'INVALID_SATELLITE_NUMBER',
  INVALID_INTL_DESIGNATOR_YEAR = 'INVALID_INTL_DESIGNATOR_YEAR',
  INVALID_INTL_DESIGNATOR_LAUNCH = 'INVALID_INTL_DESIGNATOR_LAUNCH',
  INVALID_EPOCH_YEAR = 'INVALID_EPOCH_YEAR',
  INVALID_EPOCH_DAY = 'INVALID_EPOCH_DAY',
  INVALID_EPHEMERIS_TYPE = 'INVALID_EPHEMERIS_TYPE',
  INVALID_ELEMENT_SET_NUMBER = 'INVALID_ELEMENT_SET_NUMBER',
  INVALID_INCLINATION = 'INVALID_INCLINATION',
  INVALID_RIGHT_ASCENSION = 'INVALID_RIGHT_ASCENSION',
  INVALID_ECCENTRICITY = 'INVALID_ECCENTRICITY',
  INVALID_ARG_OF_PERIGEE = 'INVALID_ARG_OF_PERIGEE',
  INVALID_MEAN_ANOMALY = 'INVALID_MEAN_ANOMALY',
  INVALID_MEAN_MOTION = 'INVALID_MEAN_MOTION',
  INVALID_REVOLUTION_NUMBER = 'INVALID_REVOLUTION_NUMBER',

  // Warning codes
  UNUSUAL_CLASSIFICATION = 'UNUSUAL_CLASSIFICATION',
  OLD_EPOCH = 'OLD_EPOCH',
  EXTREME_ECCENTRICITY = 'EXTREME_ECCENTRICITY',
  EXTREME_INCLINATION = 'EXTREME_INCLINATION',
  HIGH_MEAN_MOTION = 'HIGH_MEAN_MOTION',
  LOW_MEAN_MOTION = 'LOW_MEAN_MOTION',

  // Generic errors
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * TLE validation or parsing error
 */
export interface TLEError {
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
export interface TLEWarning {
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

// ============================================================================
// PARSED TLE OBJECT - Comprehensive field definitions
// ============================================================================

/**
 * Parsed TLE object with all standard fields
 * All numeric fields are returned as strings to preserve exact formatting
 */
export interface ParsedTLE {
  /** Satellite name (if 3-line format used) */
  readonly satelliteName: string | null;

  // Line 1 fields
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

  // Line 2 fields
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

  // Optional metadata
  /** Validation warnings (if includeWarnings=true) */
  readonly warnings?: readonly TLEWarning[];
  /** Comment lines from TLE file (if includeComments=true) */
  readonly comments?: readonly string[];
}

/**
 * Extended parsed TLE object with typed numeric conversions
 * For library consumers who want strongly-typed numeric values
 */
export interface ParsedTLEWithNumbers extends ParsedTLE {
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

// ============================================================================
// PARSER OPTIONS
// ============================================================================

/**
 * Options for TLE parsing and validation
 */
export interface TLEParseOptions {
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
export interface TLEValidateOptions {
  /** Require valid checksums (default: true) */
  readonly strictChecksums?: boolean;
  /** Validate field value ranges (default: true) */
  readonly validateRanges?: boolean;
  /** Validation mode: 'strict' or 'permissive' (default: 'strict') */
  readonly mode?: ValidationMode;
}

// ============================================================================
// DISCRIMINATED UNIONS FOR PARSER RESULTS
// ============================================================================

/**
 * Successful validation result
 */
export interface ValidationSuccess {
  readonly success: true;
  readonly isValid: true;
  readonly errors: readonly [];
  readonly warnings: readonly TLEWarning[];
}

/**
 * Failed validation result
 */
export interface ValidationFailure {
  readonly success: false;
  readonly isValid: false;
  readonly errors: readonly TLEError[];
  readonly warnings: readonly TLEWarning[];
}

/**
 * Discriminated union for validation results
 * Use the 'success' field to narrow the type
 */
export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Legacy validation result format (for backward compatibility)
 */
export interface LegacyValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly TLEError[];
  readonly warnings: readonly TLEWarning[];
}

/**
 * Successful parse result
 */
export interface ParseSuccess<T extends ParsedTLE = ParsedTLE> {
  readonly success: true;
  readonly data: T;
  readonly warnings: readonly TLEWarning[];
}

/**
 * Failed parse result
 */
export interface ParseFailure {
  readonly success: false;
  readonly errors: readonly TLEError[];
  readonly warnings: readonly TLEWarning[];
}

/**
 * Discriminated union for parse results
 * Use the 'success' field to narrow the type
 */
export type ParseResult<T extends ParsedTLE = ParsedTLE> = ParseSuccess<T> | ParseFailure;

// ============================================================================
// STATE MACHINE PARSER TYPES
// ============================================================================

/**
 * Parser state in the state machine
 */
export enum ParserState {
  INITIAL = 'INITIAL',
  READING_NAME = 'READING_NAME',
  READING_LINE1 = 'READING_LINE1',
  READING_LINE2 = 'READING_LINE2',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  RECOVERING = 'RECOVERING'
}

/**
 * Recovery action for error handling
 */
export enum RecoveryAction {
  /** Continue parsing despite the error */
  CONTINUE = 'CONTINUE',
  /** Skip the current field */
  SKIP_FIELD = 'SKIP_FIELD',
  /** Use a default value for the field */
  USE_DEFAULT = 'USE_DEFAULT',
  /** Attempt to fix the issue automatically */
  ATTEMPT_FIX = 'ATTEMPT_FIX',
  /** Cannot recover, abort parsing */
  ABORT = 'ABORT'
}

/**
 * State machine parser context
 */
export interface ParserContext {
  readonly state: ParserState;
  readonly currentLine: number;
  readonly partialData: Partial<ParsedTLE>;
  readonly errors: TLEError[];
  readonly warnings: TLEWarning[];
}

/**
 * State machine parser result with recovery information
 */
export interface StateMachineParseResult {
  readonly success: boolean;
  readonly data: ParsedTLE | null;
  readonly errors: readonly TLEError[];
  readonly warnings: readonly TLEWarning[];
  readonly recoveryActions: readonly RecoveryAction[];
  readonly partialData?: Partial<ParsedTLE>;
}

// ============================================================================
// CUSTOM ERROR CLASSES INTERFACES
// ============================================================================

/**
 * TLE validation error class interface
 */
export interface ITLEValidationError extends Error {
  readonly name: 'TLEValidationError';
  readonly errors: readonly TLEError[];
  readonly warnings: readonly TLEWarning[];
}

/**
 * TLE format error class interface
 */
export interface ITLEFormatError extends Error {
  readonly name: 'TLEFormatError';
  readonly code: TLEErrorCode | string;
  readonly details: Record<string, unknown>;
}

// ============================================================================
// CHECKSUM VALIDATION RESULT
// ============================================================================

/**
 * Result of checksum validation
 */
export interface ChecksumValidationResult {
  readonly isValid: boolean;
  readonly expected: number | null;
  readonly actual: number | null;
  readonly error: TLEError | null;
}

/**
 * Result of line structure validation
 */
export interface LineValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly TLEError[];
}

/**
 * Result of satellite number validation
 */
export interface SatelliteNumberValidationResult {
  readonly isValid: boolean;
  readonly error: TLEError | null;
}

/**
 * Result of classification validation
 */
export interface ClassificationValidationResult {
  readonly isValid: boolean;
  readonly error: TLEError | null;
}

/**
 * Result of numeric range validation
 */
export interface NumericRangeValidationResult {
  readonly isValid: boolean;
  readonly error: TLEError | null;
}

// ============================================================================
// GENERIC TYPES FOR EXTENSIBILITY
// ============================================================================

/**
 * Generic parser function type
 * @template TOptions - The options type for parsing
 * @template TResult - The result type from parsing
 */
export type Parser<TOptions = TLEParseOptions, TResult = ParsedTLE> = (
  input: string,
  options?: TOptions
) => TResult;

/**
 * Generic validator function type
 * @template TOptions - The options type for validation
 */
export type Validator<TOptions = TLEValidateOptions> = (
  input: string,
  options?: TOptions
) => ValidationResult | LegacyValidationResult;

/**
 * Field extractor function type
 * @template T - The type of the extracted value
 */
export type FieldExtractor<T = string> = (line: string, start: number, end: number) => T;

/**
 * Custom field parser for extending TLE parsing
 * @template TField - The field type to parse
 */
export interface FieldParser<TField = unknown> {
  readonly name: string;
  readonly extract: FieldExtractor<TField>;
  readonly validate?: (value: TField) => ValidationResult;
}

/**
 * Extended TLE object with custom fields
 * @template TCustomFields - Additional custom fields to include
 */
export type ExtendedParsedTLE<TCustomFields extends Record<string, unknown> = Record<string, never>> =
  ParsedTLE & TCustomFields;

/**
 * Parser plugin interface for extending functionality
 */
export interface ParserPlugin<TOptions = unknown, TResult = unknown> {
  readonly name: string;
  readonly version: string;
  readonly preProcess?: (input: string, options: TOptions) => string;
  readonly postProcess?: (result: ParsedTLE, options: TOptions) => TResult;
  readonly validate?: Validator<TOptions>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a validation result is successful
 */
export function isValidationSuccess(
  result: ValidationResult
): result is ValidationSuccess {
  return result.success === true;
}

/**
 * Type guard to check if a validation result is a failure
 */
export function isValidationFailure(
  result: ValidationResult
): result is ValidationFailure {
  return result.success === false;
}

/**
 * Type guard to check if a parse result is successful
 */
export function isParseSuccess<T extends ParsedTLE = ParsedTLE>(
  result: ParseResult<T>
): result is ParseSuccess<T> {
  return result.success === true;
}

/**
 * Type guard to check if a parse result is a failure
 */
export function isParseFailure<T extends ParsedTLE = ParsedTLE>(
  result: ParseResult<T>
): result is ParseFailure {
  return result.success === false;
}

/**
 * Type guard to check if an error is a TLE error
 */
export function isTLEError(error: unknown): error is TLEError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'severity' in error
  );
}

/**
 * Type guard to check if an error is a TLE warning
 */
export function isTLEWarning(error: unknown): error is TLEWarning {
  return isTLEError(error) && error.severity === 'warning';
}

/**
 * Type guard to check if a value is a valid classification
 */
export function isValidClassification(value: string): value is ClassificationType {
  return value === 'U' || value === 'C' || value === 'S';
}

/**
 * Type guard to check if an object is a ParsedTLE
 */
export function isParsedTLE(obj: unknown): obj is ParsedTLE {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const required = [
    'lineNumber1', 'satelliteNumber1', 'classification',
    'lineNumber2', 'satelliteNumber2', 'inclination',
    'rightAscension', 'eccentricity', 'argumentOfPerigee',
    'meanAnomaly', 'meanMotion'
  ];

  return required.every(field => field in obj);
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties in T mutable (opposite of Readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Make specific properties in T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties in T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract only the string fields from ParsedTLE
 */
export type TLEStringFields = {
  [K in keyof ParsedTLE]: ParsedTLE[K] extends string | null ? K : never;
}[keyof ParsedTLE];

/**
 * Extract only the optional array fields from ParsedTLE
 */
export type TLEArrayFields = {
  [K in keyof ParsedTLE]: ParsedTLE[K] extends readonly unknown[] | undefined ? K : never;
}[keyof ParsedTLE];
