const { parseTLE, validateTLE } = require('../index');
const historicalTLEs = require('./fixtures/historical-tles');

describe('Historical TLE Data Testing', () => {
  describe('ISS TLE Evolution Across Different Epochs', () => {
    Object.entries(historicalTLEs)
      .filter(([key]) => key.startsWith('iss'))
      .forEach(([key, tleString]) => {
        test(`should parse ${key} correctly`, () => {
          const result = parseTLE(tleString);
          expect(result).toBeDefined();
          expect(result.satelliteName).toBe('ISS (ZARYA)');
          expect(result.satelliteNumber1).toBe('25544');
          expect(result.satelliteNumber2).toBe('25544');
          expect(result.classification).toBe('U');

          // Verify inclination is in expected range for ISS (~51.6 degrees)
          const inclination = parseFloat(result.inclination);
          expect(inclination).toBeGreaterThan(51.0);
          expect(inclination).toBeLessThan(52.0);

          // Verify mean motion is in expected range for ISS (~15.49 rev/day)
          const meanMotion = parseFloat(result.meanMotion);
          expect(meanMotion).toBeGreaterThan(15.0);
          expect(meanMotion).toBeLessThan(16.0);
        });
      });

    test('should show orbital parameter evolution over time', () => {
      const epoch2020 = parseTLE(historicalTLEs.issEpoch20200101);
      const epoch2021 = parseTLE(historicalTLEs.issEpoch20210601);
      const epoch2023 = parseTLE(historicalTLEs.issEpoch20230915);

      // All should be valid ISS data
      [epoch2020, epoch2021, epoch2023].forEach(result => {
        expect(result.satelliteName).toBe('ISS (ZARYA)');
        expect(result.satelliteNumber1).toBe('25544');
      });

      // Epoch numbers should increase over time
      const epochNum2020 = parseFloat(epoch2020.epochYear + epoch2020.epochDay);
      const epochNum2021 = parseFloat(epoch2021.epochYear + epoch2021.epochDay);
      const epochNum2023 = parseFloat(epoch2023.epochYear + epoch2023.epochDay);

      expect(epochNum2021).toBeGreaterThan(epochNum2020);
      expect(epochNum2023).toBeGreaterThan(epochNum2021);
    });
  });

  describe('Hubble Space Telescope Historical Data', () => {
    Object.entries(historicalTLEs)
      .filter(([key]) => key.startsWith('hubble'))
      .forEach(([key, tleString]) => {
        test(`should parse ${key} correctly`, () => {
          const result = parseTLE(tleString);
          expect(result).toBeDefined();
          expect(result.satelliteName).toBe('HST');
          expect(result.satelliteNumber1).toBe('20580');

          // Verify inclination is in expected range for Hubble (~28.5 degrees)
          const inclination = parseFloat(result.inclination);
          expect(inclination).toBeGreaterThan(28.0);
          expect(inclination).toBeLessThan(29.0);
        });
      });
  });

  describe('Orbital Type Variations', () => {
    test('should handle decaying satellite with negative drag coefficient', () => {
      const result = parseTLE(historicalTLEs.decayingSatellite, { includeWarnings: true });
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('DECAYSAT');

      // Should parse the negative ballistic coefficient
      expect(result.bStar).toContain('-');
    });

    test('should handle GEO satellite with low mean motion', () => {
      const result = parseTLE(historicalTLEs.geoStationary, { includeWarnings: true });
      expect(result).toBeDefined();

      // Mean motion should be approximately 1 rev/day for GEO
      const meanMotion = parseFloat(result.meanMotion);
      expect(meanMotion).toBeGreaterThan(0.9);
      expect(meanMotion).toBeLessThan(1.1);
    });

    test('should handle multiple GEO satellites', () => {
      const geo1 = parseTLE(historicalTLEs.geoStationary);
      const geo2 = parseTLE(historicalTLEs.geoStationary2);

      [geo1, geo2].forEach(result => {
        const meanMotion = parseFloat(result.meanMotion);
        expect(meanMotion).toBeGreaterThan(0.9);
        expect(meanMotion).toBeLessThan(1.1);
      });
    });

    test('should handle Molniya orbit with high eccentricity', () => {
      const result = parseTLE(historicalTLEs.molniyaOrbit, { includeWarnings: true });
      expect(result).toBeDefined();

      // High eccentricity (0.7+)
      const eccentricity = parseFloat('0.' + result.eccentricity);
      expect(eccentricity).toBeGreaterThan(0.7);

      // Verify characteristic Molniya inclination (~63 degrees)
      const inclination = parseFloat(result.inclination);
      expect(inclination).toBeGreaterThan(60.0);
      expect(inclination).toBeLessThan(65.0);
    });

    test('should handle transfer orbit with very high eccentricity', () => {
      const result = parseTLE(historicalTLEs.transferOrbit);
      expect(result).toBeDefined();

      // Very high eccentricity (0.85)
      const eccentricity = parseFloat('0.' + result.eccentricity);
      expect(eccentricity).toBeGreaterThan(0.8);
    });

    test('should handle sun-synchronous orbit', () => {
      const result = parseTLE(historicalTLEs.sunSynchronous);
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('LANDSAT 8');

      // Sun-synchronous orbits have inclination ~98 degrees
      const inclination = parseFloat(result.inclination);
      expect(inclination).toBeGreaterThan(97.0);
      expect(inclination).toBeLessThan(99.0);
    });

    test('should handle polar orbit', () => {
      const result = parseTLE(historicalTLEs.polarOrbit);
      expect(result).toBeDefined();

      // Polar orbits have high inclination (70-90 degrees)
      const inclination = parseFloat(result.inclination);
      expect(inclination).toBeGreaterThan(70.0);
      expect(inclination).toBeLessThan(90.0);
    });

    test('should handle GPS satellite in MEO', () => {
      const result = parseTLE(historicalTLEs.gpsSatellite);
      expect(result).toBeDefined();

      // GPS satellites have inclination ~55 degrees
      const inclination = parseFloat(result.inclination);
      expect(inclination).toBeGreaterThan(54.0);
      expect(inclination).toBeLessThan(56.0);

      // GPS satellites have ~2 rev/day
      const meanMotion = parseFloat(result.meanMotion);
      expect(meanMotion).toBeGreaterThan(1.9);
      expect(meanMotion).toBeLessThan(2.1);
    });

    test('should handle near-circular orbit', () => {
      const result = parseTLE(historicalTLEs.nearCircular);
      expect(result).toBeDefined();

      // Very low eccentricity
      const eccentricity = parseFloat('0.' + result.eccentricity);
      expect(eccentricity).toBeLessThan(0.001);
    });

    test('should handle high altitude orbit beyond GEO', () => {
      const result = parseTLE(historicalTLEs.highAltitude);
      expect(result).toBeDefined();

      // High eccentricity for Tundra orbit
      const eccentricity = parseFloat('0.' + result.eccentricity);
      expect(eccentricity).toBeGreaterThan(0.2);
    });
  });

  describe('Historical Era TLE Formats', () => {
    test('should parse 1980s era TLE format', () => {
      const result = parseTLE(historicalTLEs.vintage1980s);
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('COSMOS 1234');
      expect(result.satelliteNumber1).toBe('12345');

      // Should handle 2-digit year from 1980
      expect(result.epochYear).toBe('80');
    });

    test('should parse 1990s era TLE format', () => {
      const result = parseTLE(historicalTLEs.vintage1990s);
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('SPOT 1');

      // Should handle 2-digit year from 1995
      expect(result.epochYear).toBe('95');
    });

    test('should parse recent launch format', () => {
      const result = parseTLE(historicalTLEs.recentLaunch);
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('STARLINK-1234');

      // Recent satellites use higher catalog numbers
      const satNum = parseInt(result.satelliteNumber1);
      expect(satNum).toBeGreaterThan(40000);
    });
  });

  describe('Edge Cases in Historical Data', () => {
    test('should handle maximum revision number', () => {
      const result = parseTLE(historicalTLEs.maxRevision);
      expect(result).toBeDefined();
      expect(result.elementSetNumber).toBe('999');
    });

    test('should handle maximum satellite catalog number', () => {
      const result = parseTLE(historicalTLEs.maxRevision);
      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('99999');
    });

    test('should validate all historical TLEs are parseable', () => {
      const results = Object.entries(historicalTLEs).map(([key, tleString]) => {
        try {
          const result = parseTLE(tleString);
          return { key, success: true, result };
        } catch (error) {
          return { key, success: false, error };
        }
      });

      // All historical TLEs should parse successfully
      const failures = results.filter(r => !r.success);
      expect(failures).toHaveLength(0);

      // All should return valid objects
      results.forEach(r => {
        expect(r.result).toBeDefined();
        expect(r.result.satelliteName).toBeDefined();
        expect(r.result.satelliteNumber1).toBeDefined();
      });
    });

    test('should validate all historical TLEs pass validation', () => {
      const validationResults = Object.entries(historicalTLEs).map(([key, tleString]) => {
        const result = validateTLE(tleString);
        return { key, ...result };
      });

      // All should be valid
      const invalid = validationResults.filter(r => !r.isValid);
      if (invalid.length > 0) {
        console.log('Invalid TLEs:', invalid.map(r => ({ key: r.key, errors: r.errors })));
      }
      expect(invalid).toHaveLength(0);
    });
  });

  describe('Cross-Era Consistency', () => {
    test('should extract consistent satellite numbers across all eras', () => {
      const allResults = Object.values(historicalTLEs).map(tle => parseTLE(tle));

      allResults.forEach(result => {
        // Satellite numbers should match between line 1 and line 2
        expect(result.satelliteNumber1).toBe(result.satelliteNumber2);

        // Should be numeric and within valid range
        const satNum = parseInt(result.satelliteNumber1);
        expect(satNum).toBeGreaterThan(0);
        expect(satNum).toBeLessThanOrEqual(99999);
      });
    });

    test('should extract consistent checksums across all eras', () => {
      const allResults = Object.values(historicalTLEs).map(tle => validateTLE(tle));

      // All checksums should be valid
      allResults.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });

    test('should handle epoch formats consistently', () => {
      const allResults = Object.values(historicalTLEs).map(tle => parseTLE(tle));

      allResults.forEach(result => {
        // Epoch year should be 2 digits
        expect(result.epochYear).toMatch(/^\d{2}$/);

        // Epoch day should be a decimal number (format: DDD.DDDDDDDD)
        expect(result.epoch).toMatch(/^\d{3}\.\d+$/);

        // Day should be between 1 and 366
        const day = parseFloat(result.epoch);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(366.99999999);
      });
    });
  });

  describe('Format Variation Robustness', () => {
    test('should handle satellites with different name lengths', () => {
      const names = Object.values(historicalTLEs)
        .map(tle => parseTLE(tle).satelliteName);

      // Should have variety of name lengths
      const nameLengths = names.map(n => n.length);
      const uniqueLengths = [...new Set(nameLengths)];

      expect(uniqueLengths.length).toBeGreaterThan(5); // At least 6 different lengths
    });

    test('should handle different international designator formats', () => {
      const allResults = Object.values(historicalTLEs).map(tle => parseTLE(tle));

      allResults.forEach(result => {
        // International designator components should be in correct format
        expect(result.internationalDesignatorYear).toMatch(/^\d{2}$/); // YY
        expect(result.internationalDesignatorLaunchNumber).toMatch(/^\d{3}$/); // NNN
        expect(result.internationalDesignatorPiece).toMatch(/^[A-Z]{1,3}$/); // LLL (1-3 letters)
      });
    });

    test('should handle various eccentricity magnitudes', () => {
      const allResults = Object.values(historicalTLEs).map(tle => parseTLE(tle));
      const eccentricities = allResults.map(r => parseFloat('0.' + r.eccentricity));

      // Should have range from near-circular to highly eccentric
      const minEcc = Math.min(...eccentricities);
      const maxEcc = Math.max(...eccentricities);

      expect(minEcc).toBeLessThan(0.001); // Near circular
      expect(maxEcc).toBeGreaterThan(0.7); // Highly eccentric
    });

    test('should handle various mean motion values', () => {
      const allResults = Object.values(historicalTLEs).map(tle => parseTLE(tle));
      const meanMotions = allResults.map(r => parseFloat(r.meanMotion));

      // Should have range from GEO (~1) to LEO (~15)
      const minMotion = Math.min(...meanMotions);
      const maxMotion = Math.max(...meanMotions);

      expect(minMotion).toBeLessThan(1.1); // GEO-like
      expect(maxMotion).toBeGreaterThan(14.0); // LEO-like
    });
  });
});
