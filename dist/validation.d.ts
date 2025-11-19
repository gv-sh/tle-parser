/**
 * Comprehensive TLE Validation and Normalization Module
 *
 * This module provides advanced validation, normalization, and data quality
 * assessment for Two-Line Element (TLE) sets.
 */
import { ParsedTLE, TLEError, TLEWarning, ErrorSeverity } from './types';
/**
 * Valid orbital parameter ranges based on TLE specifications and physical constraints
 */
export declare const ORBITAL_PARAMETER_RANGES: {
    readonly meanMotion: {
        readonly min: 0;
        readonly max: 20;
        readonly typical: {
            readonly min: 10;
            readonly max: 17;
        };
    };
    readonly eccentricity: {
        readonly min: 0;
        readonly max: 0.999999;
        readonly typical: {
            readonly min: 0;
            readonly max: 0.25;
        };
    };
    readonly inclination: {
        readonly min: 0;
        readonly max: 180;
        readonly typical: {
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly rightAscension: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly argumentOfPerigee: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly meanAnomaly: {
        readonly min: 0;
        readonly max: 360;
    };
    readonly bStar: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.001;
            readonly max: 0.001;
        };
    };
    readonly meanMotionFirstDerivative: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.001;
            readonly max: 0.001;
        };
    };
    readonly meanMotionSecondDerivative: {
        readonly min: -1;
        readonly max: 1;
        readonly typical: {
            readonly min: -0.00001;
            readonly max: 0.00001;
        };
    };
    readonly revolutionNumber: {
        readonly min: 0;
        readonly max: 99999;
    };
    readonly elementSetNumber: {
        readonly min: 0;
        readonly max: 999;
    };
    readonly ephemerisType: {
        readonly min: 0;
        readonly max: 9;
    };
};
/**
 * NORAD satellite number ranges
 */
export declare const SATELLITE_NUMBER_RANGES: {
    readonly min: 1;
    readonly max: 999999;
    readonly historical5Digit: 99999;
    readonly modern6Digit: 999999;
};
/**
 * Epoch date validation constraints
 */
export declare const EPOCH_CONSTRAINTS: {
    readonly minYear: 57;
    readonly maxYear: 99;
    readonly minDayOfYear: 1;
    readonly maxDayOfYear: 366.99999999;
    readonly warningAgeThreshold: 7;
    readonly criticalAgeThreshold: 30;
    readonly maxFutureDays: 30;
};
/**
 * International Designator format constraints
 */
export declare const DESIGNATOR_CONSTRAINTS: {
    readonly yearMin: 57;
    readonly yearMax: 99;
    readonly launchNumberMin: 1;
    readonly launchNumberMax: 999;
    readonly piecePattern: RegExp;
};
/**
 * Data quality score weights
 */
export declare const QUALITY_SCORE_WEIGHTS: {
    readonly checksumValid: 20;
    readonly fieldFormatValid: 15;
    readonly parametersInRange: 15;
    readonly parametersInTypicalRange: 10;
    readonly epochRecent: 15;
    readonly noAnomalies: 10;
    readonly designatorValid: 5;
    readonly consistencyChecks: 10;
};
export interface EpochDate {
    /** Full year (e.g., 2024) */
    year: number;
    /** Two-digit year (e.g., 24) */
    twoDigitYear: number;
    /** Day of year with fractional part */
    dayOfYear: number;
    /** ISO 8601 date string */
    isoDate: string;
    /** JavaScript Date object */
    date: Date;
    /** Julian Date */
    julianDate: number;
    /** Modified Julian Date */
    modifiedJulianDate: number;
}
export interface ValidationRule<T = any> {
    /** Rule identifier */
    name: string;
    /** Rule description */
    description: string;
    /** Rule severity */
    severity: ErrorSeverity;
    /** Validation function */
    validate: (value: T, context?: any) => ValidationRuleResult;
    /** Whether rule is enabled */
    enabled: boolean;
    /** Custom error message template */
    errorMessage?: string;
}
export interface ValidationRuleResult {
    /** Whether validation passed */
    valid: boolean;
    /** Error message if validation failed */
    message?: string;
    /** Additional context */
    context?: Record<string, any>;
}
export interface FieldSanitizationResult {
    /** Sanitized value */
    value: string;
    /** Whether value was modified */
    modified: boolean;
    /** Description of modifications */
    modifications?: string[];
}
export interface AnomalyDetectionResult {
    /** Whether anomaly was detected */
    hasAnomaly: boolean;
    /** Anomaly type */
    type?: string;
    /** Anomaly description */
    description?: string;
    /** Anomaly severity */
    severity?: ErrorSeverity;
    /** Anomaly score (0-1, higher = more anomalous) */
    score?: number;
}
export interface DataQualityScore {
    /** Overall quality score (0-100) */
    overall: number;
    /** Component scores */
    components: {
        checksumScore: number;
        formatScore: number;
        rangeScore: number;
        epochScore: number;
        anomalyScore: number;
        consistencyScore: number;
    };
    /** Quality grade (A-F) */
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    /** Quality assessment */
    assessment: string;
}
export interface ValidationReport {
    /** Whether TLE is valid */
    isValid: boolean;
    /** Data quality score */
    qualityScore: DataQualityScore;
    /** All errors found */
    errors: TLEError[];
    /** All warnings found */
    warnings: TLEWarning[];
    /** Anomalies detected */
    anomalies: AnomalyDetectionResult[];
    /** Fields that were sanitized */
    sanitizedFields: string[];
    /** Validation timestamp */
    timestamp: Date;
    /** Validation rules applied */
    rulesApplied: string[];
    /** Summary statistics */
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        warningCount: number;
        errorCount: number;
    };
}
export interface ValidationOptions {
    /** Enable strict validation mode */
    strict?: boolean;
    /** Validate checksums */
    validateChecksums?: boolean;
    /** Validate orbital parameter ranges */
    validateRanges?: boolean;
    /** Validate epoch dates */
    validateEpoch?: boolean;
    /** Detect anomalies */
    detectAnomalies?: boolean;
    /** Calculate quality score */
    calculateQuality?: boolean;
    /** Custom validation rules */
    customRules?: ValidationRule[];
    /** Enable field sanitization */
    sanitizeFields?: boolean;
    /** Reference date for temporal validation (defaults to now) */
    referenceDate?: Date;
    /** Allow future epochs */
    allowFutureEpochs?: boolean;
    /** Maximum allowed epoch age in days */
    maxEpochAge?: number;
}
/**
 * Convert TLE epoch to full date information
 *
 * @param epochYear - Two-digit year from TLE
 * @param epochDay - Day of year with fractional part
 * @returns Complete epoch date information
 */
export declare function convertEpochToDate(epochYear: number, epochDay: number): EpochDate;
/**
 * Validate epoch date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @returns Validation result with any errors/warnings
 */
export declare function validateEpochDate(epochYear: number, epochDay: number): ValidationRuleResult;
/**
 * Calculate age of TLE epoch relative to reference date
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param referenceDate - Reference date (defaults to now)
 * @returns Age in days (positive = past, negative = future)
 */
export declare function calculateEpochAge(epochYear: number, epochDay: number, referenceDate?: Date): number;
/**
 * Validate epoch age (staleness or future date check)
 *
 * @param epochYear - Two-digit year
 * @param epochDay - Day of year with fractional part
 * @param options - Validation options
 * @returns Validation result with warnings for stale or future epochs
 */
export declare function validateEpochAge(epochYear: number, epochDay: number, options?: {
    referenceDate?: Date;
    allowFuture?: boolean;
    maxAge?: number;
}): ValidationRuleResult;
/**
 * Validate a numeric orbital parameter against its valid range
 *
 * @param paramName - Parameter name
 * @param value - Parameter value
 * @param checkTypical - Whether to also check typical range
 * @returns Validation result
 */
export declare function validateOrbitalParameter(paramName: keyof typeof ORBITAL_PARAMETER_RANGES, value: number, checkTypical?: boolean): ValidationRuleResult;
/**
 * Validate all orbital parameters in a parsed TLE
 *
 * @param tle - Parsed TLE object
 * @param checkTypical - Whether to check typical ranges
 * @returns Array of validation results for parameters outside range
 */
export declare function validateAllOrbitalParameters(tle: ParsedTLE, checkTypical?: boolean): ValidationRuleResult[];
/**
 * Calculate TLE checksum for a line
 *
 * @param line - TLE line (without checksum)
 * @returns Calculated checksum (0-9)
 */
export declare function calculateChecksum(line: string): number;
/**
 * Validate checksum for a TLE line
 *
 * @param line - Complete TLE line
 * @param lineNumber - Line number (1 or 2)
 * @returns Validation result with details
 */
export declare function validateChecksum(line: string, lineNumber: number): ValidationRuleResult;
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
export declare function normalizeAssumedDecimalNotation(value: string): number;
/**
 * Normalize a TLE field that may contain scientific notation
 *
 * @param value - Raw field value
 * @param fieldType - Type of field ('assumedDecimal' | 'standard' | 'integer')
 * @returns Normalized numeric value
 */
export declare function normalizeScientificNotation(value: string, fieldType?: 'assumedDecimal' | 'standard' | 'integer'): number;
/**
 * Validate NORAD satellite catalog number format and range
 *
 * @param satelliteNumber - Satellite number (as string or number)
 * @returns Validation result
 */
export declare function validateSatelliteNumber(satelliteNumber: string | number): ValidationRuleResult;
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
export declare function validateInternationalDesignator(designator: string): ValidationRuleResult;
/**
 * Detect anomalies in orbital parameters
 *
 * @param tle - Parsed TLE object
 * @returns Array of detected anomalies
 */
export declare function detectAnomalies(tle: ParsedTLE): AnomalyDetectionResult[];
/**
 * Calculate data quality score for a TLE
 *
 * @param tle - Parsed TLE object
 * @param validationResults - Results from validation checks
 * @returns Quality score and assessment
 */
export declare function calculateQualityScore(tle: ParsedTLE, validationResults: {
    checksumValid: boolean;
    formatValid: boolean;
    rangeErrors: ValidationRuleResult[];
    rangeResults: ValidationRuleResult[];
    epochAge: number;
    anomalies: AnomalyDetectionResult[];
}): DataQualityScore;
/**
 * Sanitize a TLE field by removing/normalizing invalid characters
 *
 * @param value - Raw field value
 * @param fieldName - Name of the field
 * @returns Sanitized value with modification details
 */
export declare function sanitizeField(value: string, fieldName: string): FieldSanitizationResult;
/**
 * Sanitize all fields in a TLE
 *
 * @param tle - Parsed TLE object
 * @returns Map of field names to sanitization results
 */
export declare function sanitizeAllFields(tle: ParsedTLE): Map<string, FieldSanitizationResult>;
/**
 * Default validation rules
 */
export declare const DEFAULT_VALIDATION_RULES: ValidationRule[];
/**
 * Create a custom validation rule
 *
 * @param name - Rule name
 * @param description - Rule description
 * @param validateFn - Validation function
 * @param options - Additional options
 * @returns Validation rule
 */
export declare function createValidationRule<T = any>(name: string, description: string, validateFn: (value: T, context?: any) => ValidationRuleResult, options?: {
    severity?: ErrorSeverity;
    enabled?: boolean;
    errorMessage?: string;
}): ValidationRule<T>;
/**
 * Validation rule manager
 */
export declare class ValidationRuleManager {
    private rules;
    constructor(initialRules?: ValidationRule[]);
    /**
     * Add or update a validation rule
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove a validation rule
     */
    removeRule(name: string): boolean;
    /**
     * Enable a validation rule
     */
    enableRule(name: string): boolean;
    /**
     * Disable a validation rule
     */
    disableRule(name: string): boolean;
    /**
     * Get all enabled rules
     */
    getEnabledRules(): ValidationRule[];
    /**
     * Get rule by name
     */
    getRule(name: string): ValidationRule | undefined;
    /**
     * Get all rules
     */
    getAllRules(): ValidationRule[];
}
/**
 * Generate a comprehensive validation report for a TLE
 *
 * @param tle - Parsed TLE object
 * @param tleLines - Original TLE lines for checksum validation
 * @param options - Validation options
 * @returns Comprehensive validation report
 */
export declare function generateValidationReport(tle: ParsedTLE, tleLines: {
    line1: string;
    line2: string;
}, options?: ValidationOptions): ValidationReport;
//# sourceMappingURL=validation.d.ts.map