/**
 * Property-Based Tests for TLE Parser
 * Tests parser robustness with generated inputs
 */

const fc = require('fast-check');
const {
  parseTLE,
  validateTLE,
  calculateChecksum,
  validateChecksum,
  parseWithStateMachine,
  ERROR_CODES
} = require('../index');

const fixtures = require('./fixtures/tle-samples');

describe('Property-Based Tests - Parser Robustness', () => {
  describe('Checksum Properties', () => {
    test('checksum calculation should be deterministic', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const lines = tleString.split('\n').filter(l => l.startsWith('1') || l.startsWith('2'));
            const line1 = lines.find(l => l.startsWith('1'));

            if (line1 && line1.length === 69) {
              const checksum1 = calculateChecksum(line1);
              const checksum2 = calculateChecksum(line1);
              return checksum1 === checksum2;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('checksum should always be a single digit (0-9)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 69, maxLength: 69 }),
          (line) => {
            const checksum = calculateChecksum(line);
            return checksum >= 0 && checksum <= 9 && Number.isInteger(checksum);
          }
        ),
        { numRuns: 200 }
      );
    });

    test('checksum calculation should handle various characters', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 67 }), // Don't modify the checksum position
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', 'A', 'B', ' ', '.', '+'),
          (position, newChar) => {
            const modifiedLine = line.substring(0, position) + newChar + line.substring(position + 1);
            const newChecksum = calculateChecksum(modifiedLine);

            // Checksum should always be a valid single digit
            return typeof newChecksum === 'number' && newChecksum >= 0 && newChecksum <= 9;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('checksum validation should reject invalid checksums', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }),
          (wrongChecksum) => {
            const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
            const correctChecksum = calculateChecksum(line);

            if (wrongChecksum === correctChecksum) {
              return true; // Skip if randomly same
            }

            const lineWithWrongChecksum = line.substring(0, 68) + wrongChecksum;
            const result = validateChecksum(lineWithWrongChecksum);

            return result.isValid === false;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Parsing Idempotence Properties', () => {
    test('parsing the same TLE multiple times should give identical results', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validISS3Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const result1 = parseTLE(tleString);
            const result2 = parseTLE(tleString);
            const result3 = parseTLE(tleString);

            return JSON.stringify(result1) === JSON.stringify(result2) &&
                   JSON.stringify(result2) === JSON.stringify(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation should be consistent across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.invalidChecksum1,
            fixtures.invalidSatNumberMismatch
          ),
          (tleString) => {
            const validation1 = validateTLE(tleString);
            const validation2 = validateTLE(tleString);

            return validation1.isValid === validation2.isValid &&
                   validation1.errors.length === validation2.errors.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('state machine parser should be idempotent', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const result1 = parseWithStateMachine(tleString);
            const result2 = parseWithStateMachine(tleString);

            return result1.success === result2.success &&
                   JSON.stringify(result1.data) === JSON.stringify(result2.data);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Field Extraction Properties', () => {
    test('satellite number from both lines should always match in valid TLEs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validISS3Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            return parsed.satelliteNumber1 === parsed.satelliteNumber2;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('line numbers should always be "1" and "2"', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validISS3Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            return parsed.lineNumber1 === '1' && parsed.lineNumber2 === '2';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('checksum fields should always be single digits', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const checksum1 = parseInt(parsed.checksum1, 10);
            const checksum2 = parseInt(parsed.checksum2, 10);

            return checksum1 >= 0 && checksum1 <= 9 &&
                   checksum2 >= 0 && checksum2 <= 9;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('classification should be one of U, C, or S', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            return ['U', 'C', 'S'].includes(parsed.classification);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Properties', () => {
    test('valid TLEs should always pass validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validISS3Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const validation = validateTLE(tleString);
            return validation.isValid === true && validation.errors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invalid TLEs should always fail validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.invalidChecksum1,
            fixtures.invalidChecksum2,
            fixtures.invalidSatNumberMismatch,
            fixtures.invalidClassification,
            fixtures.invalidInclination
          ),
          (tleString) => {
            const validation = validateTLE(tleString);
            return validation.isValid === false && validation.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation errors should have required structure', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.invalidChecksum1,
            fixtures.invalidSatNumberMismatch,
            fixtures.invalidClassification
          ),
          (tleString) => {
            const validation = validateTLE(tleString);

            if (validation.errors.length === 0) return true;

            return validation.errors.every(error =>
              error.code !== undefined &&
              error.message !== undefined &&
              error.severity !== undefined
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    test('permissive mode should have fewer or equal errors than strict mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.invalidChecksum1,
            fixtures.invalidSatNumberMismatch
          ),
          (tleString) => {
            const strictValidation = validateTLE(tleString, { mode: 'strict' });
            const permissiveValidation = validateTLE(tleString, { mode: 'permissive' });

            return permissiveValidation.errors.length <= strictValidation.errors.length;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Range Validation Properties', () => {
    test('inclination should be between 0 and 180 degrees', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const inclination = parseFloat(parsed.inclination);
            return inclination >= 0 && inclination <= 180;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('eccentricity should be between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const eccentricity = parseFloat('0.' + parsed.eccentricity);
            return eccentricity >= 0 && eccentricity <= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('mean anomaly should be between 0 and 360 degrees', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const meanAnomaly = parseFloat(parsed.meanAnomaly);
            return meanAnomaly >= 0 && meanAnomaly <= 360;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('right ascension should be between 0 and 360 degrees', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const ra = parseFloat(parsed.rightAscension);
            return ra >= 0 && ra <= 360;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Input Handling Properties', () => {
    test('parser should handle different line ending combinations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('\n', '\r\n', '\r'),
          (lineEnding) => {
            const tle = fixtures.validISS2Line.replace(/\n/g, lineEnding);
            const parsed = parseTLE(tle);
            return parsed.satelliteNumber1 === '25544';
          }
        ),
        { numRuns: 30 }
      );
    });

    test('parser should handle whitespace variations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.whitespaceMixedSpaces,
            fixtures.whitespaceWithTabs
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            return parsed.satelliteNumber1 === '25544';
          }
        ),
        { numRuns: 50 }
      );
    });

    test('parser should reject non-string input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.string()),
            fc.object()
          ),
          (invalidInput) => {
            try {
              parseTLE(invalidInput);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof TypeError;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parser should reject empty or whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\n\n', '\t\t', '   \n   '),
          (emptyString) => {
            try {
              parseTLE(emptyString);
              return false; // Should have thrown
            } catch (error) {
              return true;
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Numeric Parsing Properties', () => {
    test('satellite number should be parseable as integer', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS,
            fixtures.validStarlink
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const satNum = parseInt(parsed.satelliteNumber1, 10);
            return !isNaN(satNum) && satNum > 0 && satNum <= 99999;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('numeric fields should be parseable as floats', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);

            const numericFields = [
              parsed.inclination,
              parsed.rightAscension,
              parsed.meanAnomaly,
              parsed.meanMotion
            ];

            return numericFields.every(field => !isNaN(parseFloat(field)));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('epoch year should be valid two-digit year', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            const epochYear = parseInt(parsed.epochYear, 10);
            return !isNaN(epochYear) && epochYear >= 0 && epochYear <= 99;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('epoch day should be valid day of year', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            // The field is called 'epoch', not 'epochDay'
            const epochDay = parseFloat(parsed.epoch);
            return !isNaN(epochDay) && epochDay >= 1 && epochDay <= 366.99999999;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('State Machine Parser Properties', () => {
    test('state machine should reach COMPLETED state for valid TLEs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.validISS2Line,
            fixtures.validHubble,
            fixtures.validGPS
          ),
          (tleString) => {
            const result = parseWithStateMachine(tleString);
            return result.success === true && result.state === 'COMPLETED';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('state machine should detect errors for invalid TLEs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.invalidChecksum1,
            fixtures.invalidSatNumberMismatch,
            fixtures.invalidClassification
          ),
          (tleString) => {
            const result = parseWithStateMachine(tleString);
            return result.errors.length > 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('recovery actions should be recorded when recovery is attempted', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.invalidChecksum1,
            fixtures.invalidLineShort
          ),
          (tleString) => {
            const result = parseWithStateMachine(tleString, {
              attemptRecovery: true
            });

            // If there are errors, recovery should have been attempted
            if (result.errors.length > 0) {
              return result.recoveryActions !== undefined;
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Warning Properties', () => {
    test('warnings should not prevent successful parsing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.warningDeprecatedYear,
            fixtures.warningHighEccentricity,
            fixtures.warningLowMeanMotion
          ),
          (tleString) => {
            const validation = validateTLE(tleString);
            // Should be valid with warnings
            return validation.isValid === true && validation.warnings.length > 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('warnings should have proper structure', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.warningDeprecatedYear,
            fixtures.warningMultiple
          ),
          (tleString) => {
            const validation = validateTLE(tleString);

            if (validation.warnings.length === 0) return true;

            return validation.warnings.every(warning =>
              warning.code !== undefined &&
              warning.message !== undefined &&
              warning.severity === 'warning'
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    test('multiple warnings should accumulate correctly', () => {
      fc.assert(
        fc.property(
          fc.constant(fixtures.warningMultiple),
          (tleString) => {
            const validation = validateTLE(tleString);
            // Should have multiple distinct warnings
            return validation.warnings.length >= 5;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Fuzz Testing - Robustness', () => {
    test('parser should not crash on random strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (randomString) => {
            try {
              parseTLE(randomString, { validate: false });
              return true; // May succeed or throw, but shouldn't crash
            } catch (error) {
              // Expected to throw on invalid input
              return error instanceof Error;
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    test('validator should not crash on random strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (randomString) => {
            try {
              validateTLE(randomString);
              return true;
            } catch (error) {
              // May throw format errors
              return error instanceof Error;
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    test('state machine parser should not crash on random input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (randomString) => {
            try {
              const result = parseWithStateMachine(randomString);
              // Should return a result object
              return result !== undefined && typeof result === 'object';
            } catch (error) {
              // Should not crash, even on invalid input
              return false;
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    test('parser should handle very long lines gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 1000 }),
          (longString) => {
            try {
              validateTLE(longString);
              return true;
            } catch (error) {
              return error instanceof Error;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Case Properties', () => {
    test('minimum satellite number (00001) should be valid', () => {
      const parsed = parseTLE(fixtures.edgeSatelliteNumberMin);
      expect(parsed.satelliteNumber1).toBe('00001');
      expect(parseInt(parsed.satelliteNumber1, 10)).toBe(1);
    });

    test('maximum satellite number (99999) should be valid', () => {
      const parsed = parseTLE(fixtures.edgeSatelliteNumberMax);
      expect(parsed.satelliteNumber1).toBe('99999');
      expect(parseInt(parsed.satelliteNumber1, 10)).toBe(99999);
    });

    test('satellite names starting with digits should generate warnings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            fixtures.edgeNameStartsWith1,
            fixtures.edgeNameStartsWith2
          ),
          (tleString) => {
            const parsed = parseTLE(tleString);
            return parsed.warnings && parsed.warnings.some(w =>
              w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING
            );
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
