#!/usr/bin/env node
#!/usr/bin/env node
/**
 * tle-parser v1.0.0
 * A parser for TLE (Two-Line Element) satellite data.
 * @license MIT
 */
import { readFile, readFileSync, watch, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { stdin } from 'process';
import { promisify } from 'util';
import 'stream';
import 'zlib';

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
 * Advanced TLE Parser Features
 * Provides advanced parsing capabilities including batch, async, streaming,
 * filtering, caching, and multi-source support
 */
promisify(readFile);
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
function getSatelliteNumber$1(tle) {
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
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'};
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
                satelliteNumber: getSatelliteNumber$1(result),
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
    lines.push(`  ${colorize('Satellite Number:', Colors.green, colors)} ${getSatelliteNumber$1(tle)}`);
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
    line1 += padLeft(getSatelliteNumber$1(tle), 5, ' ');
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
    line2 += padLeft(getSatelliteNumber$1(tle), 5, ' ');
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

/**
 * TLE Parser CLI
 * Command-line interface for parsing, validating, and converting TLE data
 */
/**
 * Helper to get satellite number from ParsedTLE
 */
function getSatelliteNumber(tle) {
    return tle.satelliteNumber1 || tle.satelliteNumber2 || '';
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Print help message
 */
function printHelp() {
    const helpText = `
TLE Parser CLI - Parse and convert Two-Line Element satellite data

USAGE:
  tle-parser [options] <file|url>
  tle-parser [options] < input.txt
  cat input.txt | tle-parser [options]

OPTIONS:
  -f, --format <type>       Output format: json, csv, xml, yaml, human, tle (default: json)
  -p, --pretty              Pretty-print output (for json, xml, yaml)
  -c, --colors              Enable colored output (for human format)
  -v, --verbosity <level>   Verbosity level: compact, normal, verbose (default: normal)
  -o, --output <file>       Write output to file instead of stdout
  --validate-only           Only validate TLE, don't parse
  --watch                   Watch file for changes and reprocess
  --filter <pattern>        Filter satellites by name or number (regex)
  --diff <file>             Compare with another TLE file and show differences
  --url                     Fetch TLE from URL instead of file
  --recursive               Process all TLE files in directory recursively
  --no-warnings             Exclude warnings from output
  --no-comments             Exclude comments from output
  -h, --help                Show this help message
  --version                 Show version number

EXAMPLES:
  # Parse TLE file to JSON
  tle-parser data/iss.tle

  # Parse with pretty-printed JSON
  tle-parser --format json --pretty data/iss.tle

  # Parse to human-readable format with colors
  tle-parser --format human --colors data/iss.tle

  # Parse to CSV
  tle-parser --format csv --output satellites.csv data/satellites.tle

  # Validate TLE without parsing
  tle-parser --validate-only data/iss.tle

  # Watch file for changes
  tle-parser --watch data/iss.tle

  # Filter satellites by name
  tle-parser --filter "STARLINK" data/satellites.tle

  # Compare two TLE files
  tle-parser --diff data/old.tle data/new.tle

  # Fetch TLE from URL
  tle-parser --url https://celestrak.org/NORAD/elements/gp.php?GROUP=stations

  # Read from stdin
  cat data/iss.tle | tle-parser --format json

  # Process all TLE files in directory
  tle-parser --recursive data/

  # Reconstruct TLE from parsed data
  tle-parser --format tle data/iss.tle
`;
    console.log(helpText);
}
/**
 * Print version
 */
function printVersion() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
        console.log(`tle-parser v${packageJson.version}`);
    }
    catch {
        console.log('tle-parser (version unknown)');
    }
}
/**
 * Parse command-line arguments
 */
function parseArgs(args) {
    const options = {
        format: 'json',
        pretty: false,
        colors: false,
        verbosity: 'normal',
        validateOnly: false,
        watch: false,
        url: false,
        recursive: false,
        includeWarnings: true,
        includeComments: true
    };
    const files = [];
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (!arg)
            continue;
        switch (arg) {
            case '-h':
            case '--help':
                options.help = true;
                break;
            case '--version':
                options.version = true;
                break;
            case '-f':
            case '--format':
                options.format = (args[++i] || 'json');
                break;
            case '-p':
            case '--pretty':
                options.pretty = true;
                break;
            case '-c':
            case '--colors':
                options.colors = true;
                break;
            case '-v':
            case '--verbosity':
                options.verbosity = (args[++i] || 'normal');
                break;
            case '-o':
            case '--output':
                options.output = args[++i] || '';
                break;
            case '--validate-only':
                options.validateOnly = true;
                break;
            case '--watch':
                options.watch = true;
                break;
            case '--filter':
                options.filter = args[++i] || '';
                break;
            case '--diff':
                options.diff = args[++i] || '';
                break;
            case '--url':
                options.url = true;
                break;
            case '--recursive':
                options.recursive = true;
                break;
            case '--no-warnings':
                options.includeWarnings = false;
                break;
            case '--no-comments':
                options.includeComments = false;
                break;
            default:
                if (!arg.startsWith('-')) {
                    files.push(arg);
                }
                break;
        }
        i++;
    }
    return { options, files };
}
/**
 * Read TLE data from file, URL, or stdin
 */
async function readInput(source, isUrl = false) {
    // Read from URL
    if (isUrl && source) {
        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        return await response.text();
    }
    // Read from file
    if (source) {
        if (!existsSync(source)) {
            throw new Error(`File not found: ${source}`);
        }
        return readFileSync(source, 'utf-8');
    }
    // Read from stdin
    return new Promise((resolve, reject) => {
        let data = '';
        stdin.setEncoding('utf-8');
        stdin.on('data', chunk => (data += chunk));
        stdin.on('end', () => resolve(data));
        stdin.on('error', reject);
    });
}
/**
 * Filter TLEs by pattern
 */
function filterTLEs(tles, pattern) {
    const regex = new RegExp(pattern, 'i');
    return tles.filter(tle => {
        return regex.test(tle.satelliteName || '') || regex.test(getSatelliteNumber(tle));
    });
}
/**
 * Compare two TLE datasets and show differences
 */
function diffTLEs(oldTles, newTles) {
    const oldMap = new Map(oldTles.map(t => [getSatelliteNumber(t), t]));
    const newMap = new Map(newTles.map(t => [getSatelliteNumber(t), t]));
    console.log('\n=== TLE Comparison ===\n');
    // Find removed satellites
    const removed = oldTles.filter(t => !newMap.has(getSatelliteNumber(t)));
    if (removed.length > 0) {
        console.log(`Removed (${removed.length}):`);
        removed.forEach(t => console.log(`  - ${t.satelliteName} (${getSatelliteNumber(t)})`));
        console.log('');
    }
    // Find added satellites
    const added = newTles.filter(t => !oldMap.has(getSatelliteNumber(t)));
    if (added.length > 0) {
        console.log(`Added (${added.length}):`);
        added.forEach(t => console.log(`  + ${t.satelliteName} (${getSatelliteNumber(t)})`));
        console.log('');
    }
    // Find modified satellites
    const modified = [];
    for (const [satNum, newTle] of newMap.entries()) {
        const oldTle = oldMap.get(satNum);
        if (oldTle) {
            // Check if any orbital parameters changed
            const changed = oldTle.inclination !== newTle.inclination ||
                oldTle.eccentricity !== newTle.eccentricity ||
                oldTle.meanMotion !== newTle.meanMotion ||
                oldTle.epochYear !== newTle.epochYear ||
                oldTle.epoch !== newTle.epoch;
            if (changed) {
                modified.push({ old: oldTle, new: newTle });
            }
        }
    }
    if (modified.length > 0) {
        console.log(`Modified (${modified.length}):`);
        modified.forEach(({ old, new: newTle }) => {
            console.log(`  ~ ${newTle.satelliteName} (${getSatelliteNumber(newTle)})`);
            if (old.inclination !== newTle.inclination) {
                console.log(`    Inclination: ${old.inclination} → ${newTle.inclination}`);
            }
            if (old.eccentricity !== newTle.eccentricity) {
                console.log(`    Eccentricity: ${old.eccentricity} → ${newTle.eccentricity}`);
            }
            if (old.meanMotion !== newTle.meanMotion) {
                console.log(`    Mean Motion: ${old.meanMotion} → ${newTle.meanMotion}`);
            }
            if (old.epochYear !== newTle.epochYear || old.epoch !== newTle.epoch) {
                console.log(`    Epoch: ${old.epochYear}:${old.epoch} → ${newTle.epochYear}:${newTle.epoch}`);
            }
        });
        console.log('');
    }
    console.log(`Summary: ${removed.length} removed, ${added.length} added, ${modified.length} modified`);
}
/**
 * Process TLE file
 */
async function processFile(filePath, options, isUrl = false) {
    try {
        // Read input
        const data = await readInput(filePath, isUrl);
        // Validate only mode
        if (options.validateOnly) {
            const result = validateTLE(data);
            if (result.isValid) {
                console.log('✓ TLE validation passed');
                if (result.warnings.length > 0) {
                    console.log(`\nWarnings (${result.warnings.length}):`);
                    result.warnings.forEach(w => {
                        const msg = typeof w === 'object' && 'message' in w ? w.message : String(w);
                        console.log(`  ⚠ ${msg}`);
                    });
                }
            }
            else {
                console.error('✗ TLE validation failed');
                console.error(`\nErrors (${result.errors.length}):`);
                result.errors.forEach(e => {
                    const msg = typeof e === 'object' && 'message' in e ? e.message : String(e);
                    console.error(`  ✗ ${msg}`);
                });
                process.exit(1);
            }
            return;
        }
        // Parse TLE(s)
        let tles;
        try {
            tles = parseBatch(data, { validate: true });
        }
        catch (error) {
            // If batch parsing fails, try single TLE
            tles = [parseTLE(data, { validate: true })];
        }
        // Apply filter if specified
        if (options.filter) {
            tles = filterTLEs(tles, options.filter);
        }
        // Format output
        const outputOptions = {
            format: options.format,
            pretty: options.pretty,
            colors: options.colors,
            verbosity: options.verbosity,
            includeWarnings: options.includeWarnings,
            includeComments: options.includeComments
        };
        const result = tles.length === 1 ? tles[0] : tles;
        if (!result) {
            console.error('No TLE data parsed');
            process.exit(1);
        }
        const output = formatTLE(result, outputOptions);
        // Write output
        if (options.output) {
            const fs = await import('fs/promises');
            await fs.writeFile(options.output, output, 'utf-8');
            console.log(`Output written to: ${options.output}`);
        }
        else {
            console.log(output);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Unknown error occurred');
        }
        process.exit(1);
    }
}
/**
 * Process directory recursively
 */
async function processDirectory(dirPath, options) {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const tleExtensions = ['.tle', '.txt', '.text'];
    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory() && options.recursive) {
            await processDirectory(fullPath, options);
        }
        else if (entry.isFile() && tleExtensions.includes(extname(entry.name).toLowerCase())) {
            console.log(`\nProcessing: ${fullPath}`);
            await processFile(fullPath, options);
        }
    }
}
/**
 * Watch file for changes
 */
async function watchFile(filePath, options) {
    console.log(`Watching ${filePath} for changes... (Press Ctrl+C to stop)`);
    watch(filePath, async (eventType) => {
        if (eventType === 'change') {
            console.log(`\n[${new Date().toISOString()}] File changed, reprocessing...`);
            await processFile(filePath, options);
        }
    });
    // Keep process running
    await new Promise(() => { });
}
/**
 * Compare two TLE files
 */
async function compareFiles(file1, file2) {
    if (!file1 || !file2) {
        console.error('Error: Both file paths are required for comparison');
        process.exit(1);
    }
    try {
        const data1 = await readInput(file1);
        const data2 = await readInput(file2);
        let tles1;
        let tles2;
        try {
            tles1 = parseBatch(data1, { validate: false });
        }
        catch {
            tles1 = [parseTLE(data1, { validate: false })];
        }
        try {
            tles2 = parseBatch(data2, { validate: false });
        }
        catch {
            tles2 = [parseTLE(data2, { validate: false })];
        }
        diffTLEs(tles1, tles2);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}
// ============================================================================
// MAIN
// ============================================================================
/**
 * Main CLI entry point
 */
async function main() {
    const { options, files } = parseArgs(process.argv.slice(2));
    // Handle help and version
    if (options.help) {
        printHelp();
        return;
    }
    if (options.version) {
        printVersion();
        return;
    }
    // Handle diff mode
    if (options.diff) {
        if (files.length !== 1) {
            console.error('Error: --diff requires exactly one file argument');
            process.exit(1);
        }
        await compareFiles(options.diff, files[0]);
        return;
    }
    // Determine input source
    const inputFile = files[0];
    // Check if stdin has data
    const isStdin = !inputFile && !stdin.isTTY;
    if (!inputFile && !isStdin) {
        console.error('Error: No input file specified and stdin is empty');
        console.error('Run "tle-parser --help" for usage information');
        process.exit(1);
    }
    // Handle recursive directory processing
    if (options.recursive && inputFile) {
        const fs = await import('fs/promises');
        const stats = await fs.stat(inputFile);
        if (stats.isDirectory()) {
            await processDirectory(inputFile, options);
            return;
        }
    }
    // Handle watch mode
    if (options.watch) {
        if (!inputFile) {
            console.error('Error: --watch requires a file argument');
            process.exit(1);
        }
        await watchFile(inputFile, options);
        return;
    }
    // Process single file or stdin
    await processFile(inputFile, options, options.url);
}
// Run CLI
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { main, parseArgs, printHelp, printVersion };
//# sourceMappingURL=cli.js.map
