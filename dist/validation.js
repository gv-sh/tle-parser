"use strict";
/**
 * Comprehensive TLE Validation and Normalization Module
 *
 * This module provides advanced validation, normalization, and data quality
 * assessment for Two-Line Element (TLE) sets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationRuleManager = exports.DEFAULT_VALIDATION_RULES = exports.QUALITY_SCORE_WEIGHTS = exports.DESIGNATOR_CONSTRAINTS = exports.EPOCH_CONSTRAINTS = exports.SATELLITE_NUMBER_RANGES = exports.ORBITAL_PARAMETER_RANGES = void 0;
exports.convertEpochToDate = convertEpochToDate;
exports.validateEpochDate = validateEpochDate;
exports.calculateEpochAge = calculateEpochAge;
exports.validateEpochAge = validateEpochAge;
exports.validateOrbitalParameter = validateOrbitalParameter;
exports.validateAllOrbitalParameters = validateAllOrbitalParameters;
exports.calculateChecksum = calculateChecksum;
exports.validateChecksum = validateChecksum;
exports.normalizeAssumedDecimalNotation = normalizeAssumedDecimalNotation;
exports.normalizeScientificNotation = normalizeScientificNotation;
exports.validateSatelliteNumber = validateSatelliteNumber;
exports.validateInternationalDesignator = validateInternationalDesignator;
exports.detectAnomalies = detectAnomalies;
exports.calculateQualityScore = calculateQualityScore;
exports.sanitizeField = sanitizeField;
exports.sanitizeAllFields = sanitizeAllFields;
exports.createValidationRule = createValidationRule;
exports.generateValidationReport = generateValidationReport;
// ============================================================================
// Constants and Configuration
// ============================================================================
/**
 * Valid orbital parameter ranges based on TLE specifications and physical constraints
 */
exports.ORBITAL_PARAMETER_RANGES = {
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
    bStar: { min: -1.0, max: 1.0, typical: { min: -0.001, max: 0.001 } },
    // First derivative of mean motion (revolutions/day^2)
    meanMotionFirstDerivative: { min: -1.0, max: 1.0, typical: { min: -0.001, max: 0.001 } },
    // Second derivative of mean motion (revolutions/day^3)
    meanMotionSecondDerivative: { min: -1.0, max: 1.0, typical: { min: -0.00001, max: 0.00001 } },
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
exports.SATELLITE_NUMBER_RANGES = {
    min: 1,
    max: 999999,
    // Historical cutoffs
    historical5Digit: 99999,
    modern6Digit: 999999
};
/**
 * Epoch date validation constraints
 */
exports.EPOCH_CONSTRAINTS = {
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
exports.DESIGNATOR_CONSTRAINTS = {
    yearMin: 57, // 1957
    yearMax: 99, // up to 2099
    launchNumberMin: 1,
    launchNumberMax: 999,
    piecePattern: /^[A-Z]{1,3}$/ // 1-3 uppercase letters
};
/**
 * Data quality score weights
 */
exports.QUALITY_SCORE_WEIGHTS = {
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
    if (epochYear < exports.EPOCH_CONSTRAINTS.minYear || epochYear > exports.EPOCH_CONSTRAINTS.maxYear) {
        errors.push(`Epoch year ${epochYear} outside valid range ` +
            `[${exports.EPOCH_CONSTRAINTS.minYear}, ${exports.EPOCH_CONSTRAINTS.maxYear}]`);
    }
    // Validate day of year range
    if (epochDay < exports.EPOCH_CONSTRAINTS.minDayOfYear || epochDay > exports.EPOCH_CONSTRAINTS.maxDayOfYear) {
        errors.push(`Epoch day ${epochDay} outside valid range ` +
            `[${exports.EPOCH_CONSTRAINTS.minDayOfYear}, ${exports.EPOCH_CONSTRAINTS.maxDayOfYear}]`);
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
        else if (futureDays > exports.EPOCH_CONSTRAINTS.maxFutureDays) {
            warnings.push(`Epoch is ${futureDays.toFixed(2)} days in the future ` +
                `(threshold: ${exports.EPOCH_CONSTRAINTS.maxFutureDays} days)`);
        }
    }
    // Check if epoch is too old
    if (age > 0) {
        const maxAge = options.maxAge || exports.EPOCH_CONSTRAINTS.criticalAgeThreshold;
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
    const ranges = exports.ORBITAL_PARAMETER_RANGES[paramName];
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
function calculateChecksum(line) {
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
function validateChecksum(line, lineNumber) {
    if (line.length < 69) {
        return {
            valid: false,
            message: `Line ${lineNumber} is too short (${line.length} chars, expected 69)`,
            context: { lineNumber, length: line.length }
        };
    }
    const checksumChar = line.charAt(68);
    const expectedChecksum = parseInt(checksumChar, 10);
    const calculatedChecksum = calculateChecksum(line);
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
function validateSatelliteNumber(satelliteNumber) {
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
    if (numValue < exports.SATELLITE_NUMBER_RANGES.min || numValue > exports.SATELLITE_NUMBER_RANGES.max) {
        return {
            valid: false,
            message: `Satellite number ${numValue} outside valid range [${exports.SATELLITE_NUMBER_RANGES.min}, ${exports.SATELLITE_NUMBER_RANGES.max}]`,
            context: {
                satelliteNumber: numValue,
                min: exports.SATELLITE_NUMBER_RANGES.min,
                max: exports.SATELLITE_NUMBER_RANGES.max
            }
        };
    }
    return {
        valid: true,
        context: {
            satelliteNumber: numValue,
            format: numValue <= exports.SATELLITE_NUMBER_RANGES.historical5Digit ? '5-digit' : '6-digit'
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
    if (year < exports.DESIGNATOR_CONSTRAINTS.yearMin || year > exports.DESIGNATOR_CONSTRAINTS.yearMax) {
        return {
            valid: false,
            message: `International designator year ${year} outside valid range [${exports.DESIGNATOR_CONSTRAINTS.yearMin}, ${exports.DESIGNATOR_CONSTRAINTS.yearMax}]`,
            context: { designator: trimmed, year }
        };
    }
    // Validate launch number
    if (launchNumber < exports.DESIGNATOR_CONSTRAINTS.launchNumberMin ||
        launchNumber > exports.DESIGNATOR_CONSTRAINTS.launchNumberMax) {
        return {
            valid: false,
            message: `International designator launch number ${launchNumber} outside valid range [${exports.DESIGNATOR_CONSTRAINTS.launchNumberMin}, ${exports.DESIGNATOR_CONSTRAINTS.launchNumberMax}]`,
            context: { designator: trimmed, launchNumber }
        };
    }
    // Validate piece
    if (!exports.DESIGNATOR_CONSTRAINTS.piecePattern.test(piece)) {
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
            fullYear: year >= exports.DESIGNATOR_CONSTRAINTS.yearMin ? 1900 + year : 2000 + year
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
        components.checksumScore = exports.QUALITY_SCORE_WEIGHTS.checksumValid;
    }
    // Format score (15 points)
    if (validationResults.formatValid) {
        components.formatScore = exports.QUALITY_SCORE_WEIGHTS.fieldFormatValid;
    }
    // Range score (15 points for all in valid range, 10 for typical range)
    const rangeErrors = validationResults.rangeErrors.filter(r => !r.valid);
    const rangeWarnings = validationResults.rangeResults.filter(r => r.valid && r.message);
    if (rangeErrors.length === 0) {
        components.rangeScore = exports.QUALITY_SCORE_WEIGHTS.parametersInRange;
        if (rangeWarnings.length === 0) {
            components.rangeScore += exports.QUALITY_SCORE_WEIGHTS.parametersInTypicalRange;
        }
    }
    else {
        // Partial credit based on percentage of valid parameters
        const totalParams = rangeErrors.length + rangeWarnings.length;
        const validParams = rangeWarnings.length;
        components.rangeScore = (validParams / totalParams) * exports.QUALITY_SCORE_WEIGHTS.parametersInRange;
    }
    // Epoch score (15 points)
    const epochAge = Math.abs(validationResults.epochAge);
    if (epochAge <= 1) {
        // Very fresh data
        components.epochScore = exports.QUALITY_SCORE_WEIGHTS.epochRecent;
    }
    else if (epochAge <= exports.EPOCH_CONSTRAINTS.warningAgeThreshold) {
        // Recent data
        components.epochScore = exports.QUALITY_SCORE_WEIGHTS.epochRecent * 0.9;
    }
    else if (epochAge <= exports.EPOCH_CONSTRAINTS.criticalAgeThreshold) {
        // Aging data
        components.epochScore = exports.QUALITY_SCORE_WEIGHTS.epochRecent * 0.5;
    }
    else {
        // Stale data
        components.epochScore = exports.QUALITY_SCORE_WEIGHTS.epochRecent * 0.2;
    }
    // Anomaly score (10 points)
    const severityWeights = { error: 1.0, warning: 0.5, info: 0.1 };
    const anomalyPenalty = validationResults.anomalies.reduce((sum, anomaly) => {
        const weight = severityWeights[anomaly.severity || 'info'];
        return sum + (anomaly.score || 0.5) * weight;
    }, 0);
    components.anomalyScore = Math.max(0, exports.QUALITY_SCORE_WEIGHTS.noAnomalies - anomalyPenalty * 2);
    // Consistency score (10 points)
    // Check satellite number consistency, classification validity, etc.
    let consistencyPoints = exports.QUALITY_SCORE_WEIGHTS.consistencyChecks;
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
exports.DEFAULT_VALIDATION_RULES = [
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
        validate: (value) => validateSatelliteNumber(value)
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
    constructor(initialRules = exports.DEFAULT_VALIDATION_RULES) {
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
exports.ValidationRuleManager = ValidationRuleManager;
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
        const checksum1 = validateChecksum(tleLines.line1, 1);
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
        const checksum2 = validateChecksum(tleLines.line2, 2);
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
    const satNumResult = validateSatelliteNumber(tle.satelliteNumber1);
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
//# sourceMappingURL=validation.js.map