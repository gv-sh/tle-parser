import { calculateISSPosition } from './satellite';

/**
 * Calculates visible passes of ISS over observer location
 * @param {Object} tleData - Parsed TLE data
 * @param {Object} observer - Observer location {latitude, longitude, altitude}
 * @param {Date} startDate - Start date for predictions
 * @param {number} days - Number of days to predict
 * @param {number} minElevation - Minimum elevation angle in degrees (default: 10)
 * @returns {Array<Object>} Array of pass objects
 */
export function calculatePasses(tleData, observer, startDate, days, minElevation = 10) {
  const passes = [];
  const stepMinutes = 1; // Check position every minute
  const totalMinutes = days * 24 * 60;

  let inPass = false;
  let currentPass = null;

  for (let i = 0; i < totalMinutes; i++) {
    const time = new Date(startDate.getTime() + i * 60 * 1000);

    try {
      const satPos = calculateISSPosition(tleData, time);
      const lookAngles = calculateLookAngles(observer, satPos);

      if (lookAngles.elevation > minElevation) {
        if (!inPass) {
          // Pass is starting
          inPass = true;
          currentPass = {
            rise: {
              time: time,
              azimuth: lookAngles.azimuth,
              elevation: lookAngles.elevation
            },
            max: {
              time: time,
              azimuth: lookAngles.azimuth,
              elevation: lookAngles.elevation
            },
            set: null
          };
        } else {
          // Update max elevation if current is higher
          if (lookAngles.elevation > currentPass.max.elevation) {
            currentPass.max = {
              time: time,
              azimuth: lookAngles.azimuth,
              elevation: lookAngles.elevation
            };
          }
        }
      } else {
        if (inPass) {
          // Pass is ending
          currentPass.set = {
            time: new Date(time.getTime() - 60 * 1000), // Previous minute
            azimuth: lookAngles.azimuth,
            elevation: minElevation
          };

          passes.push(currentPass);
          inPass = false;
          currentPass = null;

          // Limit to reasonable number of passes
          if (passes.length >= 10) {
            break;
          }
        }
      }
    } catch (err) {
      console.error('Pass calculation error at', time, ':', err);
    }
  }

  return passes;
}

/**
 * Calculates look angles from observer to satellite
 * @param {Object} observer - Observer {latitude, longitude, altitude}
 * @param {Object} satPosition - Satellite position {latitude, longitude, altitude}
 * @returns {Object} Look angles {azimuth, elevation, range}
 */
function calculateLookAngles(observer, satPosition) {
  const R_EARTH = 6371.0; // Earth radius in km

  // Convert to radians
  const obsLat = observer.latitude * Math.PI / 180;
  const obsLon = observer.longitude * Math.PI / 180;
  const satLat = satPosition.latitude * Math.PI / 180;
  const satLon = satPosition.longitude * Math.PI / 180;

  // Calculate difference in longitude
  const dLon = satLon - obsLon;

  // Calculate azimuth
  const y = Math.sin(dLon) * Math.cos(satLat);
  const x = Math.cos(obsLat) * Math.sin(satLat) -
            Math.sin(obsLat) * Math.cos(satLat) * Math.cos(dLon);
  let azimuth = Math.atan2(y, x) * 180 / Math.PI;
  azimuth = (azimuth + 360) % 360; // Normalize to 0-360

  // Calculate range using haversine formula
  const dLat = satLat - obsLat;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(obsLat) * Math.cos(satLat) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const groundRange = R_EARTH * c;

  // Calculate elevation angle
  const obsAlt = (observer.altitude || 0) / 1000; // Convert m to km
  const satAlt = satPosition.altitude;

  const dx = groundRange;
  const dy = satAlt - obsAlt;
  let elevation = Math.atan2(dy, dx) * 180 / Math.PI;

  // Calculate slant range
  const range = Math.sqrt(dx * dx + dy * dy);

  // Simplified elevation - accounts for Earth curvature
  const horizonAngle = Math.acos(R_EARTH / (R_EARTH + satAlt)) * 180 / Math.PI;
  const angularDistance = c * 180 / Math.PI;

  if (angularDistance < horizonAngle) {
    elevation = 90 - angularDistance;
  } else {
    elevation = -10; // Below horizon
  }

  return {
    azimuth: azimuth,
    elevation: Math.max(-90, Math.min(90, elevation)),
    range: range
  };
}

/**
 * Formats pass duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

/**
 * Checks if a pass is visible (occurs during night time)
 * Simplified check - actual visibility depends on sun position
 * @param {Object} pass - Pass object
 * @param {Object} observer - Observer location
 * @returns {boolean} True if pass is potentially visible
 */
export function isPassVisible(pass, observer) {
  const hour = pass.rise.time.getHours();
  // Simplified: consider passes before sunrise or after sunset
  // In reality, this should use sun position calculations
  return hour < 6 || hour > 19;
}
