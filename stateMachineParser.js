const { ERROR_CODES } = require('./index');

/**
 * Parser states for the state machine
 */
const ParserState = {
    INITIAL: 'INITIAL',
    DETECTING_FORMAT: 'DETECTING_FORMAT',
    PARSING_NAME: 'PARSING_NAME',
    PARSING_LINE1: 'PARSING_LINE1',
    PARSING_LINE2: 'PARSING_LINE2',
    VALIDATING: 'VALIDATING',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR'
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * Recovery action types
 */
const RecoveryAction = {
    CONTINUE: 'CONTINUE',           // Continue parsing
    SKIP_FIELD: 'SKIP_FIELD',       // Skip current field
    USE_DEFAULT: 'USE_DEFAULT',     // Use default value
    ATTEMPT_FIX: 'ATTEMPT_FIX',     // Attempt to fix the issue
    ABORT: 'ABORT'                  // Cannot recover, abort parsing
};

/**
 * State machine parser for TLE data with error recovery
 */
class TLEStateMachineParser {
    constructor(options = {}) {
        this.options = {
            attemptRecovery: true,
            maxRecoveryAttempts: 10,
            includePartialResults: true,
            strictMode: false,
            ...options
        };

        this.reset();
    }

    /**
     * Reset the parser state
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
     */
    addIssue(severity, code, message, details = {}) {
        const issue = {
            severity,
            code,
            message,
            state: this.state,
            ...details
        };

        if (severity === ErrorSeverity.WARNING) {
            this.warnings.push(issue);
        } else {
            this.errors.push(issue);
        }

        return issue;
    }

    /**
     * Record a recovery action
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
     * Transition to a new state
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
     */
    parse(tleString) {
        this.reset();

        // Input validation
        if (typeof tleString !== 'string') {
            this.addIssue(
                ErrorSeverity.CRITICAL,
                ERROR_CODES.INVALID_INPUT_TYPE,
                'TLE data must be a string',
                { inputType: typeof tleString }
            );
            this.transition(ParserState.ERROR);
            return this.getResult();
        }

        if (tleString.length === 0) {
            this.addIssue(
                ErrorSeverity.CRITICAL,
                ERROR_CODES.EMPTY_INPUT,
                'TLE string cannot be empty',
                { inputLength: 0 }
            );
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
     */
    detectFormat(tleString) {
        // Parse lines
        const lines = tleString.trim().split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        this.context.lines = lines;
        this.context.lineCount = lines.length;

        // Validate line count
        if (lines.length < 2) {
            this.addIssue(
                ErrorSeverity.CRITICAL,
                ERROR_CODES.INVALID_LINE_COUNT,
                `TLE must contain at least 2 lines (found ${lines.length})`,
                { expected: '2 or 3', actual: lines.length }
            );

            if (this.options.attemptRecovery) {
                this.recordRecovery(
                    RecoveryAction.ABORT,
                    'Insufficient lines to parse TLE',
                    { lineCount: lines.length }
                );
            }

            this.transition(ParserState.ERROR);
            return;
        }

        if (lines.length > 3) {
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_LINE_COUNT,
                `TLE should contain 2 or 3 lines (found ${lines.length})`,
                { expected: '2 or 3', actual: lines.length }
            );

            if (this.options.attemptRecovery) {
                this.recordRecovery(
                    RecoveryAction.ATTEMPT_FIX,
                    'Attempting to identify valid TLE lines from excess lines',
                    { lineCount: lines.length }
                );

                // Try to find the two lines starting with '1' and '2'
                const line1Candidates = lines.filter(l => l[0] === '1');
                const line2Candidates = lines.filter(l => l[0] === '2');

                if (line1Candidates.length === 1 && line2Candidates.length === 1) {
                    const line1Idx = lines.indexOf(line1Candidates[0]);
                    const line2Idx = lines.indexOf(line2Candidates[0]);

                    // If line1 comes before line2, check if there's a name line before line1
                    if (line1Idx < line2Idx) {
                        if (line1Idx > 0) {
                            this.context.hasName = true;
                            this.context.nameLineIndex = line1Idx - 1;
                        }
                        this.context.line1Index = line1Idx;
                        this.context.line2Index = line2Idx;
                        this.context.lines = this.context.hasName
                            ? [lines[this.context.nameLineIndex], lines[line1Idx], lines[line2Idx]]
                            : [lines[line1Idx], lines[line2Idx]];
                        this.context.lineCount = this.context.lines.length;

                        this.recordRecovery(
                            RecoveryAction.CONTINUE,
                            'Successfully identified TLE lines from excess input',
                            { extractedLines: this.context.lineCount }
                        );
                    }
                }
            }
        } else {
            // Determine if we have 2 or 3 lines
            if (lines.length === 3) {
                // Check if first line looks like a satellite name or a TLE line
                const firstChar = lines[0][0];
                if (firstChar === '1' || firstChar === '2') {
                    this.addIssue(
                        ErrorSeverity.WARNING,
                        ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
                        'First line starts with "1" or "2", might be missing satellite name',
                        { firstLine: lines[0] }
                    );
                    // Could be malformed 3-line or actual TLE data
                }
                this.context.hasName = true;
                this.context.nameLineIndex = 0;
                this.context.line1Index = 1;
                this.context.line2Index = 2;
            } else {
                this.context.hasName = false;
                this.context.line1Index = 0;
                this.context.line2Index = 1;
            }
        }
    }

    /**
     * Execute the state machine
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
                    } else {
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
                    const hasCriticalErrors = this.errors.some(
                        e => e.severity === ErrorSeverity.CRITICAL
                    );
                    if (hasCriticalErrors && !this.options.includePartialResults) {
                        this.transition(ParserState.ERROR);
                    } else {
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
            this.addIssue(
                ErrorSeverity.CRITICAL,
                'STATE_MACHINE_LOOP',
                'State machine exceeded maximum iterations',
                { iterations }
            );
            this.transition(ParserState.ERROR);
        }
    }

    /**
     * Parse satellite name line
     */
    parseSatelliteName() {
        const nameLineIdx = this.context.nameLineIndex;
        if (nameLineIdx < 0 || nameLineIdx >= this.context.lines.length) {
            this.addIssue(
                ErrorSeverity.ERROR,
                'INVALID_NAME_LINE_INDEX',
                'Invalid satellite name line index',
                { index: nameLineIdx }
            );
            return;
        }

        const nameLine = this.context.lines[nameLineIdx];
        this.parsedData.satelliteName = nameLine;

        // Validate satellite name
        if (nameLine.length > 24) {
            this.addIssue(
                ErrorSeverity.WARNING,
                ERROR_CODES.SATELLITE_NAME_TOO_LONG,
                'Satellite name exceeds recommended 24 characters',
                { length: nameLine.length, name: nameLine }
            );
        }

        if (nameLine[0] === '1' || nameLine[0] === '2') {
            this.addIssue(
                ErrorSeverity.WARNING,
                ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
                'Satellite name starts with "1" or "2", might be incorrectly formatted',
                { name: nameLine }
            );
        }
    }

    /**
     * Parse TLE Line 1
     */
    parseLine1() {
        const line1Idx = this.context.line1Index;
        if (line1Idx < 0 || line1Idx >= this.context.lines.length) {
            this.addIssue(
                ErrorSeverity.CRITICAL,
                'INVALID_LINE1_INDEX',
                'Invalid Line 1 index',
                { index: line1Idx }
            );
            return;
        }

        const line1 = this.context.lines[line1Idx];
        this.parsedData.line1Raw = line1;

        // Check line length
        if (line1.length !== 69) {
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_LINE_LENGTH,
                `Line 1 must be exactly 69 characters (got ${line1.length})`,
                { line: 1, expected: 69, actual: line1.length }
            );

            if (this.options.attemptRecovery) {
                this.recordRecovery(
                    RecoveryAction.CONTINUE,
                    'Attempting to parse Line 1 despite incorrect length',
                    { length: line1.length }
                );
            } else if (this.options.strictMode) {
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
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_LINE_NUMBER,
                `Line 1 must start with '1' (got '${this.parsedData.lineNumber1}')`,
                { line: 1, expected: '1', actual: this.parsedData.lineNumber1 }
            );
        }

        // Validate classification
        const validClassifications = ['U', 'C', 'S'];
        if (this.parsedData.classification &&
            !validClassifications.includes(this.parsedData.classification)) {
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_CLASSIFICATION,
                `Classification must be U, C, or S (got '${this.parsedData.classification}')`,
                { expected: validClassifications, actual: this.parsedData.classification }
            );
        }

        // Validate checksum
        if (line1.length === 69) {
            const checksum = this.calculateChecksum(line1);
            const actualChecksum = parseInt(this.parsedData.checksum1, 10);
            if (checksum !== actualChecksum) {
                this.addIssue(
                    ErrorSeverity.ERROR,
                    ERROR_CODES.CHECKSUM_MISMATCH,
                    `Line 1 checksum mismatch (expected ${checksum}, got ${actualChecksum})`,
                    { line: 1, expected: checksum, actual: actualChecksum }
                );

                if (this.options.attemptRecovery) {
                    this.recordRecovery(
                        RecoveryAction.CONTINUE,
                        'Continuing despite checksum mismatch',
                        { line: 1 }
                    );
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
            this.addIssue(
                ErrorSeverity.CRITICAL,
                'INVALID_LINE2_INDEX',
                'Invalid Line 2 index',
                { index: line2Idx }
            );
            return;
        }

        const line2 = this.context.lines[line2Idx];
        this.parsedData.line2Raw = line2;

        // Check line length
        if (line2.length !== 69) {
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_LINE_LENGTH,
                `Line 2 must be exactly 69 characters (got ${line2.length})`,
                { line: 2, expected: 69, actual: line2.length }
            );

            if (this.options.attemptRecovery) {
                this.recordRecovery(
                    RecoveryAction.CONTINUE,
                    'Attempting to parse Line 2 despite incorrect length',
                    { length: line2.length }
                );
            } else if (this.options.strictMode) {
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
            this.addIssue(
                ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_LINE_NUMBER,
                `Line 2 must start with '2' (got '${this.parsedData.lineNumber2}')`,
                { line: 2, expected: '2', actual: this.parsedData.lineNumber2 }
            );
        }

        // Validate checksum
        if (line2.length === 69) {
            const checksum = this.calculateChecksum(line2);
            const actualChecksum = parseInt(this.parsedData.checksum2, 10);
            if (checksum !== actualChecksum) {
                this.addIssue(
                    ErrorSeverity.ERROR,
                    ERROR_CODES.CHECKSUM_MISMATCH,
                    `Line 2 checksum mismatch (expected ${checksum}, got ${actualChecksum})`,
                    { line: 2, expected: checksum, actual: actualChecksum }
                );

                if (this.options.attemptRecovery) {
                    this.recordRecovery(
                        RecoveryAction.CONTINUE,
                        'Continuing despite checksum mismatch',
                        { line: 2 }
                    );
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
                this.addIssue(
                    ErrorSeverity.ERROR,
                    ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
                    `Satellite numbers must match (Line 1: ${sat1}, Line 2: ${sat2})`,
                    { line1Value: sat1, line2Value: sat2 }
                );
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
                this.addIssue(
                    ErrorSeverity.ERROR,
                    ERROR_CODES.VALUE_OUT_OF_RANGE,
                    `Eccentricity must be between 0 and 1 (got ${ecc})`,
                    { field: 'eccentricity', value: ecc, min: 0, max: 1 }
                );
            }
        }

        // Mean motion warning (not strict error)
        this.validateNumericField('meanMotion', 0, 20, 'Mean Motion', true);

        // Epoch year (00-99)
        this.validateNumericField('epochYear', 0, 99, 'Epoch Year');
    }

    /**
     * Validate a numeric field is within range
     */
    validateNumericField(fieldName, min, max, displayName, warningOnly = false) {
        if (!this.parsedData[fieldName]) {
            return;
        }

        const value = parseFloat(this.parsedData[fieldName].trim());
        if (isNaN(value)) {
            this.addIssue(
                warningOnly ? ErrorSeverity.WARNING : ErrorSeverity.ERROR,
                ERROR_CODES.INVALID_NUMBER_FORMAT,
                `${displayName} must be numeric (got '${this.parsedData[fieldName]}')`,
                { field: fieldName, value: this.parsedData[fieldName] }
            );
            return;
        }

        if (value < min || value > max) {
            this.addIssue(
                warningOnly ? ErrorSeverity.WARNING : ErrorSeverity.ERROR,
                ERROR_CODES.VALUE_OUT_OF_RANGE,
                `${displayName} must be between ${min} and ${max} (got ${value})`,
                { field: fieldName, value, min, max }
            );
        }
    }

    /**
     * Safely parse a field from a line
     */
    parseFieldSafe(fieldName, line, start, end, displayName) {
        try {
            if (line.length >= end) {
                this.parsedData[fieldName] = line.substring(start, end).trim();
            } else if (line.length > start) {
                // Partial field available
                this.parsedData[fieldName] = line.substring(start).trim();
                this.addIssue(
                    ErrorSeverity.WARNING,
                    'PARTIAL_FIELD',
                    `${displayName} is incomplete due to short line`,
                    { field: fieldName, expected: [start, end], actual: line.length }
                );

                if (this.options.attemptRecovery) {
                    this.recordRecovery(
                        RecoveryAction.USE_DEFAULT,
                        `Using partial value for ${displayName}`,
                        { field: fieldName }
                    );
                }
            } else {
                // Field completely missing
                this.parsedData[fieldName] = null;
                this.addIssue(
                    ErrorSeverity.WARNING,
                    'MISSING_FIELD',
                    `${displayName} is missing due to short line`,
                    { field: fieldName, expected: [start, end], actual: line.length }
                );

                if (this.options.attemptRecovery) {
                    this.recordRecovery(
                        RecoveryAction.USE_DEFAULT,
                        `Using null for missing ${displayName}`,
                        { field: fieldName }
                    );
                }
            }
        } catch (error) {
            this.parsedData[fieldName] = null;
            this.addIssue(
                ErrorSeverity.ERROR,
                'FIELD_PARSE_ERROR',
                `Error parsing ${displayName}: ${error.message}`,
                { field: fieldName, error: error.message }
            );
        }
    }

    /**
     * Calculate checksum for a TLE line
     */
    calculateChecksum(line) {
        let checksum = 0;
        for (let i = 0; i < line.length - 1; i++) {
            const char = line[i];
            if (char >= '0' && char <= '9') {
                checksum += parseInt(char, 10);
            } else if (char === '-') {
                checksum += 1;
            }
        }
        return checksum % 10;
    }

    /**
     * Get the final result
     */
    getResult() {
        return {
            success: this.state === ParserState.COMPLETED,
            state: this.state,
            data: this.parsedData,
            errors: this.errors,
            warnings: this.warnings,
            recoveryActions: this.recoveryActions,
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
 * @param {string} tleString - The TLE data string
 * @param {object} options - Parser options
 * @returns {object} - Parse result with data, errors, warnings, and recovery actions
 */
function parseWithStateMachine(tleString, options = {}) {
    const parser = new TLEStateMachineParser(options);
    return parser.parse(tleString);
}

module.exports = {
    TLEStateMachineParser,
    parseWithStateMachine,
    ParserState,
    ErrorSeverity,
    RecoveryAction
};
