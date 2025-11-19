/**
 * tle-parser v1.0.0
 * A parser for TLE (Two-Line Element) satellite data.
 * @license MIT
 */
/**
 * Error codes for structured error handling in TLE parser
 * Provides type-safe error identification for validation and parsing operations
 */
/**
 * Comprehensive enumeration of all TLE parser error codes
 * Used for structured error reporting and handling
 */
var ERROR_CODES;
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
})(ERROR_CODES || (ERROR_CODES = {}));
/**
 * Const object for backward compatibility with existing JavaScript code
 * Provides the same interface as the original ERROR_CODES object
 *
 * @deprecated Use the ERROR_CODES enum instead for better type safety
 */
({
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
});
/**
 * Type guard to check if a string is a valid error code
 * @param code - The string to check
 * @returns True if the string is a valid error code
 */
function isValidErrorCode(code) {
    return Object.values(ERROR_CODES).includes(code);
}
/**
 * Helper function to get a human-readable description of an error code
 * @param code - The error code to describe
 * @returns A human-readable description of the error code
 */
function getErrorDescription(code) {
    const descriptions = {
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
function isWarningCode(code) {
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
})(TLEErrorCode || (TLEErrorCode = {}));
// ============================================================================
// STATE MACHINE PARSER TYPES
// ============================================================================
/**
 * Parser state in the state machine
 */
var ParserState$1;
(function (ParserState) {
    ParserState["INITIAL"] = "INITIAL";
    ParserState["READING_NAME"] = "READING_NAME";
    ParserState["READING_LINE1"] = "READING_LINE1";
    ParserState["READING_LINE2"] = "READING_LINE2";
    ParserState["COMPLETE"] = "COMPLETE";
    ParserState["ERROR"] = "ERROR";
    ParserState["RECOVERING"] = "RECOVERING";
})(ParserState$1 || (ParserState$1 = {}));
/**
 * Recovery action for error handling
 */
var RecoveryAction$1;
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
})(RecoveryAction$1 || (RecoveryAction$1 = {}));
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
var ParserState;
(function (ParserState) {
    ParserState["INITIAL"] = "INITIAL";
    ParserState["DETECTING_FORMAT"] = "DETECTING_FORMAT";
    ParserState["PARSING_NAME"] = "PARSING_NAME";
    ParserState["PARSING_LINE1"] = "PARSING_LINE1";
    ParserState["PARSING_LINE2"] = "PARSING_LINE2";
    ParserState["VALIDATING"] = "VALIDATING";
    ParserState["COMPLETED"] = "COMPLETED";
    ParserState["ERROR"] = "ERROR";
})(ParserState || (ParserState = {}));
/**
 * Error severity levels for issue reporting
 */
var ErrorSeverityEnum;
(function (ErrorSeverityEnum) {
    ErrorSeverityEnum["WARNING"] = "warning";
    ErrorSeverityEnum["ERROR"] = "error";
    ErrorSeverityEnum["CRITICAL"] = "critical";
})(ErrorSeverityEnum || (ErrorSeverityEnum = {}));
/**
 * Recovery action types for error handling
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
        this.state = ParserState.INITIAL;
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
        this.state = ParserState.INITIAL;
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
        if (severity === ErrorSeverityEnum.WARNING) {
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
            this.addIssue(ErrorSeverityEnum.CRITICAL, ERROR_CODES.INVALID_INPUT_TYPE, 'TLE data must be a string', { inputType: typeof tleString });
            this.transition(ParserState.ERROR);
            return this.getResult();
        }
        if (tleString.length === 0) {
            this.addIssue(ErrorSeverityEnum.CRITICAL, ERROR_CODES.EMPTY_INPUT, 'TLE string cannot be empty', { inputLength: 0 });
            this.transition(ParserState.ERROR);
            return this.getResult();
        }
        // Start parsing
        this.transition(ParserState.DETECTING_FORMAT, 'Starting parse');
        this.detectFormat(tleString);
        // Continue through state machine
        if (this.state === ParserState.DETECTING_FORMAT) {
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
            this.addIssue(ErrorSeverityEnum.CRITICAL, ERROR_CODES.INVALID_LINE_COUNT, `TLE must contain at least 2 lines (found ${lines.length})`, { expected: '2 or 3', actual: lines.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(RecoveryAction.ABORT, 'Insufficient lines to parse TLE', { lineCount: lines.length });
            }
            this.transition(ParserState.ERROR);
            return;
        }
        if (lines.length > 3) {
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_LINE_COUNT, `TLE should contain 2 or 3 lines (found ${lines.length})`, { expected: '2 or 3', actual: lines.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(RecoveryAction.ATTEMPT_FIX, 'Attempting to identify valid TLE lines from excess lines', { lineCount: lines.length });
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
                        this.recordRecovery(RecoveryAction.CONTINUE, 'Successfully identified TLE lines from excess input', { extractedLines: this.context.lineCount });
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
                    this.addIssue(ErrorSeverityEnum.WARNING, ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING, 'First line starts with "1" or "2", might be missing satellite name', { firstLine: lines[0] });
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
        while (this.state !== ParserState.COMPLETED &&
            this.state !== ParserState.ERROR &&
            iterations < maxIterations) {
            switch (this.state) {
                case ParserState.DETECTING_FORMAT:
                    if (this.context.hasName) {
                        this.transition(ParserState.PARSING_NAME);
                    }
                    else {
                        this.transition(ParserState.PARSING_LINE1);
                    }
                    break;
                case ParserState.PARSING_NAME:
                    this.parseSatelliteName();
                    this.transition(ParserState.PARSING_LINE1);
                    break;
                case ParserState.PARSING_LINE1:
                    this.parseLine1();
                    this.transition(ParserState.PARSING_LINE2);
                    break;
                case ParserState.PARSING_LINE2:
                    this.parseLine2();
                    this.transition(ParserState.VALIDATING);
                    break;
                case ParserState.VALIDATING:
                    this.validateCrossFields();
                    // Check if we have critical errors
                    const hasCriticalErrors = this.errors.some(e => e.severity === ErrorSeverityEnum.CRITICAL);
                    if (hasCriticalErrors && !this.options.includePartialResults) {
                        this.transition(ParserState.ERROR);
                    }
                    else {
                        this.transition(ParserState.COMPLETED);
                    }
                    break;
                default:
                    // Unexpected state, exit
                    this.transition(ParserState.ERROR, 'Unexpected state');
                    break;
            }
            iterations++;
        }
        if (iterations >= maxIterations) {
            this.addIssue(ErrorSeverityEnum.CRITICAL, 'STATE_MACHINE_LOOP', 'State machine exceeded maximum iterations', { iterations });
            this.transition(ParserState.ERROR);
        }
    }
    /**
     * Parse satellite name line
     */
    parseSatelliteName() {
        const nameLineIdx = this.context.nameLineIndex;
        if (nameLineIdx < 0 || nameLineIdx >= this.context.lines.length) {
            this.addIssue(ErrorSeverityEnum.ERROR, 'INVALID_NAME_LINE_INDEX', 'Invalid satellite name line index', { index: nameLineIdx });
            return;
        }
        const nameLine = this.context.lines[nameLineIdx];
        if (!nameLine)
            return;
        this.parsedData.satelliteName = nameLine;
        // Validate satellite name
        if (nameLine.length > 24) {
            this.addIssue(ErrorSeverityEnum.WARNING, ERROR_CODES.SATELLITE_NAME_TOO_LONG, 'Satellite name exceeds recommended 24 characters', { length: nameLine.length, name: nameLine });
        }
        if (nameLine[0] === '1' || nameLine[0] === '2') {
            this.addIssue(ErrorSeverityEnum.WARNING, ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING, 'Satellite name starts with "1" or "2", might be incorrectly formatted', { name: nameLine });
        }
    }
    /**
     * Parse TLE Line 1
     */
    parseLine1() {
        const line1Idx = this.context.line1Index;
        if (line1Idx < 0 || line1Idx >= this.context.lines.length) {
            this.addIssue(ErrorSeverityEnum.CRITICAL, 'INVALID_LINE1_INDEX', 'Invalid Line 1 index', { index: line1Idx });
            return;
        }
        const line1 = this.context.lines[line1Idx];
        if (!line1)
            return;
        // Store raw line (not in standard ParsedTLE but useful for debugging)
        this.parsedData.line1Raw = line1;
        // Check line length
        if (line1.length !== 69) {
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_LINE_LENGTH, `Line 1 must be exactly 69 characters (got ${line1.length})`, { line: 1, expected: 69, actual: line1.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(RecoveryAction.CONTINUE, 'Attempting to parse Line 1 despite incorrect length', { length: line1.length });
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
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_LINE_NUMBER, `Line 1 must start with '1' (got '${this.parsedData.lineNumber1}')`, { line: 1, expected: '1', actual: this.parsedData.lineNumber1 });
        }
        // Validate classification
        const validClassifications = ['U', 'C', 'S'];
        if (this.parsedData.classification &&
            !validClassifications.includes(this.parsedData.classification)) {
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_CLASSIFICATION, `Classification must be U, C, or S (got '${this.parsedData.classification}')`, { expected: validClassifications, actual: this.parsedData.classification });
        }
        // Validate checksum
        if (line1.length === 69) {
            const checksum = this.calculateChecksum(line1);
            const actualChecksum = parseInt(this.parsedData.checksum1 || '', 10);
            if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
                this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.CHECKSUM_MISMATCH, `Line 1 checksum mismatch (expected ${checksum}, got ${actualChecksum})`, { line: 1, expected: checksum, actual: actualChecksum });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(RecoveryAction.CONTINUE, 'Continuing despite checksum mismatch', { line: 1 });
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
            this.addIssue(ErrorSeverityEnum.CRITICAL, 'INVALID_LINE2_INDEX', 'Invalid Line 2 index', { index: line2Idx });
            return;
        }
        const line2 = this.context.lines[line2Idx];
        if (!line2)
            return;
        // Store raw line
        this.parsedData.line2Raw = line2;
        // Check line length
        if (line2.length !== 69) {
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_LINE_LENGTH, `Line 2 must be exactly 69 characters (got ${line2.length})`, { line: 2, expected: 69, actual: line2.length });
            if (this.options.attemptRecovery) {
                this.recordRecovery(RecoveryAction.CONTINUE, 'Attempting to parse Line 2 despite incorrect length', { length: line2.length });
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
            this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_LINE_NUMBER, `Line 2 must start with '2' (got '${this.parsedData.lineNumber2}')`, { line: 2, expected: '2', actual: this.parsedData.lineNumber2 });
        }
        // Validate checksum
        if (line2.length === 69) {
            const checksum = this.calculateChecksum(line2);
            const actualChecksum = parseInt(this.parsedData.checksum2 || '', 10);
            if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
                this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.CHECKSUM_MISMATCH, `Line 2 checksum mismatch (expected ${checksum}, got ${actualChecksum})`, { line: 2, expected: checksum, actual: actualChecksum });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(RecoveryAction.CONTINUE, 'Continuing despite checksum mismatch', { line: 2 });
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
                this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.SATELLITE_NUMBER_MISMATCH, `Satellite numbers must match (Line 1: ${sat1}, Line 2: ${sat2})`, { line1Value: sat1, line2Value: sat2 });
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
                this.addIssue(ErrorSeverityEnum.ERROR, ERROR_CODES.VALUE_OUT_OF_RANGE, `Eccentricity must be between 0 and 1 (got ${ecc})`, { field: 'eccentricity', value: ecc, min: 0, max: 1 });
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
            this.addIssue(warningOnly ? ErrorSeverityEnum.WARNING : ErrorSeverityEnum.ERROR, ERROR_CODES.INVALID_NUMBER_FORMAT, `${displayName} must be numeric (got '${fieldValue}')`, { field: fieldName, value: fieldValue });
            return;
        }
        if (value < min || value > max) {
            this.addIssue(warningOnly ? ErrorSeverityEnum.WARNING : ErrorSeverityEnum.ERROR, ERROR_CODES.VALUE_OUT_OF_RANGE, `${displayName} must be between ${min} and ${max} (got ${value})`, { field: fieldName, value, min, max });
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
                this.addIssue(ErrorSeverityEnum.WARNING, 'PARTIAL_FIELD', `${displayName} is incomplete due to short line`, { field: fieldName, expected: [start, end], actual: line.length });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(RecoveryAction.USE_DEFAULT, `Using partial value for ${displayName}`, { field: fieldName });
                }
            }
            else {
                // Field completely missing
                this.parsedData[fieldName] = null;
                this.addIssue(ErrorSeverityEnum.WARNING, 'MISSING_FIELD', `${displayName} is missing due to short line`, { field: fieldName, expected: [start, end], actual: line.length });
                if (this.options.attemptRecovery) {
                    this.recordRecovery(RecoveryAction.USE_DEFAULT, `Using null for missing ${displayName}`, { field: fieldName });
                }
            }
        }
        catch (error) {
            this.parsedData[fieldName] = null;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.addIssue(ErrorSeverityEnum.ERROR, 'FIELD_PARSE_ERROR', `Error parsing ${displayName}: ${errorMessage}`, { field: fieldName, error: errorMessage });
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
            severity: (e.severity === ErrorSeverityEnum.CRITICAL ? 'error' : e.severity),
            ...Object.fromEntries(Object.entries(e).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key)))
        }));
        const warnings = this.warnings.map(w => ({
            code: w.code,
            message: w.message,
            severity: 'warning',
            ...Object.fromEntries(Object.entries(w).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key)))
        }));
        return {
            success: this.state === ParserState.COMPLETED,
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
        Error.captureStackTrace(this, this.constructor);
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
function validateLineStructure(line, expectedLineNumber) {
    const errors = [];
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
function validateClassification(line1) {
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
function validateNumericRange(value, fieldName, min, max) {
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
function checkClassificationWarnings(line1) {
    const warnings = [];
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
function checkDragAndEphemerisWarnings(line1) {
    const warnings = [];
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
function validateTLE(tleString, options = {}) {
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
            const criticalErrors = line1Result.errors.filter(e => e.code !== ERROR_CODES.CHECKSUM_MISMATCH &&
                e.code !== ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            const checksumErrors = line1Result.errors.filter(e => e.code === ERROR_CODES.CHECKSUM_MISMATCH ||
                e.code === ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
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
            const criticalErrors = line2Result.errors.filter(e => e.code !== ERROR_CODES.CHECKSUM_MISMATCH &&
                e.code !== ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
            const checksumErrors = line2Result.errors.filter(e => e.code === ERROR_CODES.CHECKSUM_MISMATCH ||
                e.code === ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
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
        throw new TLEFormatError('Missing required TLE lines', ERROR_CODES.INVALID_LINE_COUNT);
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
    ERROR_CODES
};

export { ERROR_CODES, ErrorSeverityEnum as ErrorSeverity, ParserState, RecoveryAction, TLEErrorCode, TLEFormatError, TLEStateMachineParser, TLEValidationError, calculateChecksum, checkClassificationWarnings, checkDragAndEphemerisWarnings, checkEpochWarnings, checkOrbitalParameterWarnings, index as default, getErrorDescription, isCriticalError, isParseFailure, isParseSuccess, isParsedTLE, isTLEError, isTLEWarning, isValidClassification, isValidErrorCode, isValidationFailure, isValidationSuccess, isWarningCode, normalizeLineEndings, parseTLE, parseTLELines, parseWithStateMachine, validateChecksum, validateClassification, validateLineStructure, validateNumericRange, validateSatelliteNumber, validateTLE };
//# sourceMappingURL=index.mjs.map
