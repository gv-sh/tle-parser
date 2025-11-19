/**
 * TLE Format Conversion Module
 * Provides conversion between TLE and various orbital data formats including
 * OMM, STK, KVN, CCSDS OEM, GPS almanac, state vectors, and Keplerian elements.
 */
import { ParsedTLE } from './types.js';
/**
 * Orbit Mean Elements Message (OMM) format (CCSDS standard)
 */
export interface OMMFormat {
    readonly CCSDS_OMM_VERS: string;
    readonly COMMENT?: string;
    readonly CREATION_DATE: string;
    readonly ORIGINATOR: string;
    readonly OBJECT_NAME: string;
    readonly OBJECT_ID: string;
    readonly CENTER_NAME: string;
    readonly REF_FRAME: string;
    readonly TIME_SYSTEM: string;
    readonly MEAN_ELEMENT_THEORY: string;
    readonly EPOCH: string;
    readonly MEAN_MOTION: number;
    readonly ECCENTRICITY: number;
    readonly INCLINATION: number;
    readonly RA_OF_ASC_NODE: number;
    readonly ARG_OF_PERICENTER: number;
    readonly MEAN_ANOMALY: number;
    readonly EPHEMERIS_TYPE: number;
    readonly CLASSIFICATION_TYPE: string;
    readonly NORAD_CAT_ID: string;
    readonly ELEMENT_SET_NO: number;
    readonly REV_AT_EPOCH: number;
    readonly BSTAR: number;
    readonly MEAN_MOTION_DOT: number;
    readonly MEAN_MOTION_DDOT: number;
}
/**
 * STK Ephemeris format (.e file)
 */
export interface STKEphemerisFormat {
    readonly header: {
        readonly version: string;
        readonly satelliteName: string;
        readonly coordinateSystem: string;
        readonly centralBody: string;
    };
    readonly stateVectors: readonly StateVector[];
}
/**
 * KVN (Keyhole Markup Language) format
 */
export interface KVNFormat {
    readonly KVN_VERS: string;
    readonly CREATION_DATE: string;
    readonly ORIGINATOR: string;
    readonly OBJECT_NAME: string;
    readonly OBJECT_ID: string;
    readonly elements: Record<string, string | number>;
}
/**
 * CCSDS Orbit Ephemeris Message (OEM) format
 */
export interface OEMFormat {
    readonly CCSDS_OEM_VERS: string;
    readonly CREATION_DATE: string;
    readonly ORIGINATOR: string;
    readonly OBJECT_NAME: string;
    readonly OBJECT_ID: string;
    readonly CENTER_NAME: string;
    readonly REF_FRAME: string;
    readonly TIME_SYSTEM: string;
    readonly START_TIME: string;
    readonly STOP_TIME: string;
    readonly USEABLE_START_TIME: string;
    readonly USEABLE_STOP_TIME: string;
    readonly INTERPOLATION: string;
    readonly INTERPOLATION_DEGREE: number;
    readonly ephemerisData: readonly StateVector[];
}
/**
 * GPS Almanac format
 */
export interface GPSAlmanacFormat {
    readonly satelliteId: string;
    readonly health: number;
    readonly eccentricity: number;
    readonly timeOfApplicability: number;
    readonly orbitalInclination: number;
    readonly rateOfRightAscension: number;
    readonly sqrtSemiMajorAxis: number;
    readonly rightAscensionAtWeek: number;
    readonly argumentOfPerigee: number;
    readonly meanAnomaly: number;
    readonly af0: number;
    readonly af1: number;
    readonly week: number;
}
/**
 * State vector (position and velocity)
 */
export interface StateVector {
    readonly time: string | Date;
    readonly position: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly velocity: {
        readonly vx: number;
        readonly vy: number;
        readonly vz: number;
    };
}
/**
 * Classical Keplerian orbital elements
 */
export interface KeplerianElements {
    readonly semiMajorAxis: number;
    readonly eccentricity: number;
    readonly inclination: number;
    readonly rightAscensionOfAscendingNode: number;
    readonly argumentOfPerigee: number;
    readonly meanAnomaly: number;
    readonly trueAnomaly?: number;
    readonly epoch: Date;
    readonly meanMotion?: number;
    readonly period?: number;
}
/**
 * Coordinate frame types
 */
export declare enum CoordinateFrame {
    TEME = "TEME",// True Equator Mean Equinox (TLE native)
    J2000 = "J2000",// J2000 Inertial
    ITRF = "ITRF",// International Terrestrial Reference Frame
    GCRF = "GCRF",// Geocentric Celestial Reference Frame
    EME2000 = "EME2000"
}
/**
 * Planetarium software formats
 */
export declare enum PlanetariumFormat {
    STELLARIUM = "STELLARIUM",
    CELESTIA = "CELESTIA",
    SPACENGINE = "SPACENGINE",
    UNIVERSESANDBOX = "UNIVERSESANDBOX"
}
/**
 * Custom format definition
 */
export interface CustomFormat {
    readonly name: string;
    readonly version: string;
    readonly fields: readonly CustomFormatField[];
    readonly separator?: string;
    readonly lineEnding?: string;
    readonly header?: string;
    readonly footer?: string;
}
/**
 * Custom format field definition
 */
export interface CustomFormatField {
    readonly name: string;
    readonly source: string;
    readonly format?: string;
    readonly transform?: (value: any) => any;
}
/**
 * Convert TLE to OMM format (CCSDS standard)
 */
export declare function tleToOMM(tle: ParsedTLE, originator?: string): OMMFormat;
/**
 * Convert OMM to TLE format
 */
export declare function ommToTLE(omm: OMMFormat): string;
/**
 * Serialize OMM to XML format
 */
export declare function ommToXML(omm: OMMFormat): string;
/**
 * Convert TLE to STK .e ephemeris format
 */
export declare function tleToSTK(tle: ParsedTLE, _duration?: number): STKEphemerisFormat;
/**
 * Serialize STK ephemeris to .e file format
 */
export declare function stkToFile(stk: STKEphemerisFormat): string;
/**
 * Convert TLE to KVN format
 */
export declare function tleToKVN(tle: ParsedTLE, originator?: string): KVNFormat;
/**
 * Serialize KVN to text format
 */
export declare function kvnToText(kvn: KVNFormat): string;
/**
 * Convert TLE to CCSDS OEM format
 */
export declare function tleToOEM(tle: ParsedTLE, duration?: number, originator?: string): OEMFormat;
/**
 * Serialize OEM to text format
 */
export declare function oemToText(oem: OEMFormat): string;
/**
 * Extract Keplerian elements from TLE
 */
export declare function extractKeplerianElements(tle: ParsedTLE): KeplerianElements;
/**
 * Convert TLE to state vector at epoch
 * Note: This is a simplified conversion. For accurate propagation, use SGP4.
 */
export declare function tleToStateVector(tle: ParsedTLE): StateVector;
/**
 * Convert Keplerian elements to Cartesian state vector
 */
export declare function keplerianToCartesian(elements: KeplerianElements): {
    position: {
        x: number;
        y: number;
        z: number;
    };
    velocity: {
        vx: number;
        vy: number;
        vz: number;
    };
};
/**
 * Convert TLE to GPS almanac format (simplified)
 */
export declare function tleToGPSAlmanac(tle: ParsedTLE): GPSAlmanacFormat;
/**
 * Transform state vector between coordinate frames
 * Note: This is a simplified implementation
 */
export declare function transformCoordinateFrame(stateVector: StateVector, fromFrame: CoordinateFrame, toFrame: CoordinateFrame, time: Date): StateVector;
/**
 * Convert TLE to Stellarium format
 */
export declare function tleToStellarium(tle: ParsedTLE): string;
/**
 * Convert TLE to Celestia SSC format
 */
export declare function tleToCelestia(tle: ParsedTLE): string;
/**
 * Convert to generic planetarium format
 */
export declare function tleToPlanetarium(tle: ParsedTLE, format: PlanetariumFormat): string;
/**
 * Convert TLE to custom format
 */
export declare function tleToCustomFormat(tle: ParsedTLE, format: CustomFormat): string;
/**
 * Create custom format definition
 */
export declare function createCustomFormat(name: string, fields: readonly CustomFormatField[], options?: {
    separator?: string;
    lineEnding?: string;
    header?: string;
    footer?: string;
}): CustomFormat;
/**
 * Convert modern TLE to legacy format (if different)
 */
export declare function tleToLegacyFormat(tle: ParsedTLE): string;
/**
 * Reconstruct TLE string from ParsedTLE object
 */
export declare function reconstructTLE(tle: ParsedTLE): string;
//# sourceMappingURL=formatConversion.d.ts.map