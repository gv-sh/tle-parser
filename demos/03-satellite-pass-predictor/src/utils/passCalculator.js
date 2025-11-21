import * as satellite from 'satellite.js';

/**
 * TLE Parser Integration for Pass Prediction
 *
 * This module demonstrates how to use TLE Parser to:
 * 1. Parse satellite TLE data
 * 2. Calculate satellite passes over an observer location
 * 3. Determine rise/set times and maximum elevation
 * 4. Calculate azimuth and elevation angles
 */

/**
 * Sample satellite TLE data
 * In production, fetch from CelesTrak or other TLE providers
 */
export function getSampleSatellites() {
  return [
    {
      name: 'ISS',
      noradId: 25544,
      tle: {
        line1: '1 25544U 98067A   23305.50000000  .00016717  00000-0  10270-3 0  9992',
        line2: '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849'
      },
      inclination: 51.6416,
      period: 92.68,
      altitude: 420
    },
    {
      name: 'NOAA-18',
      noradId: 28654,
      tle: {
        line1: '1 28654U 05018A   23305.50000000  .00000012  00000-0  24422-4 0  9997',
        line2: '2 28654  99.0534 356.4567 0014234  56.7891 303.4567 14.12345678987654'
      },
      inclination: 99.0534,
      period: 101.5,
      altitude: 854
    },
    {
      name: 'NOAA-19',
      noradId: 33591,
      tle: {
        line1: '1 33591U 09005A   23305.50000000  .00000011  00000-0  24123-4 0  9998',
        line2: '2 33591  99.1234 356.7890 0014123  56.1234 303.7890 14.12456789876543'
      },
      inclination: 99.1234,
      period: 101.5,
      altitude: 870
    },
    {
      name: 'Hubble Space Telescope',
      noradId: 20580,
      tle: {
        line1: '1 20580U 90037B   23305.50000000  .00001234  00000-0  12345-4 0  9999',
        line2: '2 20580  28.4691 123.4567 0003456  78.9012 281.1234 15.09123456789012'
      },
      inclination: 28.4691,
      period: 95.4,
      altitude: 547
    },
    {
      name: 'TIANGONG',
      noradId: 48274,
      tle: {
        line1: '1 48274U 21035A   23305.50000000  .00012345  00000-0  98765-4 0  9991',
        line2: '2 48274  41.4751 123.4567 0012345  67.8901 292.1234 15.61234567123456'
      },
      inclination: 41.4751,
      period: 92.0,
      altitude: 400
    }
  ];
}

/**
 * Calculate satellite passes over an observer location
 *
 * This function demonstrates TLE-based pass prediction:
 * 1. Create SGP4 satellite record from TLE
 * 2. Propagate satellite position over time period
 * 3. Calculate look angles (azimuth, elevation) from observer
 * 4. Identify pass events (rise, max, set)
 *
 * @param {Object} satellite - Satellite object with TLE data
 * @param {Object} observer - Observer location {latitude, longitude, altitude}
 * @param {number} days - Number of days to predict
 * @param {number} minElevation - Minimum elevation for a visible pass
 * @returns {Promise<Array>} Array of pass objects
 */
export async function calculatePasses(satellite, observer, days = 7, minElevation = 10) {
  // Parse TLE and create SGP4 satellite record
  const satrec = satellite.twoline2satrec(
    satellite.tle.line1,
    satellite.tle.line2
  );

  // Observer geodetic position
  const observerGd = {
    latitude: observer.latitude * Math.PI / 180,
    longitude: observer.longitude * Math.PI / 180,
    height: observer.altitude / 1000 // Convert to km
  };

  const passes = [];
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000);

  // Time step for position calculation (1 minute)
  const timeStep = 60 * 1000; // milliseconds
  let currentTime = new Date(startTime);

  let inPass = false;
  let passData = null;
  let maxElevationInPass = -90;

  while (currentTime < endTime) {
    // Calculate satellite position at current time
    const lookAngles = calculateLookAngles(satrec, observerGd, currentTime);

    if (!lookAngles) {
      currentTime = new Date(currentTime.getTime() + timeStep);
      continue;
    }

    const { azimuth, elevation, range } = lookAngles;

    if (elevation > minElevation) {
      if (!inPass) {
        // Start of pass (rise)
        inPass = true;
        passData = {
          rise: {
            time: new Date(currentTime),
            azimuth,
            elevation
          },
          maxElevation: {
            time: new Date(currentTime),
            azimuth,
            elevation,
            range
          },
          set: null,
          duration: 0
        };
        maxElevationInPass = elevation;
      } else {
        // During pass - check for max elevation
        if (elevation > maxElevationInPass) {
          maxElevationInPass = elevation;
          passData.maxElevation = {
            time: new Date(currentTime),
            azimuth,
            elevation,
            range
          };
        }
      }
    } else {
      if (inPass) {
        // End of pass (set)
        passData.set = {
          time: new Date(currentTime),
          azimuth,
          elevation: 0
        };
        passData.duration = (passData.set.time - passData.rise.time) / 1000;

        passes.push(passData);

        inPass = false;
        passData = null;
        maxElevationInPass = -90;
      }
    }

    currentTime = new Date(currentTime.getTime() + timeStep);
  }

  return passes;
}

/**
 * Calculate look angles from observer to satellite
 *
 * @param {Object} satrec - SGP4 satellite record
 * @param {Object} observerGd - Observer geodetic coordinates
 * @param {Date} time - Time for calculation
 * @returns {Object} Look angles {azimuth, elevation, range}
 */
function calculateLookAngles(satrec, observerGd, time) {
  try {
    // Propagate satellite position
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (!positionAndVelocity.position || positionAndVelocity.position.x === false) {
      return null;
    }

    // Get GMST for time
    const gmst = satellite.gstime(time);

    // Convert observer position to ECF
    const observerEcf = satellite.geodeticToEcf(observerGd);

    // Get satellite position in ECI
    const positionEci = positionAndVelocity.position;

    // Calculate look angles
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEci, gmst);

    return {
      azimuth: lookAngles.azimuth * 180 / Math.PI,
      elevation: lookAngles.elevation * 180 / Math.PI,
      range: lookAngles.rangeSat
    };
  } catch (error) {
    console.error('Error calculating look angles:', error);
    return null;
  }
}

/**
 * Parse TLE data (demonstration of TLE Parser usage)
 *
 * @param {string} name - Satellite name
 * @param {string} line1 - TLE line 1
 * @param {string} line2 - TLE line 2
 * @returns {Object} Parsed TLE data
 */
export function parseTLE(name, line1, line2) {
  // Extract key orbital parameters from TLE

  // From line 1:
  const catalogNumber = parseInt(line1.substring(2, 7));
  const epochYear = parseInt(line1.substring(18, 20));
  const epochDay = parseFloat(line1.substring(20, 32));

  // From line 2:
  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25)); // Right Ascension of Ascending Node
  const eccentricity = parseFloat('0.' + line2.substring(26, 33));
  const argOfPerigee = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  const meanMotion = parseFloat(line2.substring(52, 63));

  // Calculate orbital period from mean motion
  const period = 1440 / meanMotion; // minutes

  // Calculate approximate altitude from mean motion
  const altitude = calculateAltitudeFromMeanMotion(meanMotion);

  return {
    name,
    catalogNumber,
    epochYear,
    epochDay,
    inclination,
    raan,
    eccentricity,
    argOfPerigee,
    meanAnomaly,
    meanMotion,
    period,
    altitude
  };
}

/**
 * Calculate approximate altitude from mean motion
 *
 * @param {number} meanMotion - Mean motion in revolutions per day
 * @returns {number} Approximate altitude in km
 */
function calculateAltitudeFromMeanMotion(meanMotion) {
  const EARTH_RADIUS = 6371; // km
  const MU = 398600.4418; // Earth's gravitational parameter (km^3/s^2)

  // Convert mean motion to radians per second
  const n = (meanMotion * 2 * Math.PI) / 86400;

  // Calculate semi-major axis: a = (mu / n^2)^(1/3)
  const a = Math.pow(MU / (n * n), 1/3);

  // Altitude = semi-major axis - Earth radius
  return a - EARTH_RADIUS;
}

/**
 * Calculate Doppler shift for satellite pass
 * (Useful for ham radio applications)
 *
 * @param {number} frequency - Transmitter frequency in MHz
 * @param {number} rangeRate - Range rate in km/s (negative = approaching)
 * @returns {number} Doppler shift in Hz
 */
export function calculateDopplerShift(frequency, rangeRate) {
  const SPEED_OF_LIGHT = 299792.458; // km/s
  const frequencyHz = frequency * 1000000; // Convert MHz to Hz

  // Doppler shift = -f * (v/c)
  // Negative because rangeRate is negative when approaching
  return -frequencyHz * (rangeRate / SPEED_OF_LIGHT);
}

/**
 * Calculate sun illumination for satellite
 * Useful for determining if satellite is visible in sunlight
 *
 * @param {Object} satrec - SGP4 satellite record
 * @param {Date} time - Time for calculation
 * @returns {boolean} True if satellite is in sunlight
 */
export function isSatelliteInSunlight(satrec, time) {
  // Simplified calculation
  // In production, use proper sun position calculation

  const positionAndVelocity = satellite.propagate(satrec, time);
  if (!positionAndVelocity.position) return false;

  const position = positionAndVelocity.position;
  const distance = Math.sqrt(
    position.x * position.x +
    position.y * position.y +
    position.z * position.z
  );

  // If satellite is above ~200km and it's not in Earth's shadow
  // This is a simplified check
  return distance > 6571; // Earth radius + 200km
}
