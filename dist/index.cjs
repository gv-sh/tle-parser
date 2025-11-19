/**
 * tle-parser v1.0.0
 * A parser for TLE (Two-Line Element) satellite data.
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var promises = require('fs/promises');
var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('util');
var stream = require('stream');
var zlib = require('zlib');

/**
 * Error codes for structured error handling in TLE parser
 * Provides type-safe error identification for validation and parsing operations
 */
/**
 * Comprehensive enumeration of all TLE parser error codes
 * Used for structured error reporting and handling
 */
exports.ERROR_CODES = void 0;
(function (ERROR_CODES) {
    // ============================================================================
    // INPUT VALIDATION ERRORS
    // ============================================================================
    /** Input data type is invalid (not a string) */
    ERROR_CODES["INVALID_INPUT_TYPE"] = "INVALID_INPUT_TYPE";
    /** Input string is empty or contains only whitespace */
    ERROR_CODES["EMPTY_INPUT"] = "EMPTY_INPUT";
    // ============================================================================
    // STRUCTURE ERRORS
    // ============================================================================
    /** TLE does not contain exactly 2 or 3 lines */
    ERROR_CODES["INVALID_LINE_COUNT"] = "INVALID_LINE_COUNT";
    /** TLE line is not exactly 69 characters */
    ERROR_CODES["INVALID_LINE_LENGTH"] = "INVALID_LINE_LENGTH";
    /** Line number is not 1 or 2 as expected */
    ERROR_CODES["INVALID_LINE_NUMBER"] = "INVALID_LINE_NUMBER";
    // ============================================================================
    // CHECKSUM ERRORS
    // ============================================================================
    /** Calculated checksum does not match the checksum in the TLE */
    ERROR_CODES["CHECKSUM_MISMATCH"] = "CHECKSUM_MISMATCH";
    /** Checksum character is not a valid digit (0-9) */
    ERROR_CODES["INVALID_CHECKSUM_CHARACTER"] = "INVALID_CHECKSUM_CHARACTER";
    // ============================================================================
    // FIELD VALIDATION ERRORS
    // ============================================================================
    /** Satellite catalog numbers on line 1 and line 2 do not match */
    ERROR_CODES["SATELLITE_NUMBER_MISMATCH"] = "SATELLITE_NUMBER_MISMATCH";
    /** Satellite catalog number is invalid or out of range */
    ERROR_CODES["INVALID_SATELLITE_NUMBER"] = "INVALID_SATELLITE_NUMBER";
    /** Classification character is not U, C, or S */
    ERROR_CODES["INVALID_CLASSIFICATION"] = "INVALID_CLASSIFICATION";
    /** Field value is outside the valid range */
    ERROR_CODES["VALUE_OUT_OF_RANGE"] = "VALUE_OUT_OF_RANGE";
    /** Field contains non-numeric characters where numbers are expected */
    ERROR_CODES["INVALID_NUMBER_FORMAT"] = "INVALID_NUMBER_FORMAT";
    /** Satellite name exceeds maximum allowed length */
    ERROR_CODES["SATELLITE_NAME_TOO_LONG"] = "SATELLITE_NAME_TOO_LONG";
    /** Satellite name contains unusual or non-standard characters */
    ERROR_CODES["SATELLITE_NAME_FORMAT_WARNING"] = "SATELLITE_NAME_FORMAT_WARNING";
    // ============================================================================
    // WARNING CODES - Unusual but potentially valid values
    // ============================================================================
    /** TLE contains classified satellite data (classification C or S) */
    ERROR_CODES["CLASSIFIED_DATA_WARNING"] = "CLASSIFIED_DATA_WARNING";
    /** TLE epoch is significantly old (data may be stale) */
    ERROR_CODES["STALE_TLE_WARNING"] = "STALE_TLE_WARNING";
    /** Eccentricity is unusually high (near 1.0, highly elliptical orbit) */
    ERROR_CODES["HIGH_ECCENTRICITY_WARNING"] = "HIGH_ECCENTRICITY_WARNING";
    /** Mean motion is unusually low (very high altitude orbit) */
    ERROR_CODES["LOW_MEAN_MOTION_WARNING"] = "LOW_MEAN_MOTION_WARNING";
    /** Epoch year is in the far past (potentially deprecated data) */
    ERROR_CODES["DEPRECATED_EPOCH_YEAR_WARNING"] = "DEPRECATED_EPOCH_YEAR_WARNING";
    /** Revolution number may have rolled over (exceeded 99999) */
    ERROR_CODES["REVOLUTION_NUMBER_ROLLOVER_WARNING"] = "REVOLUTION_NUMBER_ROLLOVER_WARNING";
    /** Drag coefficient (BSTAR) is near zero */
    ERROR_CODES["NEAR_ZERO_DRAG_WARNING"] = "NEAR_ZERO_DRAG_WARNING";
    /** Ephemeris type is not standard (not 0 or blank) */
    ERROR_CODES["NON_STANDARD_EPHEMERIS_WARNING"] = "NON_STANDARD_EPHEMERIS_WARNING";
    /** First derivative (mean motion decay) is negative */
    ERROR_CODES["NEGATIVE_DECAY_WARNING"] = "NEGATIVE_DECAY_WARNING";
})(exports.ERROR_CODES || (exports.ERROR_CODES = {}));
/**
 * Const object for backward compatibility with existing JavaScript code
 * Provides the same interface as the original ERROR_CODES object
 *
 * @deprecated Use the ERROR_CODES enum instead for better type safety
 */
({
    INVALID_INPUT_TYPE: exports.ERROR_CODES.INVALID_INPUT_TYPE,
    EMPTY_INPUT: exports.ERROR_CODES.EMPTY_INPUT,
    INVALID_LINE_COUNT: exports.ERROR_CODES.INVALID_LINE_COUNT,
    INVALID_LINE_LENGTH: exports.ERROR_CODES.INVALID_LINE_LENGTH,
    INVALID_LINE_NUMBER: exports.ERROR_CODES.INVALID_LINE_NUMBER,
    CHECKSUM_MISMATCH: exports.ERROR_CODES.CHECKSUM_MISMATCH,
    INVALID_CHECKSUM_CHARACTER: exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER,
    SATELLITE_NUMBER_MISMATCH: exports.ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
    INVALID_SATELLITE_NUMBER: exports.ERROR_CODES.INVALID_SATELLITE_NUMBER,
    INVALID_CLASSIFICATION: exports.ERROR_CODES.INVALID_CLASSIFICATION,
    VALUE_OUT_OF_RANGE: exports.ERROR_CODES.VALUE_OUT_OF_RANGE,
    INVALID_NUMBER_FORMAT: exports.ERROR_CODES.INVALID_NUMBER_FORMAT,
    SATELLITE_NAME_TOO_LONG: exports.ERROR_CODES.SATELLITE_NAME_TOO_LONG,
    SATELLITE_NAME_FORMAT_WARNING: exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
    CLASSIFIED_DATA_WARNING: exports.ERROR_CODES.CLASSIFIED_DATA_WARNING,
    STALE_TLE_WARNING: exports.ERROR_CODES.STALE_TLE_WARNING,
    HIGH_ECCENTRICITY_WARNING: exports.ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
    LOW_MEAN_MOTION_WARNING: exports.ERROR_CODES.LOW_MEAN_MOTION_WARNING,
    DEPRECATED_EPOCH_YEAR_WARNING: exports.ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
    REVOLUTION_NUMBER_ROLLOVER_WARNING: exports.ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
    NEAR_ZERO_DRAG_WARNING: exports.ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
    NON_STANDARD_EPHEMERIS_WARNING: exports.ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
    NEGATIVE_DECAY_WARNING: exports.ERROR_CODES.NEGATIVE_DECAY_WARNING
});
/**
 * Type guard to check if a string is a valid error code
 * @param code - The string to check
 * @returns True if the string is a valid error code
 */
function isValidErrorCode(code) {
    return Object.values(exports.ERROR_CODES).includes(code);
}
/**
 * Helper function to get a human-readable description of an error code
 * @param code - The error code to describe
 * @returns A human-readable description of the error code
 */
function getErrorDescription(code) {
    const descriptions = {
        [exports.ERROR_CODES.INVALID_INPUT_TYPE]: 'Input data must be a string',
        [exports.ERROR_CODES.EMPTY_INPUT]: 'Input string is empty or contains only whitespace',
        [exports.ERROR_CODES.INVALID_LINE_COUNT]: 'TLE must contain exactly 2 or 3 lines',
        [exports.ERROR_CODES.INVALID_LINE_LENGTH]: 'TLE line must be exactly 69 characters',
        [exports.ERROR_CODES.INVALID_LINE_NUMBER]: 'Line number must be 1 or 2',
        [exports.ERROR_CODES.CHECKSUM_MISMATCH]: 'Calculated checksum does not match',
        [exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER]: 'Checksum must be a digit 0-9',
        [exports.ERROR_CODES.SATELLITE_NUMBER_MISMATCH]: 'Satellite numbers on line 1 and line 2 must match',
        [exports.ERROR_CODES.INVALID_SATELLITE_NUMBER]: 'Satellite catalog number is invalid',
        [exports.ERROR_CODES.INVALID_CLASSIFICATION]: 'Classification must be U, C, or S',
        [exports.ERROR_CODES.VALUE_OUT_OF_RANGE]: 'Field value is outside valid range',
        [exports.ERROR_CODES.INVALID_NUMBER_FORMAT]: 'Field contains invalid numeric format',
        [exports.ERROR_CODES.SATELLITE_NAME_TOO_LONG]: 'Satellite name exceeds maximum length',
        [exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING]: 'Satellite name contains unusual characters',
        [exports.ERROR_CODES.CLASSIFIED_DATA_WARNING]: 'TLE contains classified satellite data',
        [exports.ERROR_CODES.STALE_TLE_WARNING]: 'TLE epoch is significantly old',
        [exports.ERROR_CODES.HIGH_ECCENTRICITY_WARNING]: 'Eccentricity is unusually high',
        [exports.ERROR_CODES.LOW_MEAN_MOTION_WARNING]: 'Mean motion is unusually low',
        [exports.ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING]: 'Epoch year is in the far past',
        [exports.ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING]: 'Revolution number may have rolled over',
        [exports.ERROR_CODES.NEAR_ZERO_DRAG_WARNING]: 'Drag coefficient is near zero',
        [exports.ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING]: 'Ephemeris type is non-standard',
        [exports.ERROR_CODES.NEGATIVE_DECAY_WARNING]: 'Mean motion decay is negative'
    };
    return descriptions[code] || 'Unknown error code';
}
/**
 * Check if an error code represents a warning (non-critical issue)
 * @param code - The error code to check
 * @returns True if the error code is a warning
 */
function isWarningCode(code) {
    const warningCodes = [
        exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
        exports.ERROR_CODES.CLASSIFIED_DATA_WARNING,
        exports.ERROR_CODES.STALE_TLE_WARNING,
        exports.ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
        exports.ERROR_CODES.LOW_MEAN_MOTION_WARNING,
        exports.ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
        exports.ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
        exports.ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
        exports.ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
        exports.ERROR_CODES.NEGATIVE_DECAY_WARNING
    ];
    return warningCodes.includes(code);
}
/**
 * Check if an error code represents a critical error
 * @param code - The error code to check
 * @returns True if the error code is critical
 */
function isCriticalError(code) {
    return !isWarningCode(code);
}

var lineNumber1 = [
	0,
	1
];
var satelliteNumber1 = [
	2,
	7
];
var classification = [
	7,
	8
];
var internationalDesignatorYear = [
	9,
	11
];
var internationalDesignatorLaunchNumber = [
	11,
	14
];
var internationalDesignatorPiece = [
	14,
	17
];
var epochYear = [
	18,
	20
];
var epoch = [
	20,
	32
];
var firstDerivative = [
	33,
	43
];
var secondDerivative = [
	44,
	52
];
var bStar = [
	53,
	61
];
var ephemerisType = [
	62,
	63
];
var elementSetNumber = [
	64,
	68
];
var checksum1 = [
	68,
	69
];
var lineNumber2 = [
	0,
	1
];
var satelliteNumber2 = [
	2,
	7
];
var inclination = [
	8,
	16
];
var rightAscension = [
	17,
	25
];
var eccentricity = [
	26,
	33
];
var argumentOfPerigee = [
	34,
	42
];
var meanAnomaly = [
	43,
	51
];
var meanMotion = [
	52,
	63
];
var revolutionNumber = [
	63,
	68
];
var checksum2 = [
	68,
	69
];
var tleConfigData = {
	lineNumber1: lineNumber1,
	satelliteNumber1: satelliteNumber1,
	classification: classification,
	internationalDesignatorYear: internationalDesignatorYear,
	internationalDesignatorLaunchNumber: internationalDesignatorLaunchNumber,
	internationalDesignatorPiece: internationalDesignatorPiece,
	epochYear: epochYear,
	epoch: epoch,
	firstDerivative: firstDerivative,
	secondDerivative: secondDerivative,
	bStar: bStar,
	ephemerisType: ephemerisType,
	elementSetNumber: elementSetNumber,
	checksum1: checksum1,
	lineNumber2: lineNumber2,
	satelliteNumber2: satelliteNumber2,
	inclination: inclination,
	rightAscension: rightAscension,
	eccentricity: eccentricity,
	argumentOfPerigee: argumentOfPerigee,
	meanAnomaly: meanAnomaly,
	meanMotion: meanMotion,
	revolutionNumber: revolutionNumber,
	checksum2: checksum2
};

/**
 * Comprehensive TypeScript type definitions for TLE Parser
 * Provides type-safe parsing of Two-Line Element (TLE) satellite data
 */
/**
 * TLE error codes - comprehensive enumeration of all possible error conditions
 */
exports.TLEErrorCode = void 0;
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
})(exports.TLEErrorCode || (exports.TLEErrorCode = {}));
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
})(ParserState || (ParserState = {}));
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
})(RecoveryAction || (RecoveryAction = {}));
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

/**
 * State machine parser for TLE data with advanced error recovery
 * Provides robust parsing of malformed TLE data with detailed error reporting
 */
/**
 * Parser states for the state machine
 */
exports.ParserState = void 0;
(function (ParserState) {
    ParserState["INITIAL"] = "INITIAL";
    ParserState["DETECTING_FORMAT"] = "DETECTING_FORMAT";
    ParserState["PARSING_NAME"] = "PARSING_NAME";
    ParserState["PARSING_LINE1"] = "PARSING_LINE1";
    ParserState["PARSING_LINE2"] = "PARSING_LINE2";
    ParserState["VALIDATING"] = "VALIDATING";
    ParserState["COMPLETED"] = "COMPLETED";
    ParserState["ERROR"] = "ERROR";
})(exports.ParserState || (exports.ParserState = {}));
/**
 * Error severity levels for issue reporting
 */
exports.ErrorSeverity = void 0;
(function (ErrorSeverityEnum) {
    ErrorSeverityEnum["WARNING"] = "warning";
    ErrorSeverityEnum["ERROR"] = "error";
    ErrorSeverityEnum["CRITICAL"] = "critical";
})(exports.ErrorSeverity || (exports.ErrorSeverity = {}));
/**
 * Recovery action types for error handling
 */
exports.RecoveryAction = void 0;
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
})(exports.RecoveryAction || (exports.RecoveryAction = {}));
/**
 * State machine parser for TLE data with error recovery
 * Provides robust parsing with detailed error reporting and recovery capabilities
 */
class TLEStateMachineParser {
    /**
     * Create a new state machine parser
     * @param options - Parser configuration options
     */
    constructor(options = {}) {
        this.options = {
            attemptRecovery: true,
            maxRecoveryAttempts: 10,
            includePartialResults: true,
            strictMode: false,
            ...options
        };
        this.state = exports.ParserState.INITIAL;
        this.errors = [];
        this.warnings = [];
        this.recoveryActions = [];
        this.parsedData = {};
        this.context = {
            lineCount: 0,
            hasName: false,
            nameLineIndex: -1,
            line1Index: -1,
            line2Index: -1,
            lines: [],
            recoveryAttempts: 0
        };
        this.reset();
    }
    /**
     * Reset the parser state to initial conditions
     */
    reset() {
        this.state = exports.ParserState.INITIAL;
        this.errors = [];
        this.warnings = [];
        this.recoveryActions = [];
        this.parsedData = {};
        this.context = {
            lineCount: 0,
            hasName: false,
            nameLineIndex: -1,
            line1Index: -1,
            line2Index: -1,
            lines: [],
            recoveryAttempts: 0
        };
    }
    /**
     * Add an error or warning to the collection
     * @param severity - Issue severity level
     * @param code - Error code
     * @param message - Human-readable message
     * @param details - Additional details about the issue
     * @returns The created issue
     */
    addIssue(severity, code, message, details = {}) {
        const issue = {
            severity,
            code,
            message,
            state: this.state,
            ...details
        };
        if (severity === exports.ErrorSeverity.WARNING) {
            this.warnings.push(issue);
        }
        else {
            this.errors.push(issue);
        }
        return issue;
    }
    /**
     * Record a recovery action taken during parsing
     * @param action - Type of recovery action
     * @param description - Description of what was done
     * @param context - Additional context information
     */
    recordRecovery(action, description, context = {}) {
        this.recoveryActions.push({
            action,
            description,
            state: this.state,
            timestamp: Date.now(),
            ...context
        });
        this.context.recoveryAttempts++;
    }
    /**
     * Transition to a new parser state
     * @param newState - The state to transition to
     * @param reason - Reason for the transition
     * @returns State transition record
     */
    transition(newState, reason = '') {
        const oldState = this.state;
        this.state = newState;
        return {
            from: oldState,
            to: newState,
            reason
        };
    }
    /**
     * Parse TLE string with state machine and error recovery
     * @param tleString - The TLE data to parse
     * @returns Complete parse result with data, errors, warnings, and recovery information
     */
    parse(tleString) {
        this.reset();
        // Input validation
        if (typeof tleString !== 'string') {
            this.addIssue(exports.ErrorSeverity.CRITICAL, exports.ERROR_CODES.INVALID_INPUT_TYPE, 'TLE data must be a string', { inputType: typeof tleString });
            this.transition(exports.ParserState.ERROR);
            return this.getResult();
        }
        if (tleString.length === 0) {
            this.addIssue(exports.ErrorSeverity.CRITICAL, exports.ERROR_CODES.EMPTY_INPUT, 'TLE string cannot be empty', { inputLength: 0 });
            this.transition(exports.ParserState.ERROR);
            return this.getResult();
        }
        // Start parsing
        this.transition(exports.ParserState.DETECTING_FORMAT, 'Starting parse');
        this.detectFormat(tleString);
        // Continue through state machine
        if (this.state === exports.ParserState.DETECTING_FORMAT) {
            this.executeStateMachine();
        }
        return this.getResult();
    }
    /**
     * Detect the format of the TLE data (2 or 3 lines)
     * @param tleString - The raw TLE string
     */
    detectFormat(tleString) {
        // Parse lines
        const lines = tleString
            .trim()
            .split('\n')
            .map(line => line.trim())
            .filter((line) => line.length > 0);
        this.context.lines = lines;
        this.context.lineCount = lines.length;
        // Validate line count
        if (lines.length < 2) {
            this.addIssue(exports.ErrorSeverity.CRITICAL, exports.ERROR_CODES.INVALID_LINE_COUNT, `TLE must contain at least 2 lines (found ${lines.length})`, { expected: '2 or 3', actual: lines.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(exports.RecoveryAction.ABORT, 'Insufficient lines to parse TLE', { lineCount: lines.length });
            }
            this.transition(exports.ParserState.ERROR);
            return;
        }
        if (lines.length > 3) {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_LINE_COUNT, `TLE should contain 2 or 3 lines (found ${lines.length})`, { expected: '2 or 3', actual: lines.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(exports.RecoveryAction.ATTEMPT_FIX, 'Attempting to identify valid TLE lines from excess lines', { lineCount: lines.length });
                // Try to find the two lines starting with '1' and '2'
                const line1Candidates = lines.filter(l => l[0] === '1');
                const line2Candidates = lines.filter(l => l[0] === '2');
                if (line1Candidates.length === 1 && line2Candidates.length === 1) {
                    const line1Candidate = line1Candidates[0];
                    const line2Candidate = line2Candidates[0];
                    if (!line1Candidate || !line2Candidate)
                        return;
                    const line1Idx = lines.indexOf(line1Candidate);
                    const line2Idx = lines.indexOf(line2Candidate);
                    // If line1 comes before line2, check if there's a name line before line1
                    if (line1Idx < line2Idx) {
                        if (line1Idx > 0) {
                            this.context.hasName = true;
                            this.context.nameLineIndex = line1Idx - 1;
                        }
                        this.context.line1Index = line1Idx;
                        this.context.line2Index = line2Idx;
                        const nameLine = lines[this.context.nameLineIndex];
                        const line1 = lines[line1Idx];
                        const line2 = lines[line2Idx];
                        this.context.lines = this.context.hasName && nameLine && line1 && line2
                            ? [nameLine, line1, line2]
                            : line1 && line2
                                ? [line1, line2]
                                : [];
                        this.context.lineCount = this.context.lines.length;
                        this.recordRecovery(exports.RecoveryAction.CONTINUE, 'Successfully identified TLE lines from excess input', { extractedLines: this.context.lineCount });
                    }
                }
            }
        }
        else {
            // Determine if we have 2 or 3 lines
            if (lines.length === 3) {
                // Check if first line looks like a satellite name or a TLE line
                const firstChar = lines[0]?.[0];
                if (firstChar === '1' || firstChar === '2') {
                    this.addIssue(exports.ErrorSeverity.WARNING, exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING, 'First line starts with "1" or "2", might be missing satellite name', { firstLine: lines[0] });
                }
                this.context.hasName = true;
                this.context.nameLineIndex = 0;
                this.context.line1Index = 1;
                this.context.line2Index = 2;
            }
            else {
                this.context.hasName = false;
                this.context.line1Index = 0;
                this.context.line2Index = 1;
            }
        }
    }
    /**
     * Execute the state machine until completion or error
     */
    executeStateMachine() {
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        while (this.state !== exports.ParserState.COMPLETED &&
            this.state !== exports.ParserState.ERROR &&
            iterations < maxIterations) {
            switch (this.state) {
                case exports.ParserState.DETECTING_FORMAT:
                    if (this.context.hasName) {
                        this.transition(exports.ParserState.PARSING_NAME);
                    }
                    else {
                        this.transition(exports.ParserState.PARSING_LINE1);
                    }
                    break;
                case exports.ParserState.PARSING_NAME:
                    this.parseSatelliteName();
                    this.transition(exports.ParserState.PARSING_LINE1);
                    break;
                case exports.ParserState.PARSING_LINE1:
                    this.parseLine1();
                    this.transition(exports.ParserState.PARSING_LINE2);
                    break;
                case exports.ParserState.PARSING_LINE2:
                    this.parseLine2();
                    this.transition(exports.ParserState.VALIDATING);
                    break;
                case exports.ParserState.VALIDATING:
                    this.validateCrossFields();
                    // Check if we have critical errors
                    const hasCriticalErrors = this.errors.some(e => e.severity === exports.ErrorSeverity.CRITICAL);
                    if (hasCriticalErrors && !this.options.includePartialResults) {
                        this.transition(exports.ParserState.ERROR);
                    }
                    else {
                        this.transition(exports.ParserState.COMPLETED);
                    }
                    break;
                default:
                    // Unexpected state, exit
                    this.transition(exports.ParserState.ERROR, 'Unexpected state');
                    break;
            }
            iterations++;
        }
        if (iterations >= maxIterations) {
            this.addIssue(exports.ErrorSeverity.CRITICAL, 'STATE_MACHINE_LOOP', 'State machine exceeded maximum iterations', { iterations });
            this.transition(exports.ParserState.ERROR);
        }
    }
    /**
     * Parse satellite name line
     */
    parseSatelliteName() {
        const nameLineIdx = this.context.nameLineIndex;
        if (nameLineIdx < 0 || nameLineIdx >= this.context.lines.length) {
            this.addIssue(exports.ErrorSeverity.ERROR, 'INVALID_NAME_LINE_INDEX', 'Invalid satellite name line index', { index: nameLineIdx });
            return;
        }
        const nameLine = this.context.lines[nameLineIdx];
        if (!nameLine)
            return;
        this.parsedData.satelliteName = nameLine;
        // Validate satellite name
        if (nameLine.length > 24) {
            this.addIssue(exports.ErrorSeverity.WARNING, exports.ERROR_CODES.SATELLITE_NAME_TOO_LONG, 'Satellite name exceeds recommended 24 characters', { length: nameLine.length, name: nameLine });
        }
        if (nameLine[0] === '1' || nameLine[0] === '2') {
            this.addIssue(exports.ErrorSeverity.WARNING, exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING, 'Satellite name starts with "1" or "2", might be incorrectly formatted', { name: nameLine });
        }
    }
    /**
     * Parse TLE Line 1
     */
    parseLine1() {
        const line1Idx = this.context.line1Index;
        if (line1Idx < 0 || line1Idx >= this.context.lines.length) {
            this.addIssue(exports.ErrorSeverity.CRITICAL, 'INVALID_LINE1_INDEX', 'Invalid Line 1 index', { index: line1Idx });
            return;
        }
        const line1 = this.context.lines[line1Idx];
        if (!line1)
            return;
        // Store raw line (not in standard ParsedTLE but useful for debugging)
        this.parsedData.line1Raw = line1;
        // Check line length
        if (line1.length !== 69) {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_LINE_LENGTH, `Line 1 must be exactly 69 characters (got ${line1.length})`, { line: 1, expected: 69, actual: line1.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(exports.RecoveryAction.CONTINUE, 'Attempting to parse Line 1 despite incorrect length', { length: line1.length });
            }
            else if (this.options.strictMode) {
                return;
            }
        }
        // Parse fields from Line 1 with error recovery
        this.parseFieldSafe('lineNumber1', line1, 0, 1, 'Line 1 number');
        this.parseFieldSafe('satelliteNumber1', line1, 2, 7, 'Satellite number');
        this.parseFieldSafe('classification', line1, 7, 8, 'Classification');
        this.parseFieldSafe('internationalDesignatorYear', line1, 9, 11, 'Int. designator year');
        this.parseFieldSafe('internationalDesignatorLaunchNumber', line1, 11, 14, 'Int. designator launch');
        this.parseFieldSafe('internationalDesignatorPiece', line1, 14, 17, 'Int. designator piece');
        this.parseFieldSafe('epochYear', line1, 18, 20, 'Epoch year');
        this.parseFieldSafe('epoch', line1, 20, 32, 'Epoch');
        this.parseFieldSafe('firstDerivative', line1, 33, 43, 'First derivative');
        this.parseFieldSafe('secondDerivative', line1, 44, 52, 'Second derivative');
        this.parseFieldSafe('bStar', line1, 53, 61, 'B* drag term');
        this.parseFieldSafe('ephemerisType', line1, 62, 63, 'Ephemeris type');
        this.parseFieldSafe('elementSetNumber', line1, 64, 68, 'Element set number');
        this.parseFieldSafe('checksum1', line1, 68, 69, 'Checksum');
        // Validate line number
        if (this.parsedData.lineNumber1 !== '1') {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_LINE_NUMBER, `Line 1 must start with '1' (got '${this.parsedData.lineNumber1}')`, { line: 1, expected: '1', actual: this.parsedData.lineNumber1 });
        }
        // Validate classification
        const validClassifications = ['U', 'C', 'S'];
        if (this.parsedData.classification &&
            !validClassifications.includes(this.parsedData.classification)) {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_CLASSIFICATION, `Classification must be U, C, or S (got '${this.parsedData.classification}')`, { expected: validClassifications, actual: this.parsedData.classification });
        }
        // Validate checksum
        if (line1.length === 69) {
            const checksum = this.calculateChecksum(line1);
            const actualChecksum = parseInt(this.parsedData.checksum1 || '', 10);
            if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
                this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.CHECKSUM_MISMATCH, `Line 1 checksum mismatch (expected ${checksum}, got ${actualChecksum})`, { line: 1, expected: checksum, actual: actualChecksum });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(exports.RecoveryAction.CONTINUE, 'Continuing despite checksum mismatch', { line: 1 });
                }
            }
        }
    }
    /**
     * Parse TLE Line 2
     */
    parseLine2() {
        const line2Idx = this.context.line2Index;
        if (line2Idx < 0 || line2Idx >= this.context.lines.length) {
            this.addIssue(exports.ErrorSeverity.CRITICAL, 'INVALID_LINE2_INDEX', 'Invalid Line 2 index', { index: line2Idx });
            return;
        }
        const line2 = this.context.lines[line2Idx];
        if (!line2)
            return;
        // Store raw line
        this.parsedData.line2Raw = line2;
        // Check line length
        if (line2.length !== 69) {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_LINE_LENGTH, `Line 2 must be exactly 69 characters (got ${line2.length})`, { line: 2, expected: 69, actual: line2.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(exports.RecoveryAction.CONTINUE, 'Attempting to parse Line 2 despite incorrect length', { length: line2.length });
            }
            else if (this.options.strictMode) {
                return;
            }
        }
        // Parse fields from Line 2 with error recovery
        this.parseFieldSafe('lineNumber2', line2, 0, 1, 'Line 2 number');
        this.parseFieldSafe('satelliteNumber2', line2, 2, 7, 'Satellite number');
        this.parseFieldSafe('inclination', line2, 8, 16, 'Inclination');
        this.parseFieldSafe('rightAscension', line2, 17, 25, 'Right ascension');
        this.parseFieldSafe('eccentricity', line2, 26, 33, 'Eccentricity');
        this.parseFieldSafe('argumentOfPerigee', line2, 34, 42, 'Argument of perigee');
        this.parseFieldSafe('meanAnomaly', line2, 43, 51, 'Mean anomaly');
        this.parseFieldSafe('meanMotion', line2, 52, 63, 'Mean motion');
        this.parseFieldSafe('revolutionNumber', line2, 63, 68, 'Revolution number');
        this.parseFieldSafe('checksum2', line2, 68, 69, 'Checksum');
        // Validate line number
        if (this.parsedData.lineNumber2 !== '2') {
            this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_LINE_NUMBER, `Line 2 must start with '2' (got '${this.parsedData.lineNumber2}')`, { line: 2, expected: '2', actual: this.parsedData.lineNumber2 });
        }
        // Validate checksum
        if (line2.length === 69) {
            const checksum = this.calculateChecksum(line2);
            const actualChecksum = parseInt(this.parsedData.checksum2 || '', 10);
            if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
                this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.CHECKSUM_MISMATCH, `Line 2 checksum mismatch (expected ${checksum}, got ${actualChecksum})`, { line: 2, expected: checksum, actual: actualChecksum });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(exports.RecoveryAction.CONTINUE, 'Continuing despite checksum mismatch', { line: 2 });
                }
            }
        }
    }
    /**
     * Validate cross-field relationships
     */
    validateCrossFields() {
        // Validate satellite number consistency
        if (this.parsedData.satelliteNumber1 && this.parsedData.satelliteNumber2) {
            const sat1 = this.parsedData.satelliteNumber1.trim();
            const sat2 = this.parsedData.satelliteNumber2.trim();
            if (sat1 !== sat2) {
                this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.SATELLITE_NUMBER_MISMATCH, `Satellite numbers must match (Line 1: ${sat1}, Line 2: ${sat2})`, { line1Value: sat1, line2Value: sat2 });
            }
        }
        // Validate numeric ranges
        this.validateNumericField('inclination', 0, 180, 'Inclination');
        this.validateNumericField('rightAscension', 0, 360, 'Right Ascension');
        this.validateNumericField('argumentOfPerigee', 0, 360, 'Argument of Perigee');
        this.validateNumericField('meanAnomaly', 0, 360, 'Mean Anomaly');
        // Eccentricity is stored without leading "0."
        if (this.parsedData.eccentricity) {
            const ecc = parseFloat('0.' + this.parsedData.eccentricity.trim());
            if (!isNaN(ecc) && (ecc < 0 || ecc > 1)) {
                this.addIssue(exports.ErrorSeverity.ERROR, exports.ERROR_CODES.VALUE_OUT_OF_RANGE, `Eccentricity must be between 0 and 1 (got ${ecc})`, { field: 'eccentricity', value: ecc, min: 0, max: 1 });
            }
        }
        // Mean motion warning (not strict error)
        this.validateNumericField('meanMotion', 0, 20, 'Mean Motion', true);
        // Epoch year (00-99)
        this.validateNumericField('epochYear', 0, 99, 'Epoch Year');
    }
    /**
     * Validate a numeric field is within range
     * @param fieldName - Name of the field to validate
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @param displayName - Human-readable field name
     * @param warningOnly - If true, generate warning instead of error
     */
    validateNumericField(fieldName, min, max, displayName, warningOnly = false) {
        const fieldValue = this.parsedData[fieldName];
        if (!fieldValue || typeof fieldValue !== 'string') {
            return;
        }
        const value = parseFloat(fieldValue.trim());
        if (isNaN(value)) {
            this.addIssue(warningOnly ? exports.ErrorSeverity.WARNING : exports.ErrorSeverity.ERROR, exports.ERROR_CODES.INVALID_NUMBER_FORMAT, `${displayName} must be numeric (got '${fieldValue}')`, { field: fieldName, value: fieldValue });
            return;
        }
        if (value < min || value > max) {
            this.addIssue(warningOnly ? exports.ErrorSeverity.WARNING : exports.ErrorSeverity.ERROR, exports.ERROR_CODES.VALUE_OUT_OF_RANGE, `${displayName} must be between ${min} and ${max} (got ${value})`, { field: fieldName, value, min, max });
        }
    }
    /**
     * Safely parse a field from a line
     * @param fieldName - Name of the field to parse
     * @param line - The line containing the field
     * @param start - Start position of the field
     * @param end - End position of the field
     * @param displayName - Human-readable field name
     */
    parseFieldSafe(fieldName, line, start, end, displayName) {
        try {
            if (line.length >= end) {
                this.parsedData[fieldName] = line.substring(start, end).trim();
            }
            else if (line.length > start) {
                // Partial field available
                this.parsedData[fieldName] = line.substring(start).trim();
                this.addIssue(exports.ErrorSeverity.WARNING, 'PARTIAL_FIELD', `${displayName} is incomplete due to short line`, { field: fieldName, expected: [start, end], actual: line.length });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(exports.RecoveryAction.USE_DEFAULT, `Using partial value for ${displayName}`, { field: fieldName });
                }
            }
            else {
                // Field completely missing
                this.parsedData[fieldName] = null;
                this.addIssue(exports.ErrorSeverity.WARNING, 'MISSING_FIELD', `${displayName} is missing due to short line`, { field: fieldName, expected: [start, end], actual: line.length });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(exports.RecoveryAction.USE_DEFAULT, `Using null for missing ${displayName}`, { field: fieldName });
                }
            }
        }
        catch (error) {
            this.parsedData[fieldName] = null;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.addIssue(exports.ErrorSeverity.ERROR, 'FIELD_PARSE_ERROR', `Error parsing ${displayName}: ${errorMessage}`, { field: fieldName, error: errorMessage });
        }
    }
    /**
     * Calculate checksum for a TLE line
     * @param line - The TLE line to calculate checksum for
     * @returns The calculated checksum (0-9)
     */
    calculateChecksum(line) {
        let checksum = 0;
        for (let i = 0; i < line.length - 1; i++) {
            const char = line[i];
            if (char && char >= '0' && char <= '9') {
                checksum += parseInt(char, 10);
            }
            else if (char === '-') {
                checksum += 1;
            }
        }
        return checksum % 10;
    }
    /**
     * Get the final parse result
     * @returns Complete parse result with all information
     */
    getResult() {
        // Convert parser issues to TLE errors/warnings
        const errors = this.errors.map(e => ({
            code: e.code,
            message: e.message,
            severity: (e.severity === exports.ErrorSeverity.CRITICAL ? 'error' : e.severity),
            ...Object.fromEntries(Object.entries(e).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key)))
        }));
        const warnings = this.warnings.map(w => ({
            code: w.code,
            message: w.message,
            severity: 'warning',
            ...Object.fromEntries(Object.entries(w).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key)))
        }));
        return {
            success: this.state === exports.ParserState.COMPLETED,
            state: this.state,
            data: this.parsedData,
            errors,
            warnings,
            recoveryActions: this.recoveryActions.map(r => r.action),
            partialData: this.options.includePartialResults ? this.parsedData : undefined,
            context: {
                lineCount: this.context.lineCount,
                hasName: this.context.hasName,
                recoveryAttempts: this.context.recoveryAttempts
            }
        };
    }
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
function parseWithStateMachine(tleString, options = {}) {
    const parser = new TLEStateMachineParser(options);
    return parser.parse(tleString);
}

/**
 * Advanced TLE Parser Features
 * Provides advanced parsing capabilities including batch, async, streaming,
 * filtering, caching, and multi-source support
 */
const readFileAsync = util.promisify(fs.readFile);
// ============================================================================
// BATCH PARSING
// ============================================================================
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
function parseBatch(input, options = {}) {
    const { filter, continueOnError = false, limit, skip = 0, onTLE, onError, ...parseOptions } = options;
    const results = [];
    const tleSets = splitTLEs(input);
    let processed = 0;
    for (let i = 0; i < tleSets.length; i++) {
        // Apply skip
        if (i < skip)
            continue;
        // Apply limit
        if (limit !== undefined && processed >= limit)
            break;
        const rawTLE = tleSets[i];
        if (!rawTLE)
            continue;
        try {
            const parsed = parseTLE(rawTLE, parseOptions);
            // Apply filters
            if (filter && !applyFilter(parsed, filter)) {
                continue;
            }
            results.push(parsed);
            processed++;
            // Call callback
            if (onTLE) {
                onTLE(parsed, i);
            }
        }
        catch (error) {
            if (onError) {
                onError(error, i, rawTLE);
            }
            if (!continueOnError) {
                throw error;
            }
        }
    }
    return results;
}
/**
 * Split input string into individual TLE sets
 * Handles 2-line and 3-line TLE formats
 *
 * @param input - Input string containing multiple TLEs
 * @returns Array of TLE strings
 */
function splitTLEs(input) {
    const normalized = normalizeLineEndings(input);
    const lines = normalized
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    const tleSets = [];
    let currentSet = [];
    for (const line of lines) {
        // Skip comment lines
        if (line.startsWith('#')) {
            if (currentSet.length > 0) {
                currentSet.push(line);
            }
            continue;
        }
        // Line starting with '1' begins a new TLE set
        if (line[0] === '1') {
            // Save previous set if it has both lines
            if (currentSet.length >= 2) {
                tleSets.push(currentSet.join('\n'));
            }
            currentSet = [line];
        }
        else if (line[0] === '2') {
            // Add line 2 to current set
            currentSet.push(line);
        }
        else {
            // This is a satellite name (line 0)
            // If we have a complete set, save it first
            if (currentSet.length >= 2) {
                tleSets.push(currentSet.join('\n'));
                currentSet = [line];
            }
            else if (currentSet.length === 0) {
                // Start new set with name
                currentSet = [line];
            }
            else {
                // Add to current set
                currentSet.push(line);
            }
        }
    }
    // Add final set
    if (currentSet.length >= 2) {
        tleSets.push(currentSet.join('\n'));
    }
    return tleSets;
}
// ============================================================================
// ASYNC PARSING
// ============================================================================
/**
 * Asynchronously parse a single TLE
 *
 * @param tleString - TLE data string
 * @param options - Parse options
 * @returns Promise resolving to parsed TLE
 */
async function parseTLEAsync(tleString, options = {}) {
    return Promise.resolve(parseTLE(tleString, options));
}
/**
 * Asynchronously parse multiple TLEs
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseBatchAsync(input, options = {}) {
    return Promise.resolve(parseBatch(input, options));
}
/**
 * Asynchronously validate a TLE
 *
 * @param tleString - TLE data string
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
async function validateTLEAsync(tleString, options = {}) {
    return Promise.resolve(validateTLE(tleString, options));
}
// ============================================================================
// FILTERING
// ============================================================================
/**
 * Apply filter criteria to a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param filter - Filter criteria
 * @returns True if TLE matches filter
 */
function applyFilter(tle, filter) {
    // Filter by satellite number
    if (filter.satelliteNumber !== undefined) {
        const satNum = tle.satelliteNumber1 || '';
        if (typeof filter.satelliteNumber === 'function') {
            if (!filter.satelliteNumber(satNum))
                return false;
        }
        else if (Array.isArray(filter.satelliteNumber)) {
            if (!filter.satelliteNumber.includes(satNum))
                return false;
        }
        else {
            if (satNum !== filter.satelliteNumber)
                return false;
        }
    }
    // Filter by satellite name
    if (filter.satelliteName !== undefined && tle.satelliteName) {
        const name = tle.satelliteName;
        if (typeof filter.satelliteName === 'function') {
            if (!filter.satelliteName(name))
                return false;
        }
        else if (Array.isArray(filter.satelliteName)) {
            if (!filter.satelliteName.some(n => name.includes(n)))
                return false;
        }
        else {
            if (!name.includes(filter.satelliteName))
                return false;
        }
    }
    // Filter by international designator
    if (filter.intlDesignator !== undefined) {
        const intl = `${tle.internationalDesignatorYear || ''}${tle.internationalDesignatorLaunchNumber || ''}${tle.internationalDesignatorPiece || ''}`.trim();
        if (typeof filter.intlDesignator === 'function') {
            if (!filter.intlDesignator(intl))
                return false;
        }
        else if (Array.isArray(filter.intlDesignator)) {
            if (!filter.intlDesignator.includes(intl))
                return false;
        }
        else {
            if (intl !== filter.intlDesignator)
                return false;
        }
    }
    // Filter by classification
    if (filter.classification !== undefined) {
        const classification = tle.classification;
        if (Array.isArray(filter.classification)) {
            if (!filter.classification.includes(classification))
                return false;
        }
        else {
            if (classification !== filter.classification)
                return false;
        }
    }
    // Filter by epoch range
    if (filter.epochRange) {
        const epochYear = parseInt(tle.epochYear || '0', 10);
        const epochStr = tle.epoch || '0';
        const epochDay = parseFloat(epochStr);
        const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear;
        const epochDate = new Date(fullYear, 0, 1);
        epochDate.setDate(epochDate.getDate() + epochDay - 1);
        if (filter.epochRange.start && epochDate < filter.epochRange.start) {
            return false;
        }
        if (filter.epochRange.end && epochDate > filter.epochRange.end) {
            return false;
        }
    }
    // Filter by inclination range
    if (filter.inclinationRange) {
        const inclination = parseFloat(tle.inclination || '0');
        if (filter.inclinationRange.min !== undefined && inclination < filter.inclinationRange.min) {
            return false;
        }
        if (filter.inclinationRange.max !== undefined && inclination > filter.inclinationRange.max) {
            return false;
        }
    }
    // Custom filter
    if (filter.custom && !filter.custom(tle)) {
        return false;
    }
    return true;
}
// ============================================================================
// STREAMING PARSER
// ============================================================================
/**
 * Transform stream for parsing TLEs
 */
class TLEParserStream extends stream.Transform {
    constructor(options = {}) {
        super({
            objectMode: true,
            highWaterMark: options.highWaterMark || 16
        });
        this.buffer = '';
        this.index = 0;
        this.options = options;
    }
    _transform(chunk, _encoding, callback) {
        this.buffer += chunk.toString();
        // Try to extract complete TLE sets
        const lines = this.buffer.split('\n');
        // Keep the last incomplete line in buffer
        this.buffer = lines.pop() || '';
        let currentSet = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            if (trimmed.startsWith('#')) {
                currentSet.push(trimmed);
                continue;
            }
            if (trimmed[0] === '1') {
                // Start of new TLE
                if (currentSet.length >= 2) {
                    this.processTLE(currentSet.join('\n'));
                }
                currentSet = [trimmed];
            }
            else if (trimmed[0] === '2') {
                currentSet.push(trimmed);
                // We have a complete TLE
                if (currentSet.length >= 2) {
                    this.processTLE(currentSet.join('\n'));
                    currentSet = [];
                }
            }
            else {
                // Satellite name
                if (currentSet.length >= 2) {
                    this.processTLE(currentSet.join('\n'));
                }
                currentSet = [trimmed];
            }
        }
        callback();
    }
    _flush(callback) {
        // Process any remaining data
        if (this.buffer.trim().length > 0) {
            const lines = this.buffer.split('\n').filter(l => l.trim().length > 0);
            if (lines.length >= 2) {
                this.processTLE(lines.join('\n'));
            }
        }
        callback();
    }
    processTLE(rawTLE) {
        const { continueOnError = true, filter, onTLE, onError, ...parseOptions } = this.options;
        try {
            const parsed = parseTLE(rawTLE, parseOptions);
            // Apply filters
            if (filter && !applyFilter(parsed, filter)) {
                return;
            }
            this.push(parsed);
            if (onTLE) {
                onTLE(parsed, this.index);
            }
            this.index++;
        }
        catch (error) {
            if (onError) {
                onError(error, this.index, rawTLE);
            }
            if (!continueOnError) {
                this.destroy(error);
            }
            this.index++;
        }
    }
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
function createTLEParserStream(options = {}) {
    return new TLEParserStream(options);
}
// ============================================================================
// MULTI-SOURCE PARSING
// ============================================================================
/**
 * Parse TLE from a file
 *
 * @param filePath - Path to TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseFromFile(filePath, options = {}) {
    const { encoding = 'utf8', ...batchOptions } = options;
    const content = await readFileAsync(filePath, { encoding });
    return parseBatch(content, batchOptions);
}
/**
 * Parse TLE from a URL
 *
 * @param url - URL to fetch TLE data from
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseFromURL(url, options = {}) {
    const { headers, timeout = 30000, ...batchOptions } = options;
    // Use fetch API (available in Node 18+)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            headers,
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        return parseBatch(content, batchOptions);
    }
    finally {
        clearTimeout(timeoutId);
    }
}
/**
 * Parse TLE from a stream
 *
 * @param stream - Readable stream containing TLE data
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseFromStream(stream, options = {}) {
    return new Promise((resolve, reject) => {
        const results = [];
        const parser = createTLEParserStream({
            ...options,
            onTLE: (tle, index) => {
                results.push(tle);
                if (options.onTLE) {
                    options.onTLE(tle, index);
                }
            }
        });
        stream
            .pipe(parser)
            .on('data', () => { }) // Results collected via onTLE callback
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}
/**
 * Parse TLE from compressed file (.gz)
 *
 * @param filePath - Path to compressed TLE file
 * @param options - Parse options
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseFromCompressed(filePath, options = {}) {
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    return parseFromStream(fileStream.pipe(gunzip), options);
}
// ============================================================================
// MIDDLEWARE AND PLUGIN SYSTEM
// ============================================================================
/**
 * Parser with middleware support
 */
class MiddlewareParser {
    constructor() {
        this.middlewares = [];
        this.plugins = [];
    }
    /**
     * Add middleware to the parser
     */
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }
    /**
     * Add plugin to the parser
     */
    plugin(plugin) {
        this.plugins.push(plugin);
        if (plugin.middleware) {
            this.use(plugin.middleware);
        }
        return this;
    }
    /**
     * Parse TLE with middleware chain
     */
    async parse(rawTLE, options = {}) {
        const context = {
            rawTLE,
            options,
            metadata: {}
        };
        // Execute middleware chain
        const execute = async (index) => {
            if (index >= this.middlewares.length) {
                // Base parser
                return parseTLE(context.rawTLE, context.options);
            }
            const middleware = this.middlewares[index];
            if (!middleware) {
                return parseTLE(context.rawTLE, context.options);
            }
            return middleware(context, () => execute(index + 1));
        };
        return execute(0);
    }
    /**
     * Parse multiple TLEs with plugin support
     */
    async parseBatch(input, options = {}) {
        // Call plugin batch start hooks
        for (const plugin of this.plugins) {
            if (plugin.onBatchStart) {
                await plugin.onBatchStart(options);
            }
        }
        const results = [];
        const tleSets = splitTLEs(input);
        for (let i = 0; i < tleSets.length; i++) {
            const rawTLE = tleSets[i];
            if (!rawTLE)
                continue;
            try {
                // Parse with middleware
                const parsed = await this.parse(rawTLE, options);
                // Apply filters
                if (options.filter && !applyFilter(parsed, options.filter)) {
                    continue;
                }
                results.push(parsed);
                // Call plugin TLE parsed hooks
                for (const plugin of this.plugins) {
                    if (plugin.onTLEParsed) {
                        await plugin.onTLEParsed(parsed, i);
                    }
                }
                if (options.onTLE) {
                    options.onTLE(parsed, i);
                }
            }
            catch (error) {
                // Call plugin error hooks
                for (const plugin of this.plugins) {
                    if (plugin.onError) {
                        await plugin.onError(error, i);
                    }
                }
                if (options.onError) {
                    options.onError(error, i, rawTLE);
                }
                if (!options.continueOnError) {
                    throw error;
                }
            }
        }
        // Call plugin batch end hooks
        for (const plugin of this.plugins) {
            if (plugin.onBatchEnd) {
                await plugin.onBatchEnd(results);
            }
        }
        return results;
    }
}
/**
 * Create a new parser with middleware support
 */
function createMiddlewareParser() {
    return new MiddlewareParser();
}
// ============================================================================
// CACHING
// ============================================================================
/**
 * LRU Cache for parsed TLEs
 */
class TLECache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 1000;
        this.ttl = options.ttl || 3600000; // 1 hour default
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    }
    defaultKeyGenerator(rawTLE, options) {
        return `${rawTLE}:${JSON.stringify(options)}`;
    }
    get(rawTLE, options = {}) {
        const key = this.keyGenerator(rawTLE, options);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check TTL
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.tle;
    }
    set(rawTLE, tle, options = {}) {
        const key = this.keyGenerator(rawTLE, options);
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, {
            tle,
            timestamp: Date.now()
        });
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
/**
 * Create a cached parser
 */
function createCachedParser(cacheOptions = {}) {
    const cache = new TLECache(cacheOptions);
    return {
        parse: (rawTLE, options = {}) => {
            const cached = cache.get(rawTLE, options);
            if (cached)
                return cached;
            const parsed = parseTLE(rawTLE, options);
            cache.set(rawTLE, parsed, options);
            return parsed;
        },
        parseAsync: async (rawTLE, options = {}) => {
            const cached = cache.get(rawTLE, options);
            if (cached)
                return cached;
            const parsed = await parseTLEAsync(rawTLE, options);
            cache.set(rawTLE, parsed, options);
            return parsed;
        },
        cache
    };
}
// ============================================================================
// PARSER PROFILES
// ============================================================================
/**
 * Get parser options for a specific profile
 */
function getProfileOptions(profile) {
    const profiles = {
        strict: {
            validate: true,
            strictChecksums: true,
            validateRanges: true,
            mode: 'strict',
            includeWarnings: true,
            includeComments: true
        },
        permissive: {
            validate: true,
            strictChecksums: false,
            validateRanges: false,
            mode: 'permissive',
            includeWarnings: true,
            includeComments: true
        },
        fast: {
            validate: false,
            includeWarnings: false,
            includeComments: false
        },
        realtime: {
            validate: true,
            strictChecksums: false,
            validateRanges: false,
            mode: 'permissive',
            includeWarnings: false,
            includeComments: false
        },
        batch: {
            validate: true,
            strictChecksums: true,
            validateRanges: true,
            mode: 'strict',
            includeWarnings: false,
            includeComments: false
        },
        recovery: {
            validate: false,
            includeWarnings: true,
            includeComments: true
        },
        legacy: {
            validate: true,
            strictChecksums: false,
            validateRanges: false,
            mode: 'permissive',
            includeWarnings: true,
            includeComments: true
        }
    };
    return profiles[profile];
}
/**
 * Parse with a specific profile
 */
function parseWithProfile(rawTLE, profile) {
    return parseTLE(rawTLE, getProfileOptions(profile));
}
// ============================================================================
// INCREMENTAL PARSER
// ============================================================================
/**
 * Incremental parser for real-time feeds
 */
class IncrementalParser {
    constructor(onTLE, options = {}) {
        this.buffer = '';
        this.currentSet = [];
        this.onTLE = onTLE;
        this.options = options;
    }
    /**
     * Add data to the parser
     */
    push(data) {
        this.buffer += data;
        this.processBuffer();
    }
    /**
     * Flush remaining data
     */
    flush() {
        if (this.currentSet.length >= 2) {
            this.emitTLE(this.currentSet.join('\n'));
            this.currentSet = [];
        }
    }
    processBuffer() {
        const lines = this.buffer.split('\n');
        // Keep last incomplete line
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            if (trimmed.startsWith('#')) {
                this.currentSet.push(trimmed);
                continue;
            }
            if (trimmed[0] === '1') {
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                }
                this.currentSet = [trimmed];
            }
            else if (trimmed[0] === '2') {
                this.currentSet.push(trimmed);
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                    this.currentSet = [];
                }
            }
            else {
                // Satellite name
                if (this.currentSet.length >= 2) {
                    this.emitTLE(this.currentSet.join('\n'));
                }
                this.currentSet = [trimmed];
            }
        }
    }
    emitTLE(rawTLE) {
        try {
            const parsed = parseTLE(rawTLE, this.options);
            this.onTLE(parsed);
        }
        catch (error) {
            // Silently ignore parse errors in incremental mode
        }
    }
}
/**
 * Create an incremental parser
 */
function createIncrementalParser(onTLE, options = {}) {
    return new IncrementalParser(onTLE, options);
}
// ============================================================================
// PARALLEL PARSING
// ============================================================================
/**
 * Parse TLEs in parallel using worker threads
 * Note: This requires a worker script to be created
 *
 * @param input - String containing multiple TLEs
 * @param options - Batch parse options
 * @param workerCount - Number of worker threads (default: CPU count)
 * @returns Promise resolving to array of parsed TLEs
 */
async function parseParallel(input, options = {}, _workerCount) {
    // Note: Parallel parsing with worker threads would require a separate worker file
    // For now, we fall back to batch parsing
    // In a real implementation, you would:
    // 1. Split TLEs into chunks
    // 2. Create worker threads
    // 3. Distribute work across workers
    // 4. Collect and merge results
    // Fallback to optimized batch parsing
    return parseBatch(input, options);
}
// ============================================================================
// PROVIDER-SPECIFIC VARIATIONS
// ============================================================================
/**
 * Get provider-specific parsing options
 */
function getProviderOptions(provider) {
    const providerOptions = {
        celestrak: {
            validate: true,
            strictChecksums: true,
            validateRanges: true,
            mode: 'strict',
            includeWarnings: true,
            includeComments: true
        },
        spacetrack: {
            validate: true,
            strictChecksums: true,
            validateRanges: true,
            mode: 'strict',
            includeWarnings: true,
            includeComments: true
        },
        amsat: {
            validate: true,
            strictChecksums: false,
            validateRanges: false,
            mode: 'permissive',
            includeWarnings: true,
            includeComments: true
        },
        custom: {
            validate: false,
            includeWarnings: true,
            includeComments: true
        }
    };
    return providerOptions[provider];
}
/**
 * Parse with provider-specific options
 */
function parseWithProvider(rawTLE, provider) {
    return parseTLE(rawTLE, getProviderOptions(provider));
}

/**
 * Comprehensive TLE Validation and Normalization Module
 *
 * This module provides advanced validation, normalization, and data quality
 * assessment for Two-Line Element (TLE) sets.
 */
// ============================================================================
// Constants and Configuration
// ============================================================================
/**
 * Valid orbital parameter ranges based on TLE specifications and physical constraints
 */
const ORBITAL_PARAMETER_RANGES = {
    // Mean motion (revolutions per day) - valid range for Earth orbit
    meanMotion: { min: 0.0, max: 20.0, typical: { min: 10.0, max: 17.0 } },
    // Eccentricity (0 = circular, <1 = elliptical)
    eccentricity: { min: 0.0, max: 0.999999, typical: { min: 0.0, max: 0.25 } },
    // Inclination (degrees, 0-180)
    inclination: { min: 0.0, max: 180.0, typical: { min: 0.0, max: 100.0 } },
    // Right Ascension of Ascending Node (degrees, 0-360)
    rightAscension: { min: 0.0, max: 360.0 },
    // Argument of Perigee (degrees, 0-360)
    argumentOfPerigee: { min: 0.0, max: 360.0 },
    // Mean Anomaly (degrees, 0-360)
    meanAnomaly: { min: 0.0, max: 360.0 },
    // Ballistic coefficient (1/Earth radii)
    bStar: { min: -1, max: 1.0, typical: { min: -1e-3, max: 0.001 } },
    // First derivative of mean motion (revolutions/day^2)
    meanMotionFirstDerivative: { min: -1, max: 1.0, typical: { min: -1e-3, max: 0.001 } },
    // Second derivative of mean motion (revolutions/day^3)
    meanMotionSecondDerivative: { min: -1, max: 1.0, typical: { min: -1e-5, max: 0.00001 } },
    // Revolution number at epoch
    revolutionNumber: { min: 0, max: 99999 },
    // Element set number
    elementSetNumber: { min: 0, max: 999 },
    // Ephemeris type (usually 0-4)
    ephemerisType: { min: 0, max: 9 }
};
/**
 * NORAD satellite number ranges
 */
const SATELLITE_NUMBER_RANGES = {
    min: 1,
    max: 999999,
    // Historical cutoffs
    historical5Digit: 99999,
    modern6Digit: 999999
};
/**
 * Epoch date validation constraints
 */
const EPOCH_CONSTRAINTS = {
    // Minimum year (Sputnik era)
    minYear: 57, // 1957
    maxYear: 99, // Up to 2099 in 2-digit format
    // Day of year constraints
    minDayOfYear: 1.0,
    maxDayOfYear: 366.99999999, // Leap year maximum
    // Staleness thresholds (days)
    warningAgeThreshold: 7, // Warn if older than 7 days
    criticalAgeThreshold: 30, // Critical if older than 30 days
    // Future epoch threshold (days)
    maxFutureDays: 30 // Warn if more than 30 days in future
};
/**
 * International Designator format constraints
 */
const DESIGNATOR_CONSTRAINTS = {
    yearMin: 57, // 1957
    yearMax: 99, // up to 2099
    launchNumberMin: 1,
    launchNumberMax: 999,
    piecePattern: /^[A-Z]{1,3}$/ // 1-3 uppercase letters
};
/**
 * Data quality score weights
 */
const QUALITY_SCORE_WEIGHTS = {
    checksumValid: 20,
    fieldFormatValid: 15,
    parametersInRange: 15,
    parametersInTypicalRange: 10,
    epochRecent: 15,
    noAnomalies: 10,
    designatorValid: 5,
    consistencyChecks: 10
};
// ============================================================================
// Epoch Date Validation and Conversion
// ============================================================================
/**
 * Convert TLE epoch to full date information
 *
 * @param epochYear - Two-digit year from TLE
 * @param epochDay - Day of year with fractional part
 * @returns Complete epoch date information
 */
function convertEpochToDate(epochYear, epochDay) {
    // Convert 2-digit year to 4-digit year
    // TLE convention: 57-99 = 1957-1999, 00-56 = 2000-2056
    let fullYear;
    if (epochYear >= 57) {
        fullYear = 1900 + epochYear;
    }
    else {
        fullYear = 2000 + epochYear;
    }
    // Create date from year and day of year
    const yearStart = new Date(Date.UTC(fullYear, 0, 1));
    const millisInDay = 86400000;
    const epochMillis = yearStart.getTime() + (epochDay - 1) * millisInDay;
    const date = new Date(epochMillis);
    // Calculate Julian Date
    // JD = 367Y - 7(Y + (M+9)/12)/4 + 275M/9 + D + 1721013.5
    const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
    const y = fullYear + 4800 - a;
    const m = (date.getUTCMonth() + 1) + 12 * a - 3;
    const julianDate = date.getUTCDate() +
        Math.floor((153 * m + 2) / 5) +
        365 * y +
        Math.floor(y / 4) -
        Math.floor(y / 100) +
        Math.floor(y / 400) -
        32045 +
        (date.getUTCHours() +
            date.getUTCMinutes() / 60 +
            date.getUTCSeconds() / 3600) / 24;
    const modifiedJulianDate = julianDate - 2400000.5;
    return {
        year: fullYear,
        twoDigitYear: epochYear,
        dayOfYear: epochDay,
        isoDate: date.toISOString(),
        date,
        julianDate,
        modifiedJulianDate
    };
}
/**
 * Validate epoch date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @returns Validation result with any errors/warnings
 */
function validateEpochDate(epochYear, epochDay) {
    const errors = [];
    // Validate year range
    if (epochYear < EPOCH_CONSTRAINTS.minYear || epochYear > EPOCH_CONSTRAINTS.maxYear) {
        errors.push(`Epoch year ${epochYear} outside valid range ` +
            `[${EPOCH_CONSTRAINTS.minYear}, ${EPOCH_CONSTRAINTS.maxYear}]`);
    }
    // Validate day of year range
    if (epochDay < EPOCH_CONSTRAINTS.minDayOfYear || epochDay > EPOCH_CONSTRAINTS.maxDayOfYear) {
        errors.push(`Epoch day ${epochDay} outside valid range ` +
            `[${EPOCH_CONSTRAINTS.minDayOfYear}, ${EPOCH_CONSTRAINTS.maxDayOfYear}]`);
    }
    if (errors.length > 0) {
        return {
            valid: false,
            message: errors.join('; '),
            context: { epochYear, epochDay }
        };
    }
    // Additional validation: check if day is valid for the year
    const epochDate = convertEpochToDate(epochYear, epochDay);
    const fullYear = epochDate.year;
    const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
    const maxDayForYear = isLeapYear ? 366 : 365;
    if (Math.floor(epochDay) > maxDayForYear) {
        errors.push(`Day ${Math.floor(epochDay)} exceeds maximum for ${fullYear} ` +
            `(${isLeapYear ? 'leap year' : 'non-leap year'}: ${maxDayForYear} days)`);
    }
    if (errors.length > 0) {
        return {
            valid: false,
            message: errors.join('; '),
            context: { epochYear, epochDay, fullYear, isLeapYear }
        };
    }
    return {
        valid: true,
        context: { epochDate }
    };
}
/**
 * Calculate age of TLE epoch relative to reference date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param referenceDate - Reference date (defaults to now)
 * @returns Age in days (positive = past, negative = future)
 */
function calculateEpochAge(epochYear, epochDay, referenceDate = new Date()) {
    const epochDate = convertEpochToDate(epochYear, epochDay);
    const ageMillis = referenceDate.getTime() - epochDate.date.getTime();
    return ageMillis / 86400000; // Convert to days
}
/**
 * Validate epoch age (staleness or future date check)
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param options - Validation options
 * @returns Validation result with warnings for stale or future epochs
 */
function validateEpochAge(epochYear, epochDay, options = {}) {
    const refDate = options.referenceDate || new Date();
    const age = calculateEpochAge(epochYear, epochDay, refDate);
    const warnings = [];
    // Check if epoch is in the future
    if (age < 0) {
        const futureDays = Math.abs(age);
        if (!options.allowFuture) {
            return {
                valid: false,
                message: `Epoch is ${futureDays.toFixed(2)} days in the future`,
                context: { age, futureDays }
            };
        }
        else if (futureDays > EPOCH_CONSTRAINTS.maxFutureDays) {
            warnings.push(`Epoch is ${futureDays.toFixed(2)} days in the future ` +
                `(threshold: ${EPOCH_CONSTRAINTS.maxFutureDays} days)`);
        }
    }
    // Check if epoch is too old
    if (age > 0) {
        const maxAge = options.maxAge || EPOCH_CONSTRAINTS.criticalAgeThreshold;
        if (age > maxAge) {
            warnings.push(`Epoch is ${age.toFixed(2)} days old (threshold: ${maxAge} days)`);
        }
    }
    return {
        valid: true,
        message: warnings.length > 0 ? warnings.join('; ') : undefined,
        context: { age }
    };
}
// ============================================================================
// Orbital Parameter Validation
// ============================================================================
/**
 * Validate a numeric orbital parameter against its valid range
 *
 * @param paramName - Parameter name
 * @param value - Parameter value
 * @param checkTypical - Whether to also check typical range
 * @returns Validation result
 */
function validateOrbitalParameter(paramName, value, checkTypical = false) {
    const ranges = ORBITAL_PARAMETER_RANGES[paramName];
    if (!ranges) {
        return {
            valid: false,
            message: `Unknown parameter: ${paramName}`
        };
    }
    // Check absolute limits
    if (value < ranges.min || value > ranges.max) {
        return {
            valid: false,
            message: `${paramName} value ${value} outside valid range [${ranges.min}, ${ranges.max}]`,
            context: { paramName, value, min: ranges.min, max: ranges.max }
        };
    }
    // Check typical range if requested
    if (checkTypical && 'typical' in ranges && ranges.typical) {
        const typical = ranges.typical;
        if (value < typical.min || value > typical.max) {
            return {
                valid: true,
                message: `${paramName} value ${value} outside typical range [${typical.min}, ${typical.max}]`,
                context: {
                    paramName,
                    value,
                    typicalMin: typical.min,
                    typicalMax: typical.max,
                    outsideTypical: true
                }
            };
        }
    }
    return {
        valid: true,
        context: { paramName, value }
    };
}
/**
 * Validate all orbital parameters in a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param checkTypical - Whether to check typical ranges
 * @returns Array of validation results for parameters outside range
 */
function validateAllOrbitalParameters(tle, checkTypical = false) {
    const results = [];
    // Map TLE fields to parameter names
    const parameterMap = {
        meanMotion: { field: 'meanMotion', param: 'meanMotion' },
        eccentricity: { field: 'eccentricity', param: 'eccentricity' },
        inclination: { field: 'inclination', param: 'inclination' },
        rightAscension: { field: 'rightAscension', param: 'rightAscension' },
        argumentOfPerigee: { field: 'argumentOfPerigee', param: 'argumentOfPerigee' },
        meanAnomaly: { field: 'meanAnomaly', param: 'meanAnomaly' },
        bStar: { field: 'bStar', param: 'bStar' },
        firstDerivative: { field: 'firstDerivative', param: 'meanMotionFirstDerivative' },
        secondDerivative: { field: 'secondDerivative', param: 'meanMotionSecondDerivative' },
        revolutionNumber: { field: 'revolutionNumber', param: 'revolutionNumber' },
        elementSetNumber: { field: 'elementSetNumber', param: 'elementSetNumber' },
        ephemerisType: { field: 'ephemerisType', param: 'ephemerisType' }
    };
    for (const [key, mapping] of Object.entries(parameterMap)) {
        const value = parseFloat(tle[mapping.field]);
        if (isNaN(value)) {
            results.push({
                valid: false,
                message: `Field ${key} is not a valid number`,
                context: { field: key, value: tle[mapping.field] }
            });
            continue;
        }
        const result = validateOrbitalParameter(mapping.param, value, checkTypical);
        if (!result.valid || result.message) {
            results.push({
                ...result,
                context: { ...result.context, field: key }
            });
        }
    }
    return results;
}
// ============================================================================
// Checksum Validation
// ============================================================================
/**
 * Calculate TLE checksum for a line
 *
 * @param line - TLE line (without checksum)
 * @returns Calculated checksum (0-9)
 */
function calculateChecksum$1(line) {
    let checksum = 0;
    // Process first 68 characters (excluding checksum at position 68)
    const dataSection = line.substring(0, 68);
    for (const char of dataSection) {
        if (char >= '0' && char <= '9') {
            checksum += parseInt(char, 10);
        }
        else if (char === '-') {
            checksum += 1;
        }
        // All other characters (letters, spaces, periods, +) count as 0
    }
    return checksum % 10;
}
/**
 * Validate checksum for a TLE line
 *
 * @param line - Complete TLE line
 * @param lineNumber - Line number (1 or 2)
 * @returns Validation result with details
 */
function validateChecksum$1(line, lineNumber) {
    if (line.length < 69) {
        return {
            valid: false,
            message: `Line ${lineNumber} is too short (${line.length} chars, expected 69)`,
            context: { lineNumber, length: line.length }
        };
    }
    const checksumChar = line.charAt(68);
    const expectedChecksum = parseInt(checksumChar, 10);
    const calculatedChecksum = calculateChecksum$1(line);
    if (isNaN(expectedChecksum)) {
        return {
            valid: false,
            message: `Line ${lineNumber} checksum is not a digit: '${checksumChar}'`,
            context: { lineNumber, checksumChar }
        };
    }
    if (calculatedChecksum !== expectedChecksum) {
        return {
            valid: false,
            message: `Line ${lineNumber} checksum mismatch: expected ${expectedChecksum}, calculated ${calculatedChecksum}`,
            context: {
                lineNumber,
                expected: expectedChecksum,
                calculated: calculatedChecksum,
                line: line.substring(0, 68)
            }
        };
    }
    return {
        valid: true,
        context: { lineNumber, checksum: calculatedChecksum }
    };
}
// ============================================================================
// Scientific Notation Normalization
// ============================================================================
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
function normalizeAssumedDecimalNotation(value) {
    value = value.trim();
    // Check for sign
    const negative = value[0] === '-';
    const sign = negative ? -1 : 1;
    // Remove sign and spaces
    const cleaned = value.replace(/^[-+\s]+/, '').replace(/\s+/g, '');
    // Find exponent marker (- or +)
    const expMatch = cleaned.match(/([+-])(\d+)$/);
    if (!expMatch) {
        // No exponent, treat as regular number
        return sign * parseFloat('0.' + cleaned);
    }
    // Extract mantissa and exponent
    const mantissa = cleaned.substring(0, cleaned.length - expMatch[0].length);
    const expSign = (expMatch[1] || '+') === '-' ? -1 : 1;
    const exponent = parseInt(expMatch[2] || '0', 10);
    // Build standard scientific notation
    const mantissaValue = parseFloat('0.' + mantissa);
    const result = sign * mantissaValue * Math.pow(10, expSign * exponent);
    return result;
}
/**
 * Normalize a TLE field that may contain scientific notation
 *
 * @param value - Raw field value
 * @param fieldType - Type of field ('assumedDecimal' | 'standard' | 'integer')
 * @returns Normalized numeric value
 */
function normalizeScientificNotation(value, fieldType = 'standard') {
    if (fieldType === 'assumedDecimal') {
        return normalizeAssumedDecimalNotation(value);
    }
    else if (fieldType === 'integer') {
        return parseInt(value.trim(), 10);
    }
    else {
        // Standard notation
        return parseFloat(value.trim());
    }
}
// ============================================================================
// Satellite Number Validation
// ============================================================================
/**
 * Validate NORAD satellite catalog number format and range
 *
 * @param satelliteNumber - Satellite number (as string or number)
 * @returns Validation result
 */
function validateSatelliteNumber$1(satelliteNumber) {
    const numValue = typeof satelliteNumber === 'string'
        ? parseInt(satelliteNumber.trim(), 10)
        : satelliteNumber;
    if (isNaN(numValue)) {
        return {
            valid: false,
            message: `Satellite number is not a valid integer: '${satelliteNumber}'`,
            context: { satelliteNumber }
        };
    }
    if (numValue < SATELLITE_NUMBER_RANGES.min || numValue > SATELLITE_NUMBER_RANGES.max) {
        return {
            valid: false,
            message: `Satellite number ${numValue} outside valid range [${SATELLITE_NUMBER_RANGES.min}, ${SATELLITE_NUMBER_RANGES.max}]`,
            context: {
                satelliteNumber: numValue,
                min: SATELLITE_NUMBER_RANGES.min,
                max: SATELLITE_NUMBER_RANGES.max
            }
        };
    }
    return {
        valid: true,
        context: {
            satelliteNumber: numValue,
            format: numValue <= SATELLITE_NUMBER_RANGES.historical5Digit ? '5-digit' : '6-digit'
        }
    };
}
// ============================================================================
// International Designator Validation
// ============================================================================
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
function validateInternationalDesignator(designator) {
    const trimmed = designator.trim();
    // Format validation
    const designatorPattern = /^(\d{2})(\d{1,3})([A-Z]{1,3})$/;
    const match = trimmed.match(designatorPattern);
    if (!match) {
        return {
            valid: false,
            message: `Invalid international designator format: '${designator}' (expected YYLLLPPP)`,
            context: { designator: trimmed }
        };
    }
    const yearStr = match[1] || '0';
    const launchNumStr = match[2] || '0';
    const piece = match[3] || '';
    const year = parseInt(yearStr, 10);
    const launchNumber = parseInt(launchNumStr, 10);
    // Validate year
    if (year < DESIGNATOR_CONSTRAINTS.yearMin || year > DESIGNATOR_CONSTRAINTS.yearMax) {
        return {
            valid: false,
            message: `International designator year ${year} outside valid range [${DESIGNATOR_CONSTRAINTS.yearMin}, ${DESIGNATOR_CONSTRAINTS.yearMax}]`,
            context: { designator: trimmed, year }
        };
    }
    // Validate launch number
    if (launchNumber < DESIGNATOR_CONSTRAINTS.launchNumberMin ||
        launchNumber > DESIGNATOR_CONSTRAINTS.launchNumberMax) {
        return {
            valid: false,
            message: `International designator launch number ${launchNumber} outside valid range [${DESIGNATOR_CONSTRAINTS.launchNumberMin}, ${DESIGNATOR_CONSTRAINTS.launchNumberMax}]`,
            context: { designator: trimmed, launchNumber }
        };
    }
    // Validate piece
    if (!DESIGNATOR_CONSTRAINTS.piecePattern.test(piece)) {
        return {
            valid: false,
            message: `International designator piece '${piece}' invalid (must be 1-3 uppercase letters)`,
            context: { designator: trimmed, piece }
        };
    }
    return {
        valid: true,
        context: {
            designator: trimmed,
            year,
            launchNumber,
            piece,
            fullYear: year >= DESIGNATOR_CONSTRAINTS.yearMin ? 1900 + year : 2000 + year
        }
    };
}
// ============================================================================
// Anomaly Detection
// ============================================================================
/**
 * Anomaly detection thresholds and patterns
 */
const ANOMALY_PATTERNS = {
    // High eccentricity (approaching parabolic orbit)
    highEccentricity: 0.5,
    // Very low mean motion (deep space or high orbit)
    lowMeanMotion: 1.0,
    // Very high mean motion (low orbit or unstable)
    highMeanMotion: 18.0,
    // Unusual inclination (retrograde or polar)
    retrogradeInclination: 90.0,
    // Very high B* drag term (high atmospheric drag)
    highDrag: 0.01,
    // Unusual mean motion derivatives (rapid orbital decay)
    highMeanMotionDerivative: 0.01,
    // Very low revolution number (new satellite)
    lowRevolutionNumber: 100
};
/**
 * Detect anomalies in orbital parameters
 *
 * @param tle - Parsed TLE object
 * @returns Array of detected anomalies
 */
function detectAnomalies(tle) {
    const anomalies = [];
    // Parse numeric values
    const eccentricity = parseFloat(tle.eccentricity);
    const meanMotion = parseFloat(tle.meanMotion);
    const inclination = parseFloat(tle.inclination);
    const bStar = normalizeAssumedDecimalNotation(tle.bStar);
    const meanMotionDeriv = parseFloat(tle.firstDerivative);
    const revolutionNumber = parseInt(tle.revolutionNumber, 10);
    // High eccentricity detection
    if (eccentricity > ANOMALY_PATTERNS.highEccentricity) {
        anomalies.push({
            hasAnomaly: true,
            type: 'HIGH_ECCENTRICITY',
            description: `Unusually high eccentricity: ${eccentricity.toFixed(6)} (threshold: ${ANOMALY_PATTERNS.highEccentricity})`,
            severity: eccentricity > 0.9 ? 'error' : 'warning',
            score: Math.min(eccentricity / ANOMALY_PATTERNS.highEccentricity, 1.0)
        });
    }
    // Low mean motion (high/deep orbit)
    if (meanMotion < ANOMALY_PATTERNS.lowMeanMotion) {
        anomalies.push({
            hasAnomaly: true,
            type: 'LOW_MEAN_MOTION',
            description: `Unusually low mean motion: ${meanMotion.toFixed(8)} rev/day (threshold: ${ANOMALY_PATTERNS.lowMeanMotion})`,
            severity: 'warning',
            score: 1.0 - (meanMotion / ANOMALY_PATTERNS.lowMeanMotion)
        });
    }
    // High mean motion (very low orbit)
    if (meanMotion > ANOMALY_PATTERNS.highMeanMotion) {
        anomalies.push({
            hasAnomaly: true,
            type: 'HIGH_MEAN_MOTION',
            description: `Unusually high mean motion: ${meanMotion.toFixed(8)} rev/day (threshold: ${ANOMALY_PATTERNS.highMeanMotion})`,
            severity: 'warning',
            score: Math.min(meanMotion / ANOMALY_PATTERNS.highMeanMotion, 1.0)
        });
    }
    // Retrograde orbit detection
    if (inclination > ANOMALY_PATTERNS.retrogradeInclination && inclination < 180) {
        anomalies.push({
            hasAnomaly: true,
            type: 'RETROGRADE_ORBIT',
            description: `Retrograde orbit detected: inclination ${inclination.toFixed(4)}° (>90°)`,
            severity: 'info',
            score: (inclination - 90) / 90
        });
    }
    // High atmospheric drag
    if (Math.abs(bStar) > ANOMALY_PATTERNS.highDrag) {
        anomalies.push({
            hasAnomaly: true,
            type: 'HIGH_DRAG',
            description: `Unusually high drag coefficient: B* = ${bStar.toExponential(4)} (threshold: ${ANOMALY_PATTERNS.highDrag})`,
            severity: 'warning',
            score: Math.min(Math.abs(bStar) / ANOMALY_PATTERNS.highDrag, 1.0)
        });
    }
    // Rapid orbital decay
    if (Math.abs(meanMotionDeriv) > ANOMALY_PATTERNS.highMeanMotionDerivative) {
        anomalies.push({
            hasAnomaly: true,
            type: 'RAPID_ORBITAL_CHANGE',
            description: `Rapid orbital evolution: dn/dt = ${meanMotionDeriv.toFixed(8)} (threshold: ${ANOMALY_PATTERNS.highMeanMotionDerivative})`,
            severity: 'warning',
            score: Math.min(Math.abs(meanMotionDeriv) / ANOMALY_PATTERNS.highMeanMotionDerivative, 1.0)
        });
    }
    // Low revolution number (newly launched satellite)
    if (revolutionNumber < ANOMALY_PATTERNS.lowRevolutionNumber) {
        anomalies.push({
            hasAnomaly: true,
            type: 'NEW_SATELLITE',
            description: `Recently launched satellite: revolution number ${revolutionNumber}`,
            severity: 'info',
            score: 1.0 - (revolutionNumber / ANOMALY_PATTERNS.lowRevolutionNumber)
        });
    }
    // Circular orbit at exact 0 eccentricity (unusual but valid)
    if (eccentricity === 0.0) {
        anomalies.push({
            hasAnomaly: true,
            type: 'CIRCULAR_ORBIT',
            description: 'Perfect circular orbit (eccentricity = 0)',
            severity: 'info',
            score: 0.1
        });
    }
    return anomalies;
}
// ============================================================================
// Data Quality Scoring
// ============================================================================
/**
 * Calculate data quality score for a TLE
 *
 * @param tle - Parsed TLE object
 * @param validationResults - Results from validation checks
 * @returns Quality score and assessment
 */
function calculateQualityScore(tle, validationResults) {
    let totalScore = 0;
    const components = {
        checksumScore: 0,
        formatScore: 0,
        rangeScore: 0,
        epochScore: 0,
        anomalyScore: 0,
        consistencyScore: 0
    };
    // Checksum score (20 points)
    if (validationResults.checksumValid) {
        components.checksumScore = QUALITY_SCORE_WEIGHTS.checksumValid;
    }
    // Format score (15 points)
    if (validationResults.formatValid) {
        components.formatScore = QUALITY_SCORE_WEIGHTS.fieldFormatValid;
    }
    // Range score (15 points for all in valid range, 10 for typical range)
    const rangeErrors = validationResults.rangeErrors.filter(r => !r.valid);
    const rangeWarnings = validationResults.rangeResults.filter(r => r.valid && r.message);
    if (rangeErrors.length === 0) {
        components.rangeScore = QUALITY_SCORE_WEIGHTS.parametersInRange;
        if (rangeWarnings.length === 0) {
            components.rangeScore += QUALITY_SCORE_WEIGHTS.parametersInTypicalRange;
        }
    }
    else {
        // Partial credit based on percentage of valid parameters
        const totalParams = rangeErrors.length + rangeWarnings.length;
        const validParams = rangeWarnings.length;
        components.rangeScore = (validParams / totalParams) * QUALITY_SCORE_WEIGHTS.parametersInRange;
    }
    // Epoch score (15 points)
    const epochAge = Math.abs(validationResults.epochAge);
    if (epochAge <= 1) {
        // Very fresh data
        components.epochScore = QUALITY_SCORE_WEIGHTS.epochRecent;
    }
    else if (epochAge <= EPOCH_CONSTRAINTS.warningAgeThreshold) {
        // Recent data
        components.epochScore = QUALITY_SCORE_WEIGHTS.epochRecent * 0.9;
    }
    else if (epochAge <= EPOCH_CONSTRAINTS.criticalAgeThreshold) {
        // Aging data
        components.epochScore = QUALITY_SCORE_WEIGHTS.epochRecent * 0.5;
    }
    else {
        // Stale data
        components.epochScore = QUALITY_SCORE_WEIGHTS.epochRecent * 0.2;
    }
    // Anomaly score (10 points)
    const severityWeights = { error: 1.0, warning: 0.5, info: 0.1 };
    const anomalyPenalty = validationResults.anomalies.reduce((sum, anomaly) => {
        const weight = severityWeights[anomaly.severity || 'info'];
        return sum + (anomaly.score || 0.5) * weight;
    }, 0);
    components.anomalyScore = Math.max(0, QUALITY_SCORE_WEIGHTS.noAnomalies - anomalyPenalty * 2);
    // Consistency score (10 points)
    // Check satellite number consistency, classification validity, etc.
    let consistencyPoints = QUALITY_SCORE_WEIGHTS.consistencyChecks;
    // Check satellite number match between lines
    if (tle.satelliteNumber1 !== tle.satelliteNumber2) {
        consistencyPoints -= 5;
    }
    // Check classification is valid
    if (!['U', 'C', 'S'].includes(tle.classification)) {
        consistencyPoints -= 2;
    }
    // Check international designator is valid
    const designatorResult = validateInternationalDesignator(tle.internationalDesignatorYear + tle.internationalDesignatorLaunchNumber + tle.internationalDesignatorPiece);
    if (!designatorResult.valid) {
        consistencyPoints -= 3;
    }
    components.consistencyScore = Math.max(0, consistencyPoints);
    // Calculate total score
    totalScore = Object.values(components).reduce((sum, score) => sum + score, 0);
    // Determine grade
    let grade;
    if (totalScore >= 90) {
        grade = 'A';
    }
    else if (totalScore >= 80) {
        grade = 'B';
    }
    else if (totalScore >= 70) {
        grade = 'C';
    }
    else if (totalScore >= 60) {
        grade = 'D';
    }
    else {
        grade = 'F';
    }
    // Generate assessment
    let assessment;
    if (grade === 'A') {
        assessment = 'Excellent quality - TLE is fresh, valid, and anomaly-free';
    }
    else if (grade === 'B') {
        assessment = 'Good quality - TLE is valid with minor warnings';
    }
    else if (grade === 'C') {
        assessment = 'Acceptable quality - TLE has some issues but is usable';
    }
    else if (grade === 'D') {
        assessment = 'Poor quality - TLE has significant issues, use with caution';
    }
    else {
        assessment = 'Invalid - TLE has critical errors and should not be used';
    }
    return {
        overall: Math.round(totalScore),
        components,
        grade,
        assessment
    };
}
// ============================================================================
// Field Sanitization
// ============================================================================
/**
 * Sanitize a TLE field by removing/normalizing invalid characters
 *
 * @param value - Raw field value
 * @param fieldName - Name of the field
 * @returns Sanitized value with modification details
 */
function sanitizeField(value, fieldName) {
    let sanitized = value;
    const modifications = [];
    // Remove null bytes
    if (sanitized.includes('\0')) {
        sanitized = sanitized.replace(/\0/g, '');
        modifications.push('Removed null bytes');
    }
    // Normalize whitespace (replace tabs with spaces)
    if (sanitized.includes('\t')) {
        sanitized = sanitized.replace(/\t/g, ' ');
        modifications.push('Normalized tabs to spaces');
    }
    // Remove non-printable characters (except space)
    const nonPrintable = /[\x00-\x1F\x7F-\x9F]/g;
    if (nonPrintable.test(sanitized)) {
        sanitized = sanitized.replace(nonPrintable, '');
        modifications.push('Removed non-printable characters');
    }
    // Field-specific sanitization
    switch (fieldName) {
        case 'satelliteName':
            // Ensure name uses only valid characters
            if (!/^[A-Z0-9\s\-\(\)]+$/i.test(sanitized)) {
                sanitized = sanitized.replace(/[^A-Z0-9\s\-\(\)]/gi, '');
                modifications.push('Removed invalid characters from satellite name');
            }
            break;
        case 'classification':
            // Ensure single uppercase letter
            sanitized = sanitized.trim().toUpperCase();
            if (sanitized.length > 1) {
                sanitized = sanitized.charAt(0);
                modifications.push('Truncated classification to single character');
            }
            break;
        case 'internationalDesignatorYear':
        case 'internationalDesignatorLaunchNumber':
        case 'satelliteNumber1':
        case 'satelliteNumber2':
        case 'elementSetNumber':
        case 'revolutionNumber':
            // Ensure numeric fields contain only digits
            if (!/^\d+$/.test(sanitized.trim())) {
                sanitized = sanitized.replace(/\D/g, '');
                modifications.push(`Removed non-numeric characters from ${fieldName}`);
            }
            break;
        case 'internationalDesignatorPiece': {
            // Ensure uppercase letters only
            const original = sanitized;
            sanitized = sanitized.trim().toUpperCase().replace(/[^A-Z]/g, '');
            if (sanitized !== original.trim()) {
                modifications.push('Normalized designator piece to uppercase letters');
            }
            break;
        }
    }
    // Trim leading/trailing whitespace
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) {
        sanitized = trimmed;
        modifications.push('Trimmed whitespace');
    }
    return {
        value: sanitized,
        modified: modifications.length > 0,
        modifications: modifications.length > 0 ? modifications : undefined
    };
}
/**
 * Sanitize all fields in a TLE
 *
 * @param tle - Parsed TLE object
 * @returns Map of field names to sanitization results
 */
function sanitizeAllFields(tle) {
    const results = new Map();
    // Get all string fields from TLE
    for (const [fieldName, value] of Object.entries(tle)) {
        if (typeof value === 'string') {
            const result = sanitizeField(value, fieldName);
            if (result.modified) {
                results.set(fieldName, result);
            }
        }
    }
    return results;
}
// ============================================================================
// Validation Rule Customization
// ============================================================================
/**
 * Default validation rules
 */
const DEFAULT_VALIDATION_RULES = [
    {
        name: 'checksum',
        description: 'Validate line checksums',
        severity: 'error',
        enabled: true,
        validate: () => {
            // This is a placeholder - actual implementation in comprehensive validator
            return { valid: true };
        }
    },
    {
        name: 'satelliteNumberRange',
        description: 'Validate satellite number is in valid range',
        severity: 'error',
        enabled: true,
        validate: (value) => validateSatelliteNumber$1(value)
    },
    {
        name: 'epochDate',
        description: 'Validate epoch date format and range',
        severity: 'error',
        enabled: true,
        validate: (tle) => {
            const year = parseInt(tle.epochYear, 10);
            const day = parseFloat(tle.epoch);
            return validateEpochDate(year, day);
        }
    },
    {
        name: 'epochAge',
        description: 'Warn if epoch is stale or in future',
        severity: 'warning',
        enabled: true,
        validate: (tle, context) => {
            const year = parseInt(tle.epochYear, 10);
            const day = parseFloat(tle.epoch);
            return validateEpochAge(year, day, { referenceDate: context?.referenceDate });
        }
    },
    {
        name: 'internationalDesignator',
        description: 'Validate international designator format',
        severity: 'warning',
        enabled: true,
        validate: (tle) => {
            const designator = tle.internationalDesignatorYear +
                tle.internationalDesignatorLaunchNumber +
                tle.internationalDesignatorPiece;
            return validateInternationalDesignator(designator);
        }
    },
    {
        name: 'orbitalParameterRanges',
        description: 'Validate orbital parameters are in valid ranges',
        severity: 'error',
        enabled: true,
        validate: (tle) => {
            const results = validateAllOrbitalParameters(tle, false);
            const errors = results.filter(r => !r.valid);
            if (errors.length > 0) {
                return {
                    valid: false,
                    message: errors.map(e => e.message).join('; '),
                    context: { errors }
                };
            }
            return { valid: true };
        }
    },
    {
        name: 'anomalyDetection',
        description: 'Detect unusual orbital parameters',
        severity: 'warning',
        enabled: false, // Disabled by default
        validate: (tle) => {
            const anomalies = detectAnomalies(tle);
            if (anomalies.length > 0) {
                return {
                    valid: true,
                    message: `${anomalies.length} anomalies detected`,
                    context: { anomalies }
                };
            }
            return { valid: true };
        }
    }
];
/**
 * Create a custom validation rule
 *
 * @param name - Rule name
 * @param description - Rule description
 * @param validateFn - Validation function
 * @param options - Additional options
 * @returns Validation rule
 */
function createValidationRule(name, description, validateFn, options = {}) {
    return {
        name,
        description,
        severity: options.severity || 'warning',
        enabled: options.enabled !== false,
        validate: validateFn,
        errorMessage: options.errorMessage
    };
}
/**
 * Validation rule manager
 */
class ValidationRuleManager {
    constructor(initialRules = DEFAULT_VALIDATION_RULES) {
        this.rules = new Map();
        for (const rule of initialRules) {
            this.rules.set(rule.name, rule);
        }
    }
    /**
     * Add or update a validation rule
     */
    addRule(rule) {
        this.rules.set(rule.name, rule);
    }
    /**
     * Remove a validation rule
     */
    removeRule(name) {
        return this.rules.delete(name);
    }
    /**
     * Enable a validation rule
     */
    enableRule(name) {
        const rule = this.rules.get(name);
        if (rule) {
            rule.enabled = true;
            return true;
        }
        return false;
    }
    /**
     * Disable a validation rule
     */
    disableRule(name) {
        const rule = this.rules.get(name);
        if (rule) {
            rule.enabled = false;
            return true;
        }
        return false;
    }
    /**
     * Get all enabled rules
     */
    getEnabledRules() {
        return Array.from(this.rules.values()).filter(r => r.enabled);
    }
    /**
     * Get rule by name
     */
    getRule(name) {
        return this.rules.get(name);
    }
    /**
     * Get all rules
     */
    getAllRules() {
        return Array.from(this.rules.values());
    }
}
// ============================================================================
// Comprehensive Validation Report Generation
// ============================================================================
/**
 * Generate a comprehensive validation report for a TLE
 *
 * @param tle - Parsed TLE object
 * @param tleLines - Original TLE lines for checksum validation
 * @param options - Validation options
 * @returns Comprehensive validation report
 */
function generateValidationReport(tle, tleLines, options = {}) {
    const errors = [];
    const warnings = [];
    const anomalies = [];
    const sanitizedFields = [];
    const rulesApplied = [];
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    // Checksum validation
    if (options.validateChecksums !== false) {
        totalChecks += 2;
        rulesApplied.push('checksum');
        const checksum1 = validateChecksum$1(tleLines.line1, 1);
        if (!checksum1.valid) {
            errors.push({
                code: 'CHECKSUM_MISMATCH',
                message: checksum1.message || 'Checksum validation failed',
                line: 1,
                severity: 'error',
                field: 'checksum1'
            });
            failedChecks++;
        }
        else {
            passedChecks++;
        }
        const checksum2 = validateChecksum$1(tleLines.line2, 2);
        if (!checksum2.valid) {
            errors.push({
                code: 'CHECKSUM_MISMATCH',
                message: checksum2.message || 'Checksum validation failed',
                line: 2,
                severity: 'error',
                field: 'checksum2'
            });
            failedChecks++;
        }
        else {
            passedChecks++;
        }
    }
    // Epoch validation
    if (options.validateEpoch !== false) {
        totalChecks++;
        rulesApplied.push('epochDate');
        const epochYear = parseInt(tle.epochYear, 10);
        const epochDay = parseFloat(tle.epoch);
        const epochResult = validateEpochDate(epochYear, epochDay);
        if (!epochResult.valid) {
            errors.push({
                code: 'INVALID_EPOCH',
                message: epochResult.message || 'Invalid epoch date',
                severity: 'error',
                field: 'epoch'
            });
            failedChecks++;
        }
        else {
            passedChecks++;
        }
        // Epoch age validation
        const ageResult = validateEpochAge(epochYear, epochDay, {
            referenceDate: options.referenceDate,
            allowFuture: options.allowFutureEpochs,
            maxAge: options.maxEpochAge
        });
        if (!ageResult.valid) {
            errors.push({
                code: 'EPOCH_OUT_OF_RANGE',
                message: ageResult.message || 'Epoch age out of acceptable range',
                severity: 'error',
                field: 'epoch'
            });
        }
        else if (ageResult.message) {
            warnings.push({
                code: 'STALE_EPOCH',
                message: ageResult.message,
                severity: 'warning',
                field: 'epoch'
            });
        }
    }
    // Range validation
    const rangeResults = {
        valid: [],
        invalid: []
    };
    if (options.validateRanges !== false) {
        rulesApplied.push('orbitalParameterRanges');
        const results = validateAllOrbitalParameters(tle, options.strict);
        totalChecks += results.length;
        for (const result of results) {
            if (!result.valid) {
                errors.push({
                    code: 'PARAMETER_OUT_OF_RANGE',
                    message: result.message || 'Parameter out of valid range',
                    severity: 'error',
                    field: result.context?.field
                });
                failedChecks++;
                rangeResults.invalid.push(result);
            }
            else if (result.message) {
                warnings.push({
                    code: 'PARAMETER_OUTSIDE_TYPICAL',
                    message: result.message,
                    severity: 'warning',
                    field: result.context?.field
                });
                passedChecks++;
                rangeResults.valid.push(result);
            }
            else {
                passedChecks++;
                rangeResults.valid.push(result);
            }
        }
    }
    // Anomaly detection
    if (options.detectAnomalies) {
        rulesApplied.push('anomalyDetection');
        anomalies.push(...detectAnomalies(tle));
    }
    // Field sanitization
    if (options.sanitizeFields) {
        rulesApplied.push('fieldSanitization');
        const sanitizationResults = sanitizeAllFields(tle);
        for (const [fieldName] of sanitizationResults) {
            sanitizedFields.push(fieldName);
        }
    }
    // Satellite number validation
    totalChecks++;
    rulesApplied.push('satelliteNumber');
    const satNumResult = validateSatelliteNumber$1(tle.satelliteNumber1);
    if (!satNumResult.valid) {
        errors.push({
            code: 'INVALID_SATELLITE_NUMBER',
            message: satNumResult.message || 'Invalid satellite number',
            severity: 'error',
            field: 'satelliteNumber'
        });
        failedChecks++;
    }
    else {
        passedChecks++;
    }
    // Satellite number consistency
    if (tle.satelliteNumber1 !== tle.satelliteNumber2) {
        warnings.push({
            code: 'SATELLITE_NUMBER_MISMATCH',
            message: `Satellite numbers do not match: ${tle.satelliteNumber1} vs ${tle.satelliteNumber2}`,
            severity: 'warning',
            field: 'satelliteNumber'
        });
    }
    // International designator validation
    totalChecks++;
    rulesApplied.push('internationalDesignator');
    const designator = tle.internationalDesignatorYear +
        tle.internationalDesignatorLaunchNumber +
        tle.internationalDesignatorPiece;
    const designatorResult = validateInternationalDesignator(designator);
    if (!designatorResult.valid) {
        warnings.push({
            code: 'INVALID_DESIGNATOR',
            message: designatorResult.message || 'Invalid international designator',
            severity: 'warning',
            field: 'internationalDesignator'
        });
        failedChecks++;
    }
    else {
        passedChecks++;
    }
    // Calculate quality score if requested
    let qualityScore;
    if (options.calculateQuality !== false) {
        const epochYear = parseInt(tle.epochYear, 10);
        const epochDay = parseFloat(tle.epoch);
        const epochAge = calculateEpochAge(epochYear, epochDay, options.referenceDate);
        qualityScore = calculateQualityScore(tle, {
            checksumValid: errors.filter(e => e.code === 'CHECKSUM_MISMATCH').length === 0,
            formatValid: errors.filter(e => e.code?.includes('FORMAT')).length === 0,
            rangeErrors: rangeResults.invalid,
            rangeResults: [...rangeResults.valid, ...rangeResults.invalid],
            epochAge,
            anomalies
        });
    }
    else {
        // Default minimal score
        qualityScore = {
            overall: 0,
            components: {
                checksumScore: 0,
                formatScore: 0,
                rangeScore: 0,
                epochScore: 0,
                anomalyScore: 0,
                consistencyScore: 0
            },
            grade: 'F',
            assessment: 'Not calculated'
        };
    }
    return {
        isValid: errors.length === 0,
        qualityScore,
        errors,
        warnings,
        anomalies,
        sanitizedFields,
        timestamp: new Date(),
        rulesApplied,
        summary: {
            totalChecks,
            passedChecks,
            failedChecks,
            warningCount: warnings.length,
            errorCount: errors.length
        }
    };
}

/**
 * TLE Output Formats & Serialization
 * Supports JSON, CSV, XML, YAML, and human-readable formats
 * Includes TLE reconstruction capabilities
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Helper to get satellite number from ParsedTLE
 */
function getSatelliteNumber(tle) {
    return tle.satelliteNumber1 || tle.satelliteNumber2 || '';
}
/**
 * Helper to get international designator
 */
function getInternationalDesignator(tle) {
    const year = tle.internationalDesignatorYear || '';
    const launch = tle.internationalDesignatorLaunchNumber || '';
    const piece = tle.internationalDesignatorPiece || '';
    return `${year}${launch}${piece}`.trim();
}
// ============================================================================
// COLOR CODES FOR TERMINAL OUTPUT
// ============================================================================
const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};
/**
 * Apply color to text if colors are enabled
 */
function colorize(text, color, enabled = true) {
    return enabled ? `${color}${text}${Colors.reset}` : text;
}
// ============================================================================
// JSON OUTPUT
// ============================================================================
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
function formatAsJSON(tle, options = {}) {
    const { pretty = false, includeWarnings = true, includeComments = true, verbosity = 'normal' } = options;
    const processObject = (obj) => {
        const result = { ...obj };
        // Remove warnings if not requested
        if (!includeWarnings && 'warnings' in result) {
            delete result.warnings;
        }
        // Remove comments if not requested
        if (!includeComments && 'comments' in result) {
            delete result.comments;
        }
        // Compact mode: only essential fields
        if (verbosity === 'compact') {
            return {
                satelliteName: result.satelliteName,
                satelliteNumber: getSatelliteNumber(result),
                epoch: result.epochYear + ':' + result.epoch,
                inclination: result.inclination,
                eccentricity: result.eccentricity,
                meanMotion: result.meanMotion
            };
        }
        return result;
    };
    const data = Array.isArray(tle) ? tle.map(processObject) : processObject(tle);
    return JSON.stringify(data, null, pretty ? 2 : 0);
}
// ============================================================================
// CSV OUTPUT
// ============================================================================
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
function formatAsCSV(tle, options = {}) {
    const { includeHeader = true, delimiter = ',', quote = true, verbosity = 'normal' } = options;
    const tles = Array.isArray(tle) ? tle : [tle];
    const lines = [];
    // Define fields based on verbosity
    const compactFields = [
        'satelliteName', 'satelliteNumber1', 'epochYear', 'epoch',
        'inclination', 'eccentricity', 'meanMotion'
    ];
    const normalFields = [
        'satelliteName', 'satelliteNumber1', 'classification',
        'epochYear', 'epoch', 'firstDerivative', 'secondDerivative',
        'bStar', 'inclination', 'rightAscension', 'eccentricity',
        'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'revolutionNumber'
    ];
    const verboseFields = Object.keys(tles[0] || {}).filter(key => !['warnings', 'comments', 'checksum1', 'checksum2', 'lineNumber1', 'lineNumber2'].includes(key));
    const fields = verbosity === 'compact' ? compactFields :
        verbosity === 'verbose' ? verboseFields :
            normalFields;
    // Add header
    if (includeHeader) {
        lines.push(fields.map(f => quote ? `"${f}"` : f).join(delimiter));
    }
    // Add data rows
    for (const tleObj of tles) {
        const values = fields.map(field => {
            const value = tleObj[field] ?? '';
            const strValue = String(value);
            return quote ? `"${strValue.replace(/"/g, '""')}"` : strValue;
        });
        lines.push(values.join(delimiter));
    }
    return lines.join('\n');
}
// ============================================================================
// XML OUTPUT
// ============================================================================
/**
 * Escape XML special characters
 */
function escapeXML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
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
function formatAsXML(tle, options = {}) {
    const { pretty = false, includeWarnings = true, includeComments = true } = options;
    const indent = pretty ? '  ' : '';
    const newline = pretty ? '\n' : '';
    const tles = Array.isArray(tle) ? tle : [tle];
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push(`<tles>${newline}`);
    for (const tleObj of tles) {
        lines.push(`${indent}<tle>${newline}`);
        for (const [key, value] of Object.entries(tleObj)) {
            // Skip warnings and comments based on options
            if (key === 'warnings' && !includeWarnings)
                continue;
            if (key === 'comments' && !includeComments)
                continue;
            // Handle arrays (warnings, comments)
            if (Array.isArray(value)) {
                lines.push(`${indent}${indent}<${key}>${newline}`);
                for (const item of value) {
                    const itemStr = typeof item === 'object' ? JSON.stringify(item) : String(item);
                    lines.push(`${indent}${indent}${indent}<item>${escapeXML(itemStr)}</item>${newline}`);
                }
                lines.push(`${indent}${indent}</${key}>${newline}`);
            }
            else {
                const escapedValue = escapeXML(String(value ?? ''));
                lines.push(`${indent}${indent}<${key}>${escapedValue}</${key}>${newline}`);
            }
        }
        lines.push(`${indent}</tle>${newline}`);
    }
    lines.push('</tles>');
    return lines.join('');
}
// ============================================================================
// YAML OUTPUT
// ============================================================================
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
function formatAsYAML(tle, options = {}) {
    const { includeWarnings = true, includeComments = true } = options;
    const tles = Array.isArray(tle) ? tle : [tle];
    const lines = [];
    const formatValue = (value, indent = 0) => {
        const prefix = '  '.repeat(indent);
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'string') {
            // Quote strings that contain special characters or start with special chars
            if (/[:#\[\]{},&*!|>'"%@`]/.test(value) || /^\s|\s$/.test(value)) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (Array.isArray(value)) {
            if (value.length === 0)
                return '[]';
            const items = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const objLines = formatObject(item, indent + 1);
                    return `${prefix}  -${objLines.substring(prefix.length + 3)}`;
                }
                return `${prefix}  - ${formatValue(item, 0)}`;
            });
            return '\n' + items.join('\n');
        }
        if (typeof value === 'object') {
            return '\n' + formatObject(value, indent + 1);
        }
        return String(value);
    };
    const formatObject = (obj, indent = 0) => {
        const prefix = '  '.repeat(indent);
        const entries = [];
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'warnings' && !includeWarnings)
                continue;
            if (key === 'comments' && !includeComments)
                continue;
            const formattedValue = formatValue(value, indent);
            if (formattedValue.startsWith('\n')) {
                entries.push(`${prefix}${key}:${formattedValue}`);
            }
            else {
                entries.push(`${prefix}${key}: ${formattedValue}`);
            }
        }
        return entries.join('\n');
    };
    if (tles.length === 1) {
        return formatObject(tles[0], 0);
    }
    else {
        lines.push('tles:');
        for (const tleObj of tles) {
            lines.push('  -');
            const objStr = formatObject(tleObj, 2);
            lines.push(objStr);
        }
        return lines.join('\n');
    }
}
// ============================================================================
// HUMAN-READABLE OUTPUT
// ============================================================================
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
function formatAsHuman(tle, options = {}) {
    const { colors = false, verbosity = 'normal', includeWarnings = true } = options;
    const lines = [];
    // Header
    lines.push(colorize('═'.repeat(70), Colors.cyan, colors));
    lines.push(colorize(`  ${tle.satelliteName || 'Unknown Satellite'}`, Colors.bright + Colors.cyan, colors));
    lines.push(colorize('═'.repeat(70), Colors.cyan, colors));
    lines.push('');
    // Basic Information
    lines.push(colorize('Basic Information:', Colors.bright + Colors.yellow, colors));
    lines.push(`  ${colorize('Satellite Number:', Colors.green, colors)} ${getSatelliteNumber(tle)}`);
    lines.push(`  ${colorize('Classification:', Colors.green, colors)} ${tle.classification || 'N/A'}`);
    lines.push(`  ${colorize('International Designator:', Colors.green, colors)} ${getInternationalDesignator(tle) || 'N/A'}`);
    lines.push('');
    // Epoch Information
    lines.push(colorize('Epoch Information:', Colors.bright + Colors.yellow, colors));
    lines.push(`  ${colorize('Epoch Year:', Colors.green, colors)} ${tle.epochYear}`);
    lines.push(`  ${colorize('Epoch Day:', Colors.green, colors)} ${tle.epoch}`);
    lines.push('');
    // Orbital Parameters
    lines.push(colorize('Orbital Parameters:', Colors.bright + Colors.yellow, colors));
    lines.push(`  ${colorize('Inclination:', Colors.green, colors)} ${tle.inclination}°`);
    lines.push(`  ${colorize('Right Ascension:', Colors.green, colors)} ${tle.rightAscension}°`);
    lines.push(`  ${colorize('Eccentricity:', Colors.green, colors)} ${tle.eccentricity}`);
    lines.push(`  ${colorize('Argument of Perigee:', Colors.green, colors)} ${tle.argumentOfPerigee}°`);
    lines.push(`  ${colorize('Mean Anomaly:', Colors.green, colors)} ${tle.meanAnomaly}°`);
    lines.push(`  ${colorize('Mean Motion:', Colors.green, colors)} ${tle.meanMotion} rev/day`);
    lines.push('');
    // Verbose mode: additional parameters
    if (verbosity === 'verbose') {
        lines.push(colorize('Additional Parameters:', Colors.bright + Colors.yellow, colors));
        lines.push(`  ${colorize('First Derivative (Mean Motion):', Colors.green, colors)} ${tle.firstDerivative}`);
        lines.push(`  ${colorize('Second Derivative (Mean Motion):', Colors.green, colors)} ${tle.secondDerivative}`);
        lines.push(`  ${colorize('B* Drag Term:', Colors.green, colors)} ${tle.bStar}`);
        lines.push(`  ${colorize('Ephemeris Type:', Colors.green, colors)} ${tle.ephemerisType}`);
        lines.push(`  ${colorize('Element Set Number:', Colors.green, colors)} ${tle.elementSetNumber}`);
        lines.push(`  ${colorize('Revolution Number:', Colors.green, colors)} ${tle.revolutionNumber}`);
        lines.push('');
    }
    // Warnings
    if (includeWarnings && 'warnings' in tle && Array.isArray(tle.warnings) && tle.warnings.length > 0) {
        lines.push(colorize('Warnings:', Colors.bright + Colors.yellow, colors));
        for (const warning of tle.warnings) {
            const msg = typeof warning === 'object' && 'message' in warning ? warning.message : String(warning);
            lines.push(`  ${colorize('⚠', Colors.yellow, colors)} ${msg}`);
        }
        lines.push('');
    }
    lines.push(colorize('═'.repeat(70), Colors.cyan, colors));
    return lines.join('\n');
}
// ============================================================================
// TLE RECONSTRUCTION
// ============================================================================
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
function reconstructTLE(tle, options = {}) {
    const { includeName = true } = options;
    // Helper to pad a string to the right with spaces
    const padRight = (str, length) => {
        return str.padEnd(length, ' ');
    };
    // Helper to pad a string to the left with spaces or zeros
    const padLeft = (str, length, char = ' ') => {
        return str.padStart(length, char);
    };
    // Line 1: Build character by character according to TLE spec
    let line1 = '1 '; // Line number + space
    // Satellite number (positions 3-7): 5 characters, right-aligned
    line1 += padLeft(getSatelliteNumber(tle), 5, ' ');
    // Classification (position 8): 1 character
    line1 += (tle.classification || 'U');
    // International designator (positions 10-17): 8 characters
    const intlDesig = getInternationalDesignator(tle);
    line1 += ' ' + padRight(intlDesig, 8);
    // Epoch year (positions 19-20): 2 digits
    line1 += ' ' + padLeft(tle.epochYear || '', 2, '0');
    // Epoch day (positions 21-32): 12 characters, including decimal point
    line1 += padLeft(tle.epoch || '', 12, ' ');
    // First derivative of mean motion (positions 34-43): 10 characters
    line1 += ' ' + padLeft(tle.firstDerivative || '', 10, ' ');
    // Second derivative of mean motion (positions 45-52): 8 characters
    line1 += ' ' + padRight(tle.secondDerivative || '', 8);
    // B* drag term (positions 54-61): 8 characters
    line1 += ' ' + padRight(tle.bStar || '', 8);
    // Ephemeris type (position 63): 1 character
    line1 += ' ' + (tle.ephemerisType || '0');
    // Element set number (positions 65-68): 4 characters, right-aligned
    line1 += ' ' + padLeft(tle.elementSetNumber || '', 4, ' ');
    // Calculate checksum for line 1
    let checksum1 = 0;
    for (let i = 0; i < line1.length; i++) {
        const char = line1[i];
        if (char && char >= '0' && char <= '9') {
            checksum1 += parseInt(char, 10);
        }
        else if (char === '-') {
            checksum1 += 1;
        }
    }
    line1 += (checksum1 % 10).toString();
    // Line 2: Build character by character
    let line2 = '2 '; // Line number + space
    // Satellite number (positions 3-7): 5 characters, right-aligned
    line2 += padLeft(getSatelliteNumber(tle), 5, ' ');
    // Inclination (positions 9-16): 8 characters, with decimal point
    line2 += ' ' + padLeft(tle.inclination || '', 8, ' ');
    // Right ascension (positions 18-25): 8 characters, with decimal point
    line2 += ' ' + padLeft(tle.rightAscension || '', 8, ' ');
    // Eccentricity (positions 27-33): 7 characters, decimal point assumed
    // Remove leading "0." if present
    let ecc = (tle.eccentricity || '').replace(/^0\./, '');
    line2 += ' ' + padLeft(ecc, 7, '0');
    // Argument of perigee (positions 35-42): 8 characters
    line2 += ' ' + padLeft(tle.argumentOfPerigee || '', 8, ' ');
    // Mean anomaly (positions 44-51): 8 characters
    line2 += ' ' + padLeft(tle.meanAnomaly || '', 8, ' ');
    // Mean motion (positions 53-63): 11 characters, with decimal point
    line2 += ' ' + padLeft(tle.meanMotion || '', 11, ' ');
    // Revolution number (positions 64-68): 5 characters, right-aligned
    line2 += padLeft(tle.revolutionNumber || '', 5, ' ');
    // Calculate checksum for line 2
    let checksum2 = 0;
    for (let i = 0; i < line2.length; i++) {
        const char = line2[i];
        if (char && char >= '0' && char <= '9') {
            checksum2 += parseInt(char, 10);
        }
        else if (char === '-') {
            checksum2 += 1;
        }
    }
    line2 += (checksum2 % 10).toString();
    // Combine lines
    const lines = [];
    if (includeName && tle.satelliteName) {
        lines.push(tle.satelliteName);
    }
    lines.push(line1);
    lines.push(line2);
    return lines.join('\n');
}
// ============================================================================
// UNIVERSAL FORMAT FUNCTION
// ============================================================================
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
function formatTLE(tle, options = {}) {
    const { format = 'json' } = options;
    switch (format) {
        case 'json':
            return formatAsJSON(tle, options);
        case 'csv':
            return formatAsCSV(tle, options);
        case 'xml':
            return formatAsXML(tle, options);
        case 'yaml':
            return formatAsYAML(tle, options);
        case 'human':
            if (Array.isArray(tle)) {
                return tle.map(t => formatAsHuman(t, options)).join('\n\n');
            }
            return formatAsHuman(tle, options);
        case 'tle':
            if (Array.isArray(tle)) {
                return tle.map(t => reconstructTLE(t, { includeName: true })).join('\n\n');
            }
            return reconstructTLE(tle, { includeName: true });
        default:
            throw new Error(`Unsupported output format: ${format}`);
    }
}

/**
 * Rate Limiter for API Compliance
 * Implements token bucket algorithm with per-source rate limits
 */
/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
    constructor(config) {
        this.config = config;
        this.queue = [];
        this.processing = false;
        this.tokens = config.maxRequests;
        this.lastRefill = Date.now();
    }
    /**
     * Refill tokens based on elapsed time
     */
    refillTokens() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = (elapsed / this.config.intervalMs) * this.config.maxRequests;
        if (tokensToAdd >= 1) {
            this.tokens = Math.min(this.config.maxRequests, this.tokens + Math.floor(tokensToAdd));
            this.lastRefill = now;
        }
    }
    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            this.refillTokens();
            if (this.tokens >= 1) {
                const item = this.queue.shift();
                if (item) {
                    this.tokens -= 1;
                    item.resolve();
                }
            }
            else {
                // Wait until next refill
                const waitTime = this.config.intervalMs - (Date.now() - this.lastRefill);
                if (waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        this.processing = false;
    }
    /**
     * Acquire a token to make a request
     * Returns a promise that resolves when a token is available
     */
    async acquire() {
        this.refillTokens();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return Promise.resolve();
        }
        // Check queue size limit
        if (this.config.maxQueueSize && this.queue.length >= this.config.maxQueueSize) {
            throw new Error('Rate limiter queue is full');
        }
        // Queue the request
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                timestamp: Date.now()
            });
            this.processQueue();
        });
    }
    /**
     * Execute a function with rate limiting
     */
    async execute(fn) {
        await this.acquire();
        return fn();
    }
    /**
     * Get current rate limiter status
     */
    getStatus() {
        this.refillTokens();
        return {
            tokens: this.tokens,
            queueLength: this.queue.length,
            maxRequests: this.config.maxRequests,
            intervalMs: this.config.intervalMs
        };
    }
    /**
     * Clear the queue
     */
    clearQueue() {
        for (const item of this.queue) {
            item.reject(new Error('Rate limiter queue cleared'));
        }
        this.queue = [];
    }
    /**
     * Reset the rate limiter
     */
    reset() {
        this.tokens = this.config.maxRequests;
        this.lastRefill = Date.now();
        this.clearQueue();
    }
}
/**
 * Multi-source rate limiter manager
 */
class RateLimiterManager {
    constructor() {
        this.limiters = new Map();
    }
    /**
     * Register a rate limiter for a source
     */
    register(source, config) {
        this.limiters.set(source, new RateLimiter(config));
    }
    /**
     * Get rate limiter for a source
     */
    get(source) {
        return this.limiters.get(source);
    }
    /**
     * Acquire a token for a source
     */
    async acquire(source) {
        const limiter = this.limiters.get(source);
        if (!limiter) {
            throw new Error(`No rate limiter registered for source: ${source}`);
        }
        return limiter.acquire();
    }
    /**
     * Execute a function with rate limiting for a source
     */
    async execute(source, fn) {
        const limiter = this.limiters.get(source);
        if (!limiter) {
            throw new Error(`No rate limiter registered for source: ${source}`);
        }
        return limiter.execute(fn);
    }
    /**
     * Get status for all rate limiters
     */
    getAllStatus() {
        const status = new Map();
        for (const [source, limiter] of this.limiters) {
            status.set(source, limiter.getStatus());
        }
        return status;
    }
    /**
     * Reset all rate limiters
     */
    resetAll() {
        for (const limiter of this.limiters.values()) {
            limiter.reset();
        }
    }
}

/**
 * Caching Layer with TTL Support
 * Provides LRU cache with time-to-live and optional persistence
 */
/**
 * LRU Cache with TTL support
 */
class TTLCache {
    constructor(config = {}) {
        this.cache = new Map();
        this.accessOrder = [];
        this.persistTimer = null;
        this.maxSize = config.maxSize || 100;
        this.defaultTTL = config.defaultTTL || 3600000; // 1 hour default
        this.persistent = config.persistent || false;
        this.cacheDir = config.cacheDir || path.join(os.homedir(), '.tle-parser', 'cache');
        this.cacheFile = config.cacheFile || 'tle-cache.json';
        if (this.persistent) {
            this.loadFromDisk().catch(() => {
                // Ignore errors on initial load
            });
            // Auto-save every 5 minutes
            this.persistTimer = setInterval(() => {
                this.saveToDisk().catch(() => {
                    // Ignore persistence errors
                });
            }, 300000);
        }
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            return undefined;
        }
        // Update access order (LRU)
        this.updateAccessOrder(key);
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        const entry = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        };
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder[0];
            if (oldestKey) {
                this.delete(oldestKey);
            }
        }
        this.cache.set(key, entry);
        this.updateAccessOrder(key);
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Delete entry from cache
     */
    delete(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        return this.cache.delete(key);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get cache size
     */
    size() {
        // Clean expired entries first
        this.cleanExpired();
        return this.cache.size;
    }
    /**
     * Clean expired entries
     */
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Get all keys
     */
    keys() {
        this.cleanExpired();
        return Array.from(this.cache.keys());
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const size = this.size();
        const oldest = this.accessOrder[0] || null;
        const newest = this.accessOrder[this.accessOrder.length - 1] || null;
        return {
            size,
            maxSize: this.maxSize,
            hitRate: 0, // Would need hit/miss tracking
            oldestEntry: oldest,
            newestEntry: newest
        };
    }
    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        this.accessOrder.push(key);
    }
    /**
     * Save cache to disk
     */
    async saveToDisk() {
        if (!this.persistent)
            return;
        try {
            // Ensure cache directory exists
            if (!fs.existsSync(this.cacheDir)) {
                await promises.mkdir(this.cacheDir, { recursive: true });
            }
            const data = {
                entries: Array.from(this.cache.entries()),
                accessOrder: this.accessOrder,
                timestamp: Date.now()
            };
            const cachePath = path.join(this.cacheDir, this.cacheFile);
            await promises.writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
        }
        catch (error) {
            // Ignore persistence errors
            console.error('Failed to save cache to disk:', error);
        }
    }
    /**
     * Load cache from disk
     */
    async loadFromDisk() {
        if (!this.persistent)
            return;
        try {
            const cachePath = path.join(this.cacheDir, this.cacheFile);
            if (!fs.existsSync(cachePath)) {
                return;
            }
            const content = await promises.readFile(cachePath, 'utf8');
            const data = JSON.parse(content);
            // Restore cache entries
            this.cache.clear();
            for (const [key, entry] of data.entries) {
                this.cache.set(key, entry);
            }
            // Restore access order
            this.accessOrder = data.accessOrder || [];
            // Clean expired entries
            this.cleanExpired();
        }
        catch (error) {
            // Ignore load errors
            console.error('Failed to load cache from disk:', error);
        }
    }
    /**
     * Destroy cache and cleanup
     */
    destroy() {
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
            this.persistTimer = null;
        }
        if (this.persistent) {
            this.saveToDisk().catch(() => {
                // Ignore persistence errors
            });
        }
        this.clear();
    }
}
/**
 * Global cache instance for TLE data
 */
const tleCache = new TTLCache({
    maxSize: 1000,
    defaultTTL: 3600000, // 1 hour
    persistent: true,
    cacheFile: 'tle-data.json'
});
/**
 * Cache key generator for TLE sources
 */
function generateCacheKey(source, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return sortedParams ? `${source}:${sortedParams}` : source;
}

/**
 * TLE Data Sources Module
 * Implements fetchers for CelesTrak, Space-Track.org, and other TLE data sources
 * with authentication, caching, rate limiting, and failover support
 */
// ============================================================================
// CELESTRAK DATA SOURCE
// ============================================================================
/**
 * CelesTrak TLE data source
 * Public API, no authentication required
 * Documentation: https://celestrak.org/NORAD/documentation/
 */
class CelesTrakSource {
    constructor(config = {}) {
        this.baseUrl = 'https://celestrak.org/NORAD/elements/gp.php';
        this.config = {
            type: 'celestrak',
            baseUrl: config.baseUrl || this.baseUrl,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 20,
                intervalMs: 60000 // 20 requests per minute
            },
            ...config
        };
        this.rateLimiter = new RateLimiter(this.config.rateLimit);
        this.cache = new TTLCache({
            maxSize: 100,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'celestrak-cache.json'
        });
    }
    /**
     * Fetch TLE data from CelesTrak
     */
    async fetch(options = {}) {
        const cacheKey = this.generateCacheKey(options);
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = parseBatch(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'celestrak',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Build URL with query parameters
        const url = this.buildUrl(options);
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(url, {
                    headers: this.config.headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`CelesTrak fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = parseBatch(content, options.parseOptions || {});
        return {
            data,
            source: 'celestrak',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Build URL with query parameters
     */
    buildUrl(options) {
        const params = new URLSearchParams();
        if (options.catalogNumber) {
            const numbers = Array.isArray(options.catalogNumber)
                ? options.catalogNumber
                : [options.catalogNumber];
            params.append('CATNR', numbers.join(','));
            params.append('FORMAT', 'TLE');
        }
        else if (options.group) {
            params.append('GROUP', options.group);
            params.append('FORMAT', 'TLE');
        }
        else if (options.namePattern) {
            params.append('NAME', options.namePattern);
            params.append('FORMAT', 'TLE');
        }
        else if (options.intlDesignator) {
            params.append('INTDES', options.intlDesignator);
            params.append('FORMAT', 'TLE');
        }
        else {
            // Default to active satellites
            params.append('GROUP', 'active');
            params.append('FORMAT', 'TLE');
        }
        // Add custom query parameters
        if (options.queryParams) {
            for (const [key, value] of Object.entries(options.queryParams)) {
                params.append(key, value);
            }
        }
        return `${this.config.baseUrl}?${params.toString()}`;
    }
    /**
     * Generate cache key
     */
    generateCacheKey(options) {
        return generateCacheKey('celestrak', {
            catalog: options.catalogNumber,
            group: options.group,
            name: options.namePattern,
            intl: options.intlDesignator
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
// ============================================================================
// SPACE-TRACK.ORG DATA SOURCE
// ============================================================================
/**
 * Space-Track.org TLE data source
 * Requires authentication
 * Documentation: https://www.space-track.org/documentation
 */
class SpaceTrackSource {
    constructor(config = {}) {
        this.baseUrl = 'https://www.space-track.org';
        this.authUrl = 'https://www.space-track.org/ajaxauth/login';
        this.queryUrl = 'https://www.space-track.org/basicspacedata/query';
        this.sessionCookie = null;
        this.lastAuth = 0;
        this.authTTL = 7200000; // 2 hours
        if (!config.credentials?.username || !config.credentials?.password) {
            throw new Error('Space-Track.org requires username and password credentials');
        }
        this.config = {
            type: 'spacetrack',
            baseUrl: config.baseUrl || this.baseUrl,
            credentials: config.credentials,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 1800000, // 30 minutes
            timeout: config.timeout || 60000,
            rateLimit: config.rateLimit || {
                maxRequests: 20,
                intervalMs: 60000 // 20 requests per minute
            },
            ...config
        };
        this.rateLimiter = new RateLimiter(this.config.rateLimit);
        this.cache = new TTLCache({
            maxSize: 100,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'spacetrack-cache.json'
        });
    }
    /**
     * Authenticate with Space-Track.org
     */
    async authenticate() {
        // Check if we have a valid session
        if (this.sessionCookie &&
            Date.now() - this.lastAuth < this.authTTL) {
            return;
        }
        const formData = new URLSearchParams();
        formData.append('identity', this.config.credentials.username);
        formData.append('password', this.config.credentials.password);
        const response = await fetch(this.authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        if (!response.ok) {
            throw new Error(`Space-Track authentication failed: ${response.status} ${response.statusText}`);
        }
        // Extract session cookie
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
            const match = cookies.match(/chocolatechip=([^;]+)/);
            if (match && match[1]) {
                this.sessionCookie = match[1];
                this.lastAuth = Date.now();
            }
        }
        if (!this.sessionCookie) {
            throw new Error('Failed to obtain Space-Track session cookie');
        }
    }
    /**
     * Fetch TLE data from Space-Track.org
     */
    async fetch(options = {}) {
        const cacheKey = this.generateCacheKey(options);
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = parseBatch(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'spacetrack',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Authenticate first
        await this.authenticate();
        // Build query URL
        const url = this.buildUrl(options);
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(url, {
                    headers: {
                        Cookie: `chocolatechip=${this.sessionCookie}`,
                        ...this.config.headers
                    },
                    signal: controller.signal
                });
                if (!response.ok) {
                    // Try re-authenticating once
                    if (response.status === 401) {
                        this.sessionCookie = null;
                        await this.authenticate();
                        const retryResponse = await fetch(url, {
                            headers: {
                                Cookie: `chocolatechip=${this.sessionCookie}`,
                                ...this.config.headers
                            },
                            signal: controller.signal
                        });
                        if (!retryResponse.ok) {
                            throw new Error(`Space-Track fetch failed: ${retryResponse.status} ${retryResponse.statusText}`);
                        }
                        return await retryResponse.text();
                    }
                    throw new Error(`Space-Track fetch failed: ${response.status} ${response.statusText}`);
                }
                const text = await response.text();
                // Space-Track returns JSON, convert to TLE format
                try {
                    const json = JSON.parse(text);
                    return this.jsonToTLE(json);
                }
                catch {
                    // If not JSON, assume it's already TLE format
                    return text;
                }
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = parseBatch(content, options.parseOptions || {});
        return {
            data,
            source: 'spacetrack',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Build query URL
     */
    buildUrl(options) {
        let query = '/class/gp/';
        if (options.catalogNumber) {
            const numbers = Array.isArray(options.catalogNumber)
                ? options.catalogNumber
                : [options.catalogNumber];
            query += `NORAD_CAT_ID/${numbers.join(',')}/`;
        }
        if (options.intlDesignator) {
            query += `INTLDES/${options.intlDesignator}/`;
        }
        // Order by epoch descending and limit to latest
        query += 'orderby/EPOCH%20desc/limit/1000/format/tle';
        return `${this.queryUrl}${query}`;
    }
    /**
     * Convert Space-Track JSON to TLE format
     */
    jsonToTLE(json) {
        if (!Array.isArray(json))
            return '';
        return json
            .map(item => {
            const lines = [];
            // Add name if available
            if (item.OBJECT_NAME) {
                lines.push(item.OBJECT_NAME);
            }
            // Add TLE lines
            if (item.TLE_LINE1)
                lines.push(item.TLE_LINE1);
            if (item.TLE_LINE2)
                lines.push(item.TLE_LINE2);
            return lines.join('\n');
        })
            .join('\n');
    }
    /**
     * Generate cache key
     */
    generateCacheKey(options) {
        return generateCacheKey('spacetrack', {
            catalog: options.catalogNumber,
            intl: options.intlDesignator
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Logout and clear session
     */
    logout() {
        this.sessionCookie = null;
        this.lastAuth = 0;
    }
}
// ============================================================================
// AMSAT DATA SOURCE
// ============================================================================
/**
 * AMSAT amateur radio satellite data source
 * Public API, no authentication required
 */
class AMSATSource {
    constructor(config = {}) {
        this.baseUrl = 'https://www.amsat.org/tle/current/nasabare.txt';
        this.config = {
            type: 'amsat',
            baseUrl: config.baseUrl || this.baseUrl,
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 10,
                intervalMs: 60000 // 10 requests per minute
            },
            ...config
        };
        this.rateLimiter = new RateLimiter(this.config.rateLimit);
        this.cache = new TTLCache({
            maxSize: 10,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'amsat-cache.json'
        });
    }
    /**
     * Fetch TLE data from AMSAT
     */
    async fetch(options = {}) {
        const cacheKey = 'amsat:all';
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = parseBatch(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'amsat',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const response = await fetch(this.config.baseUrl, {
                    headers: this.config.headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`AMSAT fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = parseBatch(content, options.parseOptions || {});
        return {
            data,
            source: 'amsat',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
// ============================================================================
// CUSTOM DATA SOURCE
// ============================================================================
/**
 * Custom TLE data source
 * For user-defined URLs
 */
class CustomSource {
    constructor(config) {
        if (!config.baseUrl) {
            throw new Error('Custom source requires a base URL');
        }
        this.config = {
            ...config,
            type: 'custom',
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000,
            timeout: config.timeout || 30000,
            rateLimit: config.rateLimit || {
                maxRequests: 10,
                intervalMs: 60000
            }
        };
        this.rateLimiter = new RateLimiter(this.config.rateLimit);
        this.cache = new TTLCache({
            maxSize: 50,
            defaultTTL: this.config.cacheTTL,
            persistent: true,
            cacheFile: 'custom-cache.json'
        });
    }
    /**
     * Fetch TLE data from custom source
     */
    async fetch(options = {}) {
        const url = options.queryParams?.url || this.config.baseUrl;
        const cacheKey = generateCacheKey('custom', { url });
        const startTime = Date.now();
        // Check cache first
        if (this.config.enableCache && !options.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                const data = parseBatch(cached, options.parseOptions || {});
                return {
                    data,
                    source: 'custom',
                    timestamp: new Date(),
                    cached: true,
                    count: data.length,
                    age: Date.now() - startTime
                };
            }
        }
        // Fetch with rate limiting
        const content = await this.rateLimiter.execute(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            try {
                const headers = {
                    ...this.config.headers
                };
                if (this.config.credentials?.apiKey) {
                    headers['Authorization'] = `Bearer ${this.config.credentials.apiKey}`;
                }
                const response = await fetch(url, {
                    headers,
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`Custom source fetch failed: ${response.status} ${response.statusText}`);
                }
                return await response.text();
            }
            finally {
                clearTimeout(timeoutId);
            }
        });
        // Cache the result
        if (this.config.enableCache) {
            this.cache.set(cacheKey, content, this.config.cacheTTL);
        }
        // Parse the TLE data
        const data = parseBatch(content, options.parseOptions || {});
        return {
            data,
            source: 'custom',
            timestamp: new Date(),
            cached: false,
            count: data.length,
            age: Date.now() - startTime
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}
// ============================================================================
// DATA SOURCE MANAGER WITH FAILOVER
// ============================================================================
/**
 * Data source manager with failover support
 */
class DataSourceManager {
    constructor() {
        this.sources = new Map();
        this.primarySource = null;
        this.failoverOrder = [];
    }
    /**
     * Register a data source
     */
    register(name, source, options = {}) {
        this.sources.set(name, source);
        if (options.primary) {
            this.primarySource = name;
        }
        if (options.failover !== false) {
            this.failoverOrder.push(name);
        }
    }
    /**
     * Fetch TLE data with failover
     */
    async fetch(sourceName, options = {}) {
        // Determine which source to use
        const targetSource = sourceName || this.primarySource;
        if (!targetSource) {
            throw new Error('No data source specified and no primary source configured');
        }
        const sourceOrder = [targetSource, ...this.failoverOrder.filter(s => s !== targetSource)];
        let lastError = null;
        // Try each source in order
        for (const name of sourceOrder) {
            const source = this.sources.get(name);
            if (!source)
                continue;
            try {
                return await source.fetch(options);
            }
            catch (error) {
                lastError = error;
                console.error(`Failed to fetch from ${name}:`, error);
                // Continue to next source
            }
        }
        throw new Error(`All data sources failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * Get a specific source
     */
    getSource(name) {
        return this.sources.get(name);
    }
    /**
     * List all registered sources
     */
    listSources() {
        return Array.from(this.sources.keys());
    }
    /**
     * Clear all caches
     */
    clearAllCaches() {
        for (const source of this.sources.values()) {
            source.clearCache();
        }
    }
}
/**
 * Check if TLE data is fresh
 */
function validateFreshness(tle, maxAgeMs = 259200000 // 3 days default
) {
    // Parse epoch from TLE
    const epochYear = parseInt(tle.epochYear, 10);
    const epochDay = parseFloat(tle.epoch);
    // Convert two-digit year to full year
    const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
    // Calculate epoch date
    const epochDate = new Date(fullYear, 0, 1);
    epochDate.setDate(epochDay);
    const age = Date.now() - epochDate.getTime();
    const isFresh = age <= maxAgeMs;
    const ageInDays = Math.floor(age / 86400000);
    const message = isFresh
        ? `TLE is fresh (${ageInDays} days old)`
        : `TLE is stale (${ageInDays} days old)`;
    return {
        isFresh,
        age,
        epochDate,
        message
    };
}
/**
 * Filter TLEs by freshness
 */
function filterByFreshness(tles, maxAgeMs = 259200000) {
    return tles.filter(tle => {
        const validation = validateFreshness(tle, maxAgeMs);
        return validation.isFresh;
    });
}

/**
 * Constellation Definitions and Filters
 * Provides pre-defined satellite constellation groups and filtering
 */
/**
 * Pre-defined constellations
 */
const CONSTELLATIONS = {
    // Starlink
    starlink: {
        name: 'Starlink',
        description: 'SpaceX Starlink satellite constellation',
        namePatterns: [
            /^STARLINK-/i,
            /^STARLINK /i
        ],
        intlDesignatorPatterns: [
            /^\d{2}-(0[0-9]{2}|1[0-9]{2})[A-Z]{1,3}$/
        ]
    },
    // OneWeb
    oneweb: {
        name: 'OneWeb',
        description: 'OneWeb satellite constellation',
        namePatterns: [
            /^ONEWEB-/i,
            /^ONEWEB /i
        ]
    },
    // GPS
    gps: {
        name: 'GPS',
        description: 'Global Positioning System satellites',
        namePatterns: [
            /^GPS /i,
            /^NAVSTAR/i,
            /^USA-/i // Many GPS satellites
        ],
        catalogNumbers: [
            [20959, 20959], // GPS BIIA-1
            [22014, 22014], // GPS BIIA-2
            [22877, 22877], // GPS BIIA-3
            [23833, 23833], // GPS BIIA-4
            [24876, 24876], // GPS BIIA-5
            [25933, 25933], // GPS BIIA-6
            [26360, 26360], // GPS BIIA-7
            [26407, 26407], // GPS BIIA-8
            [26605, 26605], // GPS BIIA-9
            [26690, 26690], // GPS BIIA-10
            // GPS IIR
            [28361, 28361], // GPS BIIR-2
            [28474, 28474], // GPS BIIR-3
            [28874, 28874], // GPS BIIR-4
            [29486, 29486], // GPS BIIR-5
            [29601, 29601], // GPS BIIR-6
            [32260, 32260], // GPS BIIR-7
            [32384, 32384], // GPS BIIR-8
            [32711, 32711], // GPS BIIR-9
            [35752, 35752], // GPS BIIR-10
            [36585, 36585], // GPS BIIR-11
            [37753, 37753], // GPS BIIR-12
            [38833, 38833], // GPS BIIR-13
            [39166, 39166], // GPS BIIR-14
            [40105, 40105], // GPS BIIR-15
            [40294, 40294], // GPS BIIR-16
            [40534, 40534], // GPS BIIR-17
            [40730, 40730], // GPS BIIR-18
            [41019, 41019], // GPS BIIR-19
            [41328, 41328], // GPS BIIR-20
            // GPS IIF and III ranges
            [36500, 36600],
            [40000, 41400]
        ]
    },
    // Galileo
    galileo: {
        name: 'Galileo',
        description: 'European GNSS constellation',
        namePatterns: [
            /^GALILEO/i,
            /^GSAT/i
        ],
        catalogNumbers: [
            [37846, 37846], // GSAT0101
            [37847, 37847], // GSAT0102
            [38857, 38857], // GSAT0103
            [38858, 38858], // GSAT0104
            [40128, 40128], // GSAT0201
            [40129, 40129], // GSAT0202
            [40544, 40544], // GSAT0203
            [40545, 40545], // GSAT0204
            [40889, 40889], // GSAT0205
            [40890, 40890], // GSAT0206
            [41174, 41174], // GSAT0207
            [41175, 41175], // GSAT0208
            [41549, 41549], // GSAT0209
            [41550, 41550], // GSAT0210
            [41859, 41859], // GSAT0211
            [41860, 41860], // GSAT0212
            [41861, 41861], // GSAT0213
            [41862, 41862], // GSAT0214
            [43055, 43055], // GSAT0215
            [43056, 43056], // GSAT0216
            [43057, 43057], // GSAT0217
            [43058, 43058], // GSAT0218
            [43564, 43564], // GSAT0219
            [43565, 43565], // GSAT0220
            [43566, 43566], // GSAT0221
            [43567, 43567] // GSAT0222
        ]
    },
    // GLONASS
    glonass: {
        name: 'GLONASS',
        description: 'Russian GNSS constellation',
        namePatterns: [
            /^COSMOS \d+$/i,
            /^GLONASS/i
        ],
        catalogNumbers: [
            // GLONASS-M
            [28915, 28915], // Cosmos 2424
            [32275, 32275], // Cosmos 2425
            [32276, 32276], // Cosmos 2426
            [32393, 32393], // Cosmos 2427
            [32395, 32395], // Cosmos 2428
            [36111, 36111], // Cosmos 2429
            [36112, 36112], // Cosmos 2430
            [36113, 36113], // Cosmos 2431
            [36400, 36400], // Cosmos 2432
            [36401, 36401], // Cosmos 2433
            [36402, 36402], // Cosmos 2434
            [37139, 37139], // Cosmos 2435
            [37140, 37140], // Cosmos 2436
            [37141, 37141], // Cosmos 2437
            [37829, 37829], // Cosmos 2438
            [37869, 37869], // Cosmos 2439
            [37870, 37870], // Cosmos 2440
            [39155, 39155], // Cosmos 2441
            [39620, 39620], // Cosmos 2442
            [39621, 39621], // Cosmos 2443
            [39622, 39622], // Cosmos 2444
            [40001, 40001], // Cosmos 2445
            [40315, 40315], // Cosmos 2446
            [40315, 40315], // Cosmos 2447
            [41330, 41330], // Cosmos 2448
            [41554, 41554], // Cosmos 2449
            [41555, 41555], // Cosmos 2450
            // GLONASS-K
            [36400, 36410],
            [37800, 37900],
            [39100, 39700],
            [40000, 41600]
        ]
    },
    // BeiDou
    beidou: {
        name: 'BeiDou',
        description: 'Chinese GNSS constellation',
        namePatterns: [
            /^BEIDOU/i,
            /^BDS/i,
            /^COMPASS/i
        ],
        catalogNumbers: [
            [36287, 36287], // BeiDou-3 M1
            [36828, 36828], // BeiDou-3 M2
            [37210, 37210], // BeiDou-3 M3
            [37384, 37384], // BeiDou-3 M4
            [37763, 37763], // BeiDou-3 M5
            [37948, 37948], // BeiDou-3 M6
            [38091, 38091], // BeiDou-3 M7
            [38250, 38250], // BeiDou-3 M8
            [38251, 38251], // BeiDou-3 M9
            [38775, 38775], // BeiDou-3 M10
            [40549, 40549], // BeiDou-3 M11
            [40748, 40748], // BeiDou-3 M12
            [40749, 40749], // BeiDou-3 M13
            [40938, 40938], // BeiDou-3 M14
            [41434, 41434], // BeiDou-3 M15
            [41586, 41586], // BeiDou-3 M16
            [43001, 43001], // BeiDou-3 M17
            [43002, 43002], // BeiDou-3 M18
            [43107, 43107], // BeiDou-3 M19
            [43108, 43108], // BeiDou-3 M20
            [43207, 43207], // BeiDou-3 M21
            [43208, 43208], // BeiDou-3 M22
            [43245, 43245], // BeiDou-3 M23
            [43246, 43246], // BeiDou-3 M24
            // BeiDou-3 range
            [36200, 43300]
        ]
    },
    // ISS
    iss: {
        name: 'ISS',
        description: 'International Space Station',
        catalogNumbers: [25544],
        namePatterns: [/^ISS/i]
    },
    // Amateur Radio
    amateur: {
        name: 'Amateur Radio',
        description: 'Amateur radio satellites',
        namePatterns: [
            /^AO-/i, // AMSAT Oscar
            /^SO-/i, // Surrey Oscar
            /^FO-/i, // Fuji Oscar
            /^FUNCUBE/i, // FUNcube
            /^LILACSAT/i, // LilacSat
            /^DIWATA/i, // Diwata
            /^OSCAR/i, // Oscar
            /^AMSAT/i, // AMSAT
            /^CUBESAT/i, // CubeSat
            /^RS-/i, // Radio Sputnik
            /^ZARYA/i // Zarya
        ]
    },
    // Weather satellites
    weather: {
        name: 'Weather',
        description: 'Weather and meteorological satellites',
        namePatterns: [
            /^NOAA /i,
            /^GOES /i,
            /^METEOSAT/i,
            /^METEOR/i,
            /^FENGYUN/i,
            /^FY-/i,
            /^HIMAWARI/i
        ]
    },
    // Iridium
    iridium: {
        name: 'Iridium',
        description: 'Iridium satellite constellation',
        namePatterns: [
            /^IRIDIUM/i
        ],
        catalogNumbers: [
            // Iridium NEXT
            [41917, 41927], // First 10
            [41934, 41944], // Next 10
            [42803, 42813], // Next 10
            [42955, 42965], // Next 10
            [43070, 43080], // Next 10
            [43249, 43259], // Next 10
            [43478, 43488], // Next 10
            [43569, 43579] // Last batch
        ]
    },
    // Planet Labs
    planet: {
        name: 'Planet Labs',
        description: 'Planet Labs Earth imaging satellites',
        namePatterns: [
            /^DOVE/i,
            /^FLOCK/i,
            /^PLANET/i,
            /^SKYSAT/i
        ]
    },
    // Spire
    spire: {
        name: 'Spire',
        description: 'Spire Global satellite constellation',
        namePatterns: [
            /^LEMUR/i,
            /^SPIRE/i
        ]
    }
};
/**
 * Get constellation by name
 */
function getConstellation(name) {
    return CONSTELLATIONS[name.toLowerCase()];
}
/**
 * List all available constellations
 */
function listConstellations() {
    return Object.keys(CONSTELLATIONS);
}
/**
 * Create a TLE filter for a constellation
 */
function createConstellationFilter(constellationName) {
    const constellation = getConstellation(constellationName);
    if (!constellation)
        return undefined;
    const filter = {};
    // Add satellite number filter
    if (constellation.catalogNumbers && constellation.catalogNumbers.length > 0) {
        filter.satelliteNumber = (satNum) => {
            const num = parseInt(satNum, 10);
            if (isNaN(num))
                return false;
            return constellation.catalogNumbers.some(range => {
                if (Array.isArray(range)) {
                    return num >= range[0] && num <= range[1];
                }
                return num === range;
            });
        };
    }
    // Add name pattern filter
    if (constellation.namePatterns && constellation.namePatterns.length > 0) {
        const originalNameFilter = filter.satelliteName;
        filter.satelliteName = (name) => {
            const matchesPattern = constellation.namePatterns.some(pattern => pattern.test(name));
            if (originalNameFilter && typeof originalNameFilter === 'function') {
                return matchesPattern && originalNameFilter(name);
            }
            return matchesPattern;
        };
    }
    // Add custom filter
    if (constellation.customFilter) {
        const originalCustomFilter = filter.custom;
        filter.custom = (tle) => {
            const matchesCustom = constellation.customFilter(tle);
            if (originalCustomFilter) {
                return matchesCustom && originalCustomFilter(tle);
            }
            return matchesCustom;
        };
    }
    return filter;
}
/**
 * Check if a TLE matches a constellation
 */
function matchesConstellation(tle, constellationName) {
    const constellation = getConstellation(constellationName);
    if (!constellation)
        return false;
    // Check catalog numbers
    if (constellation.catalogNumbers && constellation.catalogNumbers.length > 0) {
        const satNum = parseInt(tle.satelliteNumber1, 10);
        if (!isNaN(satNum)) {
            const matchesCatalog = constellation.catalogNumbers.some(range => {
                if (Array.isArray(range)) {
                    return satNum >= range[0] && satNum <= range[1];
                }
                return satNum === range;
            });
            if (matchesCatalog)
                return true;
        }
    }
    // Check name patterns
    if (constellation.namePatterns && tle.satelliteName) {
        const matchesName = constellation.namePatterns.some(pattern => pattern.test(tle.satelliteName));
        if (matchesName)
            return true;
    }
    // Check custom filter
    if (constellation.customFilter) {
        return constellation.customFilter(tle);
    }
    return false;
}
/**
 * Filter TLEs by constellation
 */
function filterByConstellation(tles, constellationName) {
    return tles.filter(tle => matchesConstellation(tle, constellationName));
}
/**
 * Group TLEs by constellation
 */
function groupByConstellation(tles) {
    const groups = new Map();
    for (const tle of tles) {
        let matched = false;
        for (const [name] of Object.entries(CONSTELLATIONS)) {
            if (matchesConstellation(tle, name)) {
                if (!groups.has(name)) {
                    groups.set(name, []);
                }
                groups.get(name).push(tle);
                matched = true;
                break; // Each TLE belongs to only one constellation
            }
        }
        if (!matched) {
            if (!groups.has('unknown')) {
                groups.set('unknown', []);
            }
            groups.get('unknown').push(tle);
        }
    }
    return groups;
}

/**
 * Automatic Update Scheduler
 * Provides cron-like scheduling for automatic TLE data updates
 */
/**
 * TLE Update Scheduler
 */
class TLEScheduler {
    constructor(manager, config) {
        this.manager = manager;
        this.config = config;
        this.timer = null;
        this.isRunning = false;
        this.lastUpdate = null;
        this.updateCount = 0;
        this.errorCount = 0;
        this.lastError = null;
        this.retryCount = 0;
        if (config.autoStart) {
            this.start();
        }
    }
    /**
     * Start the scheduler
     */
    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.scheduleNext();
    }
    /**
     * Stop the scheduler
     */
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
    }
    /**
     * Schedule the next update
     */
    scheduleNext() {
        if (!this.isRunning)
            return;
        this.timer = setTimeout(() => {
            this.executeUpdate();
        }, this.config.intervalMs);
    }
    /**
     * Execute an update
     */
    async executeUpdate() {
        try {
            const result = await this.manager.fetch(this.config.source || null, this.config.fetchOptions || {});
            this.lastUpdate = new Date();
            this.updateCount++;
            this.retryCount = 0;
            this.lastError = null;
            if (this.config.onUpdate) {
                this.config.onUpdate(result);
            }
            // Schedule next update
            this.scheduleNext();
        }
        catch (error) {
            this.errorCount++;
            this.lastError = error;
            if (this.config.onError) {
                this.config.onError(this.lastError);
            }
            // Retry logic
            const maxRetries = this.config.maxRetries || 3;
            if (this.retryCount < maxRetries) {
                this.retryCount++;
                const retryDelay = this.config.retryDelayMs || 60000;
                this.timer = setTimeout(() => {
                    this.executeUpdate();
                }, retryDelay);
            }
            else {
                // Max retries reached, schedule next regular update
                this.retryCount = 0;
                this.scheduleNext();
            }
        }
    }
    /**
     * Trigger immediate update
     */
    async updateNow() {
        return this.manager.fetch(this.config.source || null, this.config.fetchOptions || {});
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdate,
            nextUpdate: this.timer
                ? new Date(Date.now() + this.config.intervalMs)
                : null,
            updateCount: this.updateCount,
            errorCount: this.errorCount,
            lastError: this.lastError
        };
    }
    /**
     * Update schedule configuration
     */
    updateConfig(config) {
        Object.assign(this.config, config);
        // Restart if running
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.updateCount = 0;
        this.errorCount = 0;
        this.lastError = null;
        this.retryCount = 0;
    }
}
/**
 * Scheduler manager for multiple schedules
 */
class SchedulerManager {
    constructor() {
        this.schedulers = new Map();
    }
    /**
     * Create and register a scheduler
     */
    create(name, manager, config) {
        const scheduler = new TLEScheduler(manager, config);
        this.schedulers.set(name, scheduler);
        return scheduler;
    }
    /**
     * Get a scheduler by name
     */
    get(name) {
        return this.schedulers.get(name);
    }
    /**
     * Remove a scheduler
     */
    remove(name) {
        const scheduler = this.schedulers.get(name);
        if (scheduler) {
            scheduler.stop();
            return this.schedulers.delete(name);
        }
        return false;
    }
    /**
     * Start all schedulers
     */
    startAll() {
        for (const scheduler of this.schedulers.values()) {
            scheduler.start();
        }
    }
    /**
     * Stop all schedulers
     */
    stopAll() {
        for (const scheduler of this.schedulers.values()) {
            scheduler.stop();
        }
    }
    /**
     * Get status for all schedulers
     */
    getAllStatus() {
        const status = new Map();
        for (const [name, scheduler] of this.schedulers) {
            status.set(name, scheduler.getStatus());
        }
        return status;
    }
    /**
     * List all scheduler names
     */
    list() {
        return Array.from(this.schedulers.keys());
    }
}
/**
 * Common schedule intervals
 */
const SCHEDULE_INTERVALS = {
    /** Every 15 minutes */
    EVERY_15_MINUTES: 15 * 60 * 1000,
    /** Every 30 minutes */
    EVERY_30_MINUTES: 30 * 60 * 1000,
    /** Every hour */
    HOURLY: 60 * 60 * 1000,
    /** Every 2 hours */
    EVERY_2_HOURS: 2 * 60 * 60 * 1000,
    /** Every 6 hours */
    EVERY_6_HOURS: 6 * 60 * 60 * 1000,
    /** Every 12 hours */
    EVERY_12_HOURS: 12 * 60 * 60 * 1000,
    /** Daily */
    DAILY: 24 * 60 * 60 * 1000,
    /** Weekly */
    WEEKLY: 7 * 24 * 60 * 60 * 1000
};
/**
 * Parse human-readable interval string
 */
function parseInterval(interval) {
    const match = interval.match(/^(\d+)\s*(ms|s|m|h|d|w)$/i);
    if (!match || !match[1] || !match[2]) {
        throw new Error(`Invalid interval format: ${interval}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 'ms':
            return value;
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        case 'w':
            return value * 7 * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Unknown interval unit: ${unit}`);
    }
}

/**
 * TLE Parser - Main Module
 * Comprehensive parser for Two-Line Element (TLE) satellite data
 * with full TypeScript support and strict type safety
 */
// Load the TLE configuration from imported JSON
const tleConfig = tleConfigData;
// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================
/**
 * Custom error class for TLE validation errors
 * Thrown when TLE validation fails with detailed error information
 */
class TLEValidationError extends Error {
    /**
     * Create a new TLE validation error
     * @param message - Error message
     * @param errors - Array of validation errors
     * @param warnings - Array of validation warnings
     */
    constructor(message, errors, warnings = []) {
        super(message);
        this.name = 'TLEValidationError';
        this.errors = errors;
        this.warnings = warnings;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Custom error class for TLE format errors
 * Thrown for structural/format issues in TLE data
 */
class TLEFormatError extends Error {
    /**
     * Create a new TLE format error
     * @param message - Error message
     * @param code - Error code from ERROR_CODES
     * @param details - Additional error details
     */
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'TLEFormatError';
        this.code = code;
        this.details = details;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
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
function normalizeLineEndings(input) {
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
function parseTLELines(tleString) {
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
function calculateChecksum(line) {
    let checksum = 0;
    // Process all characters except the last one (which is the checksum itself)
    for (let i = 0; i < line.length - 1; i++) {
        const char = line[i];
        if (char && char >= '0' && char <= '9') {
            checksum += parseInt(char, 10);
        }
        else if (char === '-') {
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
function validateChecksum(line) {
    if (line.length !== 69) {
        return {
            isValid: false,
            expected: null,
            actual: null,
            error: {
                code: exports.ERROR_CODES.INVALID_LINE_LENGTH,
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
                code: exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER,
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
                code: exports.ERROR_CODES.CHECKSUM_MISMATCH,
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
function validateLineStructure(line, expectedLineNumber) {
    const errors = [];
    // Check line length
    if (line.length !== 69) {
        errors.push({
            code: exports.ERROR_CODES.INVALID_LINE_LENGTH,
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
            code: exports.ERROR_CODES.INVALID_LINE_NUMBER,
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
        });
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
function validateSatelliteNumber(line1, line2) {
    const satNum1 = line1.substring(2, 7).trim();
    const satNum2 = line2.substring(2, 7).trim();
    if (satNum1 !== satNum2) {
        return {
            isValid: false,
            error: {
                code: exports.ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
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
                code: exports.ERROR_CODES.INVALID_SATELLITE_NUMBER,
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
function validateClassification(line1) {
    const classification = line1[7];
    const validClassifications = ['U', 'C', 'S'];
    if (!validClassifications.includes(classification || '')) {
        return {
            isValid: false,
            error: {
                code: exports.ERROR_CODES.INVALID_CLASSIFICATION,
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
function validateNumericRange(value, fieldName, min, max) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return {
            isValid: false,
            error: {
                code: exports.ERROR_CODES.INVALID_NUMBER_FORMAT,
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
                code: exports.ERROR_CODES.VALUE_OUT_OF_RANGE,
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
function checkClassificationWarnings(line1) {
    const warnings = [];
    const classification = line1[7];
    if (classification === 'C' || classification === 'S') {
        warnings.push({
            code: exports.ERROR_CODES.CLASSIFIED_DATA_WARNING,
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
function checkEpochWarnings(line1) {
    const warnings = [];
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
            code: exports.ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING,
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
            code: exports.ERROR_CODES.STALE_TLE_WARNING,
            message: `TLE epoch is ${Math.floor(daysSinceEpoch)} days old (epoch: ${epochDate.toISOString().split('T')[0]}). TLE data may be stale.`,
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
function checkOrbitalParameterWarnings(line2) {
    const warnings = [];
    // Eccentricity (stored as decimal without leading "0.")
    const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim());
    if (!isNaN(eccentricity) && eccentricity > 0.25) {
        warnings.push({
            code: exports.ERROR_CODES.HIGH_ECCENTRICITY_WARNING,
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
            code: exports.ERROR_CODES.LOW_MEAN_MOTION_WARNING,
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
            code: exports.ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING,
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
function checkDragAndEphemerisWarnings(line1) {
    const warnings = [];
    // B* drag term (ballistic coefficient)
    const bStar = line1.substring(53, 61).trim();
    // Check for near-zero or exactly zero drag
    if (bStar === '00000-0' || bStar === '00000+0' || bStar === '00000 0') {
        warnings.push({
            code: exports.ERROR_CODES.NEAR_ZERO_DRAG_WARNING,
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
            code: exports.ERROR_CODES.NEGATIVE_DECAY_WARNING,
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
            code: exports.ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING,
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
function validateTLE(tleString, options = {}) {
    // Input validation
    if (typeof tleString !== 'string') {
        throw new TypeError('TLE data must be a string');
    }
    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        throw new TypeError('Options must be an object');
    }
    if (tleString.length === 0) {
        throw new TLEFormatError('TLE string cannot be empty', exports.ERROR_CODES.EMPTY_INPUT, { inputLength: 0 });
    }
    const { strictChecksums = true, validateRanges = true, mode = 'strict' } = options;
    // Validate mode parameter
    if (mode !== 'strict' && mode !== 'permissive') {
        throw new TypeError('Mode must be either "strict" or "permissive"');
    }
    const errors = [];
    const warnings = [];
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
            code: exports.ERROR_CODES.INVALID_LINE_COUNT,
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
            code: exports.ERROR_CODES.INVALID_LINE_COUNT,
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
                code: exports.ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
                message: 'Line 0 starts with "1" or "2", might be incorrectly formatted',
                field: 'satellite_name',
                value: firstLine,
                severity: 'warning'
            });
        }
        if (firstLine && firstLine.length > 24) {
            warnings.push({
                code: exports.ERROR_CODES.SATELLITE_NAME_TOO_LONG,
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
            code: exports.ERROR_CODES.INVALID_LINE_COUNT,
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
            const criticalErrors = line1Result.errors.filter(e => e.code !== exports.ERROR_CODES.CHECKSUM_MISMATCH &&
                e.code !== exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            const checksumErrors = line1Result.errors.filter(e => e.code === exports.ERROR_CODES.CHECKSUM_MISMATCH ||
                e.code === exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            errors.push(...criticalErrors);
            warnings.push(...(checksumErrors.map(e => ({ ...e, severity: 'warning' }))));
            // Only return early for critical errors in permissive mode
            if (criticalErrors.length > 0) {
                return { isValid: false, errors, warnings };
            }
        }
        else {
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
            const criticalErrors = line2Result.errors.filter(e => e.code !== exports.ERROR_CODES.CHECKSUM_MISMATCH &&
                e.code !== exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            const checksumErrors = line2Result.errors.filter(e => e.code === exports.ERROR_CODES.CHECKSUM_MISMATCH ||
                e.code === exports.ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            errors.push(...criticalErrors);
            warnings.push(...(checksumErrors.map(e => ({ ...e, severity: 'warning' }))));
            // Only return early for critical errors in permissive mode
            if (criticalErrors.length > 0) {
                return { isValid: false, errors, warnings };
            }
        }
        else {
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
        }
        else {
            errors.push(satNumResult.error);
        }
    }
    // Validate classification
    const classResult = validateClassification(line1);
    if (!classResult.isValid && classResult.error) {
        if (mode === 'permissive') {
            // In permissive mode, invalid classification is a warning
            warnings.push({ ...classResult.error, severity: 'warning' });
        }
        else {
            errors.push(classResult.error);
        }
    }
    // Validate ranges if requested
    if (validateRanges && line1.length === 69 && line2.length === 69) {
        const rangeValidations = [
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
            if (optional && value.length === 0)
                continue;
            const result = validateNumericRange(value, name, min, max);
            if (!result.isValid && result.error) {
                if (warningOnly || mode === 'permissive') {
                    warnings.push({ ...result.error, severity: 'warning' });
                }
                else {
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
function parseTLE(tleString, options = {}) {
    // Input validation
    if (typeof tleString !== 'string') {
        throw new TypeError('TLE data must be a string');
    }
    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        throw new TypeError('Options must be an object');
    }
    const { validate = true, strictChecksums = true, validateRanges = true, includeWarnings = true, includeComments = true, mode = 'strict' } = options;
    // Validate if requested
    let validationWarnings = [];
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
    let satelliteName = null;
    if (tleLines.length === 3) {
        satelliteName = tleLines[0] || null;
        line1Index = 1;
        line2Index = 2;
    }
    const line1 = tleLines[line1Index];
    const line2 = tleLines[line2Index];
    if (!line1 || !line2) {
        throw new TLEFormatError('Missing required TLE lines', exports.ERROR_CODES.INVALID_LINE_COUNT);
    }
    const tleObject = {
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
        tleObject[key] = line.substring(start, end).trim();
    }
    // Include warnings in the result if requested and available
    if (includeWarnings && validationWarnings.length > 0) {
        tleObject.warnings = validationWarnings;
    }
    // Include comments in the result if requested and available
    if (includeComments && comments.length > 0) {
        tleObject.comments = comments;
    }
    return tleObject;
}
// ============================================================================
// DEFAULT EXPORT
// ============================================================================
var index = {
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
    ERROR_CODES: exports.ERROR_CODES
};

exports.AMSATSource = AMSATSource;
exports.CONSTELLATIONS = CONSTELLATIONS;
exports.CelesTrakSource = CelesTrakSource;
exports.Colors = Colors;
exports.CustomSource = CustomSource;
exports.DEFAULT_VALIDATION_RULES = DEFAULT_VALIDATION_RULES;
exports.DESIGNATOR_CONSTRAINTS = DESIGNATOR_CONSTRAINTS;
exports.DataSourceManager = DataSourceManager;
exports.EPOCH_CONSTRAINTS = EPOCH_CONSTRAINTS;
exports.IncrementalParser = IncrementalParser;
exports.MiddlewareParser = MiddlewareParser;
exports.ORBITAL_PARAMETER_RANGES = ORBITAL_PARAMETER_RANGES;
exports.QUALITY_SCORE_WEIGHTS = QUALITY_SCORE_WEIGHTS;
exports.RateLimiter = RateLimiter;
exports.RateLimiterManager = RateLimiterManager;
exports.SATELLITE_NUMBER_RANGES = SATELLITE_NUMBER_RANGES;
exports.SCHEDULE_INTERVALS = SCHEDULE_INTERVALS;
exports.SchedulerManager = SchedulerManager;
exports.SpaceTrackSource = SpaceTrackSource;
exports.TLECache = TLECache;
exports.TLEFormatError = TLEFormatError;
exports.TLEParserStream = TLEParserStream;
exports.TLEScheduler = TLEScheduler;
exports.TLEStateMachineParser = TLEStateMachineParser;
exports.TLEValidationError = TLEValidationError;
exports.TTLCache = TTLCache;
exports.ValidationRuleManager = ValidationRuleManager;
exports.applyFilter = applyFilter;
exports.calculateChecksum = calculateChecksum;
exports.calculateEpochAge = calculateEpochAge;
exports.calculateQualityScore = calculateQualityScore;
exports.checkClassificationWarnings = checkClassificationWarnings;
exports.checkDragAndEphemerisWarnings = checkDragAndEphemerisWarnings;
exports.checkEpochWarnings = checkEpochWarnings;
exports.checkOrbitalParameterWarnings = checkOrbitalParameterWarnings;
exports.convertEpochToDate = convertEpochToDate;
exports.createCachedParser = createCachedParser;
exports.createConstellationFilter = createConstellationFilter;
exports.createIncrementalParser = createIncrementalParser;
exports.createMiddlewareParser = createMiddlewareParser;
exports.createTLEParserStream = createTLEParserStream;
exports.createValidationRule = createValidationRule;
exports.default = index;
exports.detectAnomalies = detectAnomalies;
exports.filterByConstellation = filterByConstellation;
exports.filterByFreshness = filterByFreshness;
exports.formatAsCSV = formatAsCSV;
exports.formatAsHuman = formatAsHuman;
exports.formatAsJSON = formatAsJSON;
exports.formatAsXML = formatAsXML;
exports.formatAsYAML = formatAsYAML;
exports.formatTLE = formatTLE;
exports.generateCacheKey = generateCacheKey;
exports.generateValidationReport = generateValidationReport;
exports.getConstellation = getConstellation;
exports.getErrorDescription = getErrorDescription;
exports.getProfileOptions = getProfileOptions;
exports.getProviderOptions = getProviderOptions;
exports.groupByConstellation = groupByConstellation;
exports.isCriticalError = isCriticalError;
exports.isParseFailure = isParseFailure;
exports.isParseSuccess = isParseSuccess;
exports.isParsedTLE = isParsedTLE;
exports.isTLEError = isTLEError;
exports.isTLEWarning = isTLEWarning;
exports.isValidClassification = isValidClassification;
exports.isValidErrorCode = isValidErrorCode;
exports.isValidationFailure = isValidationFailure;
exports.isValidationSuccess = isValidationSuccess;
exports.isWarningCode = isWarningCode;
exports.listConstellations = listConstellations;
exports.matchesConstellation = matchesConstellation;
exports.normalizeAssumedDecimalNotation = normalizeAssumedDecimalNotation;
exports.normalizeLineEndings = normalizeLineEndings;
exports.normalizeScientificNotation = normalizeScientificNotation;
exports.parseBatch = parseBatch;
exports.parseBatchAsync = parseBatchAsync;
exports.parseFromCompressed = parseFromCompressed;
exports.parseFromFile = parseFromFile;
exports.parseFromStream = parseFromStream;
exports.parseFromURL = parseFromURL;
exports.parseInterval = parseInterval;
exports.parseParallel = parseParallel;
exports.parseTLE = parseTLE;
exports.parseTLEAsync = parseTLEAsync;
exports.parseTLELines = parseTLELines;
exports.parseWithProfile = parseWithProfile;
exports.parseWithProvider = parseWithProvider;
exports.parseWithStateMachine = parseWithStateMachine;
exports.reconstructTLE = reconstructTLE;
exports.sanitizeAllFields = sanitizeAllFields;
exports.sanitizeField = sanitizeField;
exports.splitTLEs = splitTLEs;
exports.tleCache = tleCache;
exports.validateAllOrbitalParameters = validateAllOrbitalParameters;
exports.validateChecksum = validateChecksum;
exports.validateClassification = validateClassification;
exports.validateEpochAge = validateEpochAge;
exports.validateEpochDate = validateEpochDate;
exports.validateFreshness = validateFreshness;
exports.validateInternationalDesignator = validateInternationalDesignator;
exports.validateLineStructure = validateLineStructure;
exports.validateNumericRange = validateNumericRange;
exports.validateOrbitalParameter = validateOrbitalParameter;
exports.validateSatelliteNumber = validateSatelliteNumber;
exports.validateTLE = validateTLE;
exports.validateTLEAsync = validateTLEAsync;
//# sourceMappingURL=index.cjs.map
