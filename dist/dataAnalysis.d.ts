/**
 * TLE Data Analysis Module
 * Provides comprehensive tools for analyzing TLE data including comparison,
 * staleness detection, orbital decay analysis, and anomaly detection.
 */
import { ParsedTLE } from './types.js';
/**
 * Orbit classification types based on altitude
 */
export declare enum OrbitType {
    LEO = "LEO",// Low Earth Orbit (< 2,000 km)
    MEO = "MEO",// Medium Earth Orbit (2,000 - 35,786 km)
    GEO = "GEO",// Geosynchronous Orbit (~35,786 km)
    HEO = "HEO",// Highly Elliptical Orbit
    CISLUNAR = "CISLUNAR",// Beyond GEO altitude
    UNKNOWN = "UNKNOWN"
}
/**
 * TLE field difference information
 */
export interface TLEFieldDiff {
    readonly field: string;
    readonly oldValue: string | number | null;
    readonly newValue: string | number | null;
    readonly percentChange?: number;
    readonly absoluteChange?: number;
}
/**
 * Complete TLE comparison result
 */
export interface TLEComparison {
    readonly satelliteNumber: string;
    readonly satelliteName: string | null;
    readonly timeDifference: number;
    readonly differences: readonly TLEFieldDiff[];
    readonly significantChanges: readonly TLEFieldDiff[];
    readonly summary: string;
}
/**
 * TLE staleness assessment
 */
export interface TLEStaleness {
    readonly ageInDays: number;
    readonly ageInHours: number;
    readonly isStale: boolean;
    readonly staleness: 'fresh' | 'recent' | 'old' | 'very_old' | 'ancient';
    readonly recommendation: string;
}
/**
 * Orbital decay analysis result
 */
export interface OrbitalDecayAnalysis {
    readonly isDecaying: boolean;
    readonly decayRate: number;
    readonly estimatedLifetimeDays: number | null;
    readonly severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    readonly details: string;
}
/**
 * TLE update frequency statistics
 */
export interface TLEUpdateFrequencyStats {
    readonly satelliteNumber: string;
    readonly totalUpdates: number;
    readonly timeSpanDays: number;
    readonly averageUpdateInterval: number;
    readonly minUpdateInterval: number;
    readonly maxUpdateInterval: number;
    readonly stdDeviation: number;
    readonly updatePattern: 'regular' | 'irregular' | 'sparse' | 'frequent';
}
/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
    readonly hasAnomaly: boolean;
    readonly anomalyType: 'none' | 'maneuver' | 'decay_anomaly' | 'sudden_change' | 'data_error';
    readonly confidence: number;
    readonly description: string;
    readonly affectedFields: readonly string[];
    readonly recommendations: readonly string[];
}
/**
 * Constellation analysis result
 */
export interface ConstellationAnalysis {
    readonly constellationName: string;
    readonly totalSatellites: number;
    readonly orbitTypes: Record<OrbitType, number>;
    readonly averageInclination: number;
    readonly averageAltitude: number;
    readonly orbitalPlanes: number;
    readonly spacing: {
        readonly alongTrack: number;
        readonly crossTrack: number;
    };
    readonly coverage: string;
}
/**
 * TLE quality metrics
 */
export interface TLEQualityMetrics {
    readonly overallScore: number;
    readonly completeness: number;
    readonly accuracy: number;
    readonly freshness: number;
    readonly consistency: number;
    readonly issues: readonly string[];
    readonly grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
/**
 * Historical TLE trend analysis
 */
export interface TLETrendAnalysis {
    readonly satelliteNumber: string;
    readonly parameter: string;
    readonly trend: 'increasing' | 'decreasing' | 'stable' | 'oscillating';
    readonly trendStrength: number;
    readonly changeRate: number;
    readonly predictions: {
        readonly next7Days: number;
        readonly next30Days: number;
    };
}
/**
 * Conjunction probability calculation result
 */
export interface ConjunctionProbability {
    readonly satellite1: string;
    readonly satellite2: string;
    readonly probabilityOfCollision: number;
    readonly minimumDistance: number;
    readonly timeOfClosestApproach: Date;
    readonly riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    readonly recommendations: readonly string[];
}
/**
 * Radar observation validation result
 */
export interface RadarValidationResult {
    readonly isValid: boolean;
    readonly positionError: number;
    readonly velocityError: number;
    readonly confidence: number;
    readonly discrepancies: readonly string[];
}
/**
 * Orbital family grouping result
 */
export interface OrbitalFamily {
    readonly familyId: string;
    readonly satellites: readonly string[];
    readonly commonCharacteristics: {
        readonly inclination: number;
        readonly semiMajorAxis: number;
        readonly eccentricity: number;
    };
    readonly tolerances: {
        readonly inclinationTolerance: number;
        readonly altitudeTolerance: number;
        readonly eccentricityTolerance: number;
    };
    readonly purpose: string;
}
/**
 * Compare two TLE objects and identify differences
 */
export declare function compareTLEs(oldTLE: ParsedTLE, newTLE: ParsedTLE): TLEComparison;
/**
 * Generate diff output in unified diff format
 */
export declare function generateTLEDiff(oldTLE: ParsedTLE, newTLE: ParsedTLE): string;
/**
 * Calculate TLE age and assess staleness
 */
export declare function assessTLEStaleness(tle: ParsedTLE, referenceDate?: Date): TLEStaleness;
/**
 * Analyze orbital decay from TLE history
 */
export declare function analyzeOrbitalDecay(tles: readonly ParsedTLE[]): OrbitalDecayAnalysis;
/**
 * Calculate update frequency statistics from TLE history
 */
export declare function calculateUpdateFrequency(tles: readonly ParsedTLE[]): TLEUpdateFrequencyStats;
/**
 * Detect anomalies in TLE data (maneuvers, sudden changes)
 */
export declare function detectAnomalies(currentTLE: ParsedTLE, previousTLE?: ParsedTLE): AnomalyDetection;
/**
 * Analyze a constellation of satellites
 */
export declare function analyzeConstellation(tles: readonly ParsedTLE[], constellationName: string): ConstellationAnalysis;
/**
 * Calculate comprehensive quality metrics for a TLE
 */
export declare function calculateQualityMetrics(tle: ParsedTLE, referenceDate?: Date): TLEQualityMetrics;
/**
 * Analyze trends in a specific TLE parameter over time
 */
export declare function analyzeTrend(tles: readonly ParsedTLE[], parameter: keyof ParsedTLE): TLETrendAnalysis;
/**
 * Classify orbit type based on TLE parameters
 */
export declare function classifyOrbitType(tle: ParsedTLE): OrbitType;
/**
 * Calculate conjunction probability between two satellites
 * Note: This is a simplified calculation. Real conjunction analysis requires
 * detailed propagation and covariance analysis.
 */
export declare function calculateConjunctionProbability(tle1: ParsedTLE, tle2: ParsedTLE, timeWindow?: number): ConjunctionProbability;
/**
 * Validate TLE against radar observations
 * Note: This is a placeholder. Real validation requires actual radar data.
 */
export declare function validateAgainstRadar(_tle: ParsedTLE, _radarPosition: {
    latitude: number;
    longitude: number;
    altitude: number;
}, _radarObservation: {
    range: number;
    azimuth: number;
    elevation: number;
    time: Date;
}): RadarValidationResult;
/**
 * Group satellites into orbital families based on similar characteristics
 */
export declare function groupIntoOrbitalFamilies(tles: readonly ParsedTLE[], tolerances?: {
    inclinationTolerance: number;
    altitudeTolerance: number;
    eccentricityTolerance: number;
}): readonly OrbitalFamily[];
//# sourceMappingURL=dataAnalysis.d.ts.map