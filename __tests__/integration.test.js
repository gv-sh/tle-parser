/**
 * Integration Tests for TLE Parser
 * End-to-end scenarios testing the complete workflow
 */

const {
  parseTLE,
  validateTLE,
  parseWithStateMachine,
  TLEStateMachineParser,
  ERROR_CODES
} = require('../index');

const fixtures = require('./fixtures/tle-samples');

describe('Integration Tests - End-to-End Scenarios', () => {
  describe('Complete Parse Workflow', () => {
    test('should validate, parse, and extract data from ISS TLE', () => {
      // Step 1: Validate
      const validation = validateTLE(fixtures.validISS3Line);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 2: Parse
      const parsed = parseTLE(fixtures.validISS3Line);
      expect(parsed).toBeDefined();
      expect(parsed.satelliteName).toBe('ISS (ZARYA)');

      // Step 3: Verify all expected fields are present
      expect(parsed.satelliteNumber1).toBe('25544');
      expect(parsed.satelliteNumber2).toBe('25544');
      expect(parsed.classification).toBe('U');
      expect(parsed.inclination).toBe('51.6453');
      expect(parsed.eccentricity).toBe('0001671');

      // Step 4: Verify checksums
      expect(parsed.checksum1).toBe('6');
      expect(parsed.checksum2).toBe('8');
    });

    test('should handle invalid TLE with proper error reporting', () => {
      // Step 1: Validate and expect failure
      const validation = validateTLE(fixtures.invalidChecksum1);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Step 2: Attempt to parse (should throw)
      expect(() => parseTLE(fixtures.invalidChecksum1)).toThrow();

      // Step 3: Parse without validation should succeed
      const parsed = parseTLE(fixtures.invalidChecksum1, { validate: false });
      expect(parsed).toBeDefined();
      expect(parsed.satelliteNumber1).toBe('25544');
    });

    test('should handle TLE with comments throughout workflow', () => {
      // Step 1: Parse with comments
      const parsed = parseTLE(fixtures.validISSWithComments, { includeComments: true });
      expect(parsed.comments).toBeDefined();
      expect(parsed.comments.length).toBeGreaterThan(0);
      expect(parsed.comments[0]).toContain('# Source:');

      // Step 2: Verify data integrity despite comments
      expect(parsed.satelliteName).toBe('ISS (ZARYA)');
      expect(parsed.satelliteNumber1).toBe('25544');

      // Step 3: Parse without comments option
      const parsedNoComments = parseTLE(fixtures.validISSWithComments, { includeComments: false });
      expect(parsedNoComments.comments).toBeUndefined();
    });
  });

  describe('Batch Processing Scenarios', () => {
    test('should parse multiple TLEs in sequence', () => {
      const tles = [
        fixtures.validISS3Line,
        fixtures.validHubble,
        fixtures.validGPS,
        fixtures.validStarlink
      ];

      const results = tles.map(tle => parseTLE(tle));

      expect(results).toHaveLength(4);
      expect(results[0].satelliteName).toBe('ISS (ZARYA)');
      expect(results[1].satelliteName).toBe('HST');
      expect(results[2].satelliteNumber1).toBe('40294');
      expect(results[3].satelliteName).toBe('STARLINK-1007');

      // Verify all have required fields
      results.forEach(result => {
        expect(result.satelliteNumber1).toBeDefined();
        expect(result.satelliteNumber2).toBeDefined();
        expect(result.inclination).toBeDefined();
        expect(result.eccentricity).toBeDefined();
      });
    });

    test('should validate multiple TLEs and collect errors', () => {
      const tles = [
        { name: 'Valid ISS', data: fixtures.validISS2Line, shouldPass: true },
        { name: 'Invalid Checksum', data: fixtures.invalidChecksum1, shouldPass: false },
        { name: 'Valid Hubble', data: fixtures.validHubble, shouldPass: true },
        { name: 'Invalid Sat Number', data: fixtures.invalidSatNumberMismatch, shouldPass: false }
      ];

      const validationResults = tles.map(tle => ({
        name: tle.name,
        validation: validateTLE(tle.data),
        expectedResult: tle.shouldPass
      }));

      validationResults.forEach(result => {
        expect(result.validation.isValid).toBe(result.expectedResult);
      });

      // Count errors across all validations
      const totalErrors = validationResults.reduce((sum, result) =>
        sum + result.validation.errors.length, 0
      );
      expect(totalErrors).toBeGreaterThan(0);
    });

    test('should parse multiple TLEs with state machine parser', () => {
      const parser = new TLEStateMachineParser();
      const tles = [
        fixtures.validISS2Line,
        fixtures.validHubble,
        fixtures.validGPS
      ];

      const results = tles.map(tle => parser.parse(tle));

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.satelliteNumber1).toBeDefined();
      });
    });
  });

  describe('Parser Comparison and Compatibility', () => {
    test('both parsers should extract same data from valid TLE', () => {
      const standardParsed = parseTLE(fixtures.validISS2Line);
      const stateMachineParsed = parseWithStateMachine(fixtures.validISS2Line);

      // Compare key fields
      expect(stateMachineParsed.data.satelliteNumber1).toBe(standardParsed.satelliteNumber1);
      expect(stateMachineParsed.data.satelliteNumber2).toBe(standardParsed.satelliteNumber2);
      expect(stateMachineParsed.data.classification).toBe(standardParsed.classification);
      expect(stateMachineParsed.data.inclination).toBe(standardParsed.inclination);
      expect(stateMachineParsed.data.eccentricity).toBe(standardParsed.eccentricity);
    });

    test('both parsers should detect same errors', () => {
      // Standard parser
      expect(() => parseTLE(fixtures.invalidChecksum1)).toThrow();

      // State machine parser
      const stateMachineResult = parseWithStateMachine(fixtures.invalidChecksum1);
      expect(stateMachineResult.errors.length).toBeGreaterThan(0);
      expect(stateMachineResult.errors.some(e =>
        e.code === ERROR_CODES.CHECKSUM_MISMATCH
      )).toBe(true);
    });

    test('state machine parser provides recovery where standard parser fails', () => {
      // Standard parser should throw
      expect(() => parseTLE(fixtures.invalidChecksum1)).toThrow();

      // State machine parser with recovery should provide partial data
      const parser = new TLEStateMachineParser({
        attemptRecovery: true,
        includePartialResults: true
      });
      const result = parser.parse(fixtures.invalidChecksum1);

      expect(result.data).toBeDefined();
      expect(result.data.satelliteNumber1).toBe('25544');
      expect(result.recoveryActions.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Use Cases', () => {
    test('satellite tracking application workflow', () => {
      // Scenario: App receives TLE data from external source
      const receivedTLE = fixtures.validISS3Line;

      // Step 1: Validate before processing
      const validation = validateTLE(receivedTLE);
      if (!validation.isValid) {
        throw new Error('Invalid TLE received');
      }

      // Step 2: Parse the TLE
      const satellite = parseTLE(receivedTLE);

      // Step 3: Extract orbital parameters for tracking
      const orbitalData = {
        name: satellite.satelliteName,
        noradId: parseInt(satellite.satelliteNumber1, 10),
        inclination: parseFloat(satellite.inclination),
        eccentricity: parseFloat('0.' + satellite.eccentricity),
        meanMotion: parseFloat(satellite.meanMotion),
        epoch: {
          year: satellite.epochYear,
          day: satellite.epochDay
        }
      };

      expect(orbitalData.name).toBe('ISS (ZARYA)');
      expect(orbitalData.noradId).toBe(25544);
      expect(orbitalData.inclination).toBeCloseTo(51.6453, 4);
      expect(orbitalData.eccentricity).toBeCloseTo(0.0001671, 7);
    });

    test('data quality monitoring workflow', () => {
      const tlesToMonitor = [
        fixtures.validISS2Line,
        fixtures.warningDeprecatedYear,
        fixtures.warningHighEccentricity,
        fixtures.warningMultiple
      ];

      const qualityReport = tlesToMonitor.map((tle, index) => {
        const validation = validateTLE(tle);
        return {
          index,
          isValid: validation.isValid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          quality: validation.errors.length === 0 && validation.warnings.length === 0 ? 'excellent' :
                   validation.errors.length === 0 && validation.warnings.length <= 2 ? 'good' :
                   validation.errors.length === 0 ? 'fair' : 'poor'
        };
      });

      expect(qualityReport[0].quality).toBe('good'); // Valid ISS (may have staleness warning)
      expect(qualityReport[qualityReport.length - 1].warningCount).toBeGreaterThan(3); // Multiple warnings
    });

    test('TLE database ingestion workflow', () => {
      // Scenario: Batch processing TLEs for database storage
      const tleDataset = [
        { source: 'CelesTrak', tle: fixtures.validISS3Line },
        { source: 'Space-Track', tle: fixtures.validHubble },
        { source: 'Amateur', tle: fixtures.validGPS }
      ];

      const dbRecords = [];
      const errors = [];

      tleDataset.forEach((item, index) => {
        try {
          const parsed = parseTLE(item.tle, { includeWarnings: true });
          dbRecords.push({
            id: index,
            source: item.source,
            satelliteName: parsed.satelliteName,
            noradId: parsed.satelliteNumber1,
            classification: parsed.classification,
            epochYear: parsed.epochYear,
            epochDay: parsed.epochDay,
            inclination: parsed.inclination,
            eccentricity: parsed.eccentricity,
            meanMotion: parsed.meanMotion,
            warnings: parsed.warnings || [],
            importDate: new Date().toISOString()
          });
        } catch (error) {
          errors.push({
            index,
            source: item.source,
            error: error.message
          });
        }
      });

      expect(dbRecords).toHaveLength(3);
      expect(errors).toHaveLength(0);
      expect(dbRecords[0].satelliteName).toBe('ISS (ZARYA)');
      expect(dbRecords[1].satelliteName).toBe('HST');
    });

    test('TLE update detection workflow', () => {
      // Scenario: Detecting when a satellite's TLE has been updated
      const oldTLE = fixtures.validISS2Line;
      const newTLE = fixtures.validISS3Line; // Same satellite, might have different epoch

      const oldParsed = parseTLE(oldTLE, { validate: false });
      const newParsed = parseTLE(newTLE);

      // Check if same satellite
      const isSameSatellite = oldParsed.satelliteNumber1 === newParsed.satelliteNumber1;
      expect(isSameSatellite).toBe(true);

      // In a real scenario, you'd compare epochs to detect updates
      const hasUpdate = oldParsed.epochYear !== newParsed.epochYear ||
                        oldParsed.epochDay !== newParsed.epochDay ||
                        oldParsed.meanMotion !== newParsed.meanMotion;

      // Both are same epoch in fixtures, so no update
      expect(hasUpdate).toBe(false);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('graceful degradation with partial TLE data', () => {
      const parser = new TLEStateMachineParser({
        attemptRecovery: true,
        includePartialResults: true,
        strictMode: false
      });

      const result = parser.parse(fixtures.invalidLineShort);

      // Should have errors but may have partial data
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeDefined();
    });

    test('sequential processing with mixed valid and invalid TLEs', () => {
      const mixedTLEs = [
        { tle: fixtures.validISS2Line, expectSuccess: true },
        { tle: fixtures.invalidChecksum1, expectSuccess: false },
        { tle: fixtures.validHubble, expectSuccess: true },
        { tle: fixtures.invalidSatNumberMismatch, expectSuccess: false },
        { tle: fixtures.validGPS, expectSuccess: true }
      ];

      const results = {
        successful: [],
        failed: []
      };

      mixedTLEs.forEach(item => {
        try {
          const parsed = parseTLE(item.tle);
          results.successful.push(parsed);
        } catch (error) {
          results.failed.push({
            tle: item.tle,
            error: error.message
          });
        }
      });

      expect(results.successful).toHaveLength(3);
      expect(results.failed).toHaveLength(2);
    });

    test('retry logic with different parsing strategies', () => {
      const problematicTLE = fixtures.invalidChecksum1;

      // Strategy 1: Strict parsing (should fail)
      let parsed = null;
      try {
        parsed = parseTLE(problematicTLE, { validate: true });
      } catch (error) {
        // Expected to fail
      }
      expect(parsed).toBeNull();

      // Strategy 2: Skip validation (should succeed)
      parsed = parseTLE(problematicTLE, { validate: false });
      expect(parsed).toBeDefined();
      expect(parsed.satelliteNumber1).toBe('25544');

      // Strategy 3: Use state machine with recovery
      const stateMachineResult = parseWithStateMachine(problematicTLE, {
        attemptRecovery: true,
        includePartialResults: true
      });
      expect(stateMachineResult.data).toBeDefined();
      expect(stateMachineResult.data.satelliteNumber1).toBe('25544');
    });
  });

  describe('Performance and Stress Testing', () => {
    test('should handle rapid sequential parsing', () => {
      const iterations = 100;
      const results = [];

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        const parsed = parseTLE(fixtures.validISS2Line);
        results.push(parsed);
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(iterations);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      // Verify consistency
      results.forEach(result => {
        expect(result.satelliteNumber1).toBe('25544');
      });
    });

    test('should handle parsing with different options combinations', () => {
      const optionCombinations = [
        { validate: true, includeWarnings: true, includeComments: true },
        { validate: true, includeWarnings: false, includeComments: false },
        { validate: false, includeWarnings: true, includeComments: true },
        { validate: false, includeWarnings: false, includeComments: false }
      ];

      optionCombinations.forEach(options => {
        const parsed = parseTLE(fixtures.validISSWithComments, options);
        expect(parsed).toBeDefined();
        expect(parsed.satelliteNumber1).toBe('25544');

        if (options.includeComments) {
          expect(parsed.comments).toBeDefined();
        } else {
          expect(parsed.comments).toBeUndefined();
        }
      });
    });
  });

  describe('Data Transformation Workflows', () => {
    test('should extract and transform TLE data for orbital calculations', () => {
      const tle = parseTLE(fixtures.validISS3Line);

      // Transform to format suitable for SGP4 propagator
      const sgp4Input = {
        satelliteNumber: parseInt(tle.satelliteNumber1, 10),
        classification: tle.classification,
        intlDesignator: `${tle.internationalDesignatorYear}${tle.internationalDesignatorLaunchNumber}${tle.internationalDesignatorPiece}`,
        epochYear: parseInt(tle.epochYear, 10),
        epochDay: parseFloat(tle.epochDay),
        meanMotionDot: parseFloat(tle.firstDerivativeMeanMotion),
        meanMotionDotDot: parseFloat(tle.secondDerivativeMeanMotion),
        bStar: parseFloat(tle.bStarDragTerm),
        inclination: parseFloat(tle.inclination),
        rightAscension: parseFloat(tle.rightAscension),
        eccentricity: parseFloat('0.' + tle.eccentricity),
        argOfPerigee: parseFloat(tle.argumentOfPerigee),
        meanAnomaly: parseFloat(tle.meanAnomaly),
        meanMotion: parseFloat(tle.meanMotion)
      };

      expect(sgp4Input.satelliteNumber).toBe(25544);
      expect(sgp4Input.inclination).toBeCloseTo(51.6453, 4);
      expect(sgp4Input.eccentricity).toBeCloseTo(0.0001671, 7);
      expect(sgp4Input.meanMotion).toBeCloseTo(15.49338189, 8);
    });

    test('should convert TLE data to JSON for API responses', () => {
      const tle = parseTLE(fixtures.validHubble);

      const apiResponse = {
        satellite: {
          name: tle.satelliteName,
          noradId: tle.satelliteNumber1,
          classification: tle.classification
        },
        orbit: {
          inclination: tle.inclination,
          eccentricity: tle.eccentricity,
          meanMotion: tle.meanMotion,
          rightAscension: tle.rightAscension,
          argOfPerigee: tle.argumentOfPerigee,
          meanAnomaly: tle.meanAnomaly
        },
        epoch: {
          year: tle.epochYear,
          day: tle.epochDay
        },
        metadata: {
          checksum: {
            line1: tle.checksum1,
            line2: tle.checksum2
          }
        }
      };

      const json = JSON.stringify(apiResponse);
      expect(json).toBeDefined();

      const parsed = JSON.parse(json);
      expect(parsed.satellite.name).toBe('HST');
      expect(parsed.satellite.noradId).toBe('20580');
    });
  });
});
