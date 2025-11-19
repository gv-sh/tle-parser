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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
  latitude: number;  // radians
  longitude: number; // radians
  height: number;    // km
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
    semiMajorAxis: number; // km
    eccentricity: number;
    inclination: number;   // degrees
  };
}

// ============================================================================
// SATELLITE RECORD INITIALIZATION
// ============================================================================

/**
 * Initialize a satellite record from parsed TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Satellite record for propagation, or null if initialization fails
 */
export function initializeSatelliteRecord(tle: ParsedTLE): satellite.SatRec | null {
  try {
    // Extract line 1 and line 2 from the parsed TLE
    // Line 1: starts with "1 ", 69 characters total
    const line1Parts = [
      '1',
      tle.satelliteNumber1.padStart(5, ' '),
      tle.classification,
      ' ',
      tle.internationalDesignatorYear.padStart(2, ' '),
      tle.internationalDesignatorLaunchNumber.padStart(3, ' '),
      tle.internationalDesignatorPiece.padEnd(3, ' '),
      ' ',
      tle.epochYear.padStart(2, ' '),
      tle.epoch.padStart(12, ' '),
      ' ',
      tle.firstDerivative.padStart(10, ' '),
      ' ',
      tle.secondDerivative.padStart(8, ' '),
      ' ',
      tle.bStar.padStart(8, ' '),
      ' ',
      tle.ephemerisType,
      ' ',
      tle.elementSetNumber.padStart(4, ' '),
      tle.checksum1,
    ];

    // Line 2: starts with "2 ", 69 characters total
    const line2Parts = [
      '2',
      tle.satelliteNumber2.padStart(5, ' '),
      ' ',
      tle.inclination.padStart(8, ' '),
      ' ',
      tle.rightAscension.padStart(8, ' '),
      ' ',
      tle.eccentricity.padStart(7, ' '),
      ' ',
      tle.argumentOfPerigee.padStart(8, ' '),
      ' ',
      tle.meanAnomaly.padStart(8, ' '),
      ' ',
      tle.meanMotion.padStart(11, ' '),
      tle.revolutionNumber.padStart(5, ' '),
      tle.checksum2,
    ];

    const line1 = line1Parts.join('');
    const line2 = line2Parts.join('');

    // Initialize satellite record using satellite.js
    const satrec = satellite.twoline2satrec(line1, line2);

    // Check for initialization errors
    if (satrec.error) {
      console.error(`Satellite record initialization error: ${satrec.error}`);
      return null;
    }

    return satrec;
  } catch (error) {
    console.error('Failed to initialize satellite record:', error);
    return null;
  }
}

// ============================================================================
// POSITION AND VELOCITY CALCULATIONS
// ============================================================================

/**
 * Calculate satellite position at TLE epoch
 *
 * @param tle - Parsed TLE data
 * @returns Satellite state at epoch, or null if calculation fails
 */
export function getPositionAtEpoch(tle: ParsedTLE): SatelliteState | null {
  const satrec = initializeSatelliteRecord(tle);
  if (!satrec) return null;

  // Calculate epoch date
  const epochYear = parseInt(tle.epochYear);
  const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
  const epochDay = parseFloat(tle.epoch);
  const dayOfYear = Math.floor(epochDay);
  const fractionalDay = epochDay - dayOfYear;

  const epochDate = new Date(Date.UTC(fullYear, 0, dayOfYear));
  epochDate.setUTCMilliseconds(fractionalDay * 86400000);

  return getPositionAtTime(tle, epochDate);
}

/**
 * Calculate satellite position and velocity at a specific time
 *
 * @param tle - Parsed TLE data
 * @param date - Time for calculation
 * @returns Satellite state at the specified time, or null if calculation fails
 */
export function getPositionAtTime(tle: ParsedTLE, date: Date): SatelliteState | null {
  const satrec = initializeSatelliteRecord(tle);
  if (!satrec) return null;

  // Propagate to the specified time
  const positionAndVelocity = satellite.propagate(satrec, date);

  if (!positionAndVelocity || !positionAndVelocity.position || !positionAndVelocity.velocity) {
    return null;
  }

  const position = positionAndVelocity.position as Vector3D;
  const velocity = positionAndVelocity.velocity as Vector3D;

  // Calculate GMST for coordinate transformations
  const gmst = satellite.gstime(date);

  // Convert to geodetic coordinates
  const positionGd = satellite.eciToGeodetic(position, gmst);

  const geographicLocation: GeographicLocation = {
    latitude: satellite.degreesLat(positionGd.latitude),
    longitude: satellite.degreesLong(positionGd.longitude),
    altitude: positionGd.height,
  };

  return {
    timestamp: date,
    position,
    velocity,
    geographicLocation,
    altitude: positionGd.height,
  };
}

/**
 * Predict future satellite positions
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for predictions
 * @param endTime - End time for predictions
 * @param stepSeconds - Time step between predictions in seconds
 * @returns Array of satellite states, or null if calculation fails
 */
export function predictFuturePositions(
  tle: ParsedTLE,
  startTime: Date,
  endTime: Date,
  stepSeconds: number = 60
): SatelliteState[] | null {
  const satrec = initializeSatelliteRecord(tle);
  if (!satrec) return null;

  const states: SatelliteState[] = [];
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
    const date = new Date(timeMs);
    const state = getPositionAtTime(tle, date);
    if (state) {
      states.push(state);
    }
  }

  return states;
}

// ============================================================================
// LOOK ANGLES AND VISIBILITY
// ============================================================================

/**
 * Calculate look angles from observer to satellite
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @returns Look angles, or null if calculation fails
 */
export function calculateLookAngles(
  tle: ParsedTLE,
  observerLocation: GeographicLocation,
  date: Date
): LookAngles | null {
  const state = getPositionAtTime(tle, date);
  if (!state) return null;

  // Calculate GMST
  const gmst = satellite.gstime(date);

  // Convert observer location to geodetic (radians)
  const observerGd: GeodeticLocation = {
    latitude: satellite.degreesToRadians(observerLocation.latitude),
    longitude: satellite.degreesToRadians(observerLocation.longitude),
    height: observerLocation.altitude,
  };

  // Convert satellite position to ECF
  const positionEcf = satellite.eciToEcf(state.position, gmst);

  // Calculate look angles
  const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

  return {
    azimuth: lookAngles.azimuth * (180 / Math.PI), // Convert radians to degrees
    elevation: lookAngles.elevation * (180 / Math.PI), // Convert radians to degrees
    range: lookAngles.rangeSat,
  };
}

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
export function calculateVisibilityWindows(
  tle: ParsedTLE,
  observerLocation: GeographicLocation,
  startTime: Date,
  endTime: Date,
  minElevation: number = 0
): VisibilityWindow[] {
  const windows: VisibilityWindow[] = [];
  const stepSeconds = 10; // Check every 10 seconds

  let inPass = false;
  let passStart: Date | null = null;
  let maxElevation = -90;
  let maxElevationTime: Date | null = null;
  let aosAngles: LookAngles | null = null;
  let tcaAngles: LookAngles | null = null;

  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
    const date = new Date(timeMs);
    const angles = calculateLookAngles(tle, observerLocation, date);

    if (!angles) continue;

    if (angles.elevation >= minElevation) {
      if (!inPass) {
        // Start of pass (AOS)
        inPass = true;
        passStart = date;
        maxElevation = angles.elevation;
        maxElevationTime = date;
        aosAngles = angles;
        tcaAngles = angles;
      } else {
        // During pass - track maximum elevation
        if (angles.elevation > maxElevation) {
          maxElevation = angles.elevation;
          maxElevationTime = date;
          tcaAngles = angles;
        }
      }
    } else if (inPass) {
      // End of pass (LOS)
      const previousDate = new Date(timeMs - stepSeconds * 1000);
      const losAngles = calculateLookAngles(tle, observerLocation, previousDate);

      if (passStart && maxElevationTime && aosAngles && tcaAngles && losAngles) {
        windows.push({
          aos: passStart,
          tca: maxElevationTime,
          los: previousDate,
          maxElevation,
          duration: (previousDate.getTime() - passStart.getTime()) / 1000,
          angles: {
            aos: aosAngles,
            tca: tcaAngles,
            los: losAngles,
          },
        });
      }

      inPass = false;
      passStart = null;
      maxElevation = -90;
      maxElevationTime = null;
    }
  }

  return windows;
}

// ============================================================================
// DOPPLER SHIFT CALCULATIONS
// ============================================================================

/**
 * Calculate Doppler shift for radio communications
 *
 * @param tle - Parsed TLE data
 * @param observerLocation - Observer's geographic location
 * @param date - Time for calculation
 * @param transmitFrequencyHz - Transmitter frequency in Hz
 * @returns Doppler shift information, or null if calculation fails
 */
export function calculateDopplerShift(
  tle: ParsedTLE,
  observerLocation: GeographicLocation,
  date: Date,
  transmitFrequencyHz: number
): DopplerShift | null {
  const state = getPositionAtTime(tle, date);
  if (!state) return null;

  // Calculate GMST
  const gmst = satellite.gstime(date);

  // Convert observer location to geodetic (radians)
  const observerGd: GeodeticLocation = {
    latitude: satellite.degreesToRadians(observerLocation.latitude),
    longitude: satellite.degreesToRadians(observerLocation.longitude),
    height: observerLocation.altitude,
  };

  // Convert to ECF coordinates
  const positionEcf = satellite.eciToEcf(state.position, gmst);
  const velocityEcf = satellite.eciToEcf(state.velocity, gmst);
  const observerEcf = satellite.geodeticToEcf(observerGd);

  // Calculate Doppler factor
  const dopplerFactor = satellite.dopplerFactor(observerEcf, positionEcf, velocityEcf);

  // Calculate range rate (component of velocity toward observer)
  const rangeVector = {
    x: positionEcf.x - observerEcf.x,
    y: positionEcf.y - observerEcf.y,
    z: positionEcf.z - observerEcf.z,
  };
  const range = Math.sqrt(rangeVector.x ** 2 + rangeVector.y ** 2 + rangeVector.z ** 2);
  const rangeRate = (
    (rangeVector.x * velocityEcf.x + rangeVector.y * velocityEcf.y + rangeVector.z * velocityEcf.z) /
    range
  );

  // Estimate rate of change (using small time step)
  const deltaT = 1; // 1 second
  const futureDate = new Date(date.getTime() + deltaT * 1000);
  const futureState = getPositionAtTime(tle, futureDate);

  let rateHzPerSecond = 0;
  if (futureState) {
    const futurePosEcf = satellite.eciToEcf(futureState.position, satellite.gstime(futureDate));
    const futureVelEcf = satellite.eciToEcf(futureState.velocity, satellite.gstime(futureDate));
    const futureDopplerFactor = satellite.dopplerFactor(observerEcf, futurePosEcf, futureVelEcf);
    const futureShift = transmitFrequencyHz * (futureDopplerFactor - 1);
    const currentShift = transmitFrequencyHz * (dopplerFactor - 1);
    rateHzPerSecond = (futureShift - currentShift) / deltaT;
  }

  return {
    factor: dopplerFactor,
    shiftHz: transmitFrequencyHz * (dopplerFactor - 1),
    rateHzPerSecond,
    rangeRate,
  };
}

// ============================================================================
// ECLIPSE PREDICTIONS
// ============================================================================

/**
 * Calculate eclipse predictions (when satellite is in Earth's shadow)
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time for search
 * @param endTime - End time for search
 * @returns Array of eclipse predictions
 */
export function calculateEclipses(
  tle: ParsedTLE,
  startTime: Date,
  endTime: Date
): EclipsePrediction[] {
  const eclipses: EclipsePrediction[] = [];
  const stepSeconds = 10; // Check every 10 seconds
  const EARTH_RADIUS = 6378.137; // km
  const AU = 149597870.7; // km (astronomical unit)

  let inEclipse = false;
  let eclipseStart: Date | null = null;
  let maxDepth = 0;

  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
    const date = new Date(timeMs);
    const state = getPositionAtTime(tle, date);

    if (!state) continue;

    // Calculate Sun position (simplified - uses mean longitude)
    const jd = satellite.jday(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );

    // Approximate sun position
    const T = (jd - 2451545.0) / 36525;
    const L = (280.460 + 36000.771 * T) % 360; // Mean longitude
    const g = (357.528 + 35999.050 * T) % 360; // Mean anomaly
    const lambda = L + 1.915 * Math.sin(g * Math.PI / 180); // Ecliptic longitude

    const sunDistance = AU; // Approximate
    const sunPos: Vector3D = {
      x: sunDistance * Math.cos(lambda * Math.PI / 180),
      y: sunDistance * Math.sin(lambda * Math.PI / 180),
      z: 0,
    };

    // Calculate if satellite is in Earth's shadow
    const satToSun = {
      x: sunPos.x - state.position.x,
      y: sunPos.y - state.position.y,
      z: sunPos.z - state.position.z,
    };

    const satToSunDist = Math.sqrt(
      satToSun.x ** 2 + satToSun.y ** 2 + satToSun.z ** 2
    );

    // Project satellite position onto Earth-Sun line
    const satDist = Math.sqrt(
      state.position.x ** 2 + state.position.y ** 2 + state.position.z ** 2
    );

    const dotProduct = -(
      state.position.x * satToSun.x +
      state.position.y * satToSun.y +
      state.position.z * satToSun.z
    );

    // Check if satellite is on the dark side and in shadow cone
    const isInShadow = dotProduct > 0 && satDist < EARTH_RADIUS + 1000; // Simplified check

    // Calculate shadow depth (0 = no eclipse, 1 = full eclipse)
    let depth = 0;
    if (isInShadow) {
      const perpDist = Math.sqrt(
        satDist ** 2 - (dotProduct / satToSunDist) ** 2
      );
      const shadowRadius = EARTH_RADIUS * (1 + dotProduct / sunDistance);
      depth = Math.max(0, Math.min(1, 1 - perpDist / shadowRadius));
    }

    if (depth > 0.1) {
      // Threshold for eclipse detection
      if (!inEclipse) {
        // Start of eclipse
        inEclipse = true;
        eclipseStart = date;
        maxDepth = depth;
      } else {
        // During eclipse - track maximum depth
        maxDepth = Math.max(maxDepth, depth);
      }
    } else if (inEclipse) {
      // End of eclipse
      const previousDate = new Date(timeMs - stepSeconds * 1000);

      if (eclipseStart) {
        eclipses.push({
          start: eclipseStart,
          end: previousDate,
          duration: (previousDate.getTime() - eclipseStart.getTime()) / 1000,
          type: maxDepth > 0.9 ? 'umbra' : 'penumbra',
          depth: maxDepth,
        });
      }

      inEclipse = false;
      eclipseStart = null;
      maxDepth = 0;
    }
  }

  return eclipses;
}

// ============================================================================
// GROUND TRACK CALCULATION
// ============================================================================

/**
 * Calculate satellite ground track
 *
 * @param tle - Parsed TLE data
 * @param startTime - Start time
 * @param endTime - End time
 * @param stepSeconds - Time step in seconds (default 60)
 * @returns Array of ground track points
 */
export function calculateGroundTrack(
  tle: ParsedTLE,
  startTime: Date,
  endTime: Date,
  stepSeconds: number = 60
): GroundTrackPoint[] {
  const points: GroundTrackPoint[] = [];
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
    const date = new Date(timeMs);
    const state = getPositionAtTime(tle, date);

    if (state) {
      const velocityMag = Math.sqrt(
        state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
      );

      points.push({
        timestamp: date,
        location: state.geographicLocation,
        velocity: velocityMag,
      });
    }
  }

  return points;
}

// ============================================================================
// ORBIT VISUALIZATION DATA
// ============================================================================

/**
 * Generate orbit visualization data
 *
 * @param tle - Parsed TLE data
 * @param numPoints - Number of points to generate (default 100)
 * @returns Object containing orbit path and ground track
 */
export function generateOrbitVisualization(
  tle: ParsedTLE,
  numPoints: number = 100
): {
  orbitPath: Vector3D[];
  groundTrack: GroundTrackPoint[];
} | null {
  const period = calculateOrbitalPeriod(tle);
  if (!period) return null;

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + period * 60 * 1000);
  const stepSeconds = (period * 60) / numPoints;

  const states = predictFuturePositions(tle, startTime, endTime, stepSeconds);
  if (!states) return null;

  const orbitPath = states.map((state) => state.position);
  const groundTrack = states.map((state) => ({
    timestamp: state.timestamp,
    location: state.geographicLocation,
    velocity: Math.sqrt(
      state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
    ),
  }));

  return { orbitPath, groundTrack };
}

// ============================================================================
// DERIVED ORBITAL PARAMETERS
// ============================================================================

/**
 * Calculate orbital period from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital period in minutes, or null if calculation fails
 */
export function calculateOrbitalPeriod(tle: ParsedTLE): number | null {
  try {
    const meanMotion = parseFloat(tle.meanMotion);
    if (meanMotion <= 0) return null;
    return 1440 / meanMotion; // 1440 minutes in a day
  } catch {
    return null;
  }
}

/**
 * Calculate comprehensive orbital parameters from TLE data
 *
 * @param tle - Parsed TLE data
 * @returns Orbital parameters, or null if calculation fails
 */
export function calculateOrbitalParameters(tle: ParsedTLE): OrbitalParameters | null {
  try {
    const satrec = initializeSatelliteRecord(tle);
    if (!satrec) return null;

    // Extract values from satrec (already in correct units)
    const meanMotionRevPerDay = parseFloat(tle.meanMotion);
    const inclinationRad = satrec.inclo;
    const eccentricity = satrec.ecco;
    const argumentOfPerigeeRad = satrec.argpo;
    const rightAscensionRad = satrec.nodeo;
    const meanAnomalyRad = satrec.mo;

    // Calculate orbital period
    const periodMinutes = 1440 / meanMotionRevPerDay;

    // Calculate semi-major axis using Kepler's third law
    // T^2 = (4π^2 / μ) * a^3, where μ = GM_earth = 398600.4418 km^3/s^2
    const MU_EARTH = 398600.4418; // km^3/s^2
    const periodSeconds = periodMinutes * 60;
    const semiMajorAxis = Math.pow(
      (MU_EARTH * periodSeconds ** 2) / (4 * Math.PI ** 2),
      1 / 3
    );

    // Calculate perigee and apogee
    const EARTH_RADIUS = 6378.137; // km
    const perigeeAltitude = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS;
    const apogeeAltitude = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS;

    // Classify orbit type
    let orbitType: OrbitalParameters['orbitType'] = 'Unknown';
    if (perigeeAltitude < 2000) {
      orbitType = 'LEO'; // Low Earth Orbit
    } else if (perigeeAltitude >= 2000 && apogeeAltitude < 35786) {
      orbitType = 'MEO'; // Medium Earth Orbit
    } else if (Math.abs(apogeeAltitude - 35786) < 100 && eccentricity < 0.01) {
      orbitType = 'GEO'; // Geostationary Earth Orbit
    } else if (apogeeAltitude >= 35786) {
      orbitType = 'HEO'; // High Earth Orbit or Highly Elliptical Orbit
    }

    return {
      periodMinutes,
      semiMajorAxis,
      perigeeAltitude,
      apogeeAltitude,
      meanMotionRevPerDay,
      inclinationDegrees: inclinationRad * (180 / Math.PI),
      eccentricity,
      argumentOfPerigee: argumentOfPerigeeRad * (180 / Math.PI),
      rightAscension: rightAscensionRad * (180 / Math.PI),
      meanAnomaly: meanAnomalyRad * (180 / Math.PI),
      orbitType,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// CONJUNCTION PREDICTION
// ============================================================================

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
export function predictConjunctions(
  tle1: ParsedTLE,
  tle2: ParsedTLE,
  startTime: Date,
  endTime: Date,
  minDistance: number = 10
): ConjunctionEvent[] {
  const conjunctions: ConjunctionEvent[] = [];
  const stepSeconds = 60; // Check every 60 seconds

  let previousDistance = Infinity;
  let approachDetected = false;

  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepSeconds * 1000) {
    const date = new Date(timeMs);

    const state1 = getPositionAtTime(tle1, date);
    const state2 = getPositionAtTime(tle2, date);

    if (!state1 || !state2) continue;

    // Calculate distance between satellites
    const distance = Math.sqrt(
      (state1.position.x - state2.position.x) ** 2 +
      (state1.position.y - state2.position.y) ** 2 +
      (state1.position.z - state2.position.z) ** 2
    );

    // Detect local minimum (closest approach)
    if (distance < previousDistance) {
      approachDetected = true;
    } else if (approachDetected && distance > previousDistance) {
      // Passed closest approach
      if (previousDistance <= minDistance) {
        // Calculate relative velocity
        const relativeVelocity = Math.sqrt(
          (state1.velocity.x - state2.velocity.x) ** 2 +
          (state1.velocity.y - state2.velocity.y) ** 2 +
          (state1.velocity.z - state2.velocity.z) ** 2
        );

        // Assess risk level
        let riskLevel: ConjunctionEvent['riskLevel'] = 'low';
        if (previousDistance < 1) {
          riskLevel = 'critical';
        } else if (previousDistance < 2) {
          riskLevel = 'high';
        } else if (previousDistance < 5) {
          riskLevel = 'medium';
        }

        const previousDate = new Date(timeMs - stepSeconds * 1000);
        const prevState1 = getPositionAtTime(tle1, previousDate);
        const prevState2 = getPositionAtTime(tle2, previousDate);

        if (prevState1 && prevState2) {
          conjunctions.push({
            time: previousDate,
            distance: previousDistance,
            relativeVelocity,
            satellite1Position: prevState1.position,
            satellite2Position: prevState2.position,
            riskLevel,
          });
        }
      }

      approachDetected = false;
    }

    previousDistance = distance;
  }

  return conjunctions;
}

// ============================================================================
// STATION-KEEPING MANEUVER DETECTION
// ============================================================================

/**
 * Detect station-keeping maneuvers by comparing two TLEs
 *
 * @param olderTle - Earlier TLE
 * @param newerTle - Later TLE
 * @returns Maneuver detection result
 */
export function detectStationKeepingManeuver(
  olderTle: ParsedTLE,
  newerTle: ParsedTLE
): ManeuverDetection {
  try {
    const olderParams = calculateOrbitalParameters(olderTle);
    const newerParams = calculateOrbitalParameters(newerTle);

    if (!olderParams || !newerParams) {
      return { detected: false };
    }

    // Calculate changes in orbital elements
    const deltaSemiMajorAxis = Math.abs(
      newerParams.semiMajorAxis - olderParams.semiMajorAxis
    );
    const deltaEccentricity = Math.abs(
      newerParams.eccentricity - olderParams.eccentricity
    );
    const deltaInclination = Math.abs(
      newerParams.inclinationDegrees - olderParams.inclinationDegrees
    );

    // Thresholds for maneuver detection
    const SEMI_MAJOR_AXIS_THRESHOLD = 0.1; // km
    const ECCENTRICITY_THRESHOLD = 0.0001;
    const INCLINATION_THRESHOLD = 0.01; // degrees

    const maneuverDetected =
      deltaSemiMajorAxis > SEMI_MAJOR_AXIS_THRESHOLD ||
      deltaEccentricity > ECCENTRICITY_THRESHOLD ||
      deltaInclination > INCLINATION_THRESHOLD;

    if (!maneuverDetected) {
      return { detected: false };
    }

    // Estimate delta-V using vis-viva equation
    const MU_EARTH = 398600.4418; // km^3/s^2
    const velocityOld = Math.sqrt(MU_EARTH / olderParams.semiMajorAxis);
    const velocityNew = Math.sqrt(MU_EARTH / newerParams.semiMajorAxis);
    const deltaV = Math.abs(velocityNew - velocityOld) * 1000; // Convert to m/s

    // Estimate maneuver time (midpoint between TLE epochs)
    const olderEpoch = getTLEEpochDate(olderTle);
    const newerEpoch = getTLEEpochDate(newerTle);
    const maneuverTime = new Date(
      (olderEpoch.getTime() + newerEpoch.getTime()) / 2
    );

    return {
      detected: true,
      deltaV,
      maneuverTime,
      elementChanges: {
        semiMajorAxis: deltaSemiMajorAxis,
        eccentricity: deltaEccentricity,
        inclination: deltaInclination,
      },
    };
  } catch {
    return { detected: false };
  }
}

/**
 * Helper function to get TLE epoch as Date
 *
 * @param tle - Parsed TLE data
 * @returns Date object representing TLE epoch
 */
function getTLEEpochDate(tle: ParsedTLE): Date {
  const epochYear = parseInt(tle.epochYear);
  const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
  const epochDay = parseFloat(tle.epoch);
  const dayOfYear = Math.floor(epochDay);
  const fractionalDay = epochDay - dayOfYear;

  const epochDate = new Date(Date.UTC(fullYear, 0, dayOfYear));
  epochDate.setUTCMilliseconds(fractionalDay * 86400000);

  return epochDate;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Initialization
  initializeSatelliteRecord,

  // Position & Velocity
  getPositionAtEpoch,
  getPositionAtTime,
  predictFuturePositions,

  // Look Angles & Visibility
  calculateLookAngles,
  calculateVisibilityWindows,

  // Doppler
  calculateDopplerShift,

  // Eclipse
  calculateEclipses,

  // Ground Track & Visualization
  calculateGroundTrack,
  generateOrbitVisualization,

  // Orbital Parameters
  calculateOrbitalPeriod,
  calculateOrbitalParameters,

  // Advanced
  predictConjunctions,
  detectStationKeepingManeuver,
};
