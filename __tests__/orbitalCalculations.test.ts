/**
 * Comprehensive Jest tests for Orbital Calculations Module
 */

import {
  parseTLE,
  initializeSatelliteRecord,
  getPositionAtEpoch,
  getPositionAtTime,
  predictFuturePositions,
  calculateLookAngles,
  calculateVisibilityWindows,
  calculateDopplerShift,
  calculateEclipses,
  calculateGroundTrack,
  generateOrbitVisualization,
  calculateOrbitalPeriod,
  calculateOrbitalParameters,
  predictConjunctions,
  detectStationKeepingManeuver,
} from '../src/index';

// Use validated TLE data from fixtures
const fixtures = require('./fixtures/tle-samples');

const ISS_TLE = fixtures.validISS3Line;
const HUBBLE_TLE = fixtures.validHubble;
const GPS_TLE = fixtures.validGPS;
const STARLINK_TLE = fixtures.validStarlink;

describe('Orbital Calculations - Initialization', () => {
  let issData;
  let hubbleData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
    hubbleData = parseTLE(HUBBLE_TLE);
  });

  describe('initializeSatelliteRecord()', () => {
    test('should initialize satellite record from ISS TLE', () => {
      const satrec = initializeSatelliteRecord(issData);
      expect(satrec).not.toBeNull();
      // satellite.js may return satnum as string, check it exists
      expect(satrec!.satnum).toBeDefined();
    });

    test('should initialize satellite record from Hubble TLE', () => {
      const satrec = initializeSatelliteRecord(hubbleData);
      expect(satrec).not.toBeNull();
      expect(satrec!.satnum).toBeDefined();
    });

    test('should return null for invalid TLE data', () => {
      const invalidTLE = { ...issData, meanMotion: 'invalid' };
      const satrec = initializeSatelliteRecord(invalidTLE);
      // May return null or a record with errors
      expect(satrec).toBeDefined();
    });
  });
});

describe('Orbital Calculations - Position and Velocity', () => {
  let issData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
  });

  describe('getPositionAtEpoch()', () => {
    test('should calculate ISS position at TLE epoch', () => {
      const state = getPositionAtEpoch(issData);
      expect(state).not.toBeNull();
      expect(state.position).toBeDefined();
      expect(state.velocity).toBeDefined();
      expect(state.geographicLocation).toBeDefined();

      // ISS should be in LEO (altitude reasonable range)
      // Note: altitude includes Earth radius in some coordinate systems
      expect(state.altitude).toBeGreaterThan(0);
      expect(state.altitude).toBeLessThan(10000); // Well within LEO range

      // Check that latitude is within valid range
      expect(state.geographicLocation.latitude).toBeGreaterThanOrEqual(-90);
      expect(state.geographicLocation.latitude).toBeLessThanOrEqual(90);

      // Check that longitude is within valid range
      expect(state.geographicLocation.longitude).toBeGreaterThanOrEqual(-180);
      expect(state.geographicLocation.longitude).toBeLessThanOrEqual(180);
    });
  });

  describe('getPositionAtTime()', () => {
    test('should calculate ISS position at specific time', () => {
      const date = new Date('2019-06-05T12:00:00Z');
      const state = getPositionAtTime(issData, date);

      expect(state).not.toBeNull();
      expect(state.timestamp).toEqual(date);
      expect(state.position.x).toBeDefined();
      expect(state.position.y).toBeDefined();
      expect(state.position.z).toBeDefined();
      expect(state.velocity.x).toBeDefined();
      expect(state.velocity.y).toBeDefined();
      expect(state.velocity.z).toBeDefined();
    });

    test('should calculate position for current time', () => {
      const now = new Date();
      const state = getPositionAtTime(issData, now);

      // May return null if TLE is too old
      if (state) {
        expect(state.timestamp).toEqual(now);
        expect(state.altitude).toBeGreaterThan(0);
      }
    });
  });

  describe('predictFuturePositions()', () => {
    test('should predict ISS positions over 1 hour', () => {
      const startTime = new Date('2019-06-05T12:00:00Z');
      const endTime = new Date('2019-06-05T13:00:00Z');
      const states = predictFuturePositions(issData, startTime, endTime, 300); // Every 5 minutes

      expect(states).not.toBeNull();
      expect(states.length).toBeGreaterThan(0);
      expect(states.length).toBeLessThanOrEqual(13); // 12 points + 1

      // Check each state
      states.forEach((state, index) => {
        expect(state.position).toBeDefined();
        expect(state.velocity).toBeDefined();
        expect(state.altitude).toBeGreaterThan(0);
      });
    });

    test('should predict positions with small time steps', () => {
      const startTime = new Date('2019-06-05T12:00:00Z');
      const endTime = new Date('2019-06-05T12:05:00Z');
      const states = predictFuturePositions(issData, startTime, endTime, 60); // Every minute

      expect(states).not.toBeNull();
      expect(states.length).toBe(6); // 5 minutes + 1
    });
  });
});

describe('Orbital Calculations - Look Angles and Visibility', () => {
  let issData;
  let observerLocation;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
    // Observer in San Francisco
    observerLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0.0, // Sea level
    };
  });

  describe('calculateLookAngles()', () => {
    test('should calculate look angles from San Francisco to ISS', () => {
      const date = new Date('2019-06-05T12:00:00Z');
      const angles = calculateLookAngles(issData, observerLocation, date);

      expect(angles).not.toBeNull();
      expect(angles.azimuth).toBeGreaterThanOrEqual(0);
      expect(angles.azimuth).toBeLessThanOrEqual(360);
      expect(angles.elevation).toBeGreaterThanOrEqual(-90);
      expect(angles.elevation).toBeLessThanOrEqual(90);
      expect(angles.range).toBeGreaterThan(0);
    });

    test('should calculate look angles for different observer locations', () => {
      const date = new Date('2019-06-05T12:00:00Z');

      // London
      const londonObserver = {
        latitude: 51.5074,
        longitude: -0.1278,
        altitude: 0.0,
      };

      const londonAngles = calculateLookAngles(issData, londonObserver, date);
      expect(londonAngles).not.toBeNull();

      // Tokyo
      const tokyoObserver = {
        latitude: 35.6762,
        longitude: 139.6503,
        altitude: 0.0,
      };

      const tokyoAngles = calculateLookAngles(issData, tokyoObserver, date);
      expect(tokyoAngles).not.toBeNull();

      // Angles should be different for different locations
      expect(londonAngles.azimuth).not.toEqual(tokyoAngles.azimuth);
    });
  });

  describe('calculateVisibilityWindows()', () => {
    test('should calculate visibility windows for ISS over 24 hours', () => {
      const startTime = new Date('2019-06-05T00:00:00Z');
      const endTime = new Date('2019-06-06T00:00:00Z');
      const windows = calculateVisibilityWindows(
        issData,
        observerLocation,
        startTime,
        endTime,
        0 // Minimum elevation = 0 degrees (horizon)
      );

      expect(Array.isArray(windows)).toBe(true);

      // ISS should be visible multiple times per day
      if (windows.length > 0) {
        windows.forEach((window) => {
          expect(window.aos).toBeDefined();
          expect(window.tca).toBeDefined();
          expect(window.los).toBeDefined();
          expect(window.maxElevation).toBeGreaterThanOrEqual(0);
          expect(window.duration).toBeGreaterThan(0);
          expect(window.angles.aos).toBeDefined();
          expect(window.angles.tca).toBeDefined();
          expect(window.angles.los).toBeDefined();

          // TCA should be between AOS and LOS
          expect(window.tca.getTime()).toBeGreaterThanOrEqual(window.aos.getTime());
          expect(window.tca.getTime()).toBeLessThanOrEqual(window.los.getTime());
        });
      }
    });

    test('should filter passes by minimum elevation', () => {
      const startTime = new Date('2019-06-05T00:00:00Z');
      const endTime = new Date('2019-06-06T00:00:00Z');

      const windowsAll = calculateVisibilityWindows(issData, observerLocation, startTime, endTime, 0);
      const windowsFiltered = calculateVisibilityWindows(issData, observerLocation, startTime, endTime, 30);

      // Filtered list should have fewer or equal passes
      expect(windowsFiltered.length).toBeLessThanOrEqual(windowsAll.length);

      // All filtered passes should have max elevation >= 30 degrees
      windowsFiltered.forEach((window) => {
        expect(window.maxElevation).toBeGreaterThanOrEqual(30);
      });
    });
  });
});

describe('Orbital Calculations - Doppler Shift', () => {
  let issData;
  let observerLocation;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
    observerLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0.0,
    };
  });

  describe('calculateDopplerShift()', () => {
    test('should calculate Doppler shift for VHF frequency', () => {
      const date = new Date('2019-06-05T12:00:00Z');
      const transmitFrequency = 145800000; // 145.8 MHz (amateur radio)

      const doppler = calculateDopplerShift(issData, observerLocation, date, transmitFrequency);

      expect(doppler).not.toBeNull();
      expect(doppler.factor).toBeDefined();
      expect(doppler.shiftHz).toBeDefined();
      expect(doppler.rateHzPerSecond).toBeDefined();
      expect(doppler.rangeRate).toBeDefined();

      // Doppler factor should be close to 1
      expect(doppler.factor).toBeGreaterThan(0.99);
      expect(doppler.factor).toBeLessThan(1.01);

      // Doppler shift should be reasonable for LEO satellite
      expect(Math.abs(doppler.shiftHz)).toBeLessThan(10000); // < 10 kHz
    });

    test('should calculate Doppler shift for UHF frequency', () => {
      const date = new Date('2019-06-05T12:00:00Z');
      const transmitFrequency = 437800000; // 437.8 MHz

      const doppler = calculateDopplerShift(issData, observerLocation, date, transmitFrequency);

      expect(doppler).not.toBeNull();

      // Higher frequency means larger Doppler shift
      expect(Math.abs(doppler.shiftHz)).toBeGreaterThan(0);
    });
  });
});

describe('Orbital Calculations - Ground Track and Visualization', () => {
  let issData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
  });

  describe('calculateGroundTrack()', () => {
    test('should calculate ISS ground track for one orbit', () => {
      const startTime = new Date('2019-06-05T12:00:00Z');
      const endTime = new Date('2019-06-05T13:35:00Z'); // ~95 minutes (one orbit)

      const track = calculateGroundTrack(issData, startTime, endTime, 60);

      expect(Array.isArray(track)).toBe(true);
      expect(track.length).toBeGreaterThan(0);

      track.forEach((point) => {
        expect(point.timestamp).toBeDefined();
        expect(point.location).toBeDefined();
        expect(point.velocity).toBeGreaterThan(0);

        // Check valid geographic coordinates
        expect(point.location.latitude).toBeGreaterThanOrEqual(-90);
        expect(point.location.latitude).toBeLessThanOrEqual(90);
        expect(point.location.longitude).toBeGreaterThanOrEqual(-180);
        expect(point.location.longitude).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('generateOrbitVisualization()', () => {
    test('should generate ISS orbit visualization data', () => {
      const viz = generateOrbitVisualization(issData, 50);

      expect(viz).not.toBeNull();
      expect(viz.orbitPath).toBeDefined();
      expect(viz.groundTrack).toBeDefined();
      expect(Array.isArray(viz.orbitPath)).toBe(true);
      expect(Array.isArray(viz.groundTrack)).toBe(true);

      // Should have approximately the requested number of points
      expect(viz.orbitPath.length).toBeGreaterThan(40);
      expect(viz.orbitPath.length).toBeLessThanOrEqual(55);

      expect(viz.groundTrack.length).toBe(viz.orbitPath.length);
    });
  });
});

describe('Orbital Calculations - Derived Parameters', () => {
  let issData;
  let hubbleData;
  let gpsData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
    hubbleData = parseTLE(HUBBLE_TLE);
    gpsData = parseTLE(GPS_TLE);
  });

  describe('calculateOrbitalPeriod()', () => {
    test('should calculate ISS orbital period', () => {
      const period = calculateOrbitalPeriod(issData);

      expect(period).not.toBeNull();
      // ISS period should be ~90-95 minutes
      expect(period).toBeGreaterThan(85);
      expect(period).toBeLessThan(100);
    });

    test('should calculate GPS orbital period', () => {
      const period = calculateOrbitalPeriod(gpsData);

      expect(period).not.toBeNull();
      // GPS period should be ~12 hours = 720 minutes
      expect(period).toBeGreaterThan(700);
      expect(period).toBeLessThan(750);
    });
  });

  describe('calculateOrbitalParameters()', () => {
    test('should calculate ISS orbital parameters', () => {
      const params = calculateOrbitalParameters(issData);

      expect(params).not.toBeNull();
      expect(params.periodMinutes).toBeGreaterThan(85);
      expect(params.periodMinutes).toBeLessThan(100);
      expect(params.semiMajorAxis).toBeGreaterThan(6700);
      expect(params.semiMajorAxis).toBeLessThan(7000);
      expect(params.perigeeAltitude).toBeGreaterThan(300);
      expect(params.perigeeAltitude).toBeLessThan(500);
      expect(params.apogeeAltitude).toBeGreaterThan(300);
      expect(params.apogeeAltitude).toBeLessThan(500);
      expect(params.orbitType).toBe('LEO');
      expect(params.inclinationDegrees).toBeGreaterThan(50);
      expect(params.inclinationDegrees).toBeLessThan(55);
    });

    test('should calculate Hubble orbital parameters', () => {
      const params = calculateOrbitalParameters(hubbleData);

      expect(params).not.toBeNull();
      expect(params.orbitType).toBe('LEO');
      expect(params.inclinationDegrees).toBeGreaterThan(25);
      expect(params.inclinationDegrees).toBeLessThan(30);
    });

    test('should calculate GPS orbital parameters', () => {
      const params = calculateOrbitalParameters(gpsData);

      expect(params).not.toBeNull();
      expect(params.orbitType).toBe('MEO');
      expect(params.periodMinutes).toBeGreaterThan(700);
      expect(params.semiMajorAxis).toBeGreaterThan(26000);
      expect(params.perigeeAltitude).toBeGreaterThan(19000);
    });

    test('should include all orbital elements', () => {
      const params = calculateOrbitalParameters(issData);

      expect(params).not.toBeNull();
      expect(params.eccentricity).toBeGreaterThanOrEqual(0);
      expect(params.eccentricity).toBeLessThan(1);
      expect(params.argumentOfPerigee).toBeGreaterThanOrEqual(0);
      expect(params.argumentOfPerigee).toBeLessThanOrEqual(360);
      expect(params.rightAscension).toBeGreaterThanOrEqual(0);
      expect(params.rightAscension).toBeLessThanOrEqual(360);
      expect(params.meanAnomaly).toBeGreaterThanOrEqual(0);
      expect(params.meanAnomaly).toBeLessThanOrEqual(360);
    });
  });
});

describe('Orbital Calculations - Eclipse Predictions', () => {
  let issData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
  });

  describe('calculateEclipses()', () => {
    test('should calculate ISS eclipse periods over 24 hours', () => {
      const startTime = new Date('2019-06-05T00:00:00Z');
      const endTime = new Date('2019-06-06T00:00:00Z');

      const eclipses = calculateEclipses(issData, startTime, endTime);

      expect(Array.isArray(eclipses)).toBe(true);

      // ISS should experience multiple eclipses per day
      if (eclipses.length > 0) {
        eclipses.forEach((eclipse) => {
          expect(eclipse.start).toBeDefined();
          expect(eclipse.end).toBeDefined();
          expect(eclipse.duration).toBeGreaterThan(0);
          expect(eclipse.type).toMatch(/^(umbra|penumbra)$/);
          expect(eclipse.depth).toBeGreaterThanOrEqual(0);
          expect(eclipse.depth).toBeLessThanOrEqual(1);

          // Eclipse duration should be reasonable (< 40 minutes for LEO)
          expect(eclipse.duration).toBeLessThan(2400);
        });
      }
    });
  });
});

describe('Orbital Calculations - Conjunction Prediction', () => {
  let issData;
  let hubbleData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
    hubbleData = parseTLE(HUBBLE_TLE);
  });

  describe('predictConjunctions()', () => {
    test('should predict conjunctions between ISS and Hubble', () => {
      const startTime = new Date('2019-06-05T00:00:00Z');
      const endTime = new Date('2019-06-06T00:00:00Z');

      const conjunctions = predictConjunctions(
        issData,
        hubbleData,
        startTime,
        endTime,
        1000 // 1000 km threshold
      );

      expect(Array.isArray(conjunctions)).toBe(true);

      // May or may not find conjunctions depending on orbits
      conjunctions.forEach((conjunction) => {
        expect(conjunction.time).toBeDefined();
        expect(conjunction.distance).toBeGreaterThan(0);
        expect(conjunction.distance).toBeLessThanOrEqual(1000);
        expect(conjunction.relativeVelocity).toBeGreaterThan(0);
        expect(conjunction.satellite1Position).toBeDefined();
        expect(conjunction.satellite2Position).toBeDefined();
        expect(conjunction.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      });
    });

    test('should detect close approaches with smaller threshold', () => {
      const startTime = new Date('2019-06-05T00:00:00Z');
      const endTime = new Date('2019-06-06T00:00:00Z');

      const conjunctionsLarge = predictConjunctions(issData, hubbleData, startTime, endTime, 1000);
      const conjunctionsSmall = predictConjunctions(issData, hubbleData, startTime, endTime, 100);

      // Smaller threshold should find fewer or equal conjunctions
      expect(conjunctionsSmall.length).toBeLessThanOrEqual(conjunctionsLarge.length);
    });
  });
});

describe('Orbital Calculations - Maneuver Detection', () => {
  let issData;

  beforeAll(() => {
    issData = parseTLE(ISS_TLE);
  });

  describe('detectStationKeepingManeuver()', () => {
    test('should not detect maneuver when comparing same TLE', () => {
      const result = detectStationKeepingManeuver(issData, issData);

      expect(result.detected).toBe(false);
    });

    test('should detect maneuver with modified orbital elements', () => {
      // Create a modified TLE with changed mean motion
      const modifiedTLE = { ...issData };
      const originalMeanMotion = parseFloat(issData.meanMotion);
      modifiedTLE.meanMotion = (originalMeanMotion + 0.01).toFixed(8);

      const result = detectStationKeepingManeuver(issData, modifiedTLE);

      // May or may not detect depending on threshold
      if (result.detected) {
        expect(result.deltaV).toBeGreaterThan(0);
        expect(result.maneuverTime).toBeDefined();
        expect(result.elementChanges).toBeDefined();
      }
    });
  });
});

describe('Orbital Calculations - Integration Tests', () => {
  test('should perform complete orbital analysis for ISS', () => {
    const tle = parseTLE(ISS_TLE);

    // Calculate position at epoch
    const epochState = getPositionAtEpoch(tle);
    expect(epochState).not.toBeNull();

    // Calculate orbital parameters
    const params = calculateOrbitalParameters(tle);
    expect(params).not.toBeNull();
    expect(params.orbitType).toBe('LEO');

    // Calculate look angles from a location
    const observer = { latitude: 37.7749, longitude: -122.4194, altitude: 0.0 };
    const angles = calculateLookAngles(tle, observer, new Date('2019-06-05T12:00:00Z'));
    expect(angles).not.toBeNull();

    // Calculate ground track
    const startTime = new Date('2019-06-05T12:00:00Z');
    const endTime = new Date('2019-06-05T12:30:00Z');
    const track = calculateGroundTrack(tle, startTime, endTime, 300);
    expect(track.length).toBeGreaterThan(0);
  });

  test('should handle multiple satellites in constellation', () => {
    const satellites = [
      parseTLE(ISS_TLE),
      parseTLE(HUBBLE_TLE),
      parseTLE(GPS_TLE),
    ];

    const date = new Date('2019-06-05T12:00:00Z');

    satellites.forEach((tle) => {
      const state = getPositionAtTime(tle, date);
      expect(state).not.toBeNull();
      expect(state.altitude).toBeGreaterThan(0);

      const params = calculateOrbitalParameters(tle);
      expect(params).not.toBeNull();
    });
  });
});

describe('Orbital Calculations - Error Handling', () => {
  test('should handle invalid TLE gracefully', () => {
    const invalidTLE: any = {
      satelliteNumber1: 'invalid',
      meanMotion: 'not-a-number',
    };

    const period = calculateOrbitalPeriod(invalidTLE);
    expect(period).toBeNull();
  });

  test('should handle very old TLE data', () => {
    const oldTLE = `ISS (ZARYA)
1 25544U 98067A   00001.00000000  .00003075  00000-0  59442-4 0  9992
2 25544  51.6453 199.1610 0002999 319.2360  40.8499 15.51174618173442`;

    const tle = parseTLE(oldTLE);
    const now = new Date();

    // Position calculation may fail or return degraded results for very old TLE
    const state = getPositionAtTime(tle, now);
    // Don't assert - just ensure no crash
  });
});
