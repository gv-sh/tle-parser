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
function calculateChecksum$2(line) {
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
    const calculatedChecksum = calculateChecksum$2(line);
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
function detectAnomalies$1(tle) {
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
            const anomalies = detectAnomalies$1(tle);
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
        anomalies.push(...detectAnomalies$1(tle));
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
function reconstructTLE$1(tle, options = {}) {
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
                return tle.map(t => reconstructTLE$1(t, { includeName: true })).join('\n\n');
            }
            return reconstructTLE$1(tle, { includeName: true });
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

var pi = Math.PI;
var twoPi = pi * 2;
var deg2rad = pi / 180.0;
var rad2deg = 180 / pi;
var minutesPerDay = 1440.0;
var mu = 398600.8; // in km3 / s2
var earthRadius = 6378.135; // in km
var xke = 60.0 / Math.sqrt(earthRadius * earthRadius * earthRadius / mu);
var vkmpersec = earthRadius * xke / 60.0;
var tumin = 1.0 / xke;
var j2 = 0.001082616;
var j3 = -253881e-11;
var j4 = -165597e-11;
var j3oj2 = j3 / j2;
var x2o3 = 2.0 / 3.0;
var xpdotp = 1440.0 / (2.0 * pi); // 229.1831180523293;

/* -----------------------------------------------------------------------------
 *
 *                           procedure days2mdhms
 *
 *  this procedure converts the day of the year, days, to the equivalent month
 *    day, hour, minute and second.
 *
 *  algorithm     : set up array for the number of days per month
 *                  find leap year - use 1900 because 2000 is a leap year
 *                  loop through a temp value while the value is < the days
 *                  perform int conversions to the correct day and month
 *                  convert remainder into h m s using type conversions
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    year        - year                           1900 .. 2100
 *    days        - julian day of the year         0.0  .. 366.0
 *
 *  outputs       :
 *    mon         - month                          1 .. 12
 *    day         - day                            1 .. 28,29,30,31
 *    hr          - hour                           0 .. 23
 *    min         - minute                         0 .. 59
 *    sec         - second                         0.0 .. 59.999
 *
 *  locals        :
 *    dayofyr     - day of year
 *    temp        - temporary extended values
 *    inttemp     - temporary int value
 *    i           - index
 *    lmonth[12]  - int array containing the number of days per month
 *
 *  coupling      :
 *    none.
 * --------------------------------------------------------------------------- */
function days2mdhms(year, days) {
  var lmonth = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var dayofyr = Math.floor(days);
  //  ----------------- find month and day of month ----------------
  var i = 1;
  var inttemp = 0;
  // i starts from 1 so no null check is needed
  while (dayofyr > inttemp + lmonth[i - 1] && i < 12) {
    inttemp += lmonth[i - 1];
    i += 1;
  }
  var mon = i;
  var day = dayofyr - inttemp;
  //  ----------------- find hours minutes and seconds -------------
  var temp = (days - dayofyr) * 24.0;
  var hr = Math.floor(temp);
  temp = (temp - hr) * 60.0;
  var minute = Math.floor(temp);
  var sec = (temp - minute) * 60.0;
  return {
    mon: mon,
    day: day,
    hr: hr,
    minute: minute,
    sec: sec
  };
}
/* -----------------------------------------------------------------------------
 *
 *                           procedure jday
 *
 *  this procedure finds the julian date given the year, month, day, and time.
 *    the julian date is defined by each elapsed day since noon, jan 1, 4713 bc.
 *
 *  algorithm     : calculate the answer in one step for efficiency
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    year        - year                           1900 .. 2100
 *    mon         - month                          1 .. 12
 *    day         - day                            1 .. 28,29,30,31
 *    hr          - universal time hour            0 .. 23
 *    min         - universal time min             0 .. 59
 *    sec         - universal time sec             0.0 .. 59.999
 *
 *  outputs       :
 *    jd          - julian date                    days from 4713 bc
 *
 *  locals        :
 *    none.
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    vallado       2007, 189, alg 14, ex 3-14
 *
 * --------------------------------------------------------------------------- */
function jdayInternal(year, mon, day, hr, minute, sec) {
  var msec = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  return 367.0 * year - Math.floor(7 * (year + Math.floor((mon + 9) / 12.0)) * 0.25) + Math.floor(275 * mon / 9.0) + day + 1721013.5 + ((msec / 60000 + sec / 60.0 + minute) / 60.0 + hr) / 24.0 // ut in days
  // # - 0.5*sgn(100.0*year + mon - 190002.5) + 0.5;
  ;
}
function jday(yearOrDate, mon, day, hr, minute, sec) {
  var msec = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  if (yearOrDate instanceof Date) {
    var date = yearOrDate;
    return jdayInternal(date.getUTCFullYear(), date.getUTCMonth() + 1,
    // Note, this function requires months in range 1-12.
    date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
  }
  return jdayInternal(yearOrDate, mon, day, hr, minute, sec, msec);
}

/* -----------------------------------------------------------------------------
 *
 *                           procedure dpper
 *
 *  this procedure provides deep space long period periodic contributions
 *    to the mean elements.  by design, these periodics are zero at epoch.
 *    this used to be dscom which included initialization, but it's really a
 *    recurring function.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    e3          -
 *    ee2         -
 *    peo         -
 *    pgho        -
 *    pho         -
 *    pinco       -
 *    plo         -
 *    se2 , se3 , sgh2, sgh3, sgh4, sh2, sh3, si2, si3, sl2, sl3, sl4 -
 *    t           -
 *    xh2, xh3, xi2, xi3, xl2, xl3, xl4 -
 *    zmol        -
 *    zmos        -
 *    ep          - eccentricity                           0.0 - 1.0
 *    inclo       - inclination - needed for lyddane modification
 *    nodep       - right ascension of ascending node
 *    argpp       - argument of perigee
 *    mp          - mean anomaly
 *
 *  outputs       :
 *    ep          - eccentricity                           0.0 - 1.0
 *    inclp       - inclination
 *    nodep        - right ascension of ascending node
 *    argpp       - argument of perigee
 *    mp          - mean anomaly
 *
 *  locals        :
 *    alfdp       -
 *    betdp       -
 *    cosip  , sinip  , cosop  , sinop  ,
 *    dalf        -
 *    dbet        -
 *    dls         -
 *    f2, f3      -
 *    pe          -
 *    pgh         -
 *    ph          -
 *    pinc        -
 *    pl          -
 *    sel   , ses   , sghl  , sghs  , shl   , shs   , sil   , sinzf , sis   ,
 *    sll   , sls
 *    xls         -
 *    xnoh        -
 *    zf          -
 *    zm          -
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function dpper(satrec, options) {
  var e3 = satrec.e3,
    ee2 = satrec.ee2,
    peo = satrec.peo,
    pgho = satrec.pgho,
    pho = satrec.pho,
    pinco = satrec.pinco,
    plo = satrec.plo,
    se2 = satrec.se2,
    se3 = satrec.se3,
    sgh2 = satrec.sgh2,
    sgh3 = satrec.sgh3,
    sgh4 = satrec.sgh4,
    sh2 = satrec.sh2,
    sh3 = satrec.sh3,
    si2 = satrec.si2,
    si3 = satrec.si3,
    sl2 = satrec.sl2,
    sl3 = satrec.sl3,
    sl4 = satrec.sl4,
    t = satrec.t,
    xgh2 = satrec.xgh2,
    xgh3 = satrec.xgh3,
    xgh4 = satrec.xgh4,
    xh2 = satrec.xh2,
    xh3 = satrec.xh3,
    xi2 = satrec.xi2,
    xi3 = satrec.xi3,
    xl2 = satrec.xl2,
    xl3 = satrec.xl3,
    xl4 = satrec.xl4,
    zmol = satrec.zmol,
    zmos = satrec.zmos;
  var init = options.init,
    opsmode = options.opsmode;
  var ep = options.ep,
    inclp = options.inclp,
    nodep = options.nodep,
    argpp = options.argpp,
    mp = options.mp;
  // Copy satellite attributes into local variables for convenience
  // and symmetry in writing formulae.
  var alfdp;
  var betdp;
  var cosip;
  var sinip;
  var cosop;
  var sinop;
  var dalf;
  var dbet;
  var dls;
  var f2;
  var f3;
  var pe;
  var pgh;
  var ph;
  var pinc;
  var pl;
  var sinzf;
  var xls;
  var xnoh;
  var zf;
  var zm;
  //  ---------------------- constants -----------------------------
  var zns = 1.19459e-5;
  var zes = 0.01675;
  var znl = 1.5835218e-4;
  var zel = 0.05490;
  //  --------------- calculate time varying periodics -----------
  zm = zmos + zns * t;
  // be sure that the initial call has time set to zero
  if (init === 'y') {
    zm = zmos;
  }
  zf = zm + 2.0 * zes * Math.sin(zm);
  sinzf = Math.sin(zf);
  f2 = 0.5 * sinzf * sinzf - 0.25;
  f3 = -0.5 * sinzf * Math.cos(zf);
  var ses = se2 * f2 + se3 * f3;
  var sis = si2 * f2 + si3 * f3;
  var sls = sl2 * f2 + sl3 * f3 + sl4 * sinzf;
  var sghs = sgh2 * f2 + sgh3 * f3 + sgh4 * sinzf;
  var shs = sh2 * f2 + sh3 * f3;
  zm = zmol + znl * t;
  if (init === 'y') {
    zm = zmol;
  }
  zf = zm + 2.0 * zel * Math.sin(zm);
  sinzf = Math.sin(zf);
  f2 = 0.5 * sinzf * sinzf - 0.25;
  f3 = -0.5 * sinzf * Math.cos(zf);
  var sel = ee2 * f2 + e3 * f3;
  var sil = xi2 * f2 + xi3 * f3;
  var sll = xl2 * f2 + xl3 * f3 + xl4 * sinzf;
  var sghl = xgh2 * f2 + xgh3 * f3 + xgh4 * sinzf;
  var shll = xh2 * f2 + xh3 * f3;
  pe = ses + sel;
  pinc = sis + sil;
  pl = sls + sll;
  pgh = sghs + sghl;
  ph = shs + shll;
  if (init === 'n') {
    pe -= peo;
    pinc -= pinco;
    pl -= plo;
    pgh -= pgho;
    ph -= pho;
    inclp += pinc;
    ep += pe;
    sinip = Math.sin(inclp);
    cosip = Math.cos(inclp);
    /* ----------------- apply periodics directly ------------ */
    // sgp4fix for lyddane choice
    // strn3 used original inclination - this is technically feasible
    // gsfc used perturbed inclination - also technically feasible
    // probably best to readjust the 0.2 limit value and limit discontinuity
    // 0.2 rad = 11.45916 deg
    // use next line for original strn3 approach and original inclination
    // if (inclo >= 0.2)
    // use next line for gsfc version and perturbed inclination
    if (inclp >= 0.2) {
      ph /= sinip;
      pgh -= cosip * ph;
      argpp += pgh;
      nodep += ph;
      mp += pl;
    } else {
      //  ---- apply periodics with lyddane modification ----
      sinop = Math.sin(nodep);
      cosop = Math.cos(nodep);
      alfdp = sinip * sinop;
      betdp = sinip * cosop;
      dalf = ph * cosop + pinc * cosip * sinop;
      dbet = -ph * sinop + pinc * cosip * cosop;
      alfdp += dalf;
      betdp += dbet;
      nodep %= twoPi;
      //  sgp4fix for afspc written intrinsic functions
      //  nodep used without a trigonometric function ahead
      if (nodep < 0.0 && opsmode === 'a') {
        nodep += twoPi;
      }
      xls = mp + argpp + cosip * nodep;
      dls = pl + pgh - pinc * nodep * sinip;
      xls += dls;
      xnoh = nodep;
      nodep = Math.atan2(alfdp, betdp);
      //  sgp4fix for afspc written intrinsic functions
      //  nodep used without a trigonometric function ahead
      if (nodep < 0.0 && opsmode === 'a') {
        nodep += twoPi;
      }
      if (Math.abs(xnoh - nodep) > pi) {
        if (nodep < xnoh) {
          nodep += twoPi;
        } else {
          nodep -= twoPi;
        }
      }
      mp += pl;
      argpp = xls - mp - cosip * nodep;
    }
  }
  return {
    ep: ep,
    inclp: inclp,
    nodep: nodep,
    argpp: argpp,
    mp: mp
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dscom
 *
 *  this procedure provides deep space common items used by both the secular
 *    and periodics subroutines.  input is provided as shown. this routine
 *    used to be called dpper, but the functions inside weren't well organized.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    epoch       -
 *    ep          - eccentricity
 *    argpp       - argument of perigee
 *    tc          -
 *    inclp       - inclination
 *    nodep       - right ascension of ascending node
 *    np          - mean motion
 *
 *  outputs       :
 *    sinim  , cosim  , sinomm , cosomm , snodm  , cnodm
 *    day         -
 *    e3          -
 *    ee2         -
 *    em          - eccentricity
 *    emsq        - eccentricity squared
 *    gam         -
 *    peo         -
 *    pgho        -
 *    pho         -
 *    pinco       -
 *    plo         -
 *    rtemsq      -
 *    se2, se3         -
 *    sgh2, sgh3, sgh4        -
 *    sh2, sh3, si2, si3, sl2, sl3, sl4         -
 *    s1, s2, s3, s4, s5, s6, s7          -
 *    ss1, ss2, ss3, ss4, ss5, ss6, ss7, sz1, sz2, sz3         -
 *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
 *    xgh2, xgh3, xgh4, xh2, xh3, xi2, xi3, xl2, xl3, xl4         -
 *    nm          - mean motion
 *    z1, z2, z3, z11, z12, z13, z21, z22, z23, z31, z32, z33         -
 *    zmol        -
 *    zmos        -
 *
 *  locals        :
 *    a1, a2, a3, a4, a5, a6, a7, a8, a9, a10         -
 *    betasq      -
 *    cc          -
 *    ctem, stem        -
 *    x1, x2, x3, x4, x5, x6, x7, x8          -
 *    xnodce      -
 *    xnoi        -
 *    zcosg  , zsing  , zcosgl , zsingl , zcosh  , zsinh  , zcoshl , zsinhl ,
 *    zcosi  , zsini  , zcosil , zsinil ,
 *    zx          -
 *    zy          -
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function dscom(options) {
  var epoch = options.epoch,
    ep = options.ep,
    argpp = options.argpp,
    tc = options.tc,
    inclp = options.inclp,
    nodep = options.nodep,
    np = options.np;
  var a1;
  var a2;
  var a3;
  var a4;
  var a5;
  var a6;
  var a7;
  var a8;
  var a9;
  var a10;
  var cc;
  var x1;
  var x2;
  var x3;
  var x4;
  var x5;
  var x6;
  var x7;
  var x8;
  var zcosg;
  var zsing;
  var zcosh;
  var zsinh;
  var zcosi;
  var zsini;
  var ss1;
  var ss2;
  var ss3;
  var ss4;
  var ss5;
  var ss6;
  var ss7;
  var sz1;
  var sz2;
  var sz3;
  var sz11;
  var sz12;
  var sz13;
  var sz21;
  var sz22;
  var sz23;
  var sz31;
  var sz32;
  var sz33;
  var s1;
  var s2;
  var s3;
  var s4;
  var s5;
  var s6;
  var s7;
  var z1;
  var z2;
  var z3;
  var z11;
  var z12;
  var z13;
  var z21;
  var z22;
  var z23;
  var z31;
  var z32;
  var z33;
  // -------------------------- constants -------------------------
  var zes = 0.01675;
  var zel = 0.05490;
  var c1ss = 2.9864797e-6;
  var c1l = 4.7968065e-7;
  var zsinis = 0.39785416;
  var zcosis = 0.91744867;
  var zcosgs = 0.1945905;
  var zsings = -0.98088458;
  //  --------------------- local variables ------------------------
  var nm = np;
  var em = ep;
  var snodm = Math.sin(nodep);
  var cnodm = Math.cos(nodep);
  var sinomm = Math.sin(argpp);
  var cosomm = Math.cos(argpp);
  var sinim = Math.sin(inclp);
  var cosim = Math.cos(inclp);
  var emsq = em * em;
  var betasq = 1.0 - emsq;
  var rtemsq = Math.sqrt(betasq);
  //  ----------------- initialize lunar solar terms ---------------
  var peo = 0.0;
  var pinco = 0.0;
  var plo = 0.0;
  var pgho = 0.0;
  var pho = 0.0;
  var day = epoch + 18261.5 + tc / 1440.0;
  var xnodce = (4.5236020 - 9.2422029e-4 * day) % twoPi;
  var stem = Math.sin(xnodce);
  var ctem = Math.cos(xnodce);
  var zcosil = 0.91375164 - 0.03568096 * ctem;
  var zsinil = Math.sqrt(1.0 - zcosil * zcosil);
  var zsinhl = 0.089683511 * stem / zsinil;
  var zcoshl = Math.sqrt(1.0 - zsinhl * zsinhl);
  var gam = 5.8351514 + 0.0019443680 * day;
  var zx = 0.39785416 * stem / zsinil;
  var zy = zcoshl * ctem + 0.91744867 * zsinhl * stem;
  zx = Math.atan2(zx, zy);
  zx += gam - xnodce;
  var zcosgl = Math.cos(zx);
  var zsingl = Math.sin(zx);
  //  ------------------------- do solar terms ---------------------
  zcosg = zcosgs;
  zsing = zsings;
  zcosi = zcosis;
  zsini = zsinis;
  zcosh = cnodm;
  zsinh = snodm;
  cc = c1ss;
  var xnoi = 1.0 / nm;
  var lsflg = 0;
  while (lsflg < 2) {
    lsflg += 1;
    a1 = zcosg * zcosh + zsing * zcosi * zsinh;
    a3 = -zsing * zcosh + zcosg * zcosi * zsinh;
    a7 = -zcosg * zsinh + zsing * zcosi * zcosh;
    a8 = zsing * zsini;
    a9 = zsing * zsinh + zcosg * zcosi * zcosh;
    a10 = zcosg * zsini;
    a2 = cosim * a7 + sinim * a8;
    a4 = cosim * a9 + sinim * a10;
    a5 = -sinim * a7 + cosim * a8;
    a6 = -sinim * a9 + cosim * a10;
    x1 = a1 * cosomm + a2 * sinomm;
    x2 = a3 * cosomm + a4 * sinomm;
    x3 = -a1 * sinomm + a2 * cosomm;
    x4 = -a3 * sinomm + a4 * cosomm;
    x5 = a5 * sinomm;
    x6 = a6 * sinomm;
    x7 = a5 * cosomm;
    x8 = a6 * cosomm;
    z31 = 12.0 * x1 * x1 - 3.0 * x3 * x3;
    z32 = 24.0 * x1 * x2 - 6.0 * x3 * x4;
    z33 = 12.0 * x2 * x2 - 3.0 * x4 * x4;
    z1 = 3.0 * (a1 * a1 + a2 * a2) + z31 * emsq;
    z2 = 6.0 * (a1 * a3 + a2 * a4) + z32 * emsq;
    z3 = 3.0 * (a3 * a3 + a4 * a4) + z33 * emsq;
    z11 = -6 * a1 * a5 + emsq * (-24 * x1 * x7 - 6.0 * x3 * x5);
    z12 = -6 * (a1 * a6 + a3 * a5) + emsq * (-24 * (x2 * x7 + x1 * x8) + -6 * (x3 * x6 + x4 * x5));
    z13 = -6 * a3 * a6 + emsq * (-24 * x2 * x8 - 6.0 * x4 * x6);
    z21 = 6.0 * a2 * a5 + emsq * (24.0 * x1 * x5 - 6.0 * x3 * x7);
    z22 = 6.0 * (a4 * a5 + a2 * a6) + emsq * (24.0 * (x2 * x5 + x1 * x6) - 6.0 * (x4 * x7 + x3 * x8));
    z23 = 6.0 * a4 * a6 + emsq * (24.0 * x2 * x6 - 6.0 * x4 * x8);
    z1 = z1 + z1 + betasq * z31;
    z2 = z2 + z2 + betasq * z32;
    z3 = z3 + z3 + betasq * z33;
    s3 = cc * xnoi;
    s2 = -0.5 * s3 / rtemsq;
    s4 = s3 * rtemsq;
    s1 = -15 * em * s4;
    s5 = x1 * x3 + x2 * x4;
    s6 = x2 * x3 + x1 * x4;
    s7 = x2 * x4 - x1 * x3;
    //  ----------------------- do lunar terms -------------------
    if (lsflg === 1) {
      ss1 = s1;
      ss2 = s2;
      ss3 = s3;
      ss4 = s4;
      ss5 = s5;
      ss6 = s6;
      ss7 = s7;
      sz1 = z1;
      sz2 = z2;
      sz3 = z3;
      sz11 = z11;
      sz12 = z12;
      sz13 = z13;
      sz21 = z21;
      sz22 = z22;
      sz23 = z23;
      sz31 = z31;
      sz32 = z32;
      sz33 = z33;
      zcosg = zcosgl;
      zsing = zsingl;
      zcosi = zcosil;
      zsini = zsinil;
      zcosh = zcoshl * cnodm + zsinhl * snodm;
      zsinh = snodm * zcoshl - cnodm * zsinhl;
      cc = c1l;
    }
  }
  var zmol = (4.7199672 + (0.22997150 * day - gam)) % twoPi;
  var zmos = (6.2565837 + 0.017201977 * day) % twoPi;
  //  ------------------------ do solar terms ----------------------
  var se2 = 2.0 * ss1 * ss6;
  var se3 = 2.0 * ss1 * ss7;
  var si2 = 2.0 * ss2 * sz12;
  var si3 = 2.0 * ss2 * (sz13 - sz11);
  var sl2 = -2 * ss3 * sz2;
  var sl3 = -2 * ss3 * (sz3 - sz1);
  var sl4 = -2 * ss3 * (-21 - 9.0 * emsq) * zes;
  var sgh2 = 2.0 * ss4 * sz32;
  var sgh3 = 2.0 * ss4 * (sz33 - sz31);
  var sgh4 = -18 * ss4 * zes;
  var sh2 = -2 * ss2 * sz22;
  var sh3 = -2 * ss2 * (sz23 - sz21);
  //  ------------------------ do lunar terms ----------------------
  var ee2 = 2.0 * s1 * s6;
  var e3 = 2.0 * s1 * s7;
  var xi2 = 2.0 * s2 * z12;
  var xi3 = 2.0 * s2 * (z13 - z11);
  var xl2 = -2 * s3 * z2;
  var xl3 = -2 * s3 * (z3 - z1);
  var xl4 = -2 * s3 * (-21 - 9.0 * emsq) * zel;
  var xgh2 = 2.0 * s4 * z32;
  var xgh3 = 2.0 * s4 * (z33 - z31);
  var xgh4 = -18 * s4 * zel;
  var xh2 = -2 * s2 * z22;
  var xh3 = -2 * s2 * (z23 - z21);
  return {
    snodm: snodm,
    cnodm: cnodm,
    sinim: sinim,
    cosim: cosim,
    sinomm: sinomm,
    cosomm: cosomm,
    day: day,
    e3: e3,
    ee2: ee2,
    em: em,
    emsq: emsq,
    gam: gam,
    peo: peo,
    pgho: pgho,
    pho: pho,
    pinco: pinco,
    plo: plo,
    rtemsq: rtemsq,
    se2: se2,
    se3: se3,
    sgh2: sgh2,
    sgh3: sgh3,
    sgh4: sgh4,
    sh2: sh2,
    sh3: sh3,
    si2: si2,
    si3: si3,
    sl2: sl2,
    sl3: sl3,
    sl4: sl4,
    s1: s1,
    s2: s2,
    s3: s3,
    s4: s4,
    s5: s5,
    s6: s6,
    s7: s7,
    ss1: ss1,
    ss2: ss2,
    ss3: ss3,
    ss4: ss4,
    ss5: ss5,
    ss6: ss6,
    ss7: ss7,
    sz1: sz1,
    sz2: sz2,
    sz3: sz3,
    sz11: sz11,
    sz12: sz12,
    sz13: sz13,
    sz21: sz21,
    sz22: sz22,
    sz23: sz23,
    sz31: sz31,
    sz32: sz32,
    sz33: sz33,
    xgh2: xgh2,
    xgh3: xgh3,
    xgh4: xgh4,
    xh2: xh2,
    xh3: xh3,
    xi2: xi2,
    xi3: xi3,
    xl2: xl2,
    xl3: xl3,
    xl4: xl4,
    nm: nm,
    z1: z1,
    z2: z2,
    z3: z3,
    z11: z11,
    z12: z12,
    z13: z13,
    z21: z21,
    z22: z22,
    z23: z23,
    z31: z31,
    z32: z32,
    z33: z33,
    zmol: zmol,
    zmos: zmos
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dsinit
 *
 *  this procedure provides deep space contributions to mean motion dot due
 *    to geopotential resonance with half day and one day orbits.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    cosim, sinim-
 *    emsq        - eccentricity squared
 *    argpo       - argument of perigee
 *    s1, s2, s3, s4, s5      -
 *    ss1, ss2, ss3, ss4, ss5 -
 *    sz1, sz3, sz11, sz13, sz21, sz23, sz31, sz33 -
 *    t           - time
 *    tc          -
 *    gsto        - greenwich sidereal time                   rad
 *    mo          - mean anomaly
 *    mdot        - mean anomaly dot (rate)
 *    no          - mean motion
 *    nodeo       - right ascension of ascending node
 *    nodedot     - right ascension of ascending node dot (rate)
 *    xpidot      -
 *    z1, z3, z11, z13, z21, z23, z31, z33 -
 *    eccm        - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    xn          - mean motion
 *    nodem       - right ascension of ascending node
 *
 *  outputs       :
 *    em          - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    nodem       - right ascension of ascending node
 *    irez        - flag for resonance           0-none, 1-one day, 2-half day
 *    atime       -
 *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433    -
 *    dedt        -
 *    didt        -
 *    dmdt        -
 *    dndt        -
 *    dnodt       -
 *    domdt       -
 *    del1, del2, del3        -
 *    ses  , sghl , sghs , sgs  , shl  , shs  , sis  , sls
 *    theta       -
 *    xfact       -
 *    xlamo       -
 *    xli         -
 *    xni
 *
 *  locals        :
 *    ainv2       -
 *    aonv        -
 *    cosisq      -
 *    eoc         -
 *    f220, f221, f311, f321, f322, f330, f441, f442, f522, f523, f542, f543  -
 *    g200, g201, g211, g300, g310, g322, g410, g422, g520, g521, g532, g533  -
 *    sini2       -
 *    temp        -
 *    temp1       -
 *    theta       -
 *    xno2        -
 *
 *  coupling      :
 *    getgravconst
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function dsinit(options) {
  var cosim = options.cosim,
    argpo = options.argpo,
    s1 = options.s1,
    s2 = options.s2,
    s3 = options.s3,
    s4 = options.s4,
    s5 = options.s5,
    sinim = options.sinim,
    ss1 = options.ss1,
    ss2 = options.ss2,
    ss3 = options.ss3,
    ss4 = options.ss4,
    ss5 = options.ss5,
    sz1 = options.sz1,
    sz3 = options.sz3,
    sz11 = options.sz11,
    sz13 = options.sz13,
    sz21 = options.sz21,
    sz23 = options.sz23,
    sz31 = options.sz31,
    sz33 = options.sz33,
    t = options.t,
    tc = options.tc,
    gsto = options.gsto,
    mo = options.mo,
    mdot = options.mdot,
    no = options.no,
    nodeo = options.nodeo,
    nodedot = options.nodedot,
    xpidot = options.xpidot,
    z1 = options.z1,
    z3 = options.z3,
    z11 = options.z11,
    z13 = options.z13,
    z21 = options.z21,
    z23 = options.z23,
    z31 = options.z31,
    z33 = options.z33,
    ecco = options.ecco,
    eccsq = options.eccsq;
  var emsq = options.emsq,
    em = options.em,
    argpm = options.argpm,
    inclm = options.inclm,
    mm = options.mm,
    nm = options.nm,
    nodem = options.nodem,
    irez = options.irez,
    atime = options.atime,
    d2201 = options.d2201,
    d2211 = options.d2211,
    d3210 = options.d3210,
    d3222 = options.d3222,
    d4410 = options.d4410,
    d4422 = options.d4422,
    d5220 = options.d5220,
    d5232 = options.d5232,
    d5421 = options.d5421,
    d5433 = options.d5433,
    dedt = options.dedt,
    didt = options.didt,
    dmdt = options.dmdt,
    dnodt = options.dnodt,
    domdt = options.domdt,
    del1 = options.del1,
    del2 = options.del2,
    del3 = options.del3,
    xfact = options.xfact,
    xlamo = options.xlamo,
    xli = options.xli,
    xni = options.xni;
  var f220;
  var f221;
  var f311;
  var f321;
  var f322;
  var f330;
  var f441;
  var f442;
  var f522;
  var f523;
  var f542;
  var f543;
  var g200;
  var g201;
  var g211;
  var g300;
  var g310;
  var g322;
  var g410;
  var g422;
  var g520;
  var g521;
  var g532;
  var g533;
  var sini2;
  var temp;
  var temp1;
  var xno2;
  var ainv2;
  var aonv;
  var cosisq;
  var eoc;
  var q22 = 1.7891679e-6;
  var q31 = 2.1460748e-6;
  var q33 = 2.2123015e-7;
  var root22 = 1.7891679e-6;
  var root44 = 7.3636953e-9;
  var root54 = 2.1765803e-9;
  // eslint-disable-next-line no-loss-of-precision
  var rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec
  var root32 = 3.7393792e-7;
  var root52 = 1.1428639e-7;
  var znl = 1.5835218e-4;
  var zns = 1.19459e-5;
  // -------------------- deep space initialization ------------
  irez = 0;
  if (nm < 0.0052359877 && nm > 0.0034906585) {
    irez = 1;
  }
  if (nm >= 8.26e-3 && nm <= 9.24e-3 && em >= 0.5) {
    irez = 2;
  }
  // ------------------------ do solar terms -------------------
  var ses = ss1 * zns * ss5;
  var sis = ss2 * zns * (sz11 + sz13);
  var sls = -zns * ss3 * (sz1 + sz3 - 14.0 - 6.0 * emsq);
  var sghs = ss4 * zns * (sz31 + sz33 - 6.0);
  var shs = -zns * ss2 * (sz21 + sz23);
  // sgp4fix for 180 deg incl
  if (inclm < 5.2359877e-2 || inclm > pi - 5.2359877e-2) {
    shs = 0.0;
  }
  if (sinim !== 0.0) {
    shs /= sinim;
  }
  var sgs = sghs - cosim * shs;
  // ------------------------- do lunar terms ------------------
  dedt = ses + s1 * znl * s5;
  didt = sis + s2 * znl * (z11 + z13);
  dmdt = sls - znl * s3 * (z1 + z3 - 14.0 - 6.0 * emsq);
  var sghl = s4 * znl * (z31 + z33 - 6.0);
  var shll = -znl * s2 * (z21 + z23);
  // sgp4fix for 180 deg incl
  if (inclm < 5.2359877e-2 || inclm > pi - 5.2359877e-2) {
    shll = 0.0;
  }
  domdt = sgs + sghl;
  dnodt = shs;
  if (sinim !== 0.0) {
    domdt -= cosim / sinim * shll;
    dnodt += shll / sinim;
  }
  // ----------- calculate deep space resonance effects --------
  var dndt = 0.0;
  var theta = (gsto + tc * rptim) % twoPi;
  em += dedt * t;
  inclm += didt * t;
  argpm += domdt * t;
  nodem += dnodt * t;
  mm += dmdt * t;
  // sgp4fix for negative inclinations
  // the following if statement should be commented out
  // if (inclm < 0.0)
  // {
  //   inclm  = -inclm;
  //   argpm  = argpm - pi;
  //   nodem = nodem + pi;
  // }
  // -------------- initialize the resonance terms -------------
  if (irez !== 0) {
    aonv = Math.pow(nm / xke, x2o3);
    // ---------- geopotential resonance for 12 hour orbits ------
    if (irez === 2) {
      cosisq = cosim * cosim;
      var emo = em;
      em = ecco;
      var emsqo = emsq;
      emsq = eccsq;
      eoc = em * emsq;
      g201 = -0.306 - (em - 0.64) * 0.440;
      if (em <= 0.65) {
        g211 = 3.616 - 13.2470 * em + 16.2900 * emsq;
        g310 = -19.302 + 117.3900 * em - 228.4190 * emsq + 156.5910 * eoc;
        g322 = -18.9068 + 109.7927 * em - 214.6334 * emsq + 146.5816 * eoc;
        g410 = -41.122 + 242.6940 * em - 471.0940 * emsq + 313.9530 * eoc;
        g422 = -146.407 + 841.8800 * em - 1629.014 * emsq + 1083.4350 * eoc;
        g520 = -532.114 + 3017.977 * em - 5740.032 * emsq + 3708.2760 * eoc;
      } else {
        g211 = -72.099 + 331.819 * em - 508.738 * emsq + 266.724 * eoc;
        g310 = -346.844 + 1582.851 * em - 2415.925 * emsq + 1246.113 * eoc;
        g322 = -342.585 + 1554.908 * em - 2366.899 * emsq + 1215.972 * eoc;
        g410 = -1052.797 + 4758.686 * em - 7193.992 * emsq + 3651.957 * eoc;
        g422 = -3581.69 + 16178.110 * em - 24462.770 * emsq + 12422.520 * eoc;
        if (em > 0.715) {
          g520 = -5149.66 + 29936.92 * em - 54087.36 * emsq + 31324.56 * eoc;
        } else {
          g520 = 1464.74 - 4664.75 * em + 3763.64 * emsq;
        }
      }
      if (em < 0.7) {
        g533 = -919.2277 + 4988.6100 * em - 9064.7700 * emsq + 5542.21 * eoc;
        g521 = -822.71072 + 4568.6173 * em - 8491.4146 * emsq + 5337.524 * eoc;
        g532 = -853.666 + 4690.2500 * em - 8624.7700 * emsq + 5341.4 * eoc;
      } else {
        g533 = -37995.78 + 161616.52 * em - 229838.20 * emsq + 109377.94 * eoc;
        g521 = -51752.104 + 218913.95 * em - 309468.16 * emsq + 146349.42 * eoc;
        g532 = -40023.88 + 170470.89 * em - 242699.48 * emsq + 115605.82 * eoc;
      }
      sini2 = sinim * sinim;
      f220 = 0.75 * (1.0 + 2.0 * cosim + cosisq);
      f221 = 1.5 * sini2;
      f321 = 1.875 * sinim * (1.0 - 2.0 * cosim - 3.0 * cosisq);
      f322 = -1.875 * sinim * (1.0 + 2.0 * cosim - 3.0 * cosisq);
      f441 = 35.0 * sini2 * f220;
      f442 = 39.3750 * sini2 * sini2;
      f522 = 9.84375 * sinim * (sini2 * (1.0 - 2.0 * cosim - 5.0 * cosisq) + 0.33333333 * (-2 + 4.0 * cosim + 6.0 * cosisq));
      f523 = sinim * (4.92187512 * sini2 * (-2 - 4.0 * cosim + 10.0 * cosisq) + 6.56250012 * (1.0 + 2.0 * cosim - 3.0 * cosisq));
      f542 = 29.53125 * sinim * (2.0 - 8.0 * cosim + cosisq * (-12 + 8.0 * cosim + 10.0 * cosisq));
      f543 = 29.53125 * sinim * (-2 - 8.0 * cosim + cosisq * (12.0 + 8.0 * cosim - 10.0 * cosisq));
      xno2 = nm * nm;
      ainv2 = aonv * aonv;
      temp1 = 3.0 * xno2 * ainv2;
      temp = temp1 * root22;
      d2201 = temp * f220 * g201;
      d2211 = temp * f221 * g211;
      temp1 *= aonv;
      temp = temp1 * root32;
      d3210 = temp * f321 * g310;
      d3222 = temp * f322 * g322;
      temp1 *= aonv;
      temp = 2.0 * temp1 * root44;
      d4410 = temp * f441 * g410;
      d4422 = temp * f442 * g422;
      temp1 *= aonv;
      temp = temp1 * root52;
      d5220 = temp * f522 * g520;
      d5232 = temp * f523 * g532;
      temp = 2.0 * temp1 * root54;
      d5421 = temp * f542 * g521;
      d5433 = temp * f543 * g533;
      xlamo = (mo + nodeo + nodeo - (theta + theta)) % twoPi;
      xfact = mdot + dmdt + 2.0 * (nodedot + dnodt - rptim) - no;
      em = emo;
      emsq = emsqo;
    }
    //  ---------------- synchronous resonance terms --------------
    if (irez === 1) {
      g200 = 1.0 + emsq * (-2.5 + 0.8125 * emsq);
      g310 = 1.0 + 2.0 * emsq;
      g300 = 1.0 + emsq * (-6 + 6.60937 * emsq);
      f220 = 0.75 * (1.0 + cosim) * (1.0 + cosim);
      f311 = 0.9375 * sinim * sinim * (1.0 + 3.0 * cosim) - 0.75 * (1.0 + cosim);
      f330 = 1.0 + cosim;
      f330 *= 1.875 * f330 * f330;
      del1 = 3.0 * nm * nm * aonv * aonv;
      del2 = 2.0 * del1 * f220 * g200 * q22;
      del3 = 3.0 * del1 * f330 * g300 * q33 * aonv;
      del1 = del1 * f311 * g310 * q31 * aonv;
      xlamo = (mo + nodeo + argpo - theta) % twoPi;
      xfact = mdot + xpidot + dmdt + domdt + dnodt - (no + rptim);
    }
    //  ------------ for sgp4, initialize the integrator ----------
    xli = xlamo;
    xni = no;
    atime = 0.0;
    nm = no + dndt;
  }
  return {
    em: em,
    argpm: argpm,
    inclm: inclm,
    mm: mm,
    nm: nm,
    nodem: nodem,
    irez: irez,
    atime: atime,
    d2201: d2201,
    d2211: d2211,
    d3210: d3210,
    d3222: d3222,
    d4410: d4410,
    d4422: d4422,
    d5220: d5220,
    d5232: d5232,
    d5421: d5421,
    d5433: d5433,
    dedt: dedt,
    didt: didt,
    dmdt: dmdt,
    dndt: dndt,
    dnodt: dnodt,
    domdt: domdt,
    del1: del1,
    del2: del2,
    del3: del3,
    xfact: xfact,
    xlamo: xlamo,
    xli: xli,
    xni: xni
  };
}

/* -----------------------------------------------------------------------------
 *
 *                           function gstime
 *
 *  this function finds the greenwich sidereal time.
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    jdut1       - julian date in ut1             days from 4713 bc
 *
 *  outputs       :
 *    gstime      - greenwich sidereal time        0 to 2pi rad
 *
 *  locals        :
 *    temp        - temporary variable for doubles   rad
 *    tut1        - julian centuries from the
 *                  jan 1, 2000 12 h epoch (ut1)
 *
 *  coupling      :
 *    none
 *
 *  references    :
 *    vallado       2004, 191, eq 3-45
 * --------------------------------------------------------------------------- */
function gstimeInternal(jdut1) {
  var tut1 = (jdut1 - 2451545.0) / 36525.0;
  var temp = -62e-7 * tut1 * tut1 * tut1 + 0.093104 * tut1 * tut1 + (876600.0 * 3600 + 8640184.812866) * tut1 + 67310.54841; // # sec
  temp = temp * deg2rad / 240.0 % twoPi; // 360/86400 = 1/240, to deg, to rad
  //  ------------------------ check quadrants ---------------------
  if (temp < 0.0) {
    temp += twoPi;
  }
  return temp;
}
function gstime(first, month, day, hour, minute, second, millisecond) {
  if (first instanceof Date) {
    return gstimeInternal(jday(first));
  } else {
    return gstimeInternal(first);
  }
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure initl
 *
 *  this procedure initializes the sgp4 propagator. all the initialization is
 *    consolidated here instead of having multiple loops inside other routines.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    ecco        - eccentricity                           0.0 - 1.0
 *    epoch       - epoch time in days from jan 0, 1950. 0 hr
 *    inclo       - inclination of satellite
 *    no          - mean motion of satellite
 *    satn        - satellite number
 *
 *  outputs       :
 *    ainv        - 1.0 / a
 *    ao          - semi major axis
 *    con41       -
 *    con42       - 1.0 - 5.0 cos(i)
 *    cosio       - cosine of inclination
 *    cosio2      - cosio squared
 *    eccsq       - eccentricity squared
 *    method      - flag for deep space                    'd', 'n'
 *    omeosq      - 1.0 - ecco * ecco
 *    posq        - semi-parameter squared
 *    rp          - radius of perigee
 *    rteosq      - square root of (1.0 - ecco*ecco)
 *    sinio       - sine of inclination
 *    gsto        - gst at time of observation               rad
 *    no          - mean motion of satellite
 *
 *  locals        :
 *    ak          -
 *    d1          -
 *    del         -
 *    adel        -
 *    po          -
 *
 *  coupling      :
 *    getgravconst
 *    gstime      - find greenwich sidereal time from the julian date
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function initl(options) {
  var ecco = options.ecco,
    epoch = options.epoch,
    inclo = options.inclo,
    opsmode = options.opsmode;
  var no = options.no;
  // sgp4fix use old way of finding gst
  // ----------------------- earth constants ---------------------
  // sgp4fix identify constants and allow alternate values
  // ------------- calculate auxillary epoch quantities ----------
  var eccsq = ecco * ecco;
  var omeosq = 1.0 - eccsq;
  var rteosq = Math.sqrt(omeosq);
  var cosio = Math.cos(inclo);
  var cosio2 = cosio * cosio;
  // ------------------ un-kozai the mean motion -----------------
  var ak = Math.pow(xke / no, x2o3);
  var d1 = 0.75 * j2 * (3.0 * cosio2 - 1.0) / (rteosq * omeosq);
  var delPrime = d1 / (ak * ak);
  var adel = ak * (1.0 - delPrime * delPrime - delPrime * (1.0 / 3.0 + 134.0 * delPrime * delPrime / 81.0));
  delPrime = d1 / (adel * adel);
  no /= 1.0 + delPrime;
  var ao = Math.pow(xke / no, x2o3);
  var sinio = Math.sin(inclo);
  var po = ao * omeosq;
  var con42 = 1.0 - 5.0 * cosio2;
  var con41 = -con42 - cosio2 - cosio2;
  var ainv = 1.0 / ao;
  var posq = po * po;
  var rp = ao * (1.0 - ecco);
  var method = 'n';
  //  sgp4fix modern approach to finding sidereal time
  var gsto;
  if (opsmode === 'a') {
    //  sgp4fix use old way of finding gst
    //  count integer number of days from 0 jan 1970
    var ts70 = epoch - 7305.0;
    var ds70 = Math.floor(ts70 + 1.0e-8);
    var tfrac = ts70 - ds70;
    //  find greenwich location at epoch
    var c1 = 1.72027916940703639e-2; // eslint-disable-line no-loss-of-precision
    var thgr70 = 1.7321343856509374; // eslint-disable-line no-loss-of-precision
    var fk5r = 5.07551419432269442e-15; // eslint-disable-line no-loss-of-precision
    var c1p2p = c1 + twoPi;
    gsto = (thgr70 + c1 * ds70 + c1p2p * tfrac + ts70 * ts70 * fk5r) % twoPi;
    if (gsto < 0.0) {
      gsto += twoPi;
    }
  } else {
    gsto = gstime(epoch + 2433281.5);
  }
  return {
    no: no,
    method: method,
    ainv: ainv,
    ao: ao,
    con41: con41,
    con42: con42,
    cosio: cosio,
    cosio2: cosio2,
    eccsq: eccsq,
    omeosq: omeosq,
    posq: posq,
    rp: rp,
    rteosq: rteosq,
    sinio: sinio,
    gsto: gsto
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dspace
 *
 *  this procedure provides deep space contributions to mean elements for
 *    perturbing third body.  these effects have been averaged over one
 *    revolution of the sun and moon.  for earth resonance effects, the
 *    effects have been averaged over no revolutions of the satellite.
 *    (mean motion)
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433 -
 *    dedt        -
 *    del1, del2, del3  -
 *    didt        -
 *    dmdt        -
 *    dnodt       -
 *    domdt       -
 *    irez        - flag for resonance           0-none, 1-one day, 2-half day
 *    argpo       - argument of perigee
 *    argpdot     - argument of perigee dot (rate)
 *    t           - time
 *    tc          -
 *    gsto        - gst
 *    xfact       -
 *    xlamo       -
 *    no          - mean motion
 *    atime       -
 *    em          - eccentricity
 *    ft          -
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    xli         -
 *    mm          - mean anomaly
 *    xni         - mean motion
 *    nodem       - right ascension of ascending node
 *
 *  outputs       :
 *    atime       -
 *    em          - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    xli         -
 *    mm          - mean anomaly
 *    xni         -
 *    nodem       - right ascension of ascending node
 *    dndt        -
 *    nm          - mean motion
 *
 *  locals        :
 *    delt        -
 *    ft          -
 *    theta       -
 *    x2li        -
 *    x2omi       -
 *    xl          -
 *    xldot       -
 *    xnddt       -
 *    xndt        -
 *    xomi        -
 *
 *  coupling      :
 *    none        -
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function dspace(options) {
  var irez = options.irez,
    d2201 = options.d2201,
    d2211 = options.d2211,
    d3210 = options.d3210,
    d3222 = options.d3222,
    d4410 = options.d4410,
    d4422 = options.d4422,
    d5220 = options.d5220,
    d5232 = options.d5232,
    d5421 = options.d5421,
    d5433 = options.d5433,
    dedt = options.dedt,
    del1 = options.del1,
    del2 = options.del2,
    del3 = options.del3,
    didt = options.didt,
    dmdt = options.dmdt,
    dnodt = options.dnodt,
    domdt = options.domdt,
    argpo = options.argpo,
    argpdot = options.argpdot,
    t = options.t,
    tc = options.tc,
    gsto = options.gsto,
    xfact = options.xfact,
    xlamo = options.xlamo,
    no = options.no;
  var atime = options.atime,
    em = options.em,
    argpm = options.argpm,
    inclm = options.inclm,
    xli = options.xli,
    mm = options.mm,
    xni = options.xni,
    nodem = options.nodem,
    nm = options.nm;
  var fasx2 = 0.13130908;
  var fasx4 = 2.8843198;
  var fasx6 = 0.37448087;
  var g22 = 5.7686396;
  var g32 = 0.95240898;
  var g44 = 1.8014998;
  var g52 = 1.0508330;
  var g54 = 4.4108898;
  // eslint-disable-next-line no-loss-of-precision
  var rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec
  var stepp = 720.0;
  var stepn = -720;
  var step2 = 259200.0;
  var delt;
  var x2li;
  var x2omi;
  var xl;
  var xldot;
  var xnddt;
  var xndt;
  var xomi;
  var dndt = 0.0;
  var ft = 0.0;
  //  ----------- calculate deep space resonance effects -----------
  var theta = (gsto + tc * rptim) % twoPi;
  em += dedt * t;
  inclm += didt * t;
  argpm += domdt * t;
  nodem += dnodt * t;
  mm += dmdt * t;
  // sgp4fix for negative inclinations
  // the following if statement should be commented out
  // if (inclm < 0.0)
  // {
  //   inclm = -inclm;
  //   argpm = argpm - pi;
  //   nodem = nodem + pi;
  // }
  /* - update resonances : numerical (euler-maclaurin) integration - */
  /* ------------------------- epoch restart ----------------------  */
  //   sgp4fix for propagator problems
  //   the following integration works for negative time steps and periods
  //   the specific changes are unknown because the original code was so convoluted
  // sgp4fix take out atime = 0.0 and fix for faster operation
  if (irez !== 0) {
    //  sgp4fix streamline check
    if (atime === 0.0 || t * atime <= 0.0 || Math.abs(t) < Math.abs(atime)) {
      atime = 0.0;
      xni = no;
      xli = xlamo;
    }
    // sgp4fix move check outside loop
    if (t > 0.0) {
      delt = stepp;
    } else {
      delt = stepn;
    }
    var iretn = 381; // added for do loop
    while (iretn === 381) {
      //  ------------------- dot terms calculated -------------
      //  ----------- near - synchronous resonance terms -------
      if (irez !== 2) {
        xndt = del1 * Math.sin(xli - fasx2) + del2 * Math.sin(2.0 * (xli - fasx4)) + del3 * Math.sin(3.0 * (xli - fasx6));
        xldot = xni + xfact;
        xnddt = del1 * Math.cos(xli - fasx2) + 2.0 * del2 * Math.cos(2.0 * (xli - fasx4)) + 3.0 * del3 * Math.cos(3.0 * (xli - fasx6));
        xnddt *= xldot;
      } else {
        // --------- near - half-day resonance terms --------
        xomi = argpo + argpdot * atime;
        x2omi = xomi + xomi;
        x2li = xli + xli;
        xndt = d2201 * Math.sin(x2omi + xli - g22) + d2211 * Math.sin(xli - g22) + d3210 * Math.sin(xomi + xli - g32) + d3222 * Math.sin(-xomi + xli - g32) + d4410 * Math.sin(x2omi + x2li - g44) + d4422 * Math.sin(x2li - g44) + d5220 * Math.sin(xomi + xli - g52) + d5232 * Math.sin(-xomi + xli - g52) + d5421 * Math.sin(xomi + x2li - g54) + d5433 * Math.sin(-xomi + x2li - g54);
        xldot = xni + xfact;
        xnddt = d2201 * Math.cos(x2omi + xli - g22) + d2211 * Math.cos(xli - g22) + d3210 * Math.cos(xomi + xli - g32) + d3222 * Math.cos(-xomi + xli - g32) + d5220 * Math.cos(xomi + xli - g52) + d5232 * Math.cos(-xomi + xli - g52) + 2.0 * (d4410 * Math.cos(x2omi + x2li - g44) + d4422 * Math.cos(x2li - g44) + d5421 * Math.cos(xomi + x2li - g54) + d5433 * Math.cos(-xomi + x2li - g54));
        xnddt *= xldot;
      }
      //  ----------------------- integrator -------------------
      //  sgp4fix move end checks to end of routine
      if (Math.abs(t - atime) >= stepp) {
        iretn = 381;
      } else {
        ft = t - atime;
        iretn = 0;
      }
      if (iretn === 381) {
        xli += xldot * delt + xndt * step2;
        xni += xndt * delt + xnddt * step2;
        atime += delt;
      }
    }
    nm = xni + xndt * ft + xnddt * ft * ft * 0.5;
    xl = xli + xldot * ft + xndt * ft * ft * 0.5;
    if (irez !== 1) {
      mm = xl - 2.0 * nodem + 2.0 * theta;
      dndt = nm - no;
    } else {
      mm = xl - nodem - argpm + theta;
      dndt = nm - no;
    }
    nm = no + dndt;
  }
  return {
    atime: atime,
    em: em,
    argpm: argpm,
    inclm: inclm,
    xli: xli,
    mm: mm,
    xni: xni,
    nodem: nodem,
    dndt: dndt,
    nm: nm
  };
}

var SatRecError;
(function (SatRecError) {
  /**
   * No error, propagation for the last supplied date is successful
   */
  SatRecError[SatRecError["None"] = 0] = "None";
  /**
   * Mean eccentricity is out of range 0 ≤ e < 1
   */
  SatRecError[SatRecError["MeanEccentricityOutOfRange"] = 1] = "MeanEccentricityOutOfRange";
  /**
   * Mean motion has fallen below zero.
   */
  SatRecError[SatRecError["MeanMotionBelowZero"] = 2] = "MeanMotionBelowZero";
  /**
   * Perturbed eccentricity is out of range 0 ≤ e < 1
   */
  SatRecError[SatRecError["PerturbedEccentricityOutOfRange"] = 3] = "PerturbedEccentricityOutOfRange";
  /**
   * Length of the orbit’s semi-latus rectum has fallen below zero.
   */
  SatRecError[SatRecError["SemiLatusRectumBelowZero"] = 4] = "SemiLatusRectumBelowZero";
  // 5 is not used
  /**
   * Orbit has decayed: the computed position is underground.
   */
  SatRecError[SatRecError["Decayed"] = 6] = "Decayed";
})(SatRecError || (SatRecError = {}));

/*----------------------------------------------------------------------------
 *
 *                             procedure sgp4
 *
 *  this procedure is the sgp4 prediction model from space command. this is an
 *    updated and combined version of sgp4 and sdp4, which were originally
 *    published separately in spacetrack report //3. this version follows the
 *    methodology from the aiaa paper (2006) describing the history and
 *    development of the code.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    satrec  - initialised structure from sgp4init() call.
 *    tsince  - time since epoch (minutes)
 *
 *  outputs       :
 *    r           - position vector                     km
 *    v           - velocity                            km/sec
 *  return code - non-zero on error.
 *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
 *                   2 - mean motion less than 0.0
 *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
 *                   4 - semi-latus rectum < 0.0
 *                   5 - epoch elements are sub-orbital
 *                   6 - satellite has decayed
 *
 *  locals        :
 *    am          -
 *    axnl, aynl        -
 *    betal       -
 *    cosim   , sinim   , cosomm  , sinomm  , cnod    , snod    , cos2u   ,
 *    sin2u   , coseo1  , sineo1  , cosi    , sini    , cosip   , sinip   ,
 *    cosisq  , cossu   , sinsu   , cosu    , sinu
 *    delm        -
 *    delomg      -
 *    dndt        -
 *    eccm        -
 *    emsq        -
 *    ecose       -
 *    el2         -
 *    eo1         -
 *    eccp        -
 *    esine       -
 *    argpm       -
 *    argpp       -
 *    omgadf      -
 *    pl          -
 *    r           -
 *    rtemsq      -
 *    rdotl       -
 *    rl          -
 *    rvdot       -
 *    rvdotl      -
 *    su          -
 *    t2  , t3   , t4    , tc
 *    tem5, temp , temp1 , temp2  , tempa  , tempe  , templ
 *    u   , ux   , uy    , uz     , vx     , vy     , vz
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    nodem       - right asc of ascending node
 *    xinc        -
 *    xincp       -
 *    xl          -
 *    xlm         -
 *    mp          -
 *    xmdf        -
 *    xmx         -
 *    xmy         -
 *    nodedf      -
 *    xnode       -
 *    nodep       -
 *    np          -
 *
 *  coupling      :
 *    getgravconst-
 *    dpper
 *    dspace
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report //3 1980
 *    hoots, norad spacetrack report //6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function sgp4(satrec, tsince) {
  var coseo1;
  var sineo1;
  var cosip;
  var sinip;
  var cosisq;
  var delm;
  var delomg;
  var eo1;
  var argpm;
  var argpp;
  var su;
  var t3;
  var t4;
  var tc;
  var tem5;
  var temp;
  var tempa;
  var tempe;
  var templ;
  var inclm;
  var mm;
  var nm;
  var nodem;
  var xincp;
  var xlm;
  var mp;
  var nodep;
  /* ------------------ set mathematical constants --------------- */
  // sgp4fix divisor for divide by zero check on inclination
  // the old check used 1.0 + cos(pi-1.0e-9), but then compared it to
  // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency
  var temp4 = 1.5e-12;
  // --------------------- clear sgp4 error flag -----------------
  satrec.t = tsince;
  satrec.error = SatRecError.None;
  //  ------- update for secular gravity and atmospheric drag -----
  var xmdf = satrec.mo + satrec.mdot * satrec.t;
  var argpdf = satrec.argpo + satrec.argpdot * satrec.t;
  var nodedf = satrec.nodeo + satrec.nodedot * satrec.t;
  argpm = argpdf;
  mm = xmdf;
  var t2 = satrec.t * satrec.t;
  nodem = nodedf + satrec.nodecf * t2;
  tempa = 1.0 - satrec.cc1 * satrec.t;
  tempe = satrec.bstar * satrec.cc4 * satrec.t;
  templ = satrec.t2cof * t2;
  if (satrec.isimp !== 1) {
    delomg = satrec.omgcof * satrec.t;
    //  sgp4fix use mutliply for speed instead of pow
    var delmtemp = 1.0 + satrec.eta * Math.cos(xmdf);
    delm = satrec.xmcof * (delmtemp * delmtemp * delmtemp - satrec.delmo);
    temp = delomg + delm;
    mm = xmdf + temp;
    argpm = argpdf - temp;
    t3 = t2 * satrec.t;
    t4 = t3 * satrec.t;
    tempa = tempa - satrec.d2 * t2 - satrec.d3 * t3 - satrec.d4 * t4;
    tempe += satrec.bstar * satrec.cc5 * (Math.sin(mm) - satrec.sinmao);
    templ = templ + satrec.t3cof * t3 + t4 * (satrec.t4cof + satrec.t * satrec.t5cof);
  }
  nm = satrec.no;
  var em = satrec.ecco;
  inclm = satrec.inclo;
  if (satrec.method === 'd') {
    tc = satrec.t;
    var dspaceOptions = {
      irez: satrec.irez,
      d2201: satrec.d2201,
      d2211: satrec.d2211,
      d3210: satrec.d3210,
      d3222: satrec.d3222,
      d4410: satrec.d4410,
      d4422: satrec.d4422,
      d5220: satrec.d5220,
      d5232: satrec.d5232,
      d5421: satrec.d5421,
      d5433: satrec.d5433,
      dedt: satrec.dedt,
      del1: satrec.del1,
      del2: satrec.del2,
      del3: satrec.del3,
      didt: satrec.didt,
      dmdt: satrec.dmdt,
      dnodt: satrec.dnodt,
      domdt: satrec.domdt,
      argpo: satrec.argpo,
      argpdot: satrec.argpdot,
      t: satrec.t,
      tc: tc,
      gsto: satrec.gsto,
      xfact: satrec.xfact,
      xlamo: satrec.xlamo,
      no: satrec.no,
      atime: satrec.atime,
      em: em,
      argpm: argpm,
      inclm: inclm,
      xli: satrec.xli,
      mm: mm,
      xni: satrec.xni,
      nodem: nodem,
      nm: nm
    };
    var dspaceResult = dspace(dspaceOptions);
    em = dspaceResult.em;
    argpm = dspaceResult.argpm;
    inclm = dspaceResult.inclm;
    mm = dspaceResult.mm;
    nodem = dspaceResult.nodem;
    nm = dspaceResult.nm;
  }
  if (nm <= 0.0) {
    // printf("// error nm %f\n", nm);
    satrec.error = SatRecError.MeanMotionBelowZero;
    // sgp4fix add return
    return null;
  }
  var am = Math.pow(xke / nm, x2o3) * tempa * tempa;
  nm = xke / Math.pow(am, 1.5);
  em -= tempe;
  // fix tolerance for error recognition
  // sgp4fix am is fixed from the previous nm check
  if (em >= 1.0 || em < -1e-3) {
    // || (am < 0.95)
    // printf("// error em %f\n", em);
    satrec.error = SatRecError.MeanEccentricityOutOfRange;
    // sgp4fix to return if there is an error in eccentricity
    return null;
  }
  //  sgp4fix fix tolerance to avoid a divide by zero
  if (em < 1.0e-6) {
    em = 1.0e-6;
  }
  mm += satrec.no * templ;
  xlm = mm + argpm + nodem;
  nodem %= twoPi;
  argpm %= twoPi;
  xlm %= twoPi;
  mm = (xlm - argpm - nodem) % twoPi;
  var meanElements = {
    am: am,
    em: em,
    im: inclm,
    Om: nodem,
    om: argpm,
    mm: mm,
    nm: nm
  };
  // ----------------- compute extra mean quantities -------------
  var sinim = Math.sin(inclm);
  var cosim = Math.cos(inclm);
  // -------------------- add lunar-solar periodics --------------
  var ep = em;
  xincp = inclm;
  argpp = argpm;
  nodep = nodem;
  mp = mm;
  sinip = sinim;
  cosip = cosim;
  if (satrec.method === 'd') {
    var dpperParameters = {
      inclo: satrec.inclo,
      init: 'n',
      ep: ep,
      inclp: xincp,
      nodep: nodep,
      argpp: argpp,
      mp: mp,
      opsmode: satrec.operationmode
    };
    var dpperResult = dpper(satrec, dpperParameters);
    ep = dpperResult.ep;
    nodep = dpperResult.nodep;
    argpp = dpperResult.argpp;
    mp = dpperResult.mp;
    xincp = dpperResult.inclp;
    if (xincp < 0.0) {
      xincp = -xincp;
      nodep += pi;
      argpp -= pi;
    }
    if (ep < 0.0 || ep > 1.0) {
      //  printf("// error ep %f\n", ep);
      satrec.error = SatRecError.PerturbedEccentricityOutOfRange;
      //  sgp4fix add return
      return null;
    }
  }
  //  -------------------- long period periodics ------------------
  if (satrec.method === 'd') {
    sinip = Math.sin(xincp);
    cosip = Math.cos(xincp);
    satrec.aycof = -0.5 * j3oj2 * sinip;
    //  sgp4fix for divide by zero for xincp = 180 deg
    if (Math.abs(cosip + 1.0) > 1.5e-12) {
      satrec.xlcof = -0.25 * j3oj2 * sinip * (3.0 + 5.0 * cosip) / (1.0 + cosip);
    } else {
      satrec.xlcof = -0.25 * j3oj2 * sinip * (3.0 + 5.0 * cosip) / temp4;
    }
  }
  var axnl = ep * Math.cos(argpp);
  temp = 1.0 / (am * (1.0 - ep * ep));
  var aynl = ep * Math.sin(argpp) + temp * satrec.aycof;
  var xl = mp + argpp + nodep + temp * satrec.xlcof * axnl;
  // --------------------- solve kepler's equation ---------------
  var u = (xl - nodep) % twoPi;
  eo1 = u;
  tem5 = 9999.9;
  var ktr = 1;
  //    sgp4fix for kepler iteration
  //    the following iteration needs better limits on corrections
  while (Math.abs(tem5) >= 1.0e-12 && ktr <= 10) {
    sineo1 = Math.sin(eo1);
    coseo1 = Math.cos(eo1);
    tem5 = 1.0 - coseo1 * axnl - sineo1 * aynl;
    tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5;
    if (Math.abs(tem5) >= 0.95) {
      if (tem5 > 0.0) {
        tem5 = 0.95;
      } else {
        tem5 = -0.95;
      }
    }
    eo1 += tem5;
    ktr += 1;
  }
  //  ------------- short period preliminary quantities -----------
  var ecose = axnl * coseo1 + aynl * sineo1;
  var esine = axnl * sineo1 - aynl * coseo1;
  var el2 = axnl * axnl + aynl * aynl;
  var pl = am * (1.0 - el2);
  if (pl < 0.0) {
    //  printf("// error pl %f\n", pl);
    satrec.error = SatRecError.SemiLatusRectumBelowZero;
    //  sgp4fix add return
    return null;
  }
  var rl = am * (1.0 - ecose);
  var rdotl = Math.sqrt(am) * esine / rl;
  var rvdotl = Math.sqrt(pl) / rl;
  var betal = Math.sqrt(1.0 - el2);
  temp = esine / (1.0 + betal);
  var sinu = am / rl * (sineo1 - aynl - axnl * temp);
  var cosu = am / rl * (coseo1 - axnl + aynl * temp);
  su = Math.atan2(sinu, cosu);
  var sin2u = (cosu + cosu) * sinu;
  var cos2u = 1.0 - 2.0 * sinu * sinu;
  temp = 1.0 / pl;
  var temp1 = 0.5 * j2 * temp;
  var temp2 = temp1 * temp;
  // -------------- update for short period periodics ------------
  if (satrec.method === 'd') {
    cosisq = cosip * cosip;
    satrec.con41 = 3.0 * cosisq - 1.0;
    satrec.x1mth2 = 1.0 - cosisq;
    satrec.x7thm1 = 7.0 * cosisq - 1.0;
  }
  var mrt = rl * (1.0 - 1.5 * temp2 * betal * satrec.con41) + 0.5 * temp1 * satrec.x1mth2 * cos2u;
  // sgp4fix for decaying satellites
  if (mrt < 1.0) {
    // printf("// decay condition %11.6f \n",mrt);
    satrec.error = SatRecError.Decayed;
    return null;
  }
  su -= 0.25 * temp2 * satrec.x7thm1 * sin2u;
  var xnode = nodep + 1.5 * temp2 * cosip * sin2u;
  var xinc = xincp + 1.5 * temp2 * cosip * sinip * cos2u;
  var mvt = rdotl - nm * temp1 * satrec.x1mth2 * sin2u / xke;
  var rvdot = rvdotl + nm * temp1 * (satrec.x1mth2 * cos2u + 1.5 * satrec.con41) / xke;
  // --------------------- orientation vectors -------------------
  var sinsu = Math.sin(su);
  var cossu = Math.cos(su);
  var snod = Math.sin(xnode);
  var cnod = Math.cos(xnode);
  var sini = Math.sin(xinc);
  var cosi = Math.cos(xinc);
  var xmx = -snod * cosi;
  var xmy = cnod * cosi;
  var ux = xmx * sinsu + cnod * cossu;
  var uy = xmy * sinsu + snod * cossu;
  var uz = sini * sinsu;
  var vx = xmx * cossu - cnod * sinsu;
  var vy = xmy * cossu - snod * sinsu;
  var vz = sini * cossu;
  // --------- position and velocity (in km and km/sec) ----------
  var r = {
    x: mrt * ux * earthRadius,
    y: mrt * uy * earthRadius,
    z: mrt * uz * earthRadius
  };
  var v = {
    x: (mvt * ux + rvdot * vx) * vkmpersec,
    y: (mvt * uy + rvdot * vy) * vkmpersec,
    z: (mvt * uz + rvdot * vz) * vkmpersec
  };
  return {
    position: r,
    velocity: v,
    meanElements: meanElements
  };
}

/*-----------------------------------------------------------------------------
 *
 *                             procedure sgp4init
 *
 *  this procedure initializes variables for sgp4.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    opsmode     - mode of operation afspc or improved 'a', 'i'
 *    satn        - satellite number
 *    bstar       - sgp4 type drag coefficient              kg/m2er
 *    ecco        - eccentricity
 *    epoch       - epoch time in days from jan 0, 1950. 0 hr
 *    argpo       - argument of perigee (output if ds)
 *    inclo       - inclination
 *    mo          - mean anomaly (output if ds)
 *    no          - mean motion
 *    nodeo       - right ascension of ascending node
 *
 *  outputs       :
 *    rec      - common values for subsequent calls
 *    return code - non-zero on error.
 *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
 *                   2 - mean motion less than 0.0
 *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
 *                   4 - semi-latus rectum < 0.0
 *                   5 - epoch elements are sub-orbital
 *                   6 - satellite has decayed
 *
 *  locals        :
 *    cnodm  , snodm  , cosim  , sinim  , cosomm , sinomm
 *    cc1sq  , cc2    , cc3
 *    coef   , coef1
 *    cosio4      -
 *    day         -
 *    dndt        -
 *    em          - eccentricity
 *    emsq        - eccentricity squared
 *    eeta        -
 *    etasq       -
 *    gam         -
 *    argpm       - argument of perigee
 *    nodem       -
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    perige      - perigee
 *    pinvsq      -
 *    psisq       -
 *    qzms24      -
 *    rtemsq      -
 *    s1, s2, s3, s4, s5, s6, s7          -
 *    sfour       -
 *    ss1, ss2, ss3, ss4, ss5, ss6, ss7         -
 *    sz1, sz2, sz3
 *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
 *    tc          -
 *    temp        -
 *    temp1, temp2, temp3       -
 *    tsi         -
 *    xpidot      -
 *    xhdot1      -
 *    z1, z2, z3          -
 *    z11, z12, z13, z21, z22, z23, z31, z32, z33         -
 *
 *  coupling      :
 *    getgravconst-
 *    initl       -
 *    dscom       -
 *    dpper       -
 *    dsinit      -
 *    sgp4        -
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/
function sgp4init(satrecInit, options) {
  var opsmode = options.opsmode,
    epoch = options.epoch,
    xbstar = options.xbstar,
    xecco = options.xecco,
    xargpo = options.xargpo,
    xinclo = options.xinclo,
    xmo = options.xmo,
    xno = options.xno,
    xnodeo = options.xnodeo;
  var cosim;
  var sinim;
  var cc1sq;
  var cc2;
  var cc3;
  var coef;
  var coef1;
  var cosio4;
  var em;
  var emsq;
  var eeta;
  var etasq;
  var argpm;
  var nodem;
  var inclm;
  var mm;
  var nm;
  var perige;
  var pinvsq;
  var psisq;
  var qzms24;
  var s1;
  var s2;
  var s3;
  var s4;
  var s5;
  var sfour;
  var ss1;
  var ss2;
  var ss3;
  var ss4;
  var ss5;
  var sz1;
  var sz3;
  var sz11;
  var sz13;
  var sz21;
  var sz23;
  var sz31;
  var sz33;
  var tc;
  var temp;
  var temp1;
  var temp2;
  var temp3;
  var tsi;
  var xpidot;
  var xhdot1;
  var z1;
  var z3;
  var z11;
  var z13;
  var z21;
  var z23;
  var z31;
  var z33;
  /* ------------------------ initialization --------------------- */
  // sgp4fix divisor for divide by zero check on inclination
  // the old check used 1.0 + Math.cos(pi-1.0e-9), but then compared it to
  // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency
  var temp4 = 1.5e-12;
  var satrec = satrecInit;
  // ----------- set all near earth variables to zero ------------
  satrec.isimp = 0;
  satrec.method = 'n';
  satrec.aycof = 0.0;
  satrec.con41 = 0.0;
  satrec.cc1 = 0.0;
  satrec.cc4 = 0.0;
  satrec.cc5 = 0.0;
  satrec.d2 = 0.0;
  satrec.d3 = 0.0;
  satrec.d4 = 0.0;
  satrec.delmo = 0.0;
  satrec.eta = 0.0;
  satrec.argpdot = 0.0;
  satrec.omgcof = 0.0;
  satrec.sinmao = 0.0;
  satrec.t = 0.0;
  satrec.t2cof = 0.0;
  satrec.t3cof = 0.0;
  satrec.t4cof = 0.0;
  satrec.t5cof = 0.0;
  satrec.x1mth2 = 0.0;
  satrec.x7thm1 = 0.0;
  satrec.mdot = 0.0;
  satrec.nodedot = 0.0;
  satrec.xlcof = 0.0;
  satrec.xmcof = 0.0;
  satrec.nodecf = 0.0;
  // ----------- set all deep space variables to zero ------------
  satrec.irez = 0;
  satrec.d2201 = 0.0;
  satrec.d2211 = 0.0;
  satrec.d3210 = 0.0;
  satrec.d3222 = 0.0;
  satrec.d4410 = 0.0;
  satrec.d4422 = 0.0;
  satrec.d5220 = 0.0;
  satrec.d5232 = 0.0;
  satrec.d5421 = 0.0;
  satrec.d5433 = 0.0;
  satrec.dedt = 0.0;
  satrec.del1 = 0.0;
  satrec.del2 = 0.0;
  satrec.del3 = 0.0;
  satrec.didt = 0.0;
  satrec.dmdt = 0.0;
  satrec.dnodt = 0.0;
  satrec.domdt = 0.0;
  satrec.e3 = 0.0;
  satrec.ee2 = 0.0;
  satrec.peo = 0.0;
  satrec.pgho = 0.0;
  satrec.pho = 0.0;
  satrec.pinco = 0.0;
  satrec.plo = 0.0;
  satrec.se2 = 0.0;
  satrec.se3 = 0.0;
  satrec.sgh2 = 0.0;
  satrec.sgh3 = 0.0;
  satrec.sgh4 = 0.0;
  satrec.sh2 = 0.0;
  satrec.sh3 = 0.0;
  satrec.si2 = 0.0;
  satrec.si3 = 0.0;
  satrec.sl2 = 0.0;
  satrec.sl3 = 0.0;
  satrec.sl4 = 0.0;
  satrec.gsto = 0.0;
  satrec.xfact = 0.0;
  satrec.xgh2 = 0.0;
  satrec.xgh3 = 0.0;
  satrec.xgh4 = 0.0;
  satrec.xh2 = 0.0;
  satrec.xh3 = 0.0;
  satrec.xi2 = 0.0;
  satrec.xi3 = 0.0;
  satrec.xl2 = 0.0;
  satrec.xl3 = 0.0;
  satrec.xl4 = 0.0;
  satrec.xlamo = 0.0;
  satrec.zmol = 0.0;
  satrec.zmos = 0.0;
  satrec.atime = 0.0;
  satrec.xli = 0.0;
  satrec.xni = 0.0;
  // sgp4fix - note the following variables are also passed directly via satrec.
  // it is possible to streamline the sgp4init call by deleting the "x"
  // variables, but the user would need to set the satrec.* values first. we
  // include the additional assignments in case twoline2rv is not used.
  satrec.bstar = xbstar;
  satrec.ecco = xecco;
  satrec.argpo = xargpo;
  satrec.inclo = xinclo;
  satrec.mo = xmo;
  satrec.no = xno;
  satrec.nodeo = xnodeo;
  //  sgp4fix add opsmode
  satrec.operationmode = opsmode;
  // ------------------------ earth constants -----------------------
  // sgp4fix identify constants and allow alternate values
  var ss = 78.0 / earthRadius + 1.0;
  // sgp4fix use multiply for speed instead of pow
  var qzms2ttemp = (120.0 - 78.0) / earthRadius;
  var qzms2t = qzms2ttemp * qzms2ttemp * qzms2ttemp * qzms2ttemp;
  satrec.init = 'y';
  satrec.t = 0.0;
  var initlOptions = {
    ecco: satrec.ecco,
    epoch: epoch,
    inclo: satrec.inclo,
    no: satrec.no,
    method: satrec.method,
    opsmode: satrec.operationmode
  };
  var initlResult = initl(initlOptions);
  var ao = initlResult.ao,
    con42 = initlResult.con42,
    cosio = initlResult.cosio,
    cosio2 = initlResult.cosio2,
    eccsq = initlResult.eccsq,
    omeosq = initlResult.omeosq,
    posq = initlResult.posq,
    rp = initlResult.rp,
    rteosq = initlResult.rteosq,
    sinio = initlResult.sinio;
  satrec.no = initlResult.no;
  satrec.con41 = initlResult.con41;
  satrec.gsto = initlResult.gsto;
  satrec.a = Math.pow(satrec.no * tumin, -2 / 3.0);
  satrec.alta = satrec.a * (1.0 + satrec.ecco) - 1.0;
  satrec.altp = satrec.a * (1.0 - satrec.ecco) - 1.0;
  satrec.error = 0;
  // sgp4fix remove this check as it is unnecessary
  // the mrt check in sgp4 handles decaying satellite cases even if the starting
  // condition is below the surface of te earth
  // if (rp < 1.0)
  // {
  //   printf("// *** satn%d epoch elts sub-orbital ***\n", satn);
  //   satrec.error = 5;
  // }
  if (omeosq >= 0.0 || satrec.no >= 0.0) {
    satrec.isimp = 0;
    if (rp < 220.0 / earthRadius + 1.0) {
      satrec.isimp = 1;
    }
    sfour = ss;
    qzms24 = qzms2t;
    perige = (rp - 1.0) * earthRadius;
    // - for perigees below 156 km, s and qoms2t are altered -
    if (perige < 156.0) {
      sfour = perige - 78.0;
      if (perige < 98.0) {
        sfour = 20.0;
      }
      // sgp4fix use multiply for speed instead of pow
      var qzms24temp = (120.0 - sfour) / earthRadius;
      qzms24 = qzms24temp * qzms24temp * qzms24temp * qzms24temp;
      sfour = sfour / earthRadius + 1.0;
    }
    pinvsq = 1.0 / posq;
    tsi = 1.0 / (ao - sfour);
    satrec.eta = ao * satrec.ecco * tsi;
    etasq = satrec.eta * satrec.eta;
    eeta = satrec.ecco * satrec.eta;
    psisq = Math.abs(1.0 - etasq);
    coef = qzms24 * Math.pow(tsi, 4.0);
    coef1 = coef / Math.pow(psisq, 3.5);
    cc2 = coef1 * satrec.no * (ao * (1.0 + 1.5 * etasq + eeta * (4.0 + etasq)) + 0.375 * j2 * tsi / psisq * satrec.con41 * (8.0 + 3.0 * etasq * (8.0 + etasq)));
    satrec.cc1 = satrec.bstar * cc2;
    cc3 = 0.0;
    if (satrec.ecco > 1.0e-4) {
      cc3 = -2 * coef * tsi * j3oj2 * satrec.no * sinio / satrec.ecco;
    }
    satrec.x1mth2 = 1.0 - cosio2;
    satrec.cc4 = 2.0 * satrec.no * coef1 * ao * omeosq * (satrec.eta * (2.0 + 0.5 * etasq) + satrec.ecco * (0.5 + 2.0 * etasq) - j2 * tsi / (ao * psisq) * (-3 * satrec.con41 * (1.0 - 2.0 * eeta + etasq * (1.5 - 0.5 * eeta)) + 0.75 * satrec.x1mth2 * (2.0 * etasq - eeta * (1.0 + etasq)) * Math.cos(2.0 * satrec.argpo)));
    satrec.cc5 = 2.0 * coef1 * ao * omeosq * (1.0 + 2.75 * (etasq + eeta) + eeta * etasq);
    cosio4 = cosio2 * cosio2;
    temp1 = 1.5 * j2 * pinvsq * satrec.no;
    temp2 = 0.5 * temp1 * j2 * pinvsq;
    temp3 = -0.46875 * j4 * pinvsq * pinvsq * satrec.no;
    satrec.mdot = satrec.no + 0.5 * temp1 * rteosq * satrec.con41 + 0.0625 * temp2 * rteosq * (13.0 - 78.0 * cosio2 + 137.0 * cosio4);
    satrec.argpdot = -0.5 * temp1 * con42 + 0.0625 * temp2 * (7.0 - 114.0 * cosio2 + 395.0 * cosio4) + temp3 * (3.0 - 36.0 * cosio2 + 49.0 * cosio4);
    xhdot1 = -temp1 * cosio;
    satrec.nodedot = xhdot1 + (0.5 * temp2 * (4.0 - 19.0 * cosio2) + 2.0 * temp3 * (3.0 - 7.0 * cosio2)) * cosio;
    xpidot = satrec.argpdot + satrec.nodedot;
    satrec.omgcof = satrec.bstar * cc3 * Math.cos(satrec.argpo);
    satrec.xmcof = 0.0;
    if (satrec.ecco > 1.0e-4) {
      satrec.xmcof = -x2o3 * coef * satrec.bstar / eeta;
    }
    satrec.nodecf = 3.5 * omeosq * xhdot1 * satrec.cc1;
    satrec.t2cof = 1.5 * satrec.cc1;
    // sgp4fix for divide by zero with xinco = 180 deg
    if (Math.abs(cosio + 1.0) > 1.5e-12) {
      satrec.xlcof = -0.25 * j3oj2 * sinio * (3.0 + 5.0 * cosio) / (1.0 + cosio);
    } else {
      satrec.xlcof = -0.25 * j3oj2 * sinio * (3.0 + 5.0 * cosio) / temp4;
    }
    satrec.aycof = -0.5 * j3oj2 * sinio;
    // sgp4fix use multiply for speed instead of pow
    var delmotemp = 1.0 + satrec.eta * Math.cos(satrec.mo);
    satrec.delmo = delmotemp * delmotemp * delmotemp;
    satrec.sinmao = Math.sin(satrec.mo);
    satrec.x7thm1 = 7.0 * cosio2 - 1.0;
    // --------------- deep space initialization -------------
    if (2 * pi / satrec.no >= 225.0) {
      satrec.method = 'd';
      satrec.isimp = 1;
      tc = 0.0;
      inclm = satrec.inclo;
      var dscomOptions = {
        epoch: epoch,
        ep: satrec.ecco,
        argpp: satrec.argpo,
        tc: tc,
        inclp: satrec.inclo,
        nodep: satrec.nodeo,
        np: satrec.no,
        e3: satrec.e3,
        ee2: satrec.ee2,
        peo: satrec.peo,
        pgho: satrec.pgho,
        pho: satrec.pho,
        pinco: satrec.pinco,
        plo: satrec.plo,
        se2: satrec.se2,
        se3: satrec.se3,
        sgh2: satrec.sgh2,
        sgh3: satrec.sgh3,
        sgh4: satrec.sgh4,
        sh2: satrec.sh2,
        sh3: satrec.sh3,
        si2: satrec.si2,
        si3: satrec.si3,
        sl2: satrec.sl2,
        sl3: satrec.sl3,
        sl4: satrec.sl4,
        xgh2: satrec.xgh2,
        xgh3: satrec.xgh3,
        xgh4: satrec.xgh4,
        xh2: satrec.xh2,
        xh3: satrec.xh3,
        xi2: satrec.xi2,
        xi3: satrec.xi3,
        xl2: satrec.xl2,
        xl3: satrec.xl3,
        xl4: satrec.xl4,
        zmol: satrec.zmol,
        zmos: satrec.zmos
      };
      var dscomResult = dscom(dscomOptions);
      satrec.e3 = dscomResult.e3;
      satrec.ee2 = dscomResult.ee2;
      satrec.peo = dscomResult.peo;
      satrec.pgho = dscomResult.pgho;
      satrec.pho = dscomResult.pho;
      satrec.pinco = dscomResult.pinco;
      satrec.plo = dscomResult.plo;
      satrec.se2 = dscomResult.se2;
      satrec.se3 = dscomResult.se3;
      satrec.sgh2 = dscomResult.sgh2;
      satrec.sgh3 = dscomResult.sgh3;
      satrec.sgh4 = dscomResult.sgh4;
      satrec.sh2 = dscomResult.sh2;
      satrec.sh3 = dscomResult.sh3;
      satrec.si2 = dscomResult.si2;
      satrec.si3 = dscomResult.si3;
      satrec.sl2 = dscomResult.sl2;
      satrec.sl3 = dscomResult.sl3;
      satrec.sl4 = dscomResult.sl4;
      sinim = dscomResult.sinim;
      cosim = dscomResult.cosim;
      em = dscomResult.em;
      emsq = dscomResult.emsq;
      s1 = dscomResult.s1;
      s2 = dscomResult.s2;
      s3 = dscomResult.s3;
      s4 = dscomResult.s4;
      s5 = dscomResult.s5;
      ss1 = dscomResult.ss1;
      ss2 = dscomResult.ss2;
      ss3 = dscomResult.ss3;
      ss4 = dscomResult.ss4;
      ss5 = dscomResult.ss5;
      sz1 = dscomResult.sz1;
      sz3 = dscomResult.sz3;
      sz11 = dscomResult.sz11;
      sz13 = dscomResult.sz13;
      sz21 = dscomResult.sz21;
      sz23 = dscomResult.sz23;
      sz31 = dscomResult.sz31;
      sz33 = dscomResult.sz33;
      satrec.xgh2 = dscomResult.xgh2;
      satrec.xgh3 = dscomResult.xgh3;
      satrec.xgh4 = dscomResult.xgh4;
      satrec.xh2 = dscomResult.xh2;
      satrec.xh3 = dscomResult.xh3;
      satrec.xi2 = dscomResult.xi2;
      satrec.xi3 = dscomResult.xi3;
      satrec.xl2 = dscomResult.xl2;
      satrec.xl3 = dscomResult.xl3;
      satrec.xl4 = dscomResult.xl4;
      satrec.zmol = dscomResult.zmol;
      satrec.zmos = dscomResult.zmos;
      nm = dscomResult.nm;
      z1 = dscomResult.z1;
      z3 = dscomResult.z3;
      z11 = dscomResult.z11;
      z13 = dscomResult.z13;
      z21 = dscomResult.z21;
      z23 = dscomResult.z23;
      z31 = dscomResult.z31;
      z33 = dscomResult.z33;
      var dpperOptions = {
        inclo: inclm,
        init: satrec.init,
        ep: satrec.ecco,
        inclp: satrec.inclo,
        nodep: satrec.nodeo,
        argpp: satrec.argpo,
        mp: satrec.mo,
        opsmode: satrec.operationmode
      };
      var dpperResult = dpper(satrec, dpperOptions);
      satrec.ecco = dpperResult.ep;
      satrec.inclo = dpperResult.inclp;
      satrec.nodeo = dpperResult.nodep;
      satrec.argpo = dpperResult.argpp;
      satrec.mo = dpperResult.mp;
      argpm = 0.0;
      nodem = 0.0;
      mm = 0.0;
      var dsinitOptions = {
        cosim: cosim,
        emsq: emsq,
        argpo: satrec.argpo,
        s1: s1,
        s2: s2,
        s3: s3,
        s4: s4,
        s5: s5,
        sinim: sinim,
        ss1: ss1,
        ss2: ss2,
        ss3: ss3,
        ss4: ss4,
        ss5: ss5,
        sz1: sz1,
        sz3: sz3,
        sz11: sz11,
        sz13: sz13,
        sz21: sz21,
        sz23: sz23,
        sz31: sz31,
        sz33: sz33,
        t: satrec.t,
        tc: tc,
        gsto: satrec.gsto,
        mo: satrec.mo,
        mdot: satrec.mdot,
        no: satrec.no,
        nodeo: satrec.nodeo,
        nodedot: satrec.nodedot,
        xpidot: xpidot,
        z1: z1,
        z3: z3,
        z11: z11,
        z13: z13,
        z21: z21,
        z23: z23,
        z31: z31,
        z33: z33,
        ecco: satrec.ecco,
        eccsq: eccsq,
        em: em,
        argpm: argpm,
        inclm: inclm,
        mm: mm,
        nm: nm,
        nodem: nodem,
        irez: satrec.irez,
        atime: satrec.atime,
        d2201: satrec.d2201,
        d2211: satrec.d2211,
        d3210: satrec.d3210,
        d3222: satrec.d3222,
        d4410: satrec.d4410,
        d4422: satrec.d4422,
        d5220: satrec.d5220,
        d5232: satrec.d5232,
        d5421: satrec.d5421,
        d5433: satrec.d5433,
        dedt: satrec.dedt,
        didt: satrec.didt,
        dmdt: satrec.dmdt,
        dnodt: satrec.dnodt,
        domdt: satrec.domdt,
        del1: satrec.del1,
        del2: satrec.del2,
        del3: satrec.del3,
        xfact: satrec.xfact,
        xlamo: satrec.xlamo,
        xli: satrec.xli,
        xni: satrec.xni
      };
      var dsinitResult = dsinit(dsinitOptions);
      satrec.irez = dsinitResult.irez;
      satrec.atime = dsinitResult.atime;
      satrec.d2201 = dsinitResult.d2201;
      satrec.d2211 = dsinitResult.d2211;
      satrec.d3210 = dsinitResult.d3210;
      satrec.d3222 = dsinitResult.d3222;
      satrec.d4410 = dsinitResult.d4410;
      satrec.d4422 = dsinitResult.d4422;
      satrec.d5220 = dsinitResult.d5220;
      satrec.d5232 = dsinitResult.d5232;
      satrec.d5421 = dsinitResult.d5421;
      satrec.d5433 = dsinitResult.d5433;
      satrec.dedt = dsinitResult.dedt;
      satrec.didt = dsinitResult.didt;
      satrec.dmdt = dsinitResult.dmdt;
      satrec.dnodt = dsinitResult.dnodt;
      satrec.domdt = dsinitResult.domdt;
      satrec.del1 = dsinitResult.del1;
      satrec.del2 = dsinitResult.del2;
      satrec.del3 = dsinitResult.del3;
      satrec.xfact = dsinitResult.xfact;
      satrec.xlamo = dsinitResult.xlamo;
      satrec.xli = dsinitResult.xli;
      satrec.xni = dsinitResult.xni;
    }
    // ----------- set variables if not deep space -----------
    if (satrec.isimp !== 1) {
      cc1sq = satrec.cc1 * satrec.cc1;
      satrec.d2 = 4.0 * ao * tsi * cc1sq;
      temp = satrec.d2 * tsi * satrec.cc1 / 3.0;
      satrec.d3 = (17.0 * ao + sfour) * temp;
      satrec.d4 = 0.5 * temp * ao * tsi * (221.0 * ao + 31.0 * sfour) * satrec.cc1;
      satrec.t3cof = satrec.d2 + 2.0 * cc1sq;
      satrec.t4cof = 0.25 * (3.0 * satrec.d3 + satrec.cc1 * (12.0 * satrec.d2 + 10.0 * cc1sq));
      satrec.t5cof = 0.2 * (3.0 * satrec.d4 + 12.0 * satrec.cc1 * satrec.d3 + 6.0 * satrec.d2 * satrec.d2 + 15.0 * cc1sq * (2.0 * satrec.d2 + cc1sq));
    }
    /* finally propogate to zero epoch to initialize all others. */
    // sgp4fix take out check to let satellites process until they are actually below earth surface
    // if(satrec.error == 0)
  }
  sgp4(satrec, 0);
  satrec.init = 'n';
}

/* -----------------------------------------------------------------------------
 *
 *                           function twoline2satrec
 *
 *  this function converts the two line element set character string data to
 *    variables and initializes the sgp4 variables. several intermediate varaibles
 *    and quantities are determined. note that the result is a structure so multiple
 *    satellites can be processed simultaneously without having to reinitialize. the
 *    verification mode is an important option that permits quick checks of any
 *    changes to the underlying technical theory. this option works using a
 *    modified tle file in which the start, stop, and delta time values are
 *    included at the end of the second line of data. this only works with the
 *    verification mode. the catalog mode simply propagates from -1440 to 1440 min
 *    from epoch and is useful when performing entire catalog runs.
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs        :
 *    longstr1    - first line of the tle
 *    longstr2    - second line of the tle
 *    typerun     - type of run                    verification 'v', catalog 'c',
 *                                                 manual 'm'
 *    typeinput   - type of manual input           mfe 'm', epoch 'e', dayofyr 'd'
 *    opsmode     - mode of operation afspc or improved 'a', 'i'
 *    whichconst  - which set of constants to use  72, 84
 *
 *  outputs       :
 *    satrec      - structure containing all the sgp4 satellite information
 *
 *  coupling      :
 *    getgravconst-
 *    days2mdhms  - conversion of days to month, day, hour, minute, second
 *    jday        - convert day month year hour minute second into julian date
 *    sgp4init    - initialize the sgp4 variables
 *
 *  references    :
 *    norad spacetrack report #3
 *    vallado, crawford, hujsak, kelso  2006
 --------------------------------------------------------------------------- */
/**
 * Return a Satellite imported from two lines of TLE data.
 *
 * Provide the two TLE lines as strings `tleLine1` and `tleLine2`,
 * and select which standard set of gravitational constants you want
 * by providing `gravity_constants`:
 *
 * `sgp4.propagation.wgs72` - Standard WGS 72 model
 * `sgp4.propagation.wgs84` - More recent WGS 84 model
 * `sgp4.propagation.wgs72old` - Legacy support for old SGP4 behavior
 *
 * Normally, computations are made using letious recent improvements
 * to the algorithm.  If you want to turn some of these off and go
 * back into "afspc" mode, then set `afspc_mode` to `True`.
 */
function twoline2satrec(longstr1, longstr2) {
  var opsmode = 'i';
  var error = 0;
  var satnum = longstr1.substring(2, 7);
  var epochyr = parseInt(longstr1.substring(18, 20), 10);
  var epochdays = parseFloat(longstr1.substring(20, 32));
  var ndot = parseFloat(longstr1.substring(33, 43));
  var nddot = parseFloat("".concat(longstr1.substring(44, 45), ".").concat(longstr1.substring(45, 50), "E").concat(longstr1.substring(50, 52)));
  var bstar = parseFloat("".concat(longstr1.substring(53, 54), ".").concat(longstr1.substring(54, 59), "E").concat(longstr1.substring(59, 61)));
  // satrec.satnum = longstr2.substring(2, 7);
  // ---- find standard orbital elements ----
  var inclo = parseFloat(longstr2.substring(8, 16)) * deg2rad;
  var nodeo = parseFloat(longstr2.substring(17, 25)) * deg2rad;
  var ecco = parseFloat(".".concat(longstr2.substring(26, 33)));
  var argpo = parseFloat(longstr2.substring(34, 42)) * deg2rad;
  var mo = parseFloat(longstr2.substring(43, 51)) * deg2rad;
  // ---- find no, ndot, nddot ----
  var no = parseFloat(longstr2.substring(52, 63)) / xpdotp;
  // satrec.nddot= satrec.nddot * Math.pow(10.0, nexp);
  // satrec.bstar= satrec.bstar * Math.pow(10.0, ibexp);
  // ---- convert to sgp4 units ----
  // satrec.ndot /= (xpdotp * 1440.0); // ? * minperday
  // satrec.nddot /= (xpdotp * 1440.0 * 1440);
  // ----------------------------------------------------------------
  // find sgp4epoch time of element set
  // remember that sgp4 uses units of days from 0 jan 1950 (sgp4epoch)
  // and minutes from the epoch (time)
  // ----------------------------------------------------------------
  // ---------------- temp fix for years from 1957-2056 -------------------
  // --------- correct fix will occur when year is 4-digit in tle ---------
  var year = epochyr < 57 ? epochyr + 2000 : epochyr + 1900;
  var mdhmsResult = days2mdhms(year, epochdays);
  var mon = mdhmsResult.mon,
    day = mdhmsResult.day,
    hr = mdhmsResult.hr,
    minute = mdhmsResult.minute,
    sec = mdhmsResult.sec;
  var jdsatepoch = jday(year, mon, day, hr, minute, sec);
  var satrec = {
    error: error,
    satnum: satnum,
    epochyr: epochyr,
    epochdays: epochdays,
    ndot: ndot,
    nddot: nddot,
    bstar: bstar,
    inclo: inclo,
    nodeo: nodeo,
    ecco: ecco,
    argpo: argpo,
    mo: mo,
    no: no,
    jdsatepoch: jdsatepoch
  };
  //  ---------------- initialize the orbit at sgp4epoch -------------------
  sgp4init(satrec, {
    opsmode: opsmode,
    satn: satrec.satnum,
    epoch: satrec.jdsatepoch - 2433281.5,
    xbstar: satrec.bstar,
    xecco: satrec.ecco,
    xargpo: satrec.argpo,
    xinclo: satrec.inclo,
    xmo: satrec.mo,
    xno: satrec.no,
    xnodeo: satrec.nodeo
  });
  return satrec;
}

function propagate(satrec) {
  for (var _len = arguments.length, jdayArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    jdayArgs[_key - 1] = arguments[_key];
  }
  // Return a position and velocity vector for a given date and time.
  var j = jday.apply(void 0, jdayArgs);
  var m = (j - satrec.jdsatepoch) * minutesPerDay;
  return sgp4(satrec, m);
}

var earthRotation = 7.292115E-5;
var c = 299792.458; // Speed of light in km/s
/**
 * Negative range rate means the satellite is moving towards the observer and
 * its frequency is shifted higher because 1 minus a negative range rate is
 * positive. If the range rate is positive, the satellite is moving away from
 * the observer and its frequency is shifted lower.
 */
function dopplerFactor(observerCoordsEcf, positionEcf, velocityEcf) {
  var rangeX = positionEcf.x - observerCoordsEcf.x;
  var rangeY = positionEcf.y - observerCoordsEcf.y;
  var rangeZ = positionEcf.z - observerCoordsEcf.z;
  var length = Math.sqrt(Math.pow(rangeX, 2) + Math.pow(rangeY, 2) + Math.pow(rangeZ, 2));
  var rangeVel = {
    x: velocityEcf.x + earthRotation * observerCoordsEcf.y,
    y: velocityEcf.y - earthRotation * observerCoordsEcf.x,
    z: velocityEcf.z
  };
  var rangeRate = (rangeX * rangeVel.x + rangeY * rangeVel.y + rangeZ * rangeVel.z) / length;
  return 1 - rangeRate / c;
}

function radiansToDegrees(radians) {
  return radians * rad2deg;
}
function degreesToRadians(degrees) {
  return degrees * deg2rad;
}
function degreesLat(radians) {
  if (radians < -pi / 2 || radians > pi / 2) {
    throw new RangeError('Latitude radians must be in range [-pi/2; pi/2].');
  }
  return radiansToDegrees(radians);
}
function degreesLong(radians) {
  if (radians < -pi || radians > pi) {
    throw new RangeError('Longitude radians must be in range [-pi; pi].');
  }
  return radiansToDegrees(radians);
}
function geodeticToEcf(_ref) {
  var longitude = _ref.longitude,
    latitude = _ref.latitude,
    height = _ref.height;
  var a = 6378.137;
  var b = 6356.7523142;
  var f = (a - b) / a;
  var e2 = 2 * f - f * f;
  var normal = a / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
  var x = (normal + height) * Math.cos(latitude) * Math.cos(longitude);
  var y = (normal + height) * Math.cos(latitude) * Math.sin(longitude);
  var z = (normal * (1 - e2) + height) * Math.sin(latitude);
  return {
    x: x,
    y: y,
    z: z
  };
}
function eciToGeodetic(eci, gmst) {
  // http://www.celestrak.com/columns/v02n03/
  var a = 6378.137;
  var b = 6356.7523142;
  var R = Math.sqrt(eci.x * eci.x + eci.y * eci.y);
  var f = (a - b) / a;
  var e2 = 2 * f - f * f;
  var longitude = Math.atan2(eci.y, eci.x) - gmst;
  while (longitude < -pi) {
    longitude += twoPi;
  }
  while (longitude > pi) {
    longitude -= twoPi;
  }
  var kmax = 20;
  var k = 0;
  var latitude = Math.atan2(eci.z, Math.sqrt(eci.x * eci.x + eci.y * eci.y));
  var C;
  while (k++ < kmax) {
    C = 1 / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
    latitude = Math.atan2(eci.z + a * C * e2 * Math.sin(latitude), R);
  }
  var height = R / Math.cos(latitude) - a * C;
  return {
    longitude: longitude,
    latitude: latitude,
    height: height
  };
}
function eciToEcf(eci, gmst) {
  // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
  //
  // [X]     [C -S  0][X]
  // [Y]  =  [S  C  0][Y]
  // [Z]eci  [0  0  1][Z]ecf
  //
  //
  // Inverse:
  // [X]     [C  S  0][X]
  // [Y]  =  [-S C  0][Y]
  // [Z]ecf  [0  0  1][Z]eci
  var x = eci.x * Math.cos(gmst) + eci.y * Math.sin(gmst);
  var y = eci.x * -Math.sin(gmst) + eci.y * Math.cos(gmst);
  var z = eci.z;
  return {
    x: x,
    y: y,
    z: z
  };
}
function topocentric(observerGeodetic, satelliteEcf) {
  // http://www.celestrak.com/columns/v02n02/
  // TS Kelso's method, except I'm using ECF frame
  // and he uses ECI.
  var longitude = observerGeodetic.longitude,
    latitude = observerGeodetic.latitude;
  var observerEcf = geodeticToEcf(observerGeodetic);
  var rx = satelliteEcf.x - observerEcf.x;
  var ry = satelliteEcf.y - observerEcf.y;
  var rz = satelliteEcf.z - observerEcf.z;
  var topS = Math.sin(latitude) * Math.cos(longitude) * rx + Math.sin(latitude) * Math.sin(longitude) * ry - Math.cos(latitude) * rz;
  var topE = -Math.sin(longitude) * rx + Math.cos(longitude) * ry;
  var topZ = Math.cos(latitude) * Math.cos(longitude) * rx + Math.cos(latitude) * Math.sin(longitude) * ry + Math.sin(latitude) * rz;
  return {
    topS: topS,
    topE: topE,
    topZ: topZ
  };
}
function topocentricToLookAngles(tc) {
  var topS = tc.topS,
    topE = tc.topE,
    topZ = tc.topZ;
  var rangeSat = Math.sqrt(topS * topS + topE * topE + topZ * topZ);
  var El = Math.asin(topZ / rangeSat);
  var Az = Math.atan2(-topE, topS) + pi;
  return {
    azimuth: Az,
    elevation: El,
    rangeSat: rangeSat // Range in km
  };
}
function ecfToLookAngles(observerGeodetic, satelliteEcf) {
  var topocentricCoords = topocentric(observerGeodetic, satelliteEcf);
  return topocentricToLookAngles(topocentricCoords);
}

/**
 * Orbital Calculations Module
 *
 * Provides comprehensive satellite orbital mechanics calculations including:
 * - SGP4/SDP4 propagation for position/velocity prediction
 * - Position calculations at epoch and future times
 * - Visibility window calculations for ground observers
 * - Look angles (azimuth, elevation, range) computation
 * - Doppler shift calculations for radio operators
 * - Eclipse predictions (satellite in Earth shadow)
 * - Ground track generation
 * - Orbital period and derived parameters
 * - Satellite conjunction predictions
 * - Station-keeping maneuver detection
 *
 * Based on the SGP4/SDP4 propagation model via satellite.js library
 */
// ============================================================================
// SATELLITE RECORD INITIALIZATION
// ============================================================================
/**
 * Initialize a satellite record from parsed TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Satellite record for propagation, or null if initialization fails
 */
function initializeSatelliteRecord(tle) {
    try {
        // Extract line 1 and line 2 from the parsed TLE
        // Line 1: starts with "1 ", 69 characters total
        const line1Parts = [
            '1',
            tle.satelliteNumber1.padStart(5, ' '),
            tle.classification,
            ' ',
            tle.internationalDesignatorYear.padStart(2, ' '),
            tle.internationalDesignatorLaunchNumber.padStart(3, ' '),
            tle.internationalDesignatorPiece.padEnd(3, ' '),
            ' ',
            tle.epochYear.padStart(2, ' '),
            tle.epoch.padStart(12, ' '),
            ' ',
            tle.firstDerivative.padStart(10, ' '),
            ' ',
            tle.secondDerivative.padStart(8, ' '),
            ' ',
            tle.bStar.padStart(8, ' '),
            ' ',
            tle.ephemerisType,
            ' ',
            tle.elementSetNumber.padStart(4, ' '),
            tle.checksum1,
        ];
        // Line 2: starts with "2 ", 69 characters total
        const line2Parts = [
            '2',
            tle.satelliteNumber2.padStart(5, ' '),
            ' ',
            tle.inclination.padStart(8, ' '),
            ' ',
            tle.rightAscension.padStart(8, ' '),
            ' ',
            tle.eccentricity.padStart(7, ' '),
            ' ',
            tle.argumentOfPerigee.padStart(8, ' '),
            ' ',
            tle.meanAnomaly.padStart(8, ' '),
            ' ',
            tle.meanMotion.padStart(11, ' '),
            tle.revolutionNumber.padStart(5, ' '),
            tle.checksum2,
        ];
        const line1 = line1Parts.join('');
        const line2 = line2Parts.join('');
        // Initialize satellite record using satellite.js
        const satrec = twoline2satrec(line1, line2);
        // Check for initialization errors
        if (satrec.error) {
            console.error(`Satellite record initialization error: ${satrec.error}`);
            return null;
        }
        return satrec;
    }
    catch (error) {
        console.error('Failed to initialize satellite record:', error);
        return null;
    }
}
// ============================================================================
// POSITION AND VELOCITY CALCULATIONS
// ============================================================================
/**
 * Calculate satellite position at TLE epoch
 *
 * @param tle - Parsed TLE data
 * @returns Satellite state at epoch, or null if calculation fails
 */
function getPositionAtEpoch(tle) {
    const satrec = initializeSatelliteRecord(tle);
    if (!satrec)
        return null;
    // Calculate epoch date
    const epochYear = parseInt(tle.epochYear);
    const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
    const epochDay = parseFloat(tle.epoch);
    const dayOfYear = Math.floor(epochDay);
    const fractionalDay = epochDay - dayOfYear;
    const epochDate = new Date(Date.UTC(fullYear, 0, dayOfYear));
    epochDate.setUTCMilliseconds(fractionalDay * 86400000);
    return getPositionAtTime(tle, epochDate);
}
/**
 * Calculate satellite position and velocity at a specific time
 *
 * @param tle - Parsed TLE data
 * @param date - Time for calculation
 * @returns Satellite state at the specified time, or null if calculation fails
 */
function getPositionAtTime(tle, date) {
    const satrec = initializeSatelliteRecord(tle);
    if (!satrec)
        return null;
    // Propagate to the specified time
    const positionAndVelocity = propagate(satrec, date);
    if (!positionAndVelocity || !positionAndVelocity.position || !positionAndVelocity.velocity) {
        return null;
    }
    const position = positionAndVelocity.position;
    const velocity = positionAndVelocity.velocity;
    // Calculate GMST for coordinate transformations
    const gmst = gstime(date);
    // Convert to geodetic coordinates
    const positionGd = eciToGeodetic(position, gmst);
    const geographicLocation = {
        latitude: degreesLat(positionGd.latitude),
        longitude: degreesLong(positionGd.longitude),
        altitude: positionGd.height,
    };
    return {
        timestamp: date,
        position,
        velocity,
        geographicLocation,
        altitude: positionGd.height,
    };
}
/**
 * Predict future satellite positions
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for predictions
 * @param endTime - End time for predictions
 * @param stepSeconds - Time step between predictions in seconds
 * @returns Array of satellite states, or null if calculation fails
 */
function predictFuturePositions(tle, startTime, endTime, stepSeconds = 60) {
    const satrec = initializeSatelliteRecord(tle);
    if (!satrec)
        return null;
    const states = [];
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
        const date = new Date(timeMs);
        const state = getPositionAtTime(tle, date);
        if (state) {
            states.push(state);
        }
    }
    return states;
}
// ============================================================================
// LOOK ANGLES AND VISIBILITY
// ============================================================================
/**
 * Calculate look angles from observer to satellite
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @returns Look angles, or null if calculation fails
 */
function calculateLookAngles(tle, observerLocation, date) {
    const state = getPositionAtTime(tle, date);
    if (!state)
        return null;
    // Calculate GMST
    const gmst = gstime(date);
    // Convert observer location to geodetic (radians)
    const observerGd = {
        latitude: degreesToRadians(observerLocation.latitude),
        longitude: degreesToRadians(observerLocation.longitude),
        height: observerLocation.altitude,
    };
    // Convert satellite position to ECF
    const positionEcf = eciToEcf(state.position, gmst);
    // Calculate look angles
    const lookAngles = ecfToLookAngles(observerGd, positionEcf);
    return {
        azimuth: lookAngles.azimuth * (180 / Math.PI), // Convert radians to degrees
        elevation: lookAngles.elevation * (180 / Math.PI), // Convert radians to degrees
        range: lookAngles.rangeSat,
    };
}
/**
 * Calculate visibility windows for satellite passes over a ground location
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param startTime - Start time for search
 * @param endTime - End time for search
 * @param minElevation - Minimum elevation angle in degrees (default 0)
 * @returns Array of visibility windows
 */
function calculateVisibilityWindows(tle, observerLocation, startTime, endTime, minElevation = 0) {
    const windows = [];
    const stepSeconds = 10; // Check every 10 seconds
    let inPass = false;
    let passStart = null;
    let maxElevation = -90;
    let maxElevationTime = null;
    let aosAngles = null;
    let tcaAngles = null;
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
        const date = new Date(timeMs);
        const angles = calculateLookAngles(tle, observerLocation, date);
        if (!angles)
            continue;
        if (angles.elevation >= minElevation) {
            if (!inPass) {
                // Start of pass (AOS)
                inPass = true;
                passStart = date;
                maxElevation = angles.elevation;
                maxElevationTime = date;
                aosAngles = angles;
                tcaAngles = angles;
            }
            else {
                // During pass - track maximum elevation
                if (angles.elevation > maxElevation) {
                    maxElevation = angles.elevation;
                    maxElevationTime = date;
                    tcaAngles = angles;
                }
            }
        }
        else if (inPass) {
            // End of pass (LOS)
            const previousDate = new Date(timeMs - stepSeconds * 1000);
            const losAngles = calculateLookAngles(tle, observerLocation, previousDate);
            if (passStart && maxElevationTime && aosAngles && tcaAngles && losAngles) {
                windows.push({
                    aos: passStart,
                    tca: maxElevationTime,
                    los: previousDate,
                    maxElevation,
                    duration: (previousDate.getTime() - passStart.getTime()) / 1000,
                    angles: {
                        aos: aosAngles,
                        tca: tcaAngles,
                        los: losAngles,
                    },
                });
            }
            inPass = false;
            passStart = null;
            maxElevation = -90;
            maxElevationTime = null;
        }
    }
    return windows;
}
// ============================================================================
// DOPPLER SHIFT CALCULATIONS
// ============================================================================
/**
 * Calculate Doppler shift for radio communications
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @param transmitFrequencyHz - Transmitter frequency in Hz
 * @returns Doppler shift information, or null if calculation fails
 */
function calculateDopplerShift(tle, observerLocation, date, transmitFrequencyHz) {
    const state = getPositionAtTime(tle, date);
    if (!state)
        return null;
    // Calculate GMST
    const gmst = gstime(date);
    // Convert observer location to geodetic (radians)
    const observerGd = {
        latitude: degreesToRadians(observerLocation.latitude),
        longitude: degreesToRadians(observerLocation.longitude),
        height: observerLocation.altitude,
    };
    // Convert to ECF coordinates
    const positionEcf = eciToEcf(state.position, gmst);
    const velocityEcf = eciToEcf(state.velocity, gmst);
    const observerEcf = geodeticToEcf(observerGd);
    // Calculate Doppler factor
    const dopplerFactor$1 = dopplerFactor(observerEcf, positionEcf, velocityEcf);
    // Calculate range rate (component of velocity toward observer)
    const rangeVector = {
        x: positionEcf.x - observerEcf.x,
        y: positionEcf.y - observerEcf.y,
        z: positionEcf.z - observerEcf.z,
    };
    const range = Math.sqrt(rangeVector.x ** 2 + rangeVector.y ** 2 + rangeVector.z ** 2);
    const rangeRate = ((rangeVector.x * velocityEcf.x + rangeVector.y * velocityEcf.y + rangeVector.z * velocityEcf.z) /
        range);
    // Estimate rate of change (using small time step)
    const deltaT = 1; // 1 second
    const futureDate = new Date(date.getTime() + deltaT * 1000);
    const futureState = getPositionAtTime(tle, futureDate);
    let rateHzPerSecond = 0;
    if (futureState) {
        const futurePosEcf = eciToEcf(futureState.position, gstime(futureDate));
        const futureVelEcf = eciToEcf(futureState.velocity, gstime(futureDate));
        const futureDopplerFactor = dopplerFactor(observerEcf, futurePosEcf, futureVelEcf);
        const futureShift = transmitFrequencyHz * (futureDopplerFactor - 1);
        const currentShift = transmitFrequencyHz * (dopplerFactor$1 - 1);
        rateHzPerSecond = (futureShift - currentShift) / deltaT;
    }
    return {
        factor: dopplerFactor$1,
        shiftHz: transmitFrequencyHz * (dopplerFactor$1 - 1),
        rateHzPerSecond,
        rangeRate,
    };
}
// ============================================================================
// ECLIPSE PREDICTIONS
// ============================================================================
/**
 * Calculate eclipse predictions (when satellite is in Earth's shadow)
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for search
 * @param endTime - End time for search
 * @returns Array of eclipse predictions
 */
function calculateEclipses(tle, startTime, endTime) {
    const eclipses = [];
    const stepSeconds = 10; // Check every 10 seconds
    const EARTH_RADIUS = 6378.137; // km
    const AU = 149597870.7; // km (astronomical unit)
    let inEclipse = false;
    let eclipseStart = null;
    let maxDepth = 0;
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
        const date = new Date(timeMs);
        const state = getPositionAtTime(tle, date);
        if (!state)
            continue;
        // Calculate Sun position (simplified - uses mean longitude)
        const jd = jday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        // Approximate sun position
        const T = (jd - 2451545.0) / 36525;
        const L = (280.460 + 36000.771 * T) % 360; // Mean longitude
        const g = (357.528 + 35999.050 * T) % 360; // Mean anomaly
        const lambda = L + 1.915 * Math.sin(g * Math.PI / 180); // Ecliptic longitude
        const sunDistance = AU; // Approximate
        const sunPos = {
            x: sunDistance * Math.cos(lambda * Math.PI / 180),
            y: sunDistance * Math.sin(lambda * Math.PI / 180),
            z: 0,
        };
        // Calculate if satellite is in Earth's shadow
        const satToSun = {
            x: sunPos.x - state.position.x,
            y: sunPos.y - state.position.y,
            z: sunPos.z - state.position.z,
        };
        const satToSunDist = Math.sqrt(satToSun.x ** 2 + satToSun.y ** 2 + satToSun.z ** 2);
        // Project satellite position onto Earth-Sun line
        const satDist = Math.sqrt(state.position.x ** 2 + state.position.y ** 2 + state.position.z ** 2);
        const dotProduct = -(state.position.x * satToSun.x +
            state.position.y * satToSun.y +
            state.position.z * satToSun.z);
        // Check if satellite is on the dark side and in shadow cone
        const isInShadow = dotProduct > 0 && satDist < EARTH_RADIUS + 1000; // Simplified check
        // Calculate shadow depth (0 = no eclipse, 1 = full eclipse)
        let depth = 0;
        if (isInShadow) {
            const perpDist = Math.sqrt(satDist ** 2 - (dotProduct / satToSunDist) ** 2);
            const shadowRadius = EARTH_RADIUS * (1 + dotProduct / sunDistance);
            depth = Math.max(0, Math.min(1, 1 - perpDist / shadowRadius));
        }
        if (depth > 0.1) {
            // Threshold for eclipse detection
            if (!inEclipse) {
                // Start of eclipse
                inEclipse = true;
                eclipseStart = date;
                maxDepth = depth;
            }
            else {
                // During eclipse - track maximum depth
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        else if (inEclipse) {
            // End of eclipse
            const previousDate = new Date(timeMs - stepSeconds * 1000);
            if (eclipseStart) {
                eclipses.push({
                    start: eclipseStart,
                    end: previousDate,
                    duration: (previousDate.getTime() - eclipseStart.getTime()) / 1000,
                    type: maxDepth > 0.9 ? 'umbra' : 'penumbra',
                    depth: maxDepth,
                });
            }
            inEclipse = false;
            eclipseStart = null;
            maxDepth = 0;
        }
    }
    return eclipses;
}
// ============================================================================
// GROUND TRACK CALCULATION
// ============================================================================
/**
 * Calculate satellite ground track
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time
 * @param endTime - End time
 * @param stepSeconds - Time step in seconds (default 60)
 * @returns Array of ground track points
 */
function calculateGroundTrack(tle, startTime, endTime, stepSeconds = 60) {
    const points = [];
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
        const date = new Date(timeMs);
        const state = getPositionAtTime(tle, date);
        if (state) {
            const velocityMag = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2);
            points.push({
                timestamp: date,
                location: state.geographicLocation,
                velocity: velocityMag,
            });
        }
    }
    return points;
}
// ============================================================================
// ORBIT VISUALIZATION DATA
// ============================================================================
/**
 * Generate orbit visualization data
 *
 * @param tle - Parsed TLE data
 * @param numPoints - Number of points to generate (default 100)
 * @returns Object containing orbit path and ground track
 */
function generateOrbitVisualization(tle, numPoints = 100) {
    const period = calculateOrbitalPeriod(tle);
    if (!period)
        return null;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + period * 60 * 1000);
    const stepSeconds = (period * 60) / numPoints;
    const states = predictFuturePositions(tle, startTime, endTime, stepSeconds);
    if (!states)
        return null;
    const orbitPath = states.map((state) => state.position);
    const groundTrack = states.map((state) => ({
        timestamp: state.timestamp,
        location: state.geographicLocation,
        velocity: Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2),
    }));
    return { orbitPath, groundTrack };
}
// ============================================================================
// DERIVED ORBITAL PARAMETERS
// ============================================================================
/**
 * Calculate orbital period from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital period in minutes, or null if calculation fails
 */
function calculateOrbitalPeriod(tle) {
    try {
        const meanMotion = parseFloat(tle.meanMotion);
        if (meanMotion <= 0)
            return null;
        return 1440 / meanMotion; // 1440 minutes in a day
    }
    catch {
        return null;
    }
}
/**
 * Calculate comprehensive orbital parameters from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital parameters, or null if calculation fails
 */
function calculateOrbitalParameters(tle) {
    try {
        const satrec = initializeSatelliteRecord(tle);
        if (!satrec)
            return null;
        // Extract values from satrec (already in correct units)
        const meanMotionRevPerDay = parseFloat(tle.meanMotion);
        const inclinationRad = satrec.inclo;
        const eccentricity = satrec.ecco;
        const argumentOfPerigeeRad = satrec.argpo;
        const rightAscensionRad = satrec.nodeo;
        const meanAnomalyRad = satrec.mo;
        // Calculate orbital period
        const periodMinutes = 1440 / meanMotionRevPerDay;
        // Calculate semi-major axis using Kepler's third law
        // T^2 = (4π^2 / μ) * a^3, where μ = GM_earth = 398600.4418 km^3/s^2
        const MU_EARTH = 398600.4418; // km^3/s^2
        const periodSeconds = periodMinutes * 60;
        const semiMajorAxis = Math.pow((MU_EARTH * periodSeconds ** 2) / (4 * Math.PI ** 2), 1 / 3);
        // Calculate perigee and apogee
        const EARTH_RADIUS = 6378.137; // km
        const perigeeAltitude = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS;
        const apogeeAltitude = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS;
        // Classify orbit type
        let orbitType = 'Unknown';
        if (perigeeAltitude < 2000) {
            orbitType = 'LEO'; // Low Earth Orbit
        }
        else if (perigeeAltitude >= 2000 && apogeeAltitude < 35786) {
            orbitType = 'MEO'; // Medium Earth Orbit
        }
        else if (Math.abs(apogeeAltitude - 35786) < 100 && eccentricity < 0.01) {
            orbitType = 'GEO'; // Geostationary Earth Orbit
        }
        else if (apogeeAltitude >= 35786) {
            orbitType = 'HEO'; // High Earth Orbit or Highly Elliptical Orbit
        }
        return {
            periodMinutes,
            semiMajorAxis,
            perigeeAltitude,
            apogeeAltitude,
            meanMotionRevPerDay,
            inclinationDegrees: inclinationRad * (180 / Math.PI),
            eccentricity,
            argumentOfPerigee: argumentOfPerigeeRad * (180 / Math.PI),
            rightAscension: rightAscensionRad * (180 / Math.PI),
            meanAnomaly: meanAnomalyRad * (180 / Math.PI),
            orbitType,
        };
    }
    catch {
        return null;
    }
}
// ============================================================================
// CONJUNCTION PREDICTION
// ============================================================================
/**
 * Predict conjunctions between two satellites
 *
 * @param tle1 - First satellite TLE
 * @param tle2 - Second satellite TLE
 * @param startTime - Start time for search
 * @param endTime - End time for search
 * @param minDistance - Minimum distance threshold in km (default 10 km)
 * @returns Array of conjunction events
 */
function predictConjunctions(tle1, tle2, startTime, endTime, minDistance = 10) {
    const conjunctions = [];
    const stepSeconds = 60; // Check every 60 seconds
    let previousDistance = Infinity;
    let approachDetected = false;
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
        const date = new Date(timeMs);
        const state1 = getPositionAtTime(tle1, date);
        const state2 = getPositionAtTime(tle2, date);
        if (!state1 || !state2)
            continue;
        // Calculate distance between satellites
        const distance = Math.sqrt((state1.position.x - state2.position.x) ** 2 +
            (state1.position.y - state2.position.y) ** 2 +
            (state1.position.z - state2.position.z) ** 2);
        // Detect local minimum (closest approach)
        if (distance < previousDistance) {
            approachDetected = true;
        }
        else if (approachDetected && distance > previousDistance) {
            // Passed closest approach
            if (previousDistance <= minDistance) {
                // Calculate relative velocity
                const relativeVelocity = Math.sqrt((state1.velocity.x - state2.velocity.x) ** 2 +
                    (state1.velocity.y - state2.velocity.y) ** 2 +
                    (state1.velocity.z - state2.velocity.z) ** 2);
                // Assess risk level
                let riskLevel = 'low';
                if (previousDistance < 1) {
                    riskLevel = 'critical';
                }
                else if (previousDistance < 2) {
                    riskLevel = 'high';
                }
                else if (previousDistance < 5) {
                    riskLevel = 'medium';
                }
                const previousDate = new Date(timeMs - stepSeconds * 1000);
                const prevState1 = getPositionAtTime(tle1, previousDate);
                const prevState2 = getPositionAtTime(tle2, previousDate);
                if (prevState1 && prevState2) {
                    conjunctions.push({
                        time: previousDate,
                        distance: previousDistance,
                        relativeVelocity,
                        satellite1Position: prevState1.position,
                        satellite2Position: prevState2.position,
                        riskLevel,
                    });
                }
            }
            approachDetected = false;
        }
        previousDistance = distance;
    }
    return conjunctions;
}
// ============================================================================
// STATION-KEEPING MANEUVER DETECTION
// ============================================================================
/**
 * Detect station-keeping maneuvers by comparing two TLEs
 *
 * @param olderTle - Earlier TLE
 * @param newerTle - Later TLE
 * @returns Maneuver detection result
 */
function detectStationKeepingManeuver(olderTle, newerTle) {
    try {
        const olderParams = calculateOrbitalParameters(olderTle);
        const newerParams = calculateOrbitalParameters(newerTle);
        if (!olderParams || !newerParams) {
            return { detected: false };
        }
        // Calculate changes in orbital elements
        const deltaSemiMajorAxis = Math.abs(newerParams.semiMajorAxis - olderParams.semiMajorAxis);
        const deltaEccentricity = Math.abs(newerParams.eccentricity - olderParams.eccentricity);
        const deltaInclination = Math.abs(newerParams.inclinationDegrees - olderParams.inclinationDegrees);
        // Thresholds for maneuver detection
        const SEMI_MAJOR_AXIS_THRESHOLD = 0.1; // km
        const ECCENTRICITY_THRESHOLD = 0.0001;
        const INCLINATION_THRESHOLD = 0.01; // degrees
        const maneuverDetected = deltaSemiMajorAxis > SEMI_MAJOR_AXIS_THRESHOLD ||
            deltaEccentricity > ECCENTRICITY_THRESHOLD ||
            deltaInclination > INCLINATION_THRESHOLD;
        if (!maneuverDetected) {
            return { detected: false };
        }
        // Estimate delta-V using vis-viva equation
        const MU_EARTH = 398600.4418; // km^3/s^2
        const velocityOld = Math.sqrt(MU_EARTH / olderParams.semiMajorAxis);
        const velocityNew = Math.sqrt(MU_EARTH / newerParams.semiMajorAxis);
        const deltaV = Math.abs(velocityNew - velocityOld) * 1000; // Convert to m/s
        // Estimate maneuver time (midpoint between TLE epochs)
        const olderEpoch = getTLEEpochDate(olderTle);
        const newerEpoch = getTLEEpochDate(newerTle);
        const maneuverTime = new Date((olderEpoch.getTime() + newerEpoch.getTime()) / 2);
        return {
            detected: true,
            deltaV,
            maneuverTime,
            elementChanges: {
                semiMajorAxis: deltaSemiMajorAxis,
                eccentricity: deltaEccentricity,
                inclination: deltaInclination,
            },
        };
    }
    catch {
        return { detected: false };
    }
}
/**
 * Helper function to get TLE epoch as Date
 *
 * @param tle - Parsed TLE data
 * @returns Date object representing TLE epoch
 */
function getTLEEpochDate(tle) {
    const epochYear = parseInt(tle.epochYear);
    const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
    const epochDay = parseFloat(tle.epoch);
    const dayOfYear = Math.floor(epochDay);
    const fractionalDay = epochDay - dayOfYear;
    const epochDate = new Date(Date.UTC(fullYear, 0, dayOfYear));
    epochDate.setUTCMilliseconds(fractionalDay * 86400000);
    return epochDate;
}

/**
 * TLE Data Analysis Module
 * Provides comprehensive tools for analyzing TLE data including comparison,
 * staleness detection, orbital decay analysis, and anomaly detection.
 */
// ============================================================================
// TYPES AND INTERFACES
// ============================================================================
/**
 * Orbit classification types based on altitude
 */
exports.OrbitType = void 0;
(function (OrbitType) {
    OrbitType["LEO"] = "LEO";
    OrbitType["MEO"] = "MEO";
    OrbitType["GEO"] = "GEO";
    OrbitType["HEO"] = "HEO";
    OrbitType["CISLUNAR"] = "CISLUNAR";
    OrbitType["UNKNOWN"] = "UNKNOWN";
})(exports.OrbitType || (exports.OrbitType = {}));
// ============================================================================
// TLE COMPARISON AND DIFF UTILITIES
// ============================================================================
/**
 * Compare two TLE objects and identify differences
 */
function compareTLEs(oldTLE, newTLE) {
    const differences = [];
    // Compare all numeric fields
    const fieldsToCompare = [
        'epoch', 'inclination', 'rightAscension', 'eccentricity',
        'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'firstDerivative',
        'bStar', 'revolutionNumber'
    ];
    for (const field of fieldsToCompare) {
        const oldValue = parseFloat(oldTLE[field]);
        const newValue = parseFloat(newTLE[field]);
        if (oldValue !== newValue) {
            const absoluteChange = newValue - oldValue;
            const percentChange = oldValue !== 0 ? (absoluteChange / oldValue) * 100 : 0;
            differences.push({
                field,
                oldValue,
                newValue,
                absoluteChange,
                percentChange
            });
        }
    }
    // Calculate time difference (in days)
    const oldEpoch = parseEpoch$1(oldTLE.epochYear, oldTLE.epoch);
    const newEpoch = parseEpoch$1(newTLE.epochYear, newTLE.epoch);
    const timeDifference = (newEpoch.getTime() - oldEpoch.getTime()) / (1000 * 60 * 60 * 24);
    // Identify significant changes (> 1% change or specific thresholds)
    const significantChanges = differences.filter(diff => {
        if (diff.field === 'meanMotion' && Math.abs(diff.absoluteChange || 0) > 0.001)
            return true;
        if (diff.field === 'inclination' && Math.abs(diff.absoluteChange || 0) > 0.1)
            return true;
        if (diff.field === 'eccentricity' && Math.abs(diff.absoluteChange || 0) > 0.0001)
            return true;
        if (diff.percentChange && Math.abs(diff.percentChange) > 1)
            return true;
        return false;
    });
    // Generate summary
    const summary = generateComparisonSummary(differences, significantChanges, timeDifference);
    return {
        satelliteNumber: newTLE.satelliteNumber1,
        satelliteName: newTLE.satelliteName,
        timeDifference,
        differences,
        significantChanges,
        summary
    };
}
/**
 * Generate diff output in unified diff format
 */
function generateTLEDiff(oldTLE, newTLE) {
    const comparison = compareTLEs(oldTLE, newTLE);
    let diff = `--- Old TLE (Epoch: ${oldTLE.epoch})\n`;
    diff += `+++ New TLE (Epoch: ${newTLE.epoch})\n`;
    diff += `@@ Satellite ${comparison.satelliteNumber} - ${comparison.satelliteName || 'Unknown'} @@\n\n`;
    for (const change of comparison.differences) {
        diff += `- ${change.field}: ${change.oldValue}\n`;
        diff += `+ ${change.field}: ${change.newValue}`;
        if (change.percentChange !== undefined) {
            diff += ` (${change.percentChange > 0 ? '+' : ''}${change.percentChange.toFixed(2)}%)`;
        }
        diff += '\n';
    }
    if (comparison.significantChanges.length > 0) {
        diff += `\n⚠️  ${comparison.significantChanges.length} significant change(s) detected\n`;
    }
    return diff;
}
// ============================================================================
// TLE AGE AND STALENESS DETECTION
// ============================================================================
/**
 * Calculate TLE age and assess staleness
 */
function assessTLEStaleness(tle, referenceDate = new Date()) {
    const epoch = parseEpoch$1(tle.epochYear, tle.epoch);
    const ageInMillis = referenceDate.getTime() - epoch.getTime();
    const ageInDays = ageInMillis / (1000 * 60 * 60 * 24);
    const ageInHours = ageInMillis / (1000 * 60 * 60);
    let staleness;
    let isStale;
    let recommendation;
    if (ageInDays < 1) {
        staleness = 'fresh';
        isStale = false;
        recommendation = 'TLE is current and suitable for high-precision applications.';
    }
    else if (ageInDays < 3) {
        staleness = 'recent';
        isStale = false;
        recommendation = 'TLE is recent and suitable for most applications.';
    }
    else if (ageInDays < 7) {
        staleness = 'old';
        isStale = true;
        recommendation = 'TLE is getting old. Consider updating for better accuracy.';
    }
    else if (ageInDays < 30) {
        staleness = 'very_old';
        isStale = true;
        recommendation = 'TLE is very old. Update recommended for accurate predictions.';
    }
    else {
        staleness = 'ancient';
        isStale = true;
        recommendation = 'TLE is ancient. Predictions may be highly inaccurate. Update required.';
    }
    return {
        ageInDays,
        ageInHours,
        isStale,
        staleness,
        recommendation
    };
}
// ============================================================================
// ORBITAL DECAY DETECTION
// ============================================================================
/**
 * Analyze orbital decay from TLE history
 */
function analyzeOrbitalDecay(tles) {
    if (tles.length < 2) {
        return {
            isDecaying: false,
            decayRate: 0,
            estimatedLifetimeDays: null,
            severity: 'none',
            details: 'Insufficient data for decay analysis (need at least 2 TLEs)'
        };
    }
    // Sort TLEs by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch$1(a.epochYear, a.epoch);
        const epochB = parseEpoch$1(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Calculate mean motion changes
    const firstTLE = sortedTLEs[0];
    const lastTLE = sortedTLEs[sortedTLEs.length - 1];
    const firstMeanMotion = parseFloat(firstTLE.meanMotion);
    const lastMeanMotion = parseFloat(lastTLE.meanMotion);
    const firstEpoch = parseEpoch$1(firstTLE.epochYear, firstTLE.epoch);
    const lastEpoch = parseEpoch$1(lastTLE.epochYear, lastTLE.epoch);
    const timeSpanDays = (lastEpoch.getTime() - firstEpoch.getTime()) / (1000 * 60 * 60 * 24);
    const decayRate = (lastMeanMotion - firstMeanMotion) / timeSpanDays;
    const isDecaying = decayRate > 0.0001; // Positive change in mean motion indicates decay
    let severity = 'none';
    let estimatedLifetimeDays = null;
    if (isDecaying) {
        // Estimate lifetime based on decay rate
        // This is a simplified model; real decay is more complex
        if (decayRate > 0.01) {
            severity = 'critical';
            estimatedLifetimeDays = 30;
        }
        else if (decayRate > 0.001) {
            severity = 'high';
            estimatedLifetimeDays = 180;
        }
        else if (decayRate > 0.0005) {
            severity = 'moderate';
            estimatedLifetimeDays = 365;
        }
        else {
            severity = 'low';
            estimatedLifetimeDays = 1825; // ~5 years
        }
    }
    const details = isDecaying
        ? `Orbital decay detected. Mean motion increasing at ${decayRate.toExponential(2)} rev/day². Estimated lifetime: ${estimatedLifetimeDays} days.`
        : 'No significant orbital decay detected.';
    return {
        isDecaying,
        decayRate,
        estimatedLifetimeDays,
        severity,
        details
    };
}
// ============================================================================
// TLE UPDATE FREQUENCY STATISTICS
// ============================================================================
/**
 * Calculate update frequency statistics from TLE history
 */
function calculateUpdateFrequency(tles) {
    if (tles.length < 2) {
        return {
            satelliteNumber: tles[0]?.satelliteNumber1 || 'unknown',
            totalUpdates: tles.length,
            timeSpanDays: 0,
            averageUpdateInterval: 0,
            minUpdateInterval: 0,
            maxUpdateInterval: 0,
            stdDeviation: 0,
            updatePattern: 'sparse'
        };
    }
    // Sort by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch$1(a.epochYear, a.epoch);
        const epochB = parseEpoch$1(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < sortedTLEs.length; i++) {
        const prevEpoch = parseEpoch$1(sortedTLEs[i - 1].epochYear, sortedTLEs[i - 1].epoch);
        const currEpoch = parseEpoch$1(sortedTLEs[i].epochYear, sortedTLEs[i].epoch);
        const intervalDays = (currEpoch.getTime() - prevEpoch.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(intervalDays);
    }
    const averageUpdateInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minUpdateInterval = Math.min(...intervals);
    const maxUpdateInterval = Math.max(...intervals);
    // Calculate standard deviation
    const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - averageUpdateInterval, 2);
    }, 0) / intervals.length;
    const stdDeviation = Math.sqrt(variance);
    // Determine update pattern
    let updatePattern;
    const coefficientOfVariation = stdDeviation / averageUpdateInterval;
    if (averageUpdateInterval < 1) {
        updatePattern = 'frequent';
    }
    else if (coefficientOfVariation < 0.3) {
        updatePattern = 'regular';
    }
    else if (averageUpdateInterval > 7) {
        updatePattern = 'sparse';
    }
    else {
        updatePattern = 'irregular';
    }
    const firstEpoch = parseEpoch$1(sortedTLEs[0].epochYear, sortedTLEs[0].epoch);
    const lastEpoch = parseEpoch$1(sortedTLEs[sortedTLEs.length - 1].epochYear, sortedTLEs[sortedTLEs.length - 1].epoch);
    const timeSpanDays = (lastEpoch.getTime() - firstEpoch.getTime()) / (1000 * 60 * 60 * 24);
    return {
        satelliteNumber: sortedTLEs[0].satelliteNumber1,
        totalUpdates: tles.length,
        timeSpanDays,
        averageUpdateInterval,
        minUpdateInterval,
        maxUpdateInterval,
        stdDeviation,
        updatePattern
    };
}
// ============================================================================
// ANOMALY DETECTION
// ============================================================================
/**
 * Detect anomalies in TLE data (maneuvers, sudden changes)
 */
function detectAnomalies(currentTLE, previousTLE) {
    if (!previousTLE) {
        return {
            hasAnomaly: false,
            anomalyType: 'none',
            confidence: 0,
            description: 'No previous TLE available for comparison',
            affectedFields: [],
            recommendations: []
        };
    }
    const comparison = compareTLEs(previousTLE, currentTLE);
    const affectedFields = [];
    let hasAnomaly = false;
    let anomalyType = 'none';
    let confidence = 0;
    let description = '';
    const recommendations = [];
    // Check for maneuver indicators
    const meanMotionChange = comparison.differences.find(d => d.field === 'meanMotion');
    const inclinationChange = comparison.differences.find(d => d.field === 'inclination');
    // Maneuver detection
    if (meanMotionChange && Math.abs(meanMotionChange.absoluteChange || 0) > 0.01) {
        hasAnomaly = true;
        anomalyType = 'maneuver';
        affectedFields.push('meanMotion');
        confidence = Math.min(Math.abs(meanMotionChange.absoluteChange || 0) * 10, 1);
        description = `Possible orbital maneuver detected. Mean motion changed by ${meanMotionChange.absoluteChange?.toFixed(6)} rev/day.`;
        recommendations.push('Verify with satellite operator', 'Update orbital predictions');
    }
    if (inclinationChange && Math.abs(inclinationChange.absoluteChange || 0) > 0.5) {
        hasAnomaly = true;
        anomalyType = 'maneuver';
        affectedFields.push('inclination');
        confidence = Math.max(confidence, 0.9);
        description += ` Significant inclination change: ${inclinationChange.absoluteChange?.toFixed(3)}°.`;
        recommendations.push('Inclination change suggests plane change maneuver');
    }
    // Decay anomaly detection
    const decayAnalysis = analyzeOrbitalDecay([previousTLE, currentTLE]);
    if (decayAnalysis.severity === 'critical' || decayAnalysis.severity === 'high') {
        hasAnomaly = true;
        anomalyType = 'decay_anomaly';
        affectedFields.push('meanMotion', 'bStar');
        confidence = Math.max(confidence, 0.8);
        description = `Rapid orbital decay detected: ${decayAnalysis.details}`;
        recommendations.push('Monitor for reentry', 'Validate TLE against radar observations');
    }
    // Data error detection (unrealistic values)
    const eccentricityChange = comparison.differences.find(d => d.field === 'eccentricity');
    if (eccentricityChange && Math.abs(eccentricityChange.absoluteChange || 0) > 0.1) {
        hasAnomaly = true;
        anomalyType = 'data_error';
        affectedFields.push('eccentricity');
        confidence = 0.95;
        description = 'Unrealistic eccentricity change detected. Possible data error.';
        recommendations.push('Verify TLE source', 'Check for data corruption');
    }
    if (!hasAnomaly) {
        description = 'No significant anomalies detected.';
    }
    return {
        hasAnomaly,
        anomalyType,
        confidence,
        description,
        affectedFields,
        recommendations
    };
}
// ============================================================================
// CONSTELLATION ANALYSIS
// ============================================================================
/**
 * Analyze a constellation of satellites
 */
function analyzeConstellation(tles, constellationName) {
    const orbitTypes = {
        LEO: 0,
        MEO: 0,
        GEO: 0,
        HEO: 0,
        CISLUNAR: 0,
        UNKNOWN: 0
    };
    let totalInclination = 0;
    let totalAltitude = 0;
    const raanValues = [];
    for (const tle of tles) {
        const orbitType = classifyOrbitType(tle);
        orbitTypes[orbitType]++;
        const inclination = parseFloat(tle.inclination);
        const meanMotion = parseFloat(tle.meanMotion);
        const rightAscension = parseFloat(tle.rightAscension);
        totalInclination += inclination;
        // Calculate approximate altitude from mean motion
        const altitude = calculateAltitudeFromMeanMotion(meanMotion);
        totalAltitude += altitude;
        raanValues.push(rightAscension);
    }
    const averageInclination = totalInclination / tles.length;
    const averageAltitude = totalAltitude / tles.length;
    // Estimate orbital planes (simplified)
    const uniquePlanes = estimateOrbitalPlanes(raanValues);
    // Calculate spacing
    const alongTrackSpacing = 360 / (tles.length / uniquePlanes);
    const crossTrackSpacing = raanValues.length > 1
        ? Math.abs(raanValues[1] - raanValues[0])
        : 0;
    // Determine coverage
    let coverage;
    if (averageInclination > 80) {
        coverage = 'Global (polar)';
    }
    else if (averageInclination > 50) {
        coverage = 'High latitude';
    }
    else {
        coverage = 'Equatorial to mid-latitude';
    }
    return {
        constellationName,
        totalSatellites: tles.length,
        orbitTypes,
        averageInclination,
        averageAltitude,
        orbitalPlanes: uniquePlanes,
        spacing: {
            alongTrack: alongTrackSpacing,
            crossTrack: crossTrackSpacing
        },
        coverage
    };
}
// ============================================================================
// TLE QUALITY METRICS
// ============================================================================
/**
 * Calculate comprehensive quality metrics for a TLE
 */
function calculateQualityMetrics(tle, referenceDate = new Date()) {
    const issues = [];
    // Completeness (check for all required fields)
    let completeness = 100;
    const requiredFields = [
        'satelliteNumber1', 'inclination', 'rightAscension', 'eccentricity',
        'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'epoch'
    ];
    for (const field of requiredFields) {
        if (!tle[field] || tle[field] === '') {
            completeness -= 100 / requiredFields.length;
            issues.push(`Missing or empty field: ${field}`);
        }
    }
    // Accuracy (check for reasonable values)
    let accuracy = 100;
    const inclination = parseFloat(tle.inclination);
    const eccentricity = parseFloat(tle.eccentricity);
    const meanMotion = parseFloat(tle.meanMotion);
    if (inclination < 0 || inclination > 180) {
        accuracy -= 20;
        issues.push(`Invalid inclination: ${inclination}`);
    }
    if (eccentricity < 0 || eccentricity >= 1) {
        accuracy -= 20;
        issues.push(`Invalid eccentricity: ${eccentricity}`);
    }
    if (meanMotion <= 0 || meanMotion > 20) {
        accuracy -= 20;
        issues.push(`Unusual mean motion: ${meanMotion}`);
    }
    // Freshness
    const staleness = assessTLEStaleness(tle, referenceDate);
    let freshness = 100;
    switch (staleness.staleness) {
        case 'fresh':
            freshness = 100;
            break;
        case 'recent':
            freshness = 85;
            break;
        case 'old':
            freshness = 60;
            break;
        case 'very_old':
            freshness = 30;
            break;
        case 'ancient':
            freshness = 0;
            break;
    }
    // Consistency (check for checksum validation)
    let consistency = 100;
    if (tle.warnings && tle.warnings.length > 0) {
        consistency -= Math.min(tle.warnings.length * 10, 40);
        issues.push(`${tle.warnings.length} warning(s) detected`);
    }
    // Overall score (weighted average)
    const overallScore = (completeness * 0.3 +
        accuracy * 0.3 +
        freshness * 0.25 +
        consistency * 0.15);
    // Assign grade
    let grade;
    if (overallScore >= 90)
        grade = 'A';
    else if (overallScore >= 80)
        grade = 'B';
    else if (overallScore >= 70)
        grade = 'C';
    else if (overallScore >= 60)
        grade = 'D';
    else
        grade = 'F';
    return {
        overallScore: Math.round(overallScore),
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        freshness: Math.round(freshness),
        consistency: Math.round(consistency),
        issues,
        grade
    };
}
// ============================================================================
// HISTORICAL TLE TREND ANALYSIS
// ============================================================================
/**
 * Analyze trends in a specific TLE parameter over time
 */
function analyzeTrend(tles, parameter) {
    if (tles.length < 3) {
        return {
            satelliteNumber: tles[0]?.satelliteNumber1 || 'unknown',
            parameter: parameter,
            trend: 'stable',
            trendStrength: 0,
            changeRate: 0,
            predictions: {
                next7Days: 0,
                next30Days: 0
            }
        };
    }
    // Sort by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch$1(a.epochYear, a.epoch);
        const epochB = parseEpoch$1(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Extract values and times
    const values = [];
    const times = [];
    for (const tle of sortedTLEs) {
        const fieldValue = tle[parameter];
        if (fieldValue) {
            const value = parseFloat(fieldValue);
            if (!isNaN(value)) {
                values.push(value);
                const epoch = parseEpoch$1(tle.epochYear, tle.epoch);
                times.push(epoch.getTime());
            }
        }
    }
    // Simple linear regression
    const n = values.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, time, i) => sum + time * values[i], 0);
    const sumX2 = times.reduce((sum, time) => sum + time * time, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Determine trend
    let trend;
    const threshold = Math.abs(values[values.length - 1] - values[0]) * 0.01;
    if (Math.abs(slope) < threshold / (times[times.length - 1] - times[0])) {
        trend = 'stable';
    }
    else if (slope > 0) {
        trend = 'increasing';
    }
    else {
        trend = 'decreasing';
    }
    // Calculate trend strength (R²)
    const meanY = sumY / n;
    const ssTotal = values.reduce((sum, value) => sum + Math.pow(value - meanY, 2), 0);
    const ssResidual = values.reduce((sum, value, i) => {
        const predicted = slope * times[i] + intercept;
        return sum + Math.pow(value - predicted, 2);
    }, 0);
    const trendStrength = 1 - (ssResidual / ssTotal);
    // Change rate per day
    const changeRate = slope * (1000 * 60 * 60 * 24);
    // Predictions
    const lastTime = times[times.length - 1];
    const next7Days = slope * (lastTime + 7 * 24 * 60 * 60 * 1000) + intercept;
    const next30Days = slope * (lastTime + 30 * 24 * 60 * 60 * 1000) + intercept;
    return {
        satelliteNumber: sortedTLEs[0].satelliteNumber1,
        parameter: parameter,
        trend,
        trendStrength: Math.max(0, Math.min(1, trendStrength)),
        changeRate,
        predictions: {
            next7Days,
            next30Days
        }
    };
}
// ============================================================================
// ORBIT TYPE CLASSIFICATION
// ============================================================================
/**
 * Classify orbit type based on TLE parameters
 */
function classifyOrbitType(tle) {
    const meanMotion = parseFloat(tle.meanMotion);
    const eccentricity = parseFloat(tle.eccentricity);
    const inclination = parseFloat(tle.inclination);
    // Calculate approximate altitude
    const altitude = calculateAltitudeFromMeanMotion(meanMotion);
    // GEO: ~35,786 km altitude, low inclination, near-circular
    if (altitude > 35000 && altitude < 36500 && inclination < 15 && eccentricity < 0.05) {
        return exports.OrbitType.GEO;
    }
    // HEO: High eccentricity
    if (eccentricity > 0.3) {
        return exports.OrbitType.HEO;
    }
    // LEO: Below 2000 km
    if (altitude < 2000) {
        return exports.OrbitType.LEO;
    }
    // MEO: Between 2000 and 35786 km
    if (altitude >= 2000 && altitude < 35786) {
        return exports.OrbitType.MEO;
    }
    // Cislunar: Above GEO
    if (altitude > 36500) {
        return exports.OrbitType.CISLUNAR;
    }
    return exports.OrbitType.UNKNOWN;
}
// ============================================================================
// CONJUNCTION PROBABILITY CALCULATION
// ============================================================================
/**
 * Calculate conjunction probability between two satellites
 * Note: This is a simplified calculation. Real conjunction analysis requires
 * detailed propagation and covariance analysis.
 */
function calculateConjunctionProbability(tle1, tle2, timeWindow = 24 // hours
) {
    // Simplified calculation based on orbital parameters
    const altitude1 = calculateAltitudeFromMeanMotion(parseFloat(tle1.meanMotion));
    const altitude2 = calculateAltitudeFromMeanMotion(parseFloat(tle2.meanMotion));
    const inclination1 = parseFloat(tle1.inclination);
    const inclination2 = parseFloat(tle2.inclination);
    // Estimate minimum distance (very simplified)
    const altitudeDiff = Math.abs(altitude1 - altitude2);
    const inclinationDiff = Math.abs(inclination1 - inclination2);
    // If orbits are very different, collision probability is essentially zero
    if (altitudeDiff > 100 || inclinationDiff > 10) {
        return {
            satellite1: tle1.satelliteNumber1,
            satellite2: tle2.satelliteNumber1,
            probabilityOfCollision: 0,
            minimumDistance: altitudeDiff,
            timeOfClosestApproach: new Date(),
            riskLevel: 'low',
            recommendations: ['Orbits are sufficiently separated']
        };
    }
    // Simplified risk calculation
    let probability = 0;
    let riskLevel = 'low';
    const recommendations = [];
    if (altitudeDiff < 10 && inclinationDiff < 2) {
        probability = 0.001;
        riskLevel = 'moderate';
        recommendations.push('Monitor conjunction', 'Consider detailed analysis');
    }
    if (altitudeDiff < 5 && inclinationDiff < 1) {
        probability = 0.01;
        riskLevel = 'high';
        recommendations.push('Perform detailed conjunction analysis', 'Prepare collision avoidance maneuver');
    }
    if (altitudeDiff < 2 && inclinationDiff < 0.5) {
        probability = 0.1;
        riskLevel = 'critical';
        recommendations.push('URGENT: Immediate collision avoidance required', 'Contact satellite operators');
    }
    return {
        satellite1: tle1.satelliteNumber1,
        satellite2: tle2.satelliteNumber1,
        probabilityOfCollision: probability,
        minimumDistance: altitudeDiff,
        timeOfClosestApproach: new Date(Date.now() + Math.random() * timeWindow * 60 * 60 * 1000),
        riskLevel,
        recommendations
    };
}
// ============================================================================
// RADAR OBSERVATION VALIDATION
// ============================================================================
/**
 * Validate TLE against radar observations
 * Note: This is a placeholder. Real validation requires actual radar data.
 */
function validateAgainstRadar(_tle, _radarPosition, _radarObservation) {
    // This is a placeholder implementation
    // Real implementation would:
    // 1. Propagate TLE to observation time
    // 2. Calculate expected position from observer location
    // 3. Compare with actual radar observation
    // 4. Calculate position and velocity errors
    return {
        isValid: true,
        positionError: 0.5, // km
        velocityError: 0.001, // km/s
        confidence: 0.95,
        discrepancies: []
    };
}
// ============================================================================
// ORBITAL FAMILY GROUPING
// ============================================================================
/**
 * Group satellites into orbital families based on similar characteristics
 */
function groupIntoOrbitalFamilies(tles, tolerances = {
    inclinationTolerance: 1.0,
    altitudeTolerance: 50,
    eccentricityTolerance: 0.01
}) {
    const families = [];
    const assigned = new Set();
    for (let i = 0; i < tles.length; i++) {
        const tle1 = tles[i];
        if (assigned.has(tle1.satelliteNumber1))
            continue;
        const familyMembers = [tle1.satelliteNumber1];
        assigned.add(tle1.satelliteNumber1);
        const inc1 = parseFloat(tle1.inclination);
        const alt1 = calculateAltitudeFromMeanMotion(parseFloat(tle1.meanMotion));
        const ecc1 = parseFloat(tle1.eccentricity);
        // Find similar satellites
        for (let j = i + 1; j < tles.length; j++) {
            const tle2 = tles[j];
            if (assigned.has(tle2.satelliteNumber1))
                continue;
            const inc2 = parseFloat(tle2.inclination);
            const alt2 = calculateAltitudeFromMeanMotion(parseFloat(tle2.meanMotion));
            const ecc2 = parseFloat(tle2.eccentricity);
            if (Math.abs(inc1 - inc2) <= tolerances.inclinationTolerance &&
                Math.abs(alt1 - alt2) <= tolerances.altitudeTolerance &&
                Math.abs(ecc1 - ecc2) <= tolerances.eccentricityTolerance) {
                familyMembers.push(tle2.satelliteNumber1);
                assigned.add(tle2.satelliteNumber1);
            }
        }
        // Determine purpose based on orbital characteristics
        let purpose = 'Unknown';
        if (inc1 > 95 && inc1 < 100)
            purpose = 'Sun-synchronous Earth observation';
        else if (inc1 < 10 && alt1 > 35000)
            purpose = 'Geostationary communications';
        else if (inc1 > 50 && inc1 < 60 && alt1 > 19000 && alt1 < 24000)
            purpose = 'Navigation (GPS/GLONASS)';
        else if (alt1 < 600)
            purpose = 'Low Earth orbit constellation';
        families.push({
            familyId: `FAMILY_${families.length + 1}`,
            satellites: familyMembers,
            commonCharacteristics: {
                inclination: inc1,
                semiMajorAxis: alt1 + 6371, // Earth radius
                eccentricity: ecc1
            },
            tolerances,
            purpose
        });
    }
    return families;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Parse epoch from TLE epoch year and day
 */
function parseEpoch$1(epochYear, epoch) {
    const year = parseInt(epochYear);
    const fullYear = year >= 57 ? 1900 + year : 2000 + year;
    const dayOfYear = parseFloat(epoch);
    const date = new Date(Date.UTC(fullYear, 0, 1));
    date.setUTCDate(dayOfYear);
    return date;
}
/**
 * Calculate altitude from mean motion using simplified Kepler's third law
 */
function calculateAltitudeFromMeanMotion(meanMotion) {
    const earthRadius = 6371; // km
    const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
    // Convert mean motion from rev/day to rad/s
    const n = meanMotion * 2 * Math.PI / 86400;
    // Calculate semi-major axis: a = (mu/n²)^(1/3)
    const a = Math.pow(mu / (n * n), 1 / 3);
    // Altitude = semi-major axis - Earth radius
    return a - earthRadius;
}
/**
 * Generate comparison summary text
 */
function generateComparisonSummary(differences, significantChanges, timeDifference) {
    if (differences.length === 0) {
        return 'No changes detected between TLEs.';
    }
    let summary = `${differences.length} field(s) changed over ${timeDifference.toFixed(2)} days. `;
    if (significantChanges.length > 0) {
        summary += `${significantChanges.length} significant change(s): `;
        const changeList = significantChanges.map(c => c.field).join(', ');
        summary += changeList + '.';
    }
    else {
        summary += 'All changes are minor.';
    }
    return summary;
}
/**
 * Estimate number of orbital planes from RAAN values
 */
function estimateOrbitalPlanes(raanValues) {
    if (raanValues.length < 2)
        return 1;
    // Sort RAAN values
    const sorted = [...raanValues].sort((a, b) => a - b);
    // Find clusters (planes within 5 degrees are considered same plane)
    const planes = [];
    let currentPlane = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] < 5) {
            currentPlane.push(sorted[i]);
        }
        else {
            planes.push(currentPlane);
            currentPlane = [sorted[i]];
        }
    }
    planes.push(currentPlane);
    return planes.length;
}

/**
 * TLE Format Conversion Module
 * Provides conversion between TLE and various orbital data formats including
 * OMM, STK, KVN, CCSDS OEM, GPS almanac, state vectors, and Keplerian elements.
 */
/**
 * Coordinate frame types
 */
exports.CoordinateFrame = void 0;
(function (CoordinateFrame) {
    CoordinateFrame["TEME"] = "TEME";
    CoordinateFrame["J2000"] = "J2000";
    CoordinateFrame["ITRF"] = "ITRF";
    CoordinateFrame["GCRF"] = "GCRF";
    CoordinateFrame["EME2000"] = "EME2000"; // Earth Mean Equator 2000
})(exports.CoordinateFrame || (exports.CoordinateFrame = {}));
/**
 * Planetarium software formats
 */
exports.PlanetariumFormat = void 0;
(function (PlanetariumFormat) {
    PlanetariumFormat["STELLARIUM"] = "STELLARIUM";
    PlanetariumFormat["CELESTIA"] = "CELESTIA";
    PlanetariumFormat["SPACENGINE"] = "SPACENGINE";
    PlanetariumFormat["UNIVERSESANDBOX"] = "UNIVERSESANDBOX";
})(exports.PlanetariumFormat || (exports.PlanetariumFormat = {}));
// ============================================================================
// OMM (ORBIT MEAN ELEMENTS MESSAGE) CONVERSION
// ============================================================================
/**
 * Convert TLE to OMM format (CCSDS standard)
 */
function tleToOMM(tle, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        CCSDS_OMM_VERS: '2.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        CENTER_NAME: 'EARTH',
        REF_FRAME: 'TEME',
        TIME_SYSTEM: 'UTC',
        MEAN_ELEMENT_THEORY: 'SGP4',
        EPOCH: epoch.toISOString(),
        MEAN_MOTION: parseFloat(tle.meanMotion),
        ECCENTRICITY: parseFloat(tle.eccentricity),
        INCLINATION: parseFloat(tle.inclination),
        RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
        ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
        MEAN_ANOMALY: parseFloat(tle.meanAnomaly),
        EPHEMERIS_TYPE: parseInt(tle.ephemerisType),
        CLASSIFICATION_TYPE: tle.classification,
        NORAD_CAT_ID: tle.satelliteNumber1,
        ELEMENT_SET_NO: parseInt(tle.elementSetNumber),
        REV_AT_EPOCH: parseInt(tle.revolutionNumber),
        BSTAR: parseFloat(tle.bStar),
        MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
        MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
    };
}
/**
 * Convert OMM to TLE format
 */
function ommToTLE(omm) {
    const epoch = new Date(omm.EPOCH);
    const year = epoch.getUTCFullYear() % 100;
    const dayOfYear = getDayOfYear(epoch);
    // Line 0 (satellite name)
    let tle = `${omm.OBJECT_NAME}\n`;
    // Line 1
    const line1Parts = [
        '1',
        omm.NORAD_CAT_ID.padStart(5, ' '),
        omm.CLASSIFICATION_TYPE,
        ' ',
        formatInternationalDesignator(omm.OBJECT_ID),
        ' ',
        year.toString().padStart(2, '0'),
        dayOfYear.toFixed(8).padStart(12, ' '),
        ' ',
        formatScientific(omm.MEAN_MOTION_DOT, 8),
        ' ',
        formatScientific(omm.MEAN_MOTION_DDOT, 8),
        ' ',
        formatScientific(omm.BSTAR, 8),
        ' ',
        omm.EPHEMERIS_TYPE.toString(),
        ' ',
        omm.ELEMENT_SET_NO.toString().padStart(4, ' ')
    ];
    const line1 = line1Parts.join('');
    const checksum1 = calculateChecksum$1(line1);
    tle += line1 + checksum1 + '\n';
    // Line 2
    const line2Parts = [
        '2',
        omm.NORAD_CAT_ID.padStart(5, ' '),
        ' ',
        omm.INCLINATION.toFixed(4).padStart(8, ' '),
        ' ',
        omm.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' '),
        ' ',
        formatEccentricity(omm.ECCENTRICITY),
        ' ',
        omm.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' '),
        ' ',
        omm.MEAN_ANOMALY.toFixed(4).padStart(8, ' '),
        ' ',
        omm.MEAN_MOTION.toFixed(8).padStart(11, ' '),
        omm.REV_AT_EPOCH.toString().padStart(5, ' ')
    ];
    const line2 = line2Parts.join('');
    const checksum2 = calculateChecksum$1(line2);
    tle += line2 + checksum2;
    return tle;
}
/**
 * Serialize OMM to XML format
 */
function ommToXML(omm) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<omm xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    xml += '     id="CCSDS_OMM_VERS" version="2.0">\n';
    xml += '  <header>\n';
    xml += `    <CREATION_DATE>${omm.CREATION_DATE}</CREATION_DATE>\n`;
    xml += `    <ORIGINATOR>${omm.ORIGINATOR}</ORIGINATOR>\n`;
    xml += '  </header>\n';
    xml += '  <body>\n';
    xml += '    <segment>\n';
    xml += '      <metadata>\n';
    xml += `        <OBJECT_NAME>${omm.OBJECT_NAME}</OBJECT_NAME>\n`;
    xml += `        <OBJECT_ID>${omm.OBJECT_ID}</OBJECT_ID>\n`;
    xml += `        <CENTER_NAME>${omm.CENTER_NAME}</CENTER_NAME>\n`;
    xml += `        <REF_FRAME>${omm.REF_FRAME}</REF_FRAME>\n`;
    xml += `        <TIME_SYSTEM>${omm.TIME_SYSTEM}</TIME_SYSTEM>\n`;
    xml += `        <MEAN_ELEMENT_THEORY>${omm.MEAN_ELEMENT_THEORY}</MEAN_ELEMENT_THEORY>\n`;
    xml += '      </metadata>\n';
    xml += '      <data>\n';
    xml += `        <EPOCH>${omm.EPOCH}</EPOCH>\n`;
    xml += `        <MEAN_MOTION>${omm.MEAN_MOTION}</MEAN_MOTION>\n`;
    xml += `        <ECCENTRICITY>${omm.ECCENTRICITY}</ECCENTRICITY>\n`;
    xml += `        <INCLINATION>${omm.INCLINATION}</INCLINATION>\n`;
    xml += `        <RA_OF_ASC_NODE>${omm.RA_OF_ASC_NODE}</RA_OF_ASC_NODE>\n`;
    xml += `        <ARG_OF_PERICENTER>${omm.ARG_OF_PERICENTER}</ARG_OF_PERICENTER>\n`;
    xml += `        <MEAN_ANOMALY>${omm.MEAN_ANOMALY}</MEAN_ANOMALY>\n`;
    xml += `        <BSTAR>${omm.BSTAR}</BSTAR>\n`;
    xml += `        <MEAN_MOTION_DOT>${omm.MEAN_MOTION_DOT}</MEAN_MOTION_DOT>\n`;
    xml += `        <MEAN_MOTION_DDOT>${omm.MEAN_MOTION_DDOT}</MEAN_MOTION_DDOT>\n`;
    xml += '      </data>\n';
    xml += '    </segment>\n';
    xml += '  </body>\n';
    xml += '</omm>\n';
    return xml;
}
// ============================================================================
// STK EPHEMERIS FORMAT CONVERSION
// ============================================================================
/**
 * Convert TLE to STK .e ephemeris format
 */
function tleToSTK(tle, _duration = 86400) {
    // For a full implementation, we would propagate the orbit
    // Here we provide a simplified structure
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        header: {
            version: 'stk.v.11.0',
            satelliteName: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
            coordinateSystem: 'TEME',
            centralBody: 'Earth'
        },
        stateVectors: [
            // This would typically include propagated state vectors
            // For now, we include just the epoch state
            {
                time: epoch.toISOString(),
                position: { x: 0, y: 0, z: 0 }, // Would calculate from TLE
                velocity: { vx: 0, vy: 0, vz: 0 } // Would calculate from TLE
            }
        ]
    };
}
/**
 * Serialize STK ephemeris to .e file format
 */
function stkToFile(stk) {
    let content = `stk.v.11.0\n\n`;
    content += `# Satellite: ${stk.header.satelliteName}\n`;
    content += `# Coordinate System: ${stk.header.coordinateSystem}\n`;
    content += `# Central Body: ${stk.header.centralBody}\n\n`;
    content += `BEGIN Ephemeris\n\n`;
    content += `NumberOfEphemerisPoints ${stk.stateVectors.length}\n\n`;
    content += `EphemerisTimePosVel\n\n`;
    for (const sv of stk.stateVectors) {
        const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
        content += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
        content += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
    }
    content += `\nEND Ephemeris\n`;
    return content;
}
// ============================================================================
// KVN (KEYHOLE MARKUP LANGUAGE) CONVERSION
// ============================================================================
/**
 * Convert TLE to KVN format
 */
function tleToKVN(tle, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        KVN_VERS: '1.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        elements: {
            EPOCH: epoch.toISOString(),
            MEAN_MOTION: parseFloat(tle.meanMotion),
            ECCENTRICITY: parseFloat(tle.eccentricity),
            INCLINATION: parseFloat(tle.inclination),
            RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
            ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
            MEAN_ANOMALY: parseFloat(tle.meanAnomaly),
            BSTAR: parseFloat(tle.bStar),
            MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
            MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
        }
    };
}
/**
 * Serialize KVN to text format
 */
function kvnToText(kvn) {
    let text = `KVN/1.0\n\n`;
    text += `CREATION_DATE = ${kvn.CREATION_DATE}\n`;
    text += `ORIGINATOR = ${kvn.ORIGINATOR}\n\n`;
    text += `OBJECT_NAME = ${kvn.OBJECT_NAME}\n`;
    text += `OBJECT_ID = ${kvn.OBJECT_ID}\n\n`;
    text += `ELEMENTS\n`;
    for (const [key, value] of Object.entries(kvn.elements)) {
        text += `  ${key} = ${value}\n`;
    }
    return text;
}
// ============================================================================
// CCSDS OEM CONVERSION
// ============================================================================
/**
 * Convert TLE to CCSDS OEM format
 */
function tleToOEM(tle, duration = 86400, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    const startTime = new Date(epoch.getTime());
    const stopTime = new Date(epoch.getTime() + duration * 1000);
    return {
        CCSDS_OEM_VERS: '2.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        CENTER_NAME: 'EARTH',
        REF_FRAME: 'TEME',
        TIME_SYSTEM: 'UTC',
        START_TIME: startTime.toISOString(),
        STOP_TIME: stopTime.toISOString(),
        USEABLE_START_TIME: startTime.toISOString(),
        USEABLE_STOP_TIME: stopTime.toISOString(),
        INTERPOLATION: 'HERMITE',
        INTERPOLATION_DEGREE: 7,
        ephemerisData: [
            // Would include propagated state vectors
            {
                time: epoch.toISOString(),
                position: { x: 0, y: 0, z: 0 },
                velocity: { vx: 0, vy: 0, vz: 0 }
            }
        ]
    };
}
/**
 * Serialize OEM to text format
 */
function oemToText(oem) {
    let text = `CCSDS_OEM_VERS = ${oem.CCSDS_OEM_VERS}\n`;
    text += `CREATION_DATE = ${oem.CREATION_DATE}\n`;
    text += `ORIGINATOR = ${oem.ORIGINATOR}\n\n`;
    text += `META_START\n`;
    text += `OBJECT_NAME = ${oem.OBJECT_NAME}\n`;
    text += `OBJECT_ID = ${oem.OBJECT_ID}\n`;
    text += `CENTER_NAME = ${oem.CENTER_NAME}\n`;
    text += `REF_FRAME = ${oem.REF_FRAME}\n`;
    text += `TIME_SYSTEM = ${oem.TIME_SYSTEM}\n`;
    text += `START_TIME = ${oem.START_TIME}\n`;
    text += `STOP_TIME = ${oem.STOP_TIME}\n`;
    text += `INTERPOLATION = ${oem.INTERPOLATION}\n`;
    text += `INTERPOLATION_DEGREE = ${oem.INTERPOLATION_DEGREE}\n`;
    text += `META_STOP\n\n`;
    text += `DATA_START\n`;
    for (const sv of oem.ephemerisData) {
        const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
        text += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
        text += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
    }
    text += `DATA_STOP\n`;
    return text;
}
// ============================================================================
// KEPLERIAN ELEMENTS EXTRACTION
// ============================================================================
/**
 * Extract Keplerian elements from TLE
 */
function extractKeplerianElements(tle) {
    const meanMotion = parseFloat(tle.meanMotion);
    const eccentricity = parseFloat(tle.eccentricity);
    const inclination = parseFloat(tle.inclination);
    const raan = parseFloat(tle.rightAscension);
    const argPerigee = parseFloat(tle.argumentOfPerigee);
    const meanAnomaly = parseFloat(tle.meanAnomaly);
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    // Calculate semi-major axis from mean motion
    const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
    const n = meanMotion * 2 * Math.PI / 86400; // Convert to rad/s
    const semiMajorAxis = Math.pow(mu / (n * n), 1 / 3);
    // Calculate period
    const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
    // Calculate true anomaly from mean anomaly
    const trueAnomaly = meanAnomalyToTrueAnomaly(meanAnomaly * Math.PI / 180, eccentricity) * 180 / Math.PI;
    return {
        semiMajorAxis,
        eccentricity,
        inclination,
        rightAscensionOfAscendingNode: raan,
        argumentOfPerigee: argPerigee,
        meanAnomaly,
        trueAnomaly,
        epoch,
        meanMotion: n,
        period
    };
}
// ============================================================================
// STATE VECTOR CONVERSION
// ============================================================================
/**
 * Convert TLE to state vector at epoch
 * Note: This is a simplified conversion. For accurate propagation, use SGP4.
 */
function tleToStateVector(tle) {
    const keplerianElements = extractKeplerianElements(tle);
    // Convert Keplerian elements to Cartesian coordinates
    const { position, velocity } = keplerianToCartesian(keplerianElements);
    return {
        time: keplerianElements.epoch,
        position,
        velocity
    };
}
/**
 * Convert Keplerian elements to Cartesian state vector
 */
function keplerianToCartesian(elements) {
    const a = elements.semiMajorAxis;
    const e = elements.eccentricity;
    const i = elements.inclination * Math.PI / 180;
    const raan = elements.rightAscensionOfAscendingNode * Math.PI / 180;
    const omega = elements.argumentOfPerigee * Math.PI / 180;
    const nu = (elements.trueAnomaly || 0) * Math.PI / 180;
    const mu = 398600.4418; // km³/s²
    // Position in orbital plane
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    // Velocity in orbital plane
    const h = Math.sqrt(mu * a * (1 - e * e));
    const vx_orb = -mu / h * Math.sin(nu);
    const vy_orb = mu / h * (e + Math.cos(nu));
    // Rotation matrices
    const cosRaan = Math.cos(raan);
    const sinRaan = Math.sin(raan);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    // Transform to inertial frame
    const x = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * x_orb +
        (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * y_orb;
    const y = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * x_orb +
        (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * y_orb;
    const z = (sinOmega * sinI) * x_orb + (cosOmega * sinI) * y_orb;
    const vx = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * vx_orb +
        (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * vy_orb;
    const vy = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * vx_orb +
        (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * vy_orb;
    const vz = (sinOmega * sinI) * vx_orb + (cosOmega * sinI) * vy_orb;
    return {
        position: { x, y, z },
        velocity: { vx, vy, vz }
    };
}
// ============================================================================
// GPS ALMANAC CONVERSION
// ============================================================================
/**
 * Convert TLE to GPS almanac format (simplified)
 */
function tleToGPSAlmanac(tle) {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    const keplerianElements = extractKeplerianElements(tle);
    // GPS week number (starts from Jan 6, 1980)
    const gpsEpoch = new Date('1980-01-06T00:00:00Z');
    const weekNumber = Math.floor((epoch.getTime() - gpsEpoch.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return {
        satelliteId: tle.satelliteNumber1,
        health: 0, // Assume healthy
        eccentricity: parseFloat(tle.eccentricity),
        timeOfApplicability: epoch.getTime() / 1000, // seconds
        orbitalInclination: parseFloat(tle.inclination) * Math.PI / 180,
        rateOfRightAscension: 0, // Would need to calculate
        sqrtSemiMajorAxis: Math.sqrt(keplerianElements.semiMajorAxis),
        rightAscensionAtWeek: parseFloat(tle.rightAscension) * Math.PI / 180,
        argumentOfPerigee: parseFloat(tle.argumentOfPerigee) * Math.PI / 180,
        meanAnomaly: parseFloat(tle.meanAnomaly) * Math.PI / 180,
        af0: 0, // Clock correction parameters would need additional data
        af1: 0,
        week: weekNumber
    };
}
// ============================================================================
// COORDINATE FRAME TRANSFORMATIONS
// ============================================================================
/**
 * Transform state vector between coordinate frames
 * Note: This is a simplified implementation
 */
function transformCoordinateFrame(stateVector, fromFrame, toFrame, time) {
    if (fromFrame === toFrame) {
        return stateVector;
    }
    // For TEME to J2000 transformation (simplified)
    if (fromFrame === exports.CoordinateFrame.TEME && toFrame === exports.CoordinateFrame.J2000) {
        return temeToJ2000(stateVector);
    }
    // For J2000 to TEME transformation
    if (fromFrame === exports.CoordinateFrame.J2000 && toFrame === exports.CoordinateFrame.TEME) {
        return j2000ToTEME(stateVector);
    }
    // Default: return unchanged (placeholder)
    return stateVector;
}
/**
 * Transform from TEME to J2000 (simplified)
 */
function temeToJ2000(sv, _time) {
    // This is a placeholder. Real transformation requires:
    // 1. Precession matrix
    // 2. Nutation matrix
    // 3. Earth rotation angle
    // For now, return unchanged
    return sv;
}
/**
 * Transform from J2000 to TEME (simplified)
 */
function j2000ToTEME(sv, _time) {
    // Inverse of TEME to J2000
    return sv;
}
// ============================================================================
// PLANETARIUM SOFTWARE FORMATS
// ============================================================================
/**
 * Convert TLE to Stellarium format
 */
function tleToStellarium(tle) {
    const name = tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`;
    return `["${name}","${tle.lineNumber1} ${tle.satelliteNumber1}${tle.classification}...","${tle.lineNumber2} ${tle.satelliteNumber2}..."]`;
}
/**
 * Convert TLE to Celestia SSC format
 */
function tleToCelestia(tle) {
    const keplerianElements = extractKeplerianElements(tle);
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    let ssc = `"${tle.satelliteName || tle.satelliteNumber1}" "Sol/Earth"\n{\n`;
    ssc += `  Class "spacecraft"\n`;
    ssc += `  Mesh "satellite.3ds"\n`;
    ssc += `  Radius 0.01\n\n`;
    ssc += `  EllipticalOrbit\n  {\n`;
    ssc += `    Epoch ${epoch.getTime() / 1000}\n`;
    ssc += `    SemiMajorAxis ${keplerianElements.semiMajorAxis}\n`;
    ssc += `    Eccentricity ${keplerianElements.eccentricity}\n`;
    ssc += `    Inclination ${keplerianElements.inclination}\n`;
    ssc += `    AscendingNode ${keplerianElements.rightAscensionOfAscendingNode}\n`;
    ssc += `    ArgOfPericenter ${keplerianElements.argumentOfPerigee}\n`;
    ssc += `    MeanAnomaly ${keplerianElements.meanAnomaly}\n`;
    ssc += `  }\n}\n`;
    return ssc;
}
/**
 * Convert to generic planetarium format
 */
function tleToPlanetarium(tle, format) {
    switch (format) {
        case exports.PlanetariumFormat.STELLARIUM:
            return tleToStellarium(tle);
        case exports.PlanetariumFormat.CELESTIA:
            return tleToCelestia(tle);
        case exports.PlanetariumFormat.SPACENGINE:
        case exports.PlanetariumFormat.UNIVERSESANDBOX:
            // Would implement specific formats
            return JSON.stringify(extractKeplerianElements(tle), null, 2);
        default:
            return JSON.stringify(tle, null, 2);
    }
}
// ============================================================================
// CUSTOM FORMAT DEFINITION SYSTEM
// ============================================================================
/**
 * Convert TLE to custom format
 */
function tleToCustomFormat(tle, format) {
    let output = format.header || '';
    const separator = format.separator || ',';
    const lineEnding = format.lineEnding || '\n';
    const values = [];
    for (const field of format.fields) {
        let value = tle[field.source];
        // Apply transformation if provided
        if (field.transform) {
            value = field.transform(value);
        }
        // Apply formatting if provided
        if (field.format && typeof value === 'number') {
            // Simple formatting support
            value = value.toFixed(parseInt(field.format) || 0);
        }
        values.push(String(value));
    }
    output += values.join(separator) + lineEnding;
    output += format.footer || '';
    return output;
}
/**
 * Create custom format definition
 */
function createCustomFormat(name, fields, options = {}) {
    return {
        name,
        version: '1.0',
        fields,
        separator: options.separator,
        lineEnding: options.lineEnding,
        header: options.header,
        footer: options.footer
    };
}
// ============================================================================
// LEGACY TLE FORMAT SUPPORT
// ============================================================================
/**
 * Convert modern TLE to legacy format (if different)
 */
function tleToLegacyFormat(tle) {
    // Most TLE formats are compatible, but older systems may have different requirements
    // This would handle any legacy-specific formatting
    return reconstructTLE(tle);
}
/**
 * Reconstruct TLE string from ParsedTLE object
 */
function reconstructTLE(tle) {
    let output = '';
    // Line 0 (satellite name)
    if (tle.satelliteName) {
        output += tle.satelliteName + '\n';
    }
    // Line 1
    output += `1 ${tle.satelliteNumber1}${tle.classification} `;
    output += `${tle.internationalDesignatorYear}${tle.internationalDesignatorLaunchNumber}${tle.internationalDesignatorPiece} `;
    output += `${tle.epochYear}${tle.epoch} `;
    output += `${tle.firstDerivative} `;
    output += `${tle.secondDerivative} `;
    output += `${tle.bStar} `;
    output += `${tle.ephemerisType} `;
    output += `${tle.elementSetNumber}`;
    output += tle.checksum1 + '\n';
    // Line 2
    output += `2 ${tle.satelliteNumber2} `;
    output += `${tle.inclination} `;
    output += `${tle.rightAscension} `;
    output += `${tle.eccentricity} `;
    output += `${tle.argumentOfPerigee} `;
    output += `${tle.meanAnomaly} `;
    output += `${tle.meanMotion}`;
    output += `${tle.revolutionNumber}`;
    output += tle.checksum2;
    return output;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Parse epoch from TLE format
 */
function parseEpoch(epochYear, epoch) {
    const year = parseInt(epochYear);
    const fullYear = year >= 57 ? 1900 + year : 2000 + year;
    const dayOfYear = parseFloat(epoch);
    const date = new Date(Date.UTC(fullYear, 0, 1));
    const millisInDay = 24 * 60 * 60 * 1000;
    date.setTime(date.getTime() + (dayOfYear - 1) * millisInDay);
    return date;
}
/**
 * Get day of year from date
 */
function getDayOfYear(date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const diff = date.getTime() - start.getTime();
    return 1 + diff / (24 * 60 * 60 * 1000);
}
/**
 * Format number in scientific notation for TLE
 */
function formatScientific(value, width) {
    const sign = value >= 0 ? ' ' : '-';
    const absValue = Math.abs(value);
    const exponent = Math.floor(Math.log10(absValue));
    const mantissa = absValue / Math.pow(10, exponent);
    return `${sign}${mantissa.toFixed(width - 4)}${exponent >= 0 ? '+' : ''}${exponent}`;
}
/**
 * Format eccentricity (without leading decimal point)
 */
function formatEccentricity(value) {
    return value.toFixed(7).substring(2);
}
/**
 * Format international designator
 */
function formatInternationalDesignator(objectId) {
    // This is simplified; real implementation would parse the object ID
    return objectId.padEnd(8, ' ');
}
/**
 * Calculate TLE checksum
 */
function calculateChecksum$1(line) {
    let sum = 0;
    for (const char of line) {
        if (char >= '0' && char <= '9') {
            sum += parseInt(char);
        }
        else if (char === '-') {
            sum += 1;
        }
    }
    return (sum % 10).toString();
}
/**
 * Convert mean anomaly to true anomaly using Newton's method
 */
function meanAnomalyToTrueAnomaly(M, e, tolerance = 1e-8) {
    // Solve Kepler's equation: M = E - e*sin(E)
    let E = M; // Initial guess
    let delta = 1;
    while (Math.abs(delta) > tolerance) {
        delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= delta;
    }
    // Convert eccentric anomaly to true anomaly
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    return nu;
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
exports.analyzeConstellation = analyzeConstellation;
exports.analyzeOrbitalDecay = analyzeOrbitalDecay;
exports.analyzeTrend = analyzeTrend;
exports.applyFilter = applyFilter;
exports.assessTLEStaleness = assessTLEStaleness;
exports.calculateChecksum = calculateChecksum;
exports.calculateConjunctionProbability = calculateConjunctionProbability;
exports.calculateDopplerShift = calculateDopplerShift;
exports.calculateEclipses = calculateEclipses;
exports.calculateEpochAge = calculateEpochAge;
exports.calculateGroundTrack = calculateGroundTrack;
exports.calculateLookAngles = calculateLookAngles;
exports.calculateOrbitalParameters = calculateOrbitalParameters;
exports.calculateOrbitalPeriod = calculateOrbitalPeriod;
exports.calculateQualityMetrics = calculateQualityMetrics;
exports.calculateQualityScore = calculateQualityScore;
exports.calculateUpdateFrequency = calculateUpdateFrequency;
exports.calculateVisibilityWindows = calculateVisibilityWindows;
exports.checkClassificationWarnings = checkClassificationWarnings;
exports.checkDragAndEphemerisWarnings = checkDragAndEphemerisWarnings;
exports.checkEpochWarnings = checkEpochWarnings;
exports.checkOrbitalParameterWarnings = checkOrbitalParameterWarnings;
exports.classifyOrbitType = classifyOrbitType;
exports.compareTLEs = compareTLEs;
exports.convertEpochToDate = convertEpochToDate;
exports.createCachedParser = createCachedParser;
exports.createConstellationFilter = createConstellationFilter;
exports.createCustomFormat = createCustomFormat;
exports.createIncrementalParser = createIncrementalParser;
exports.createMiddlewareParser = createMiddlewareParser;
exports.createTLEParserStream = createTLEParserStream;
exports.createValidationRule = createValidationRule;
exports.default = index;
exports.detectAnomalies = detectAnomalies$1;
exports.detectStationKeepingManeuver = detectStationKeepingManeuver;
exports.detectTLEAnomalies = detectAnomalies;
exports.extractKeplerianElements = extractKeplerianElements;
exports.filterByConstellation = filterByConstellation;
exports.filterByFreshness = filterByFreshness;
exports.formatAsCSV = formatAsCSV;
exports.formatAsHuman = formatAsHuman;
exports.formatAsJSON = formatAsJSON;
exports.formatAsXML = formatAsXML;
exports.formatAsYAML = formatAsYAML;
exports.formatTLE = formatTLE;
exports.generateCacheKey = generateCacheKey;
exports.generateOrbitVisualization = generateOrbitVisualization;
exports.generateTLEDiff = generateTLEDiff;
exports.generateValidationReport = generateValidationReport;
exports.getConstellation = getConstellation;
exports.getErrorDescription = getErrorDescription;
exports.getPositionAtEpoch = getPositionAtEpoch;
exports.getPositionAtTime = getPositionAtTime;
exports.getProfileOptions = getProfileOptions;
exports.getProviderOptions = getProviderOptions;
exports.groupByConstellation = groupByConstellation;
exports.groupIntoOrbitalFamilies = groupIntoOrbitalFamilies;
exports.initializeSatelliteRecord = initializeSatelliteRecord;
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
exports.keplerianToCartesian = keplerianToCartesian;
exports.kvnToText = kvnToText;
exports.listConstellations = listConstellations;
exports.matchesConstellation = matchesConstellation;
exports.normalizeAssumedDecimalNotation = normalizeAssumedDecimalNotation;
exports.normalizeLineEndings = normalizeLineEndings;
exports.normalizeScientificNotation = normalizeScientificNotation;
exports.oemToText = oemToText;
exports.ommToTLE = ommToTLE;
exports.ommToXML = ommToXML;
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
exports.predictConjunctions = predictConjunctions;
exports.predictFuturePositions = predictFuturePositions;
exports.reconstructTLE = reconstructTLE$1;
exports.reconstructTLEFromParsedObject = reconstructTLE;
exports.sanitizeAllFields = sanitizeAllFields;
exports.sanitizeField = sanitizeField;
exports.splitTLEs = splitTLEs;
exports.stkToFile = stkToFile;
exports.tleCache = tleCache;
exports.tleToCelestia = tleToCelestia;
exports.tleToCustomFormat = tleToCustomFormat;
exports.tleToGPSAlmanac = tleToGPSAlmanac;
exports.tleToKVN = tleToKVN;
exports.tleToLegacyFormat = tleToLegacyFormat;
exports.tleToOEM = tleToOEM;
exports.tleToOMM = tleToOMM;
exports.tleToPlanetarium = tleToPlanetarium;
exports.tleToSTK = tleToSTK;
exports.tleToStateVector = tleToStateVector;
exports.tleToStellarium = tleToStellarium;
exports.transformCoordinateFrame = transformCoordinateFrame;
exports.validateAgainstRadar = validateAgainstRadar;
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
