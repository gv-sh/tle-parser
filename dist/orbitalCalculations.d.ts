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
import * as satellite from 'satellite.js';
import type { ParsedTLE } from './types.js';
/**
 * 3D position vector in kilometers
 */
export interface Vector3D {
    x: number;
    y: number;
    z: number;
}
/**
 * Geographic location on Earth's surface
 */
export interface GeographicLocation {
    /** Latitude in degrees (-90 to +90) */
    latitude: number;
    /** Longitude in degrees (-180 to +180) */
    longitude: number;
    /** Altitude above sea level in kilometers */
    altitude: number;
}
/**
 * Geodetic location (internal representation, radians)
 */
export interface GeodeticLocation {
    latitude: number;
    longitude: number;
    height: number;
}
/**
 * Look angles from observer to satellite
 */
export interface LookAngles {
    /** Azimuth angle in degrees (0=North, 90=East, 180=South, 270=West) */
    azimuth: number;
    /** Elevation angle in degrees (0=horizon, 90=zenith, negative=below horizon) */
    elevation: number;
    /** Distance to satellite in kilometers */
    range: number;
}
/**
 * Satellite position and velocity at a specific time
 */
export interface SatelliteState {
    /** Timestamp of the state */
    timestamp: Date;
    /** Position vector in ECI frame (km) */
    position: Vector3D;
    /** Velocity vector in ECI frame (km/s) */
    velocity: Vector3D;
    /** Geographic location (lat/lon/alt) */
    geographicLocation: GeographicLocation;
    /** Altitude above Earth's surface in km */
    altitude: number;
}
/**
 * Visibility window for a satellite pass over a ground location
 */
export interface VisibilityWindow {
    /** Acquisition of Signal (AOS) - when satellite rises above horizon */
    aos: Date;
    /** Time of Closest Approach (TCA) - when satellite is at maximum elevation */
    tca: Date;
    /** Loss of Signal (LOS) - when satellite sets below horizon */
    los: Date;
    /** Maximum elevation during this pass (degrees) */
    maxElevation: number;
    /** Duration of the pass in seconds */
    duration: number;
    /** Look angles at key points */
    angles: {
        aos: LookAngles;
        tca: LookAngles;
        los: LookAngles;
    };
}
/**
 * Eclipse prediction - when satellite is in Earth's shadow
 */
export interface EclipsePrediction {
    /** Start time of eclipse (entry into shadow) */
    start: Date;
    /** End time of eclipse (exit from shadow) */
    end: Date;
    /** Duration of eclipse in seconds */
    duration: number;
    /** Eclipse type */
    type: 'umbra' | 'penumbra';
    /** Maximum eclipse depth (0-1, 1 = fully eclipsed) */
    depth: number;
}
/**
 * Ground track point
 */
export interface GroundTrackPoint {
    /** Time of this point */
    timestamp: Date;
    /** Geographic location */
    location: GeographicLocation;
    /** Velocity magnitude in km/s */
    velocity: number;
}
/**
 * Orbital parameters derived from TLE
 */
export interface OrbitalParameters {
    /** Orbital period in minutes */
    periodMinutes: number;
    /** Semi-major axis in kilometers */
    semiMajorAxis: number;
    /** Perigee altitude in kilometers */
    perigeeAltitude: number;
    /** Apogee altitude in kilometers */
    apogeeAltitude: number;
    /** Mean motion in revolutions per day */
    meanMotionRevPerDay: number;
    /** Inclination in degrees */
    inclinationDegrees: number;
    /** Eccentricity (0-1) */
    eccentricity: number;
    /** Argument of perigee in degrees */
    argumentOfPerigee: number;
    /** Right ascension of ascending node in degrees */
    rightAscension: number;
    /** Mean anomaly in degrees */
    meanAnomaly: number;
    /** Orbit type classification */
    orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'Unknown';
}
/**
 * Doppler shift calculation result
 */
export interface DopplerShift {
    /** Doppler factor (observed_freq = transmitted_freq * factor) */
    factor: number;
    /** Frequency shift in Hz (for given transmit frequency) */
    shiftHz: number;
    /** Rate of change of Doppler shift (Hz/s) */
    rateHzPerSecond: number;
    /** Range rate (satellite velocity towards/away from observer) in km/s */
    rangeRate: number;
}
/**
 * Conjunction prediction between two satellites
 */
export interface ConjunctionEvent {
    /** Time of closest approach */
    time: Date;
    /** Minimum distance between satellites in kilometers */
    distance: number;
    /** Relative velocity at closest approach in km/s */
    relativeVelocity: number;
    /** Position of first satellite */
    satellite1Position: Vector3D;
    /** Position of second satellite */
    satellite2Position: Vector3D;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Station-keeping maneuver detection result
 */
export interface ManeuverDetection {
    /** Whether a maneuver was detected */
    detected: boolean;
    /** Estimated delta-V in m/s */
    deltaV?: number;
    /** Time of maneuver */
    maneuverTime?: Date;
    /** Change in orbital elements */
    elementChanges?: {
        semiMajorAxis: number;
        eccentricity: number;
        inclination: number;
    };
}
/**
 * Initialize a satellite record from parsed TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Satellite record for propagation, or null if initialization fails
 */
export declare function initializeSatelliteRecord(tle: ParsedTLE): satellite.SatRec | null;
/**
 * Calculate satellite position at TLE epoch
 *
 * @param tle - Parsed TLE data
 * @returns Satellite state at epoch, or null if calculation fails
 */
export declare function getPositionAtEpoch(tle: ParsedTLE): SatelliteState | null;
/**
 * Calculate satellite position and velocity at a specific time
 *
 * @param tle - Parsed TLE data
 * @param date - Time for calculation
 * @returns Satellite state at the specified time, or null if calculation fails
 */
export declare function getPositionAtTime(tle: ParsedTLE, date: Date): SatelliteState | null;
/**
 * Predict future satellite positions
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for predictions
 * @param endTime - End time for predictions
 * @param stepSeconds - Time step between predictions in seconds
 * @returns Array of satellite states, or null if calculation fails
 */
export declare function predictFuturePositions(tle: ParsedTLE, startTime: Date, endTime: Date, stepSeconds?: number): SatelliteState[] | null;
/**
 * Calculate look angles from observer to satellite
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @returns Look angles, or null if calculation fails
 */
export declare function calculateLookAngles(tle: ParsedTLE, observerLocation: GeographicLocation, date: Date): LookAngles | null;
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
export declare function calculateVisibilityWindows(tle: ParsedTLE, observerLocation: GeographicLocation, startTime: Date, endTime: Date, minElevation?: number): VisibilityWindow[];
/**
 * Calculate Doppler shift for radio communications
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @param transmitFrequencyHz - Transmitter frequency in Hz
 * @returns Doppler shift information, or null if calculation fails
 */
export declare function calculateDopplerShift(tle: ParsedTLE, observerLocation: GeographicLocation, date: Date, transmitFrequencyHz: number): DopplerShift | null;
/**
 * Calculate eclipse predictions (when satellite is in Earth's shadow)
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for search
 * @param endTime - End time for search
 * @returns Array of eclipse predictions
 */
export declare function calculateEclipses(tle: ParsedTLE, startTime: Date, endTime: Date): EclipsePrediction[];
/**
 * Calculate satellite ground track
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time
 * @param endTime - End time
 * @param stepSeconds - Time step in seconds (default 60)
 * @returns Array of ground track points
 */
export declare function calculateGroundTrack(tle: ParsedTLE, startTime: Date, endTime: Date, stepSeconds?: number): GroundTrackPoint[];
/**
 * Generate orbit visualization data
 *
 * @param tle - Parsed TLE data
 * @param numPoints - Number of points to generate (default 100)
 * @returns Object containing orbit path and ground track
 */
export declare function generateOrbitVisualization(tle: ParsedTLE, numPoints?: number): {
    orbitPath: Vector3D[];
    groundTrack: GroundTrackPoint[];
} | null;
/**
 * Calculate orbital period from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital period in minutes, or null if calculation fails
 */
export declare function calculateOrbitalPeriod(tle: ParsedTLE): number | null;
/**
 * Calculate comprehensive orbital parameters from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital parameters, or null if calculation fails
 */
export declare function calculateOrbitalParameters(tle: ParsedTLE): OrbitalParameters | null;
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
export declare function predictConjunctions(tle1: ParsedTLE, tle2: ParsedTLE, startTime: Date, endTime: Date, minDistance?: number): ConjunctionEvent[];
/**
 * Detect station-keeping maneuvers by comparing two TLEs
 *
 * @param olderTle - Earlier TLE
 * @param newerTle - Later TLE
 * @returns Maneuver detection result
 */
export declare function detectStationKeepingManeuver(olderTle: ParsedTLE, newerTle: ParsedTLE): ManeuverDetection;
declare const _default: {
    initializeSatelliteRecord: typeof initializeSatelliteRecord;
    getPositionAtEpoch: typeof getPositionAtEpoch;
    getPositionAtTime: typeof getPositionAtTime;
    predictFuturePositions: typeof predictFuturePositions;
    calculateLookAngles: typeof calculateLookAngles;
    calculateVisibilityWindows: typeof calculateVisibilityWindows;
    calculateDopplerShift: typeof calculateDopplerShift;
    calculateEclipses: typeof calculateEclipses;
    calculateGroundTrack: typeof calculateGroundTrack;
    generateOrbitVisualization: typeof generateOrbitVisualization;
    calculateOrbitalPeriod: typeof calculateOrbitalPeriod;
    calculateOrbitalParameters: typeof calculateOrbitalParameters;
    predictConjunctions: typeof predictConjunctions;
    detectStationKeepingManeuver: typeof detectStationKeepingManeuver;
};
export default _default;
//# sourceMappingURL=orbitalCalculations.d.ts.map