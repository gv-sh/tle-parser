import * as satellite from 'satellite.js';

/**
 * Sample ISS TLE data (fallback if fetch fails)
 * In production, this is fetched from CelesTrak
 */
const SAMPLE_ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   23305.54321875  .00012456  00000+0  22456-3 0  9995
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849`;

/**
 * Fetches current ISS TLE data from CelesTrak
 * @returns {Promise<Object>} Parsed TLE data
 */
export async function fetchISSTLE() {
  try {
    // In a real application, uncomment this to fetch from CelesTrak:
    // const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle');
    // const text = await response.text();

    // For now, parse sample TLE data
    const parsed = parseTLEData(SAMPLE_ISS_TLE);
    return parsed;
  } catch (error) {
    console.error('Failed to fetch ISS TLE:', error);
    // Fallback to sample data
    return parseTLEData(SAMPLE_ISS_TLE);
  }
}

/**
 * Parses TLE data into structured object
 * Uses the tle-parser library approach
 * @param {string} tleString - TLE data as string
 * @returns {Object} Parsed TLE object
 */
function parseTLEData(tleString) {
  const lines = tleString.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('Invalid TLE data: insufficient lines');
  }

  const hasName = lines.length === 3;
  const line1 = hasName ? lines[1] : lines[0];
  const line2 = hasName ? lines[2] : lines[1];

  return {
    satelliteName: hasName ? lines[0].trim() : null,
    line1Raw: line1,
    line2Raw: line2,
    satelliteNumber1: line1.substring(2, 7).trim(),
    classification: line1.substring(7, 8),
    intDesignatorYear: line1.substring(9, 11),
    intDesignatorLaunch: line1.substring(11, 14).trim(),
    intDesignatorPiece: line1.substring(14, 17).trim(),
    epochYear: line1.substring(18, 20),
    epochDay: line1.substring(20, 32).trim(),
    meanMotionFirstDerivative: line1.substring(33, 43).trim(),
    meanMotionSecondDerivative: line1.substring(44, 52).trim(),
    dragTerm: line1.substring(53, 61).trim(),
    ephemerisType: line1.substring(62, 63),
    elementSetNumber: line1.substring(64, 68).trim(),
    checksum1: line1.substring(68, 69),
    satelliteNumber2: line2.substring(2, 7).trim(),
    inclination: line2.substring(8, 16).trim(),
    rightAscension: line2.substring(17, 25).trim(),
    eccentricity: line2.substring(26, 33).trim(),
    argumentOfPerigee: line2.substring(34, 42).trim(),
    meanAnomaly: line2.substring(43, 51).trim(),
    meanMotion: line2.substring(52, 63).trim(),
    revolutionNumber: line2.substring(63, 68).trim(),
    checksum2: line2.substring(68, 69)
  };
}

/**
 * Calculates ISS position at current time
 * @param {Object} tleData - Parsed TLE data
 * @param {Date} date - Time for calculation (defaults to now)
 * @returns {Object} Position object with lat, lon, altitude, velocity
 */
export function calculateISSPosition(tleData, date = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(
      tleData.line1Raw,
      tleData.line2Raw
    );

    const positionAndVelocity = satellite.propagate(satrec, date);

    if (positionAndVelocity.position === false) {
      throw new Error('Position calculation failed');
    }

    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(
      positionAndVelocity.position,
      gmst
    );

    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const altitude = positionGd.height; // km

    // Calculate velocity magnitude
    const vel = positionAndVelocity.velocity;
    const velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

    return {
      latitude,
      longitude,
      altitude,
      velocity,
      timestamp: date
    };
  } catch (error) {
    console.error('Position calculation error:', error);
    throw error;
  }
}

/**
 * Calculates ground track for ISS over specified duration
 * @param {Object} tleData - Parsed TLE data
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} stepSeconds - Time step in seconds (default: 60)
 * @returns {Array<Array<number>>} Array of [lat, lon] points
 */
export function calculateGroundTrack(tleData, durationMinutes, stepSeconds = 60) {
  const points = [];
  const now = new Date();
  const steps = Math.floor((durationMinutes * 60) / stepSeconds);

  for (let i = 0; i < steps; i++) {
    const time = new Date(now.getTime() + i * stepSeconds * 1000);
    try {
      const pos = calculateISSPosition(tleData, time);
      points.push([pos.latitude, pos.longitude]);
    } catch (err) {
      console.error('Ground track point calculation failed:', err);
    }
  }

  return points;
}

/**
 * Calculates look angles from observer to satellite
 * @param {Object} observerGd - Observer position {latitude, longitude, altitude}
 * @param {Object} satPosition - Satellite position from calculateISSPosition
 * @returns {Object} Look angles {azimuth, elevation, range}
 */
export function calculateLookAngles(observerGd, satPosition) {
  // This is a simplified calculation
  // For production, use a more accurate algorithm

  const lat1 = observerGd.latitude * Math.PI / 180;
  const lon1 = observerGd.longitude * Math.PI / 180;
  const lat2 = satPosition.latitude * Math.PI / 180;
  const lon2 = satPosition.longitude * Math.PI / 180;

  const dLon = lon2 - lon1;

  const azimuth = Math.atan2(
    Math.sin(dLon) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  ) * 180 / Math.PI;

  // Simplified elevation calculation
  const elevation = Math.asin(
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)
  ) * 180 / Math.PI;

  return {
    azimuth: (azimuth + 360) % 360, // Normalize to 0-360
    elevation: elevation,
    range: 0 // Range calculation would go here
  };
}
