import * as satellite from 'satellite.js';

/**
 * TLE Parser Integration Utilities
 *
 * These utilities demonstrate how to use the TLE Parser library
 * to parse Starlink satellite data and calculate real-time positions.
 */

/**
 * Sample Starlink TLE data for demonstration
 * In production, this would be fetched from CelesTrak or similar source
 */
const SAMPLE_STARLINK_TLES = `STARLINK-1007
1 44713U 19074A   23305.50000000  .00001356  00000-0  10826-3 0  9991
2 44713  53.0000 123.4567 0001234  89.0123 271.0123 15.19000000234567
STARLINK-1008
1 44714U 19074B   23305.50000000  .00001356  00000-0  10826-3 0  9992
2 44714  53.0000 133.4567 0001234  89.0123 271.0123 15.19000000234568
STARLINK-1009
1 44715U 19074C   23305.50000000  .00001356  00000-0  10826-3 0  9993
2 44715  53.0000 143.4567 0001234  89.0123 271.0123 15.19000000234569
STARLINK-1010
1 44716U 19074D   23305.50000000  .00001356  00000-0  10826-3 0  9994
2 44716  53.0000 153.4567 0001234  89.0123 271.0123 15.19000000234570
STARLINK-1011
1 44717U 19074E   23305.50000000  .00001356  00000-0  10826-3 0  9995
2 44717  53.0000 163.4567 0001234  89.0123 271.0123 15.19000000234571
STARLINK-2001
1 45001U 19074F   23305.50000000  .00001456  00000-0  11826-3 0  9996
2 45001  53.2000 125.4567 0001134  89.0123 271.0123 15.20000000234572
STARLINK-2002
1 45002U 19074G   23305.50000000  .00001456  00000-0  11826-3 0  9997
2 45002  53.2000 135.4567 0001134  89.0123 271.0123 15.20000000234573
STARLINK-2003
1 45003U 19074H   23305.50000000  .00001456  00000-0  11826-3 0  9998
2 45003  53.2000 145.4567 0001134  89.0123 271.0123 15.20000000234574
STARLINK-3001
1 46001U 19074J   23305.50000000  .00001556  00000-0  12826-3 0  9999
2 46001  70.0000 130.4567 0001334  89.0123 271.0123 15.21000000234575
STARLINK-3002
1 46002U 19074K   23305.50000000  .00001556  00000-0  12826-3 0  9990
2 46002  70.0000 140.4567 0001334  89.0123 271.0123 15.21000000234576`;

/**
 * Fetch Starlink TLE data
 *
 * This function demonstrates TLE Parser integration by:
 * 1. Fetching TLE data from a source
 * 2. Parsing individual TLE entries
 * 3. Extracting orbital parameters
 *
 * @returns {Promise<Array>} Array of parsed satellite objects
 */
export async function fetchStarlinkTLEs() {
  try {
    // In production, fetch from CelesTrak:
    // const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle');
    // const tleData = await response.text();

    // For demo purposes, use sample data
    const tleData = SAMPLE_STARLINK_TLES;

    // Parse TLE data using our custom parser
    const satellites = parseTLEBatch(tleData);

    return satellites;
  } catch (error) {
    console.error('Error fetching Starlink TLEs:', error);
    throw error;
  }
}

/**
 * Parse batch TLE data
 *
 * Demonstrates TLE Parser usage:
 * - Split TLE text into individual entries (3 lines each)
 * - Parse each TLE to extract orbital elements
 * - Classify satellites by orbital shell
 *
 * @param {string} tleText - Raw TLE data (3-line format)
 * @returns {Array} Parsed satellites with metadata
 */
function parseTLEBatch(tleText) {
  const lines = tleText.trim().split('\n');
  const satellites = [];

  // TLE format: 3 lines per satellite (name, line1, line2)
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;

    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();

    // Parse TLE using TLE Parser principles
    const parsed = parseTLE(name, line1, line2);
    if (parsed) {
      satellites.push(parsed);
    }
  }

  return satellites;
}

/**
 * Parse individual TLE entry
 *
 * This function demonstrates TLE field extraction:
 * - Line 1: Catalog number, epoch, drag terms
 * - Line 2: Inclination, RAAN, eccentricity, argument of perigee, mean anomaly, mean motion
 *
 * @param {string} name - Satellite name
 * @param {string} line1 - TLE line 1
 * @param {string} line2 - TLE line 2
 * @returns {Object} Parsed satellite data
 */
function parseTLE(name, line1, line2) {
  try {
    // Extract catalog number from line 1 (columns 3-7)
    const catalogNumber = parseInt(line1.substring(2, 7));

    // Extract inclination from line 2 (columns 9-16)
    const inclination = parseFloat(line2.substring(8, 16));

    // Extract mean motion from line 2 (columns 53-63)
    const meanMotion = parseFloat(line2.substring(52, 63));

    // Classify orbital shell based on inclination and mean motion
    const shell = classifyOrbitalShell(inclination, meanMotion);

    // Create satellite record for SGP4 propagation
    const satrec = satellite.twoline2satrec(line1, line2);

    return {
      name,
      catalogNumber,
      inclination,
      meanMotion,
      shell,
      line1,
      line2,
      satrec,
      position: null
    };
  } catch (error) {
    console.error(`Error parsing TLE for ${name}:`, error);
    return null;
  }
}

/**
 * Classify satellite into orbital shell
 *
 * Starlink uses multiple orbital shells:
 * - Shell 1: 550 km altitude, 53° inclination
 * - Shell 2: 540 km altitude, 53.2° inclination
 * - Shell 3: 570 km altitude, 70° inclination
 * - Shell 4: 560 km altitude, 97.6° inclination
 *
 * Mean motion (revolutions per day) indicates altitude
 *
 * @param {number} inclination - Orbital inclination in degrees
 * @param {number} meanMotion - Mean motion in revolutions/day
 * @returns {string} Orbital shell classification
 */
function classifyOrbitalShell(inclination, meanMotion) {
  // Approximate altitude from mean motion
  // Higher mean motion = lower altitude
  const altitude = altitudeFromMeanMotion(meanMotion);

  if (inclination >= 52 && inclination <= 54) {
    if (altitude >= 545 && altitude <= 555) {
      return 'Shell 1 (550 km, 53°)';
    } else if (altitude >= 535 && altitude <= 545) {
      return 'Shell 2 (540 km, 53.2°)';
    }
  } else if (inclination >= 69 && inclination <= 71) {
    return 'Shell 3 (570 km, 70°)';
  } else if (inclination >= 97 && inclination <= 98) {
    return 'Shell 4 (560 km, 97.6°)';
  }

  return 'Unknown Shell';
}

/**
 * Calculate approximate altitude from mean motion
 *
 * Uses Kepler's third law simplified for Earth orbit
 *
 * @param {number} meanMotion - Revolutions per day
 * @returns {number} Approximate altitude in km
 */
function altitudeFromMeanMotion(meanMotion) {
  const EARTH_RADIUS = 6371; // km
  const MU = 398600.4418; // Earth's gravitational parameter (km^3/s^2)

  // Convert mean motion to radians per second
  const n = (meanMotion * 2 * Math.PI) / 86400; // rad/s

  // Calculate semi-major axis using n = sqrt(mu / a^3)
  const a = Math.pow(MU / (n * n), 1/3);

  // Altitude = semi-major axis - Earth radius
  return a - EARTH_RADIUS;
}

/**
 * Calculate current positions for all satellites
 *
 * Uses SGP4 propagation model to calculate satellite positions
 * at the current time.
 *
 * @param {Array} satellites - Array of satellite objects with satrec
 * @returns {Array} Satellites with updated position data
 */
export function calculatePositions(satellites) {
  const now = new Date();

  return satellites.map(sat => {
    if (!sat.satrec) return sat;

    try {
      // Propagate satellite position using SGP4
      const positionAndVelocity = satellite.propagate(sat.satrec, now);

      if (positionAndVelocity.position && !positionAndVelocity.position.x) {
        // Propagation error
        return { ...sat, position: null };
      }

      // Convert ECI coordinates to geodetic (lat/lon/alt)
      const gmst = satellite.gstime(now);
      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity;

      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      // Calculate velocity magnitude
      const velocityMagnitude = Math.sqrt(
        velocityEci.x * velocityEci.x +
        velocityEci.y * velocityEci.y +
        velocityEci.z * velocityEci.z
      );

      return {
        ...sat,
        position: {
          latitude: positionGd.latitude * (180 / Math.PI),
          longitude: positionGd.longitude * (180 / Math.PI),
          altitude: positionGd.height,
          velocity: velocityMagnitude
        }
      };
    } catch (error) {
      console.error(`Error calculating position for ${sat.name}:`, error);
      return { ...sat, position: null };
    }
  });
}

/**
 * Calculate satellite position at specific time
 *
 * @param {Object} satellite - Satellite object with satrec
 * @param {Date} date - Time for position calculation
 * @returns {Object} Position object with lat/lon/alt
 */
export function calculatePositionAtTime(sat, date) {
  if (!sat.satrec) return null;

  try {
    const positionAndVelocity = satellite.propagate(sat.satrec, date);

    if (!positionAndVelocity.position || !positionAndVelocity.position.x) {
      return null;
    }

    const gmst = satellite.gstime(date);
    const positionEci = positionAndVelocity.position;
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    return {
      latitude: positionGd.latitude * (180 / Math.PI),
      longitude: positionGd.longitude * (180 / Math.PI),
      altitude: positionGd.height
    };
  } catch (error) {
    console.error('Error calculating position:', error);
    return null;
  }
}
