const fs = require('fs');
const path = require('path');

// Load the TLE configuration with proper error handling
const tleConfigPath = path.join(__dirname, 'tleConfig.json');
let tleConfig;
try {
    const configData = fs.readFileSync(tleConfigPath, 'utf-8');
    tleConfig = JSON.parse(configData);
} catch (error) {
    if (error.code === 'ENOENT') {
        throw new Error(`TLE configuration file not found: ${tleConfigPath}`);
    } else if (error instanceof SyntaxError) {
        throw new Error(`Invalid TLE configuration JSON: ${error.message}`);
    }
    throw error;
}

// Error codes for structured error handling
const ERROR_CODES = {
    INVALID_INPUT_TYPE: 'INVALID_INPUT_TYPE',
    EMPTY_INPUT: 'EMPTY_INPUT',
    INVALID_LINE_COUNT: 'INVALID_LINE_COUNT',
    INVALID_LINE_LENGTH: 'INVALID_LINE_LENGTH',
    INVALID_LINE_NUMBER: 'INVALID_LINE_NUMBER',
    CHECKSUM_MISMATCH: 'CHECKSUM_MISMATCH',
    INVALID_CHECKSUM_CHARACTER: 'INVALID_CHECKSUM_CHARACTER',
    SATELLITE_NUMBER_MISMATCH: 'SATELLITE_NUMBER_MISMATCH',
    INVALID_SATELLITE_NUMBER: 'INVALID_SATELLITE_NUMBER',
    INVALID_CLASSIFICATION: 'INVALID_CLASSIFICATION',
    VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',
    INVALID_NUMBER_FORMAT: 'INVALID_NUMBER_FORMAT',
    SATELLITE_NAME_TOO_LONG: 'SATELLITE_NAME_TOO_LONG',
    SATELLITE_NAME_FORMAT_WARNING: 'SATELLITE_NAME_FORMAT_WARNING'
};

/**
 * Custom error class for TLE validation errors
 */
class TLEValidationError extends Error {
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
 */
class TLEFormatError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'TLEFormatError';
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Calculate the checksum for a TLE line according to NORAD specification
 * @param {string} line - The TLE line to calculate checksum for
 * @returns {number} - The calculated checksum (0-9)
 */
function calculateChecksum(line) {
    let checksum = 0;
    // Process all characters except the last one (which is the checksum itself)
    for (let i = 0; i < line.length - 1; i++) {
        const char = line[i];
        if (char >= '0' && char <= '9') {
            checksum += parseInt(char, 10);
        } else if (char === '-') {
            checksum += 1;
        }
        // Ignore all other characters (letters, spaces, periods, plus signs)
    }
    return checksum % 10;
}

/**
 * Validate TLE checksum
 * @param {string} line - The TLE line to validate
 * @returns {object} - Validation result {isValid: boolean, expected: number, actual: number, error: object}
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
                actual: line.length
            }
        };
    }

    const expected = calculateChecksum(line);
    const actual = parseInt(line[68], 10);

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
                value: line[68]
            }
        };
    }

    const isValid = expected === actual;
    return {
        isValid,
        expected,
        actual,
        error: isValid ? null : {
            code: ERROR_CODES.CHECKSUM_MISMATCH,
            message: `Checksum mismatch: expected ${expected}, got ${actual}`,
            field: 'checksum',
            expected,
            actual
        }
    };
}

/**
 * Validate TLE line structure
 * @param {string} line - The TLE line to validate
 * @param {number} expectedLineNumber - Expected line number (1 or 2)
 * @returns {object} - Validation result with structured errors array
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
    if (!checksumResult.isValid) {
        const checksumError = checksumResult.error;
        errors.push({
            ...checksumError,
            line: expectedLineNumber,
            message: `Line ${expectedLineNumber}: ${checksumError.message}`,
            severity: 'error'
        });
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate satellite number consistency between lines
 * @param {string} line1 - First TLE line
 * @param {string} line2 - Second TLE line
 * @returns {object} - Validation result with structured error
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
 * Validate classification character
 * @param {string} line1 - First TLE line
 * @returns {object} - Validation result with structured error
 */
function validateClassification(line1) {
    const classification = line1[7];
    const validClassifications = ['U', 'C', 'S'];

    if (!validClassifications.includes(classification)) {
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
 * @param {string} value - The value to validate
 * @param {string} fieldName - Name of the field
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {object} - Validation result with structured error
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

/**
 * Validate TLE format compliance with comprehensive checks
 * Validates checksums for BOTH Line 1 and Line 2
 * @param {string} tleString - The TLE data string
 * @param {object} options - Validation options {strictChecksums: boolean, validateRanges: boolean}
 * @returns {object} - Validation result with detailed structured errors and warnings
 * @throws {TypeError} - If input types are invalid
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
        throw new TLEFormatError(
            'TLE string cannot be empty',
            ERROR_CODES.EMPTY_INPUT,
            { inputLength: 0 }
        );
    }

    const {
        strictChecksums = true,
        validateRanges = true
    } = options;

    const errors = [];
    const warnings = [];

    // Parse lines
    const tleLines = tleString.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

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

        // Validate satellite name line (should not start with 1 or 2)
        if (tleLines[0][0] === '1' || tleLines[0][0] === '2') {
            warnings.push({
                code: ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
                message: 'Line 0 starts with "1" or "2", might be incorrectly formatted',
                field: 'satellite_name',
                value: tleLines[0],
                severity: 'warning'
            });
        }

        if (tleLines[0].length > 24) {
            warnings.push({
                code: ERROR_CODES.SATELLITE_NAME_TOO_LONG,
                message: 'Satellite name (Line 0) should be 24 characters or less',
                field: 'satellite_name',
                expected: 24,
                actual: tleLines[0].length,
                severity: 'warning'
            });
        }
    }

    const line1 = tleLines[line1Index];
    const line2 = tleLines[line2Index];

    // Validate line structures
    const line1Result = validateLineStructure(line1, 1);
    if (!line1Result.isValid) {
        errors.push(...line1Result.errors);
        if (strictChecksums) {
            return { isValid: false, errors, warnings };
        }
    }

    const line2Result = validateLineStructure(line2, 2);
    if (!line2Result.isValid) {
        errors.push(...line2Result.errors);
        if (strictChecksums) {
            return { isValid: false, errors, warnings };
        }
    }

    // Validate satellite number consistency
    const satNumResult = validateSatelliteNumber(line1, line2);
    if (!satNumResult.isValid) {
        errors.push(satNumResult.error);
    }

    // Validate classification
    const classResult = validateClassification(line1);
    if (!classResult.isValid) {
        errors.push(classResult.error);
    }

    // Validate ranges if requested
    if (validateRanges && line1.length === 69 && line2.length === 69) {
        // Satellite Number (1-99999, 5 digits)
        const satelliteNumber = line1.substring(2, 7).trim();
        const satNumRangeResult = validateNumericRange(satelliteNumber, 'Satellite Number', 1, 99999);
        if (!satNumRangeResult.isValid) {
            errors.push(satNumRangeResult.error);
        }

        // International Designator Year (0-99)
        const intlDesigYear = line1.substring(9, 11).trim();
        if (intlDesigYear.length > 0) {  // Field may be blank
            const idyResult = validateNumericRange(intlDesigYear, 'International Designator Year', 0, 99);
            if (!idyResult.isValid) {
                errors.push(idyResult.error);
            }
        }

        // International Designator Launch Number (1-999)
        const intlDesigLaunch = line1.substring(11, 14).trim();
        if (intlDesigLaunch.length > 0) {  // Field may be blank
            const idlResult = validateNumericRange(intlDesigLaunch, 'International Designator Launch Number', 1, 999);
            if (!idlResult.isValid) {
                errors.push(idlResult.error);
            }
        }

        // Ephemeris Type (0-9, single digit)
        const ephemerisType = line1.substring(62, 63).trim();
        if (ephemerisType.length > 0) {
            const etResult = validateNumericRange(ephemerisType, 'Ephemeris Type', 0, 9);
            if (!etResult.isValid) {
                errors.push(etResult.error);
            }
        }

        // Element Set Number (0-9999, 4 digits)
        const elementSetNum = line1.substring(64, 68).trim();
        if (elementSetNum.length > 0) {
            const esnResult = validateNumericRange(elementSetNum, 'Element Set Number', 0, 9999);
            if (!esnResult.isValid) {
                errors.push(esnResult.error);
            }
        }

        // Epoch Year (0-99)
        const epochYear = line1.substring(18, 20).trim();
        const eyResult = validateNumericRange(epochYear, 'Epoch Year', 0, 99);
        if (!eyResult.isValid) {
            errors.push(eyResult.error);
        }

        // Epoch Day (1-366.99999999)
        const epochDay = line1.substring(20, 32).trim();
        const edResult = validateNumericRange(epochDay, 'Epoch Day', 1, 366.99999999);
        if (!edResult.isValid) {
            errors.push(edResult.error);
        }

        // Inclination (0-180 degrees)
        const inclination = line2.substring(8, 16).trim();
        const incResult = validateNumericRange(inclination, 'Inclination', 0, 180);
        if (!incResult.isValid) {
            errors.push(incResult.error);
        }

        // Right Ascension (0-360 degrees)
        const rightAscension = line2.substring(17, 25).trim();
        const raResult = validateNumericRange(rightAscension, 'Right Ascension', 0, 360);
        if (!raResult.isValid) {
            errors.push(raResult.error);
        }

        // Eccentricity (0-1, stored as decimal without leading 0.)
        const eccentricity = '0.' + line2.substring(26, 33).trim();
        const eccResult = validateNumericRange(eccentricity, 'Eccentricity', 0, 1);
        if (!eccResult.isValid) {
            errors.push(eccResult.error);
        }

        // Argument of Perigee (0-360 degrees)
        const argPerigee = line2.substring(34, 42).trim();
        const apResult = validateNumericRange(argPerigee, 'Argument of Perigee', 0, 360);
        if (!apResult.isValid) {
            errors.push(apResult.error);
        }

        // Mean Anomaly (0-360 degrees)
        const meanAnomaly = line2.substring(43, 51).trim();
        const maResult = validateNumericRange(meanAnomaly, 'Mean Anomaly', 0, 360);
        if (!maResult.isValid) {
            errors.push(maResult.error);
        }

        // Mean Motion (revolutions per day, typically 0-20)
        const meanMotion = line2.substring(52, 63).trim();
        const mmResult = validateNumericRange(meanMotion, 'Mean Motion', 0, 20);
        if (!mmResult.isValid) {
            warnings.push({
                ...mmResult.error,
                message: mmResult.error.message + ' (unusual but may be valid)',
                severity: 'warning'
            });
        }

        // Revolution Number (0-99999, 5 digits)
        const revolutionNumber = line2.substring(63, 68).trim();
        if (revolutionNumber.length > 0) {
            const rnResult = validateNumericRange(revolutionNumber, 'Revolution Number', 0, 99999);
            if (!rnResult.isValid) {
                errors.push(rnResult.error);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Parse TLE data with optional validation
 * @param {string} tleString - The TLE data string
 * @param {object} options - Parsing options {validate: boolean, strictChecksums: boolean, validateRanges: boolean, includeWarnings: boolean}
 * @returns {object} - Parsed TLE object with optional warnings array
 * @throws {TypeError} - If input types are invalid
 * @throws {TLEValidationError} - If validation fails and validate option is true
 */
function parseTLE(tleString, options = {}) {
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
        includeWarnings = true
    } = options;

    // Validate if requested
    let validationWarnings = [];
    if (validate) {
        const validation = validateTLE(tleString, { strictChecksums, validateRanges });
        if (!validation.isValid) {
            // Create detailed error message
            const errorMessages = validation.errors.map(err =>
                typeof err === 'string' ? err : err.message
            );
            const errorMsg = 'TLE validation failed:\n' + errorMessages.join('\n');

            // Throw custom validation error with structured data
            throw new TLEValidationError(errorMsg, validation.errors, validation.warnings);
        }

        // Store warnings for later inclusion in result
        validationWarnings = validation.warnings;
    }

    const tleLines = tleString.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Determine line indices
    let line1Index = 0;
    let line2Index = 1;
    let satelliteName = null;

    if (tleLines.length === 3) {
        satelliteName = tleLines[0].trim();
        line1Index = 1;
        line2Index = 2;
    }

    const line1 = tleLines[line1Index];
    const line2 = tleLines[line2Index];

    const tleObject = {
        satelliteName: satelliteName
    };

    // Line 2 fields (fields that come from the second line)
    const line2Fields = [
        'lineNumber2', 'satelliteNumber2', 'inclination', 'rightAscension',
        'eccentricity', 'argumentOfPerigee', 'meanAnomaly', 'meanMotion',
        'revolutionNumber', 'checksum2'
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

    return tleObject;
}

module.exports = {
    parseTLE,
    validateTLE,
    calculateChecksum,
    validateChecksum,
    validateLineStructure,
    validateSatelliteNumber,
    validateClassification,
    validateNumericRange,
    TLEValidationError,
    TLEFormatError,
    ERROR_CODES
};