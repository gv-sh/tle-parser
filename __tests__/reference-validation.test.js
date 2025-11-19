const { parseTLE } = require('../index');
const satelliteJs = require('satellite.js');

describe('Reference Implementation Validation', () => {
  const validTLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

  describe('Checksum Validation Against satellite.js', () => {
    test('should produce valid satellite record for ISS TLE', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Verify satellite record was created successfully (error = 0 or false means success)
      expect(satRec.error).toBeFalsy();

      // Verify our parsing extracted the satellite number correctly
      expect(parsed.satelliteNumber1).toBe('25544');
      expect(parsed.satelliteNumber2).toBe('25544');
    });

    test('should handle multiple TLEs consistently with satellite.js', () => {
      const tles = [
        validTLE, // ISS TLE
        `HUBBLE
1 20580U 90037B   12345.12345678  .00001209  00000-0  57819-4 0  7281
2 20580  28.4653 110.4652 0002816 193.3781 166.7519 15.09833334373268`
      ];

      tles.forEach(tle => {
        const parsed = parseTLE(tle);
        const lines = tle.split('\n');
        const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

        // All should create valid satellite records
        expect(satRec.error).toBeFalsy();
        expect(parsed.satelliteNumber1).toBe(parsed.satelliteNumber2);
      });
    });
  });

  describe('Orbital Element Consistency', () => {
    test('should extract orbital elements that match satellite.js values', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Satellite number should match
      expect(parsed.satelliteNumber1).toBe(satRec.satnum.toString());

      // Inclination should be close (convert from radians to degrees)
      const satRecIncDeg = satRec.inclo * (180 / Math.PI);
      const parsedInc = parseFloat(parsed.inclination);
      expect(Math.abs(parsedInc - satRecIncDeg)).toBeLessThan(0.01);

      // Eccentricity should be close
      const parsedEcc = parseFloat('0.' + parsed.eccentricity);
      expect(Math.abs(parsedEcc - satRec.ecco)).toBeLessThan(0.0001);

      // Mean motion should be close (convert from radians/minute to revs/day)
      const satRecMeanMotion = satRec.no * (1440 / (2 * Math.PI)); // Convert rad/min to rev/day
      const parsedMeanMotion = parseFloat(parsed.meanMotion);
      expect(Math.abs(parsedMeanMotion - satRecMeanMotion)).toBeLessThan(0.01);
    });

    test('should handle GEO satellite orbital elements consistently', () => {
      const geoTLE = `GOES-16
1 41866U 16071A   20300.25000000 -.00000123  00000-0  00000-0 0  9999
2 41866   0.0234  45.6789 0001234 123.4567 236.5432  1.00273456 15675`;

      const parsed = parseTLE(geoTLE);
      const lines = geoTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Should create valid satellite record
      expect(satRec.error).toBeFalsy();

      // Satellite number should match
      expect(parsed.satelliteNumber1).toBe(satRec.satnum.toString());

      // For GEO, mean motion should be close to 1 rev/day
      const satRecMeanMotion = satRec.no * (1440 / (2 * Math.PI));
      const parsedMeanMotion = parseFloat(parsed.meanMotion);
      expect(Math.abs(parsedMeanMotion - satRecMeanMotion)).toBeLessThan(0.01);
      expect(parsedMeanMotion).toBeGreaterThan(0.9);
      expect(parsedMeanMotion).toBeLessThan(1.1);
    });

    test('should handle highly eccentric orbit elements consistently', () => {
      const molniyaTLE = `MOLNIYA 3-S
1 36352U 10006A   20300.00000000 -.00000213  00000-0 -24234-4 0  9998
2 36352  62.0235 358.2134 7034567 256.3478  21.1234   2.0055481712347`;

      const parsed = parseTLE(molniyaTLE);
      const lines = molniyaTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Should create valid satellite record
      expect(satRec.error).toBeFalsy();

      // Eccentricity should be high and match
      const parsedEcc = parseFloat('0.' + parsed.eccentricity);
      expect(parsedEcc).toBeGreaterThan(0.7);
      expect(Math.abs(parsedEcc - satRec.ecco)).toBeLessThan(0.0001);
    });
  });

  describe('Epoch and Time Consistency', () => {
    test('should extract epoch data consistently with satellite.js', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Epoch year should match
      const parsedYear = parseInt(parsed.epochYear);
      const expectedYear = satRec.epochyr;
      expect(parsedYear).toBe(expectedYear);

      // Epoch days should be close
      const parsedDays = parseFloat(parsed.epoch);
      const satRecDays = satRec.epochdays;
      expect(Math.abs(parsedDays - satRecDays)).toBeLessThan(0.000001);
    });
  });

  describe('Classification and Identifiers', () => {
    test('should extract classification correctly', () => {
      const classifiedTLE = `CLASSIFIED
1 12345U 98067A   20300.00000000  .00001234  00000-0  12345-4 0  9999
2 12345  51.6441 337.8819 0002411 126.8848 325.5996 15.48919322207138`;

      const parsed = parseTLE(classifiedTLE);
      const lines = classifiedTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      expect(satRec.error).toBeFalsy();
      expect(parsed.classification).toBe('U');
    });

    test('should extract international designator components', () => {
      const parsed = parseTLE(validTLE);

      // International designator format: YYNNNLLL (98067A)
      expect(parsed.internationalDesignatorYear).toBe('98');
      expect(parsed.internationalDesignatorLaunchNumber).toBe('067');
      expect(parsed.internationalDesignatorPiece).toBe('A');

      // Combined format should be correct
      const fullDesignator =
        parsed.internationalDesignatorYear +
        parsed.internationalDesignatorLaunchNumber +
        parsed.internationalDesignatorPiece;
      expect(fullDesignator).toBe('98067A');
    });
  });

  describe('Mean Motion Derivatives', () => {
    test('should extract first derivative of mean motion', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      expect(satRec.error).toBeFalsy();

      // First derivative should be extracted (stored as string)
      expect(parsed.firstDerivative).toBeDefined();
      expect(parsed.firstDerivative).toContain('-'); // Negative value in this TLE

      // satellite.js stores as ndot (first derivative)
      expect(satRec.ndot).toBeDefined();
    });

    test('should extract second derivative of mean motion', () => {
      const parsed = parseTLE(validTLE);

      // Second derivative should be extracted (stored as string in scientific notation)
      expect(parsed.secondDerivative).toBeDefined();
      expect(parsed.secondDerivative).toMatch(/\d{5}[-+]\d/); // Format: NNNNN±N
    });
  });

  describe('B* Drag Term (Ballistic Coefficient)', () => {
    test('should extract B* drag term correctly', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      expect(satRec.error).toBeFalsy();

      // B* should be extracted (stored as string in scientific notation)
      expect(parsed.bStar).toBeDefined();
      expect(parsed.bStar).toContain('-'); // Negative value in this TLE

      // satellite.js stores as bstar
      expect(satRec.bstar).toBeDefined();
    });

    test('should handle zero B* drag term', () => {
      const zeroBStarTLE = `GPS BIIR-2  (PRN 13)
1 28474U 04045A   06179.00000000 -.00000016  00000-0  00000+0 0  3925
2 28474  54.5647 324.8270 0116066  44.1802  48.7034  2.00575370 144300`;

      const parsed = parseTLE(zeroBStarTLE);
      const lines = zeroBStarTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      expect(satRec.error).toBeFalsy();
      expect(parsed.bStar).toContain('00000'); // Zero B* for GPS satellites
    });
  });

  describe('Angular Orbital Elements', () => {
    test('should extract right ascension of ascending node', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // RAAN should be close (convert from radians to degrees)
      const satRecRaanDeg = satRec.nodeo * (180 / Math.PI);
      const parsedRaan = parseFloat(parsed.rightAscension);
      expect(Math.abs(parsedRaan - satRecRaanDeg)).toBeLessThan(0.01);
    });

    test('should extract argument of perigee', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Argument of perigee should be close (convert from radians to degrees)
      const satRecArgPerigDeg = satRec.argpo * (180 / Math.PI);
      const parsedArgPerig = parseFloat(parsed.argumentOfPerigee);
      expect(Math.abs(parsedArgPerig - satRecArgPerigDeg)).toBeLessThan(0.01);
    });

    test('should extract mean anomaly', () => {
      const parsed = parseTLE(validTLE);
      const lines = validTLE.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Mean anomaly should be close (convert from radians to degrees)
      const satRecMaDeg = satRec.mo * (180 / Math.PI);
      const parsedMa = parseFloat(parsed.meanAnomaly);
      expect(Math.abs(parsedMa - satRecMaDeg)).toBeLessThan(0.01);
    });
  });

  describe('Error Handling Consistency', () => {
    test('should reject invalid checksum', () => {
      const invalidChecksum = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2920
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

      // Our parser should throw an error for checksum mismatch
      expect(() => parseTLE(invalidChecksum)).toThrow();
      expect(() => parseTLE(invalidChecksum)).toThrow(/checksum/i);
    });

    test('should handle malformed TLE', () => {
      const malformed = `MALFORMED
1 XXXXX 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

      // Our parser should throw an error
      expect(() => parseTLE(malformed)).toThrow();

      // satellite.js may still create a record but with potentially invalid data
      const lines = malformed.split('\n');
      const satRec = satelliteJs.twoline2satrec(lines[1], lines[2]);

      // Just verify satellite.js attempted to parse it (error field exists)
      expect(satRec).toBeDefined();
      expect(satRec.error).toBeDefined();
    });
  });

  describe('Revolution Number Validation', () => {
    test('should extract revolution number correctly', () => {
      const parsed = parseTLE(validTLE);

      // Revolution number should be extracted
      expect(parsed.revolutionNumber).toBeDefined();
      expect(parseInt(parsed.revolutionNumber)).toBeGreaterThan(0);

      // Should be numeric
      expect(parsed.revolutionNumber).toMatch(/^\d+$/);
    });
  });

  describe('Element Set Number', () => {
    test('should extract element set number', () => {
      const parsed = parseTLE(validTLE);

      // Element set number should be extracted
      expect(parsed.elementSetNumber).toBeDefined();

      // Should be numeric (or contain leading zeros as string)
      expect(parsed.elementSetNumber).toMatch(/^\d+$/);
    });
  });
});
