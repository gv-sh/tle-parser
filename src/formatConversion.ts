/**
 * TLE Format Conversion Module
 * Provides conversion between TLE and various orbital data formats including
 * OMM, STK, KVN, CCSDS OEM, GPS almanac, state vectors, and Keplerian elements.
 */

import { ParsedTLE } from './types.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Orbit Mean Elements Message (OMM) format (CCSDS standard)
 */
export interface OMMFormat {
  readonly CCSDS_OMM_VERS: string;
  readonly COMMENT?: string;
  readonly CREATION_DATE: string;
  readonly ORIGINATOR: string;

  // Metadata
  readonly OBJECT_NAME: string;
  readonly OBJECT_ID: string;
  readonly CENTER_NAME: string;
  readonly REF_FRAME: string;
  readonly TIME_SYSTEM: string;
  readonly MEAN_ELEMENT_THEORY: string;

  // State vector at epoch
  readonly EPOCH: string;
  readonly MEAN_MOTION: number; // rev/day
  readonly ECCENTRICITY: number;
  readonly INCLINATION: number; // degrees
  readonly RA_OF_ASC_NODE: number; // degrees
  readonly ARG_OF_PERICENTER: number; // degrees
  readonly MEAN_ANOMALY: number; // degrees

  // Additional parameters
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

  // Metadata
  readonly OBJECT_NAME: string;
  readonly OBJECT_ID: string;
  readonly CENTER_NAME: string;
  readonly REF_FRAME: string;
  readonly TIME_SYSTEM: string;

  // Ephemeris data
  readonly START_TIME: string;
  readonly STOP_TIME: string;
  readonly USEABLE_START_TIME: string;
  readonly USEABLE_STOP_TIME: string;
  readonly INTERPOLATION: string;
  readonly INTERPOLATION_DEGREE: number;

  // State vectors
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
  readonly af0: number; // clock correction
  readonly af1: number; // clock correction
  readonly week: number;
}

/**
 * State vector (position and velocity)
 */
export interface StateVector {
  readonly time: string | Date;
  readonly position: {
    readonly x: number; // km
    readonly y: number; // km
    readonly z: number; // km
  };
  readonly velocity: {
    readonly vx: number; // km/s
    readonly vy: number; // km/s
    readonly vz: number; // km/s
  };
}

/**
 * Classical Keplerian orbital elements
 */
export interface KeplerianElements {
  readonly semiMajorAxis: number; // km
  readonly eccentricity: number;
  readonly inclination: number; // degrees
  readonly rightAscensionOfAscendingNode: number; // degrees
  readonly argumentOfPerigee: number; // degrees
  readonly meanAnomaly: number; // degrees
  readonly trueAnomaly?: number; // degrees
  readonly epoch: Date;
  readonly meanMotion?: number; // rad/s
  readonly period?: number; // seconds
}

/**
 * Coordinate frame types
 */
export enum CoordinateFrame {
  TEME = 'TEME', // True Equator Mean Equinox (TLE native)
  J2000 = 'J2000', // J2000 Inertial
  ITRF = 'ITRF', // International Terrestrial Reference Frame
  GCRF = 'GCRF', // Geocentric Celestial Reference Frame
  EME2000 = 'EME2000' // Earth Mean Equator 2000
}

/**
 * Planetarium software formats
 */
export enum PlanetariumFormat {
  STELLARIUM = 'STELLARIUM',
  CELESTIA = 'CELESTIA',
  SPACENGINE = 'SPACENGINE',
  UNIVERSESANDBOX = 'UNIVERSESANDBOX'
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
  readonly source: string; // TLE field name or expression
  readonly format?: string; // printf-style format string
  readonly transform?: (value: any) => any;
}

// ============================================================================
// OMM (ORBIT MEAN ELEMENTS MESSAGE) CONVERSION
// ============================================================================

/**
 * Convert TLE to OMM format (CCSDS standard)
 */
export function tleToOMM(tle: ParsedTLE, originator: string = 'TLE-PARSER'): OMMFormat {
  const epoch = parseEpoch(tle.epochYear, tle.epoch);

  return {
    CCSDS_OMM_VERS: '2.0',
    CREATION_DATE: new Date().toISOString(),
    ORIGINATOR: originator,

    OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
    OBJECT_ID: tle.satelliteNumber1,
    CENTER_NAME: 'EARTH',
    REF_FRAME: 'TEME',
    TIME_SYSTEM: 'UTC',
    MEAN_ELEMENT_THEORY: 'SGP4',

    EPOCH: epoch.toISOString(),
    MEAN_MOTION: parseFloat(tle.meanMotion),
    ECCENTRICITY: parseFloat(tle.eccentricity),
    INCLINATION: parseFloat(tle.inclination),
    RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
    ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
    MEAN_ANOMALY: parseFloat(tle.meanAnomaly),

    EPHEMERIS_TYPE: parseInt(tle.ephemerisType),
    CLASSIFICATION_TYPE: tle.classification,
    NORAD_CAT_ID: tle.satelliteNumber1,
    ELEMENT_SET_NO: parseInt(tle.elementSetNumber),
    REV_AT_EPOCH: parseInt(tle.revolutionNumber),
    BSTAR: parseFloat(tle.bStar),
    MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
    MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
  };
}

/**
 * Convert OMM to TLE format
 */
export function ommToTLE(omm: OMMFormat): string {
  const epoch = new Date(omm.EPOCH);
  const year = epoch.getUTCFullYear() % 100;
  const dayOfYear = getDayOfYear(epoch);

  // Line 0 (satellite name)
  let tle = `${omm.OBJECT_NAME}\n`;

  // Line 1
  const line1Parts = [
    '1',
    omm.NORAD_CAT_ID.padStart(5, ' '),
    omm.CLASSIFICATION_TYPE,
    ' ',
    formatInternationalDesignator(omm.OBJECT_ID),
    ' ',
    year.toString().padStart(2, '0'),
    dayOfYear.toFixed(8).padStart(12, ' '),
    ' ',
    formatScientific(omm.MEAN_MOTION_DOT, 8),
    ' ',
    formatScientific(omm.MEAN_MOTION_DDOT, 8),
    ' ',
    formatScientific(omm.BSTAR, 8),
    ' ',
    omm.EPHEMERIS_TYPE.toString(),
    ' ',
    omm.ELEMENT_SET_NO.toString().padStart(4, ' ')
  ];

  const line1 = line1Parts.join('');
  const checksum1 = calculateChecksum(line1);
  tle += line1 + checksum1 + '\n';

  // Line 2
  const line2Parts = [
    '2',
    omm.NORAD_CAT_ID.padStart(5, ' '),
    ' ',
    omm.INCLINATION.toFixed(4).padStart(8, ' '),
    ' ',
    omm.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' '),
    ' ',
    formatEccentricity(omm.ECCENTRICITY),
    ' ',
    omm.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' '),
    ' ',
    omm.MEAN_ANOMALY.toFixed(4).padStart(8, ' '),
    ' ',
    omm.MEAN_MOTION.toFixed(8).padStart(11, ' '),
    omm.REV_AT_EPOCH.toString().padStart(5, ' ')
  ];

  const line2 = line2Parts.join('');
  const checksum2 = calculateChecksum(line2);
  tle += line2 + checksum2;

  return tle;
}

/**
 * Serialize OMM to XML format
 */
export function ommToXML(omm: OMMFormat): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<omm xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '     id="CCSDS_OMM_VERS" version="2.0">\n';

  xml += '  <header>\n';
  xml += `    <CREATION_DATE>${omm.CREATION_DATE}</CREATION_DATE>\n`;
  xml += `    <ORIGINATOR>${omm.ORIGINATOR}</ORIGINATOR>\n`;
  xml += '  </header>\n';

  xml += '  <body>\n';
  xml += '    <segment>\n';
  xml += '      <metadata>\n';
  xml += `        <OBJECT_NAME>${omm.OBJECT_NAME}</OBJECT_NAME>\n`;
  xml += `        <OBJECT_ID>${omm.OBJECT_ID}</OBJECT_ID>\n`;
  xml += `        <CENTER_NAME>${omm.CENTER_NAME}</CENTER_NAME>\n`;
  xml += `        <REF_FRAME>${omm.REF_FRAME}</REF_FRAME>\n`;
  xml += `        <TIME_SYSTEM>${omm.TIME_SYSTEM}</TIME_SYSTEM>\n`;
  xml += `        <MEAN_ELEMENT_THEORY>${omm.MEAN_ELEMENT_THEORY}</MEAN_ELEMENT_THEORY>\n`;
  xml += '      </metadata>\n';

  xml += '      <data>\n';
  xml += `        <EPOCH>${omm.EPOCH}</EPOCH>\n`;
  xml += `        <MEAN_MOTION>${omm.MEAN_MOTION}</MEAN_MOTION>\n`;
  xml += `        <ECCENTRICITY>${omm.ECCENTRICITY}</ECCENTRICITY>\n`;
  xml += `        <INCLINATION>${omm.INCLINATION}</INCLINATION>\n`;
  xml += `        <RA_OF_ASC_NODE>${omm.RA_OF_ASC_NODE}</RA_OF_ASC_NODE>\n`;
  xml += `        <ARG_OF_PERICENTER>${omm.ARG_OF_PERICENTER}</ARG_OF_PERICENTER>\n`;
  xml += `        <MEAN_ANOMALY>${omm.MEAN_ANOMALY}</MEAN_ANOMALY>\n`;
  xml += `        <BSTAR>${omm.BSTAR}</BSTAR>\n`;
  xml += `        <MEAN_MOTION_DOT>${omm.MEAN_MOTION_DOT}</MEAN_MOTION_DOT>\n`;
  xml += `        <MEAN_MOTION_DDOT>${omm.MEAN_MOTION_DDOT}</MEAN_MOTION_DDOT>\n`;
  xml += '      </data>\n';
  xml += '    </segment>\n';
  xml += '  </body>\n';
  xml += '</omm>\n';

  return xml;
}

// ============================================================================
// STK EPHEMERIS FORMAT CONVERSION
// ============================================================================

/**
 * Convert TLE to STK .e ephemeris format
 */
export function tleToSTK(tle: ParsedTLE, _duration: number = 86400): STKEphemerisFormat {
  // For a full implementation, we would propagate the orbit
  // Here we provide a simplified structure
  const epoch = parseEpoch(tle.epochYear, tle.epoch);

  return {
    header: {
      version: 'stk.v.11.0',
      satelliteName: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
      coordinateSystem: 'TEME',
      centralBody: 'Earth'
    },
    stateVectors: [
      // This would typically include propagated state vectors
      // For now, we include just the epoch state
      {
        time: epoch.toISOString(),
        position: { x: 0, y: 0, z: 0 }, // Would calculate from TLE
        velocity: { vx: 0, vy: 0, vz: 0 } // Would calculate from TLE
      }
    ]
  };
}

/**
 * Serialize STK ephemeris to .e file format
 */
export function stkToFile(stk: STKEphemerisFormat): string {
  let content = `stk.v.11.0\n\n`;
  content += `# Satellite: ${stk.header.satelliteName}\n`;
  content += `# Coordinate System: ${stk.header.coordinateSystem}\n`;
  content += `# Central Body: ${stk.header.centralBody}\n\n`;
  content += `BEGIN Ephemeris\n\n`;
  content += `NumberOfEphemerisPoints ${stk.stateVectors.length}\n\n`;
  content += `EphemerisTimePosVel\n\n`;

  for (const sv of stk.stateVectors) {
    const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
    content += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
    content += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
  }

  content += `\nEND Ephemeris\n`;

  return content;
}

// ============================================================================
// KVN (KEYHOLE MARKUP LANGUAGE) CONVERSION
// ============================================================================

/**
 * Convert TLE to KVN format
 */
export function tleToKVN(tle: ParsedTLE, originator: string = 'TLE-PARSER'): KVNFormat {
  const epoch = parseEpoch(tle.epochYear, tle.epoch);

  return {
    KVN_VERS: '1.0',
    CREATION_DATE: new Date().toISOString(),
    ORIGINATOR: originator,
    OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
    OBJECT_ID: tle.satelliteNumber1,
    elements: {
      EPOCH: epoch.toISOString(),
      MEAN_MOTION: parseFloat(tle.meanMotion),
      ECCENTRICITY: parseFloat(tle.eccentricity),
      INCLINATION: parseFloat(tle.inclination),
      RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
      ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
      MEAN_ANOMALY: parseFloat(tle.meanAnomaly),
      BSTAR: parseFloat(tle.bStar),
      MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
      MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
    }
  };
}

/**
 * Serialize KVN to text format
 */
export function kvnToText(kvn: KVNFormat): string {
  let text = `KVN/1.0\n\n`;
  text += `CREATION_DATE = ${kvn.CREATION_DATE}\n`;
  text += `ORIGINATOR = ${kvn.ORIGINATOR}\n\n`;
  text += `OBJECT_NAME = ${kvn.OBJECT_NAME}\n`;
  text += `OBJECT_ID = ${kvn.OBJECT_ID}\n\n`;

  text += `ELEMENTS\n`;
  for (const [key, value] of Object.entries(kvn.elements)) {
    text += `  ${key} = ${value}\n`;
  }

  return text;
}

// ============================================================================
// CCSDS OEM CONVERSION
// ============================================================================

/**
 * Convert TLE to CCSDS OEM format
 */
export function tleToOEM(tle: ParsedTLE, duration: number = 86400, originator: string = 'TLE-PARSER'): OEMFormat {
  const epoch = parseEpoch(tle.epochYear, tle.epoch);
  const startTime = new Date(epoch.getTime());
  const stopTime = new Date(epoch.getTime() + duration * 1000);

  return {
    CCSDS_OEM_VERS: '2.0',
    CREATION_DATE: new Date().toISOString(),
    ORIGINATOR: originator,

    OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
    OBJECT_ID: tle.satelliteNumber1,
    CENTER_NAME: 'EARTH',
    REF_FRAME: 'TEME',
    TIME_SYSTEM: 'UTC',

    START_TIME: startTime.toISOString(),
    STOP_TIME: stopTime.toISOString(),
    USEABLE_START_TIME: startTime.toISOString(),
    USEABLE_STOP_TIME: stopTime.toISOString(),
    INTERPOLATION: 'HERMITE',
    INTERPOLATION_DEGREE: 7,

    ephemerisData: [
      // Would include propagated state vectors
      {
        time: epoch.toISOString(),
        position: { x: 0, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: 0 }
      }
    ]
  };
}

/**
 * Serialize OEM to text format
 */
export function oemToText(oem: OEMFormat): string {
  let text = `CCSDS_OEM_VERS = ${oem.CCSDS_OEM_VERS}\n`;
  text += `CREATION_DATE = ${oem.CREATION_DATE}\n`;
  text += `ORIGINATOR = ${oem.ORIGINATOR}\n\n`;

  text += `META_START\n`;
  text += `OBJECT_NAME = ${oem.OBJECT_NAME}\n`;
  text += `OBJECT_ID = ${oem.OBJECT_ID}\n`;
  text += `CENTER_NAME = ${oem.CENTER_NAME}\n`;
  text += `REF_FRAME = ${oem.REF_FRAME}\n`;
  text += `TIME_SYSTEM = ${oem.TIME_SYSTEM}\n`;
  text += `START_TIME = ${oem.START_TIME}\n`;
  text += `STOP_TIME = ${oem.STOP_TIME}\n`;
  text += `INTERPOLATION = ${oem.INTERPOLATION}\n`;
  text += `INTERPOLATION_DEGREE = ${oem.INTERPOLATION_DEGREE}\n`;
  text += `META_STOP\n\n`;

  text += `DATA_START\n`;
  for (const sv of oem.ephemerisData) {
    const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
    text += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
    text += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
  }
  text += `DATA_STOP\n`;

  return text;
}

// ============================================================================
// KEPLERIAN ELEMENTS EXTRACTION
// ============================================================================

/**
 * Extract Keplerian elements from TLE
 */
export function extractKeplerianElements(tle: ParsedTLE): KeplerianElements {
  const meanMotion = parseFloat(tle.meanMotion);
  const eccentricity = parseFloat(tle.eccentricity);
  const inclination = parseFloat(tle.inclination);
  const raan = parseFloat(tle.rightAscension);
  const argPerigee = parseFloat(tle.argumentOfPerigee);
  const meanAnomaly = parseFloat(tle.meanAnomaly);
  const epoch = parseEpoch(tle.epochYear, tle.epoch);

  // Calculate semi-major axis from mean motion
  const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
  const n = meanMotion * 2 * Math.PI / 86400; // Convert to rad/s
  const semiMajorAxis = Math.pow(mu / (n * n), 1 / 3);

  // Calculate period
  const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);

  // Calculate true anomaly from mean anomaly
  const trueAnomaly = meanAnomalyToTrueAnomaly(meanAnomaly * Math.PI / 180, eccentricity) * 180 / Math.PI;

  return {
    semiMajorAxis,
    eccentricity,
    inclination,
    rightAscensionOfAscendingNode: raan,
    argumentOfPerigee: argPerigee,
    meanAnomaly,
    trueAnomaly,
    epoch,
    meanMotion: n,
    period
  };
}

// ============================================================================
// STATE VECTOR CONVERSION
// ============================================================================

/**
 * Convert TLE to state vector at epoch
 * Note: This is a simplified conversion. For accurate propagation, use SGP4.
 */
export function tleToStateVector(tle: ParsedTLE): StateVector {
  const keplerianElements = extractKeplerianElements(tle);

  // Convert Keplerian elements to Cartesian coordinates
  const { position, velocity } = keplerianToCartesian(keplerianElements);

  return {
    time: keplerianElements.epoch,
    position,
    velocity
  };
}

/**
 * Convert Keplerian elements to Cartesian state vector
 */
export function keplerianToCartesian(elements: KeplerianElements): {
  position: { x: number; y: number; z: number };
  velocity: { vx: number; vy: number; vz: number };
} {
  const a = elements.semiMajorAxis;
  const e = elements.eccentricity;
  const i = elements.inclination * Math.PI / 180;
  const raan = elements.rightAscensionOfAscendingNode * Math.PI / 180;
  const omega = elements.argumentOfPerigee * Math.PI / 180;
  const nu = (elements.trueAnomaly || 0) * Math.PI / 180;

  const mu = 398600.4418; // km³/s²

  // Position in orbital plane
  const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);

  // Velocity in orbital plane
  const h = Math.sqrt(mu * a * (1 - e * e));
  const vx_orb = -mu / h * Math.sin(nu);
  const vy_orb = mu / h * (e + Math.cos(nu));

  // Rotation matrices
  const cosRaan = Math.cos(raan);
  const sinRaan = Math.sin(raan);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);

  // Transform to inertial frame
  const x = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * x_orb +
            (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * y_orb;
  const y = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * x_orb +
            (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * y_orb;
  const z = (sinOmega * sinI) * x_orb + (cosOmega * sinI) * y_orb;

  const vx = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * vx_orb +
             (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * vy_orb;
  const vy = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * vx_orb +
             (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * vy_orb;
  const vz = (sinOmega * sinI) * vx_orb + (cosOmega * sinI) * vy_orb;

  return {
    position: { x, y, z },
    velocity: { vx, vy, vz }
  };
}

// ============================================================================
// GPS ALMANAC CONVERSION
// ============================================================================

/**
 * Convert TLE to GPS almanac format (simplified)
 */
export function tleToGPSAlmanac(tle: ParsedTLE): GPSAlmanacFormat {
  const epoch = parseEpoch(tle.epochYear, tle.epoch);
  const keplerianElements = extractKeplerianElements(tle);

  // GPS week number (starts from Jan 6, 1980)
  const gpsEpoch = new Date('1980-01-06T00:00:00Z');
  const weekNumber = Math.floor((epoch.getTime() - gpsEpoch.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return {
    satelliteId: tle.satelliteNumber1,
    health: 0, // Assume healthy
    eccentricity: parseFloat(tle.eccentricity),
    timeOfApplicability: epoch.getTime() / 1000, // seconds
    orbitalInclination: parseFloat(tle.inclination) * Math.PI / 180,
    rateOfRightAscension: 0, // Would need to calculate
    sqrtSemiMajorAxis: Math.sqrt(keplerianElements.semiMajorAxis),
    rightAscensionAtWeek: parseFloat(tle.rightAscension) * Math.PI / 180,
    argumentOfPerigee: parseFloat(tle.argumentOfPerigee) * Math.PI / 180,
    meanAnomaly: parseFloat(tle.meanAnomaly) * Math.PI / 180,
    af0: 0, // Clock correction parameters would need additional data
    af1: 0,
    week: weekNumber
  };
}

// ============================================================================
// COORDINATE FRAME TRANSFORMATIONS
// ============================================================================

/**
 * Transform state vector between coordinate frames
 * Note: This is a simplified implementation
 */
export function transformCoordinateFrame(
  stateVector: StateVector,
  fromFrame: CoordinateFrame,
  toFrame: CoordinateFrame,
  time: Date
): StateVector {
  if (fromFrame === toFrame) {
    return stateVector;
  }

  // For TEME to J2000 transformation (simplified)
  if (fromFrame === CoordinateFrame.TEME && toFrame === CoordinateFrame.J2000) {
    return temeToJ2000(stateVector, time);
  }

  // For J2000 to TEME transformation
  if (fromFrame === CoordinateFrame.J2000 && toFrame === CoordinateFrame.TEME) {
    return j2000ToTEME(stateVector, time);
  }

  // Default: return unchanged (placeholder)
  return stateVector;
}

/**
 * Transform from TEME to J2000 (simplified)
 */
function temeToJ2000(sv: StateVector, _time: Date): StateVector {
  // This is a placeholder. Real transformation requires:
  // 1. Precession matrix
  // 2. Nutation matrix
  // 3. Earth rotation angle
  // For now, return unchanged
  return sv;
}

/**
 * Transform from J2000 to TEME (simplified)
 */
function j2000ToTEME(sv: StateVector, _time: Date): StateVector {
  // Inverse of TEME to J2000
  return sv;
}

// ============================================================================
// PLANETARIUM SOFTWARE FORMATS
// ============================================================================

/**
 * Convert TLE to Stellarium format
 */
export function tleToStellarium(tle: ParsedTLE): string {
  const name = tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`;
  return `["${name}","${tle.lineNumber1} ${tle.satelliteNumber1}${tle.classification}...","${tle.lineNumber2} ${tle.satelliteNumber2}..."]`;
}

/**
 * Convert TLE to Celestia SSC format
 */
export function tleToCelestia(tle: ParsedTLE): string {
  const keplerianElements = extractKeplerianElements(tle);
  const epoch = parseEpoch(tle.epochYear, tle.epoch);

  let ssc = `"${tle.satelliteName || tle.satelliteNumber1}" "Sol/Earth"\n{\n`;
  ssc += `  Class "spacecraft"\n`;
  ssc += `  Mesh "satellite.3ds"\n`;
  ssc += `  Radius 0.01\n\n`;
  ssc += `  EllipticalOrbit\n  {\n`;
  ssc += `    Epoch ${epoch.getTime() / 1000}\n`;
  ssc += `    SemiMajorAxis ${keplerianElements.semiMajorAxis}\n`;
  ssc += `    Eccentricity ${keplerianElements.eccentricity}\n`;
  ssc += `    Inclination ${keplerianElements.inclination}\n`;
  ssc += `    AscendingNode ${keplerianElements.rightAscensionOfAscendingNode}\n`;
  ssc += `    ArgOfPericenter ${keplerianElements.argumentOfPerigee}\n`;
  ssc += `    MeanAnomaly ${keplerianElements.meanAnomaly}\n`;
  ssc += `  }\n}\n`;

  return ssc;
}

/**
 * Convert to generic planetarium format
 */
export function tleToPlanetarium(tle: ParsedTLE, format: PlanetariumFormat): string {
  switch (format) {
    case PlanetariumFormat.STELLARIUM:
      return tleToStellarium(tle);
    case PlanetariumFormat.CELESTIA:
      return tleToCelestia(tle);
    case PlanetariumFormat.SPACENGINE:
    case PlanetariumFormat.UNIVERSESANDBOX:
      // Would implement specific formats
      return JSON.stringify(extractKeplerianElements(tle), null, 2);
    default:
      return JSON.stringify(tle, null, 2);
  }
}

// ============================================================================
// CUSTOM FORMAT DEFINITION SYSTEM
// ============================================================================

/**
 * Convert TLE to custom format
 */
export function tleToCustomFormat(tle: ParsedTLE, format: CustomFormat): string {
  let output = format.header || '';
  const separator = format.separator || ',';
  const lineEnding = format.lineEnding || '\n';

  const values: string[] = [];

  for (const field of format.fields) {
    let value: any = tle[field.source as keyof ParsedTLE];

    // Apply transformation if provided
    if (field.transform) {
      value = field.transform(value);
    }

    // Apply formatting if provided
    if (field.format && typeof value === 'number') {
      // Simple formatting support
      value = value.toFixed(parseInt(field.format) || 0);
    }

    values.push(String(value));
  }

  output += values.join(separator) + lineEnding;
  output += format.footer || '';

  return output;
}

/**
 * Create custom format definition
 */
export function createCustomFormat(
  name: string,
  fields: readonly CustomFormatField[],
  options: {
    separator?: string;
    lineEnding?: string;
    header?: string;
    footer?: string;
  } = {}
): CustomFormat {
  return {
    name,
    version: '1.0',
    fields,
    separator: options.separator,
    lineEnding: options.lineEnding,
    header: options.header,
    footer: options.footer
  };
}

// ============================================================================
// LEGACY TLE FORMAT SUPPORT
// ============================================================================

/**
 * Convert modern TLE to legacy format (if different)
 */
export function tleToLegacyFormat(tle: ParsedTLE): string {
  // Most TLE formats are compatible, but older systems may have different requirements
  // This would handle any legacy-specific formatting
  return reconstructTLE(tle);
}

/**
 * Reconstruct TLE string from ParsedTLE object
 */
export function reconstructTLE(tle: ParsedTLE): string {
  let output = '';

  // Line 0 (satellite name)
  if (tle.satelliteName) {
    output += tle.satelliteName + '\n';
  }

  // Line 1
  output += `1 ${tle.satelliteNumber1}${tle.classification} `;
  output += `${tle.internationalDesignatorYear}${tle.internationalDesignatorLaunchNumber}${tle.internationalDesignatorPiece} `;
  output += `${tle.epochYear}${tle.epoch} `;
  output += `${tle.firstDerivative} `;
  output += `${tle.secondDerivative} `;
  output += `${tle.bStar} `;
  output += `${tle.ephemerisType} `;
  output += `${tle.elementSetNumber}`;
  output += tle.checksum1 + '\n';

  // Line 2
  output += `2 ${tle.satelliteNumber2} `;
  output += `${tle.inclination} `;
  output += `${tle.rightAscension} `;
  output += `${tle.eccentricity} `;
  output += `${tle.argumentOfPerigee} `;
  output += `${tle.meanAnomaly} `;
  output += `${tle.meanMotion}`;
  output += `${tle.revolutionNumber}`;
  output += tle.checksum2;

  return output;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse epoch from TLE format
 */
function parseEpoch(epochYear: string, epoch: string): Date {
  const year = parseInt(epochYear);
  const fullYear = year >= 57 ? 1900 + year : 2000 + year;
  const dayOfYear = parseFloat(epoch);

  const date = new Date(Date.UTC(fullYear, 0, 1));
  const millisInDay = 24 * 60 * 60 * 1000;
  date.setTime(date.getTime() + (dayOfYear - 1) * millisInDay);

  return date;
}

/**
 * Get day of year from date
 */
function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff = date.getTime() - start.getTime();
  return 1 + diff / (24 * 60 * 60 * 1000);
}

/**
 * Format number in scientific notation for TLE
 */
function formatScientific(value: number, width: number): string {
  const sign = value >= 0 ? ' ' : '-';
  const absValue = Math.abs(value);
  const exponent = Math.floor(Math.log10(absValue));
  const mantissa = absValue / Math.pow(10, exponent);

  return `${sign}${mantissa.toFixed(width - 4)}${exponent >= 0 ? '+' : ''}${exponent}`;
}

/**
 * Format eccentricity (without leading decimal point)
 */
function formatEccentricity(value: number): string {
  return value.toFixed(7).substring(2);
}

/**
 * Format international designator
 */
function formatInternationalDesignator(objectId: string): string {
  // This is simplified; real implementation would parse the object ID
  return objectId.padEnd(8, ' ');
}

/**
 * Calculate TLE checksum
 */
function calculateChecksum(line: string): string {
  let sum = 0;
  for (const char of line) {
    if (char >= '0' && char <= '9') {
      sum += parseInt(char);
    } else if (char === '-') {
      sum += 1;
    }
  }
  return (sum % 10).toString();
}

/**
 * Convert mean anomaly to true anomaly using Newton's method
 */
function meanAnomalyToTrueAnomaly(M: number, e: number, tolerance: number = 1e-8): number {
  // Solve Kepler's equation: M = E - e*sin(E)
  let E = M; // Initial guess
  let delta = 1;

  while (Math.abs(delta) > tolerance) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
  }

  // Convert eccentric anomaly to true anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  return nu;
}
