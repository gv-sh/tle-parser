"use strict";
/**
 * Comprehensive TypeScript type definitions for TLE Parser
 * Provides type-safe parsing of Two-Line Element (TLE) satellite data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryAction = exports.ParserState = exports.TLEErrorCode = void 0;
exports.isValidationSuccess = isValidationSuccess;
exports.isValidationFailure = isValidationFailure;
exports.isParseSuccess = isParseSuccess;
exports.isParseFailure = isParseFailure;
exports.isTLEError = isTLEError;
exports.isTLEWarning = isTLEWarning;
exports.isValidClassification = isValidClassification;
exports.isParsedTLE = isParsedTLE;
/**
 * TLE error codes - comprehensive enumeration of all possible error conditions
 */
var TLEErrorCode;
(function (TLEErrorCode) {
    // Structure errors
    TLEErrorCode["INVALID_LINE_COUNT"] = "INVALID_LINE_COUNT";
    TLEErrorCode["INVALID_LINE_LENGTH"] = "INVALID_LINE_LENGTH";
    TLEErrorCode["INVALID_LINE_NUMBER"] = "INVALID_LINE_NUMBER";
    TLEErrorCode["SATELLITE_NUMBER_MISMATCH"] = "SATELLITE_NUMBER_MISMATCH";
    // Checksum errors
    TLEErrorCode["CHECKSUM_MISMATCH"] = "CHECKSUM_MISMATCH";
    TLEErrorCode["INVALID_CHECKSUM_CHARACTER"] = "INVALID_CHECKSUM_CHARACTER";
    // Field validation errors
    TLEErrorCode["INVALID_CLASSIFICATION"] = "INVALID_CLASSIFICATION";
    TLEErrorCode["INVALID_SATELLITE_NUMBER"] = "INVALID_SATELLITE_NUMBER";
    TLEErrorCode["INVALID_INTL_DESIGNATOR_YEAR"] = "INVALID_INTL_DESIGNATOR_YEAR";
    TLEErrorCode["INVALID_INTL_DESIGNATOR_LAUNCH"] = "INVALID_INTL_DESIGNATOR_LAUNCH";
    TLEErrorCode["INVALID_EPOCH_YEAR"] = "INVALID_EPOCH_YEAR";
    TLEErrorCode["INVALID_EPOCH_DAY"] = "INVALID_EPOCH_DAY";
    TLEErrorCode["INVALID_EPHEMERIS_TYPE"] = "INVALID_EPHEMERIS_TYPE";
    TLEErrorCode["INVALID_ELEMENT_SET_NUMBER"] = "INVALID_ELEMENT_SET_NUMBER";
    TLEErrorCode["INVALID_INCLINATION"] = "INVALID_INCLINATION";
    TLEErrorCode["INVALID_RIGHT_ASCENSION"] = "INVALID_RIGHT_ASCENSION";
    TLEErrorCode["INVALID_ECCENTRICITY"] = "INVALID_ECCENTRICITY";
    TLEErrorCode["INVALID_ARG_OF_PERIGEE"] = "INVALID_ARG_OF_PERIGEE";
    TLEErrorCode["INVALID_MEAN_ANOMALY"] = "INVALID_MEAN_ANOMALY";
    TLEErrorCode["INVALID_MEAN_MOTION"] = "INVALID_MEAN_MOTION";
    TLEErrorCode["INVALID_REVOLUTION_NUMBER"] = "INVALID_REVOLUTION_NUMBER";
    // Warning codes
    TLEErrorCode["UNUSUAL_CLASSIFICATION"] = "UNUSUAL_CLASSIFICATION";
    TLEErrorCode["OLD_EPOCH"] = "OLD_EPOCH";
    TLEErrorCode["EXTREME_ECCENTRICITY"] = "EXTREME_ECCENTRICITY";
    TLEErrorCode["EXTREME_INCLINATION"] = "EXTREME_INCLINATION";
    TLEErrorCode["HIGH_MEAN_MOTION"] = "HIGH_MEAN_MOTION";
    TLEErrorCode["LOW_MEAN_MOTION"] = "LOW_MEAN_MOTION";
    // Generic errors
    TLEErrorCode["PARSE_ERROR"] = "PARSE_ERROR";
    TLEErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
})(TLEErrorCode || (exports.TLEErrorCode = TLEErrorCode = {}));
// ============================================================================
// STATE MACHINE PARSER TYPES
// ============================================================================
/**
 * Parser state in the state machine
 */
var ParserState;
(function (ParserState) {
    ParserState["INITIAL"] = "INITIAL";
    ParserState["READING_NAME"] = "READING_NAME";
    ParserState["READING_LINE1"] = "READING_LINE1";
    ParserState["READING_LINE2"] = "READING_LINE2";
    ParserState["COMPLETE"] = "COMPLETE";
    ParserState["ERROR"] = "ERROR";
    ParserState["RECOVERING"] = "RECOVERING";
})(ParserState || (exports.ParserState = ParserState = {}));
/**
 * Recovery action for error handling
 */
var RecoveryAction;
(function (RecoveryAction) {
    /** Continue parsing despite the error */
    RecoveryAction["CONTINUE"] = "CONTINUE";
    /** Skip the current field */
    RecoveryAction["SKIP_FIELD"] = "SKIP_FIELD";
    /** Use a default value for the field */
    RecoveryAction["USE_DEFAULT"] = "USE_DEFAULT";
    /** Attempt to fix the issue automatically */
    RecoveryAction["ATTEMPT_FIX"] = "ATTEMPT_FIX";
    /** Cannot recover, abort parsing */
    RecoveryAction["ABORT"] = "ABORT";
})(RecoveryAction || (exports.RecoveryAction = RecoveryAction = {}));
// ============================================================================
// TYPE GUARDS
// ============================================================================
/**
 * Type guard to check if a validation result is successful
 */
function isValidationSuccess(result) {
    return result.success === true;
}
/**
 * Type guard to check if a validation result is a failure
 */
function isValidationFailure(result) {
    return result.success === false;
}
/**
 * Type guard to check if a parse result is successful
 */
function isParseSuccess(result) {
    return result.success === true;
}
/**
 * Type guard to check if a parse result is a failure
 */
function isParseFailure(result) {
    return result.success === false;
}
/**
 * Type guard to check if an error is a TLE error
 */
function isTLEError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'severity' in error);
}
/**
 * Type guard to check if an error is a TLE warning
 */
function isTLEWarning(error) {
    return isTLEError(error) && error.severity === 'warning';
}
/**
 * Type guard to check if a value is a valid classification
 */
function isValidClassification(value) {
    return value === 'U' || value === 'C' || value === 'S';
}
/**
 * Type guard to check if an object is a ParsedTLE
 */
function isParsedTLE(obj) {
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
//# sourceMappingURL=types.js.map