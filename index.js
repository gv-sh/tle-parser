const fs = require('fs');
const path = require('path');

// Load the TLE configuration
const tleConfigPath = path.join(__dirname, 'tleConfig.json');
const tleConfig = JSON.parse(fs.readFileSync(tleConfigPath, 'utf-8'));

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
 * @returns {object} - Validation result {isValid: boolean, expected: number, actual: number}
 */
function validateChecksum(line) {
    if (line.length !== 69) {
        return { isValid: false, expected: null, actual: null, error: 'Line length must be 69 characters' };
    }

    const expected = calculateChecksum(line);
    const actual = parseInt(line[68], 10);

    if (isNaN(actual)) {
        return { isValid: false, expected, actual: null, error: 'Checksum position must contain a digit' };
    }

    return {
        isValid: expected === actual,
        expected,
        actual,
        error: expected === actual ? null : `Checksum mismatch: expected ${expected}, got ${actual}`
    };
}

/**
 * Validate TLE line structure
 * @param {string} line - The TLE line to validate
 * @param {number} expectedLineNumber - Expected line number (1 or 2)
 * @returns {object} - Validation result with errors array
 */
function validateLineStructure(line, expectedLineNumber) {
    const errors = [];

    // Check line length
    if (line.length !== 69) {
        errors.push(`Line ${expectedLineNumber} must be exactly 69 characters (got ${line.length})`);
        return { isValid: false, errors };
    }

    // Check line number
    const lineNumber = line[0];
    if (lineNumber !== expectedLineNumber.toString()) {
        errors.push(`Line ${expectedLineNumber} must start with '${expectedLineNumber}' (got '${lineNumber}')`);
    }

    // Check checksum
    const checksumResult = validateChecksum(line);
    if (!checksumResult.isValid) {
        errors.push(`Line ${expectedLineNumber}: ${checksumResult.error}`);
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate satellite number consistency between lines
 * @param {string} line1 - First TLE line
 * @param {string} line2 - Second TLE line
 * @returns {object} - Validation result
 */
function validateSatelliteNumber(line1, line2) {
    const satNum1 = line1.substring(2, 7).trim();
    const satNum2 = line2.substring(2, 7).trim();

    if (satNum1 !== satNum2) {
        return {
            isValid: false,
            error: `Satellite numbers must match (Line 1: ${satNum1}, Line 2: ${satNum2})`
        };
    }

    // Validate it's a valid number
    if (!/^\d+$/.test(satNum1)) {
        return {
            isValid: false,
            error: `Satellite number must be numeric (got '${satNum1}')`
        };
    }

    return { isValid: true, error: null };
}

/**
 * Validate classification character
 * @param {string} line1 - First TLE line
 * @returns {object} - Validation result
 */
function validateClassification(line1) {
    const classification = line1[7];
    const validClassifications = ['U', 'C', 'S'];

    if (!validClassifications.includes(classification)) {
        return {
            isValid: false,
            error: `Classification must be U, C, or S (got '${classification}')`
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
 * @returns {object} - Validation result
 */
function validateNumericRange(value, fieldName, min, max) {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return {
            isValid: false,
            error: `${fieldName} must be numeric (got '${value}')`
        };
    }

    if (numValue < min || numValue > max) {
        return {
            isValid: false,
            error: `${fieldName} must be between ${min} and ${max} (got ${numValue})`
        };
    }

    return { isValid: true, error: null };
}

/**
 * Validate TLE format compliance with comprehensive checks
 * Validates checksums for BOTH Line 1 and Line 2
 * @param {string} tleString - The TLE data string
 * @param {object} options - Validation options {strictChecksums: boolean, validateRanges: boolean}
 * @returns {object} - Validation result with detailed errors
 */
function validateTLE(tleString, options = {}) {
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
        errors.push('TLE must contain at least 2 lines');
        return { isValid: false, errors, warnings };
    }

    if (tleLines.length > 3) {
        errors.push(`TLE must contain 2 or 3 lines (got ${tleLines.length})`);
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
            warnings.push('Line 0 starts with "1" or "2", might be incorrectly formatted');
        }

        if (tleLines[0].length > 24) {
            warnings.push('Satellite name (Line 0) should be 24 characters or less');
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
            warnings.push(mmResult.error + ' (unusual but may be valid)');
        }

        // Epoch Year (00-99)
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
 * @param {object} options - Parsing options {validate: boolean, strictChecksums: boolean, validateRanges: boolean}
 * @returns {object} - Parsed TLE object
 * @throws {Error} - If validation fails and validate option is true
 */
function parseTLE(tleString, options = {}) {
    const {
        validate = true,
        strictChecksums = true,
        validateRanges = true
    } = options;

    // Validate if requested
    if (validate) {
        const validation = validateTLE(tleString, { strictChecksums, validateRanges });
        if (!validation.isValid) {
            const errorMsg = 'TLE validation failed:\n' + validation.errors.join('\n');
            throw new Error(errorMsg);
        }

        // Log warnings if any
        if (validation.warnings.length > 0) {
            console.warn('TLE validation warnings:\n' + validation.warnings.join('\n'));
        }
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
    validateNumericRange
};