/**
 * Regression Tests for TLE Parser
 *
 * These tests ensure that previously fixed bugs do not resurface.
 * Each test documents the original issue and verifies the fix remains effective.
 */

const {
  parseTLE,
  validateTLE,
  normalizeLineEndings,
  parseTLELines,
  TLEValidationError
} = require('../index');

const { TLEStateMachineParser } = require('../stateMachineParser');
const fixtures = require('./fixtures/tle-samples');

describe('TLE Parser - Regression Tests', () => {
  describe('Line Ending Normalization (Bug Fix #7d4d2c8)', () => {
    test('should handle CRLF line endings correctly', () => {
      const result = parseTLE(fixtures.lineEndingCRLF);

      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
      expect(result.satelliteNumber2).toBe('25544');
    });

    test('should handle CR line endings correctly', () => {
      const result = parseTLE(fixtures.lineEndingCR);

      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should normalize all line ending types to LF', () => {
      expect(normalizeLineEndings('a\r\nb')).toBe('a\nb');
      expect(normalizeLineEndings('a\rb')).toBe('a\nb');
      expect(normalizeLineEndings('a\nb')).toBe('a\nb');
      expect(normalizeLineEndings('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
    });
  });

  describe('Comment Line Parsing (Feature #afc3dfa)', () => {
    test('should parse TLE with comment lines when includeComments is true', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: true });

      expect(result.comments).toBeDefined();
      expect(Array.isArray(result.comments)).toBe(true);
      expect(result.comments.length).toBeGreaterThan(0);
    });

    test('should filter out comment lines during parsing', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: true });

      expect(result.satelliteName).toBe('ISS (ZARYA)');
      expect(result.comments).toBeDefined();
      expect(result.comments.length).toBeGreaterThan(0);
    });

    test('should handle TLE with only comments gracefully', () => {
      const onlyComments = '# Comment 1\n# Comment 2\n# Comment 3';

      expect(() => {
        parseTLE(onlyComments);
      }).toThrow(TLEValidationError);
    });

    test('should not include comments when includeComments is false', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: false });

      expect(result.comments).toBeUndefined();
    });

    test('should parse correctly when comments are mixed with TLE lines', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: true });

      expect(result.satelliteName).toBe('ISS (ZARYA)');
      expect(result.satelliteNumber1).toBe('25544');
      expect(result.comments).toBeDefined();
      expect(result.comments.length).toBeGreaterThan(0);
    });
  });

  describe('Warning Detection Accuracy (Feature #6fb4abe)', () => {
    test('should detect classified data warnings correctly', () => {
      const result = parseTLE(fixtures.warningClassified, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect deprecated epoch warnings correctly', () => {
      const result = parseTLE(fixtures.warningDeprecatedYear, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect high eccentricity warnings correctly', () => {
      const result = parseTLE(fixtures.warningHighEccentricity, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect low mean motion warnings correctly', () => {
      const result = parseTLE(fixtures.warningLowMeanMotion, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect zero drag warnings correctly', () => {
      const result = parseTLE(fixtures.warningZeroDrag, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect negative decay warnings correctly', () => {
      const result = parseTLE(fixtures.warningNegativeDerivative, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect multiple warnings correctly', () => {
      const result = parseTLE(fixtures.warningMultiple, { includeWarnings: true });

      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(1);
    });
  });

  describe('Permissive vs Strict Mode (Feature #324b0ca)', () => {
    test('should throw error on checksum mismatch in strict mode', () => {
      expect(() => {
        parseTLE(fixtures.invalidChecksum1, { validate: true, strictChecksums: true });
      }).toThrow(TLEValidationError);
    });

    test('should allow parsing without validation', () => {
      const result = parseTLE(fixtures.invalidChecksum1, { validate: false });

      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should handle range validation in strict mode', () => {
      expect(() => {
        parseTLE(fixtures.invalidInclination, {
          validate: true,
          validateRanges: true
        });
      }).toThrow(TLEValidationError);
    });

    test('should allow out-of-range values when range validation is disabled', () => {
      const result = parseTLE(fixtures.invalidInclination, {
        validate: false,
        validateRanges: false
      });

      // Should parse without validation
      expect(result).toBeDefined();
    });
  });

  describe('State Machine Recovery (Feature #6657172)', () => {
    test('should use state machine parser for complex scenarios', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.validISS3Line);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should record errors when parsing invalid TLEs', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.invalidChecksum1);

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should handle excess lines in TLE data', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.tooManyLines);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    test('should detect short line errors', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.invalidLineShort);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Whitespace Handling (Bug Fix #364473b)', () => {
    test('should handle leading and trailing whitespace correctly', () => {
      const result = parseTLE(fixtures.whitespaceMixedSpaces);

      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
      expect(result.satelliteNumber2).toBe('25544');
    });

    test('should handle tabs in whitespace correctly', () => {
      const result = parseTLE(fixtures.whitespaceWithTabs);

      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should handle empty lines gracefully', () => {
      const tleWithEmptyLines = `ISS (ZARYA)

1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996

2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428

`;

      const result = parseTLE(tleWithEmptyLines);

      expect(result.satelliteName).toBe('ISS (ZARYA)');
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should filter empty and whitespace-only lines in parseTLELines', () => {
      const input = `Line 1


\t
Line 2`;

      const lines = parseTLELines(input);

      expect(lines).toEqual(['Line 1', 'Line 2']);
    });
  });

  describe('Field Range Validation (Feature #fcbd5d7)', () => {
    test('should validate inclination range (0-180 degrees)', () => {
      expect(() => {
        parseTLE(fixtures.invalidInclination, {
          validate: true,
          validateRanges: true
        });
      }).toThrow(TLEValidationError);
    });

    test('should accept valid inclination values', () => {
      // Valid ISS inclination of 51.6453 degrees
      const result = parseTLE(fixtures.validISS2Line, {
        validate: true,
        validateRanges: true
      });

      expect(result.inclination).toBe('51.6453');
    });

    test('should validate epoch day range (1-366.99999999)', () => {
      expect(() => {
        parseTLE(fixtures.invalidEpochDay, {
          validate: true,
          validateRanges: true
        });
      }).toThrow(TLEValidationError);
    });

    test('should validate eccentricity range (0-1)', () => {
      // High eccentricity fixture should still be in valid range
      const result = parseTLE(fixtures.warningHighEccentricity, {
        validate: true,
        validateRanges: true
      });

      expect(result).toBeDefined();
    });

    test('should validate satellite number range (1-99999)', () => {
      // Edge cases: minimum and maximum satellite numbers
      const minSatNum = parseTLE(fixtures.edgeSatelliteNumberMin, {
        validate: true,
        validateRanges: true
      });

      const maxSatNum = parseTLE(fixtures.edgeSatelliteNumberMax, {
        validate: true,
        validateRanges: true
      });

      expect(minSatNum.satelliteNumber1).toBe('00001');
      expect(maxSatNum.satelliteNumber1).toBe('99999');
    });
  });

  describe('Edge Case Regression Tests', () => {
    test('should handle satellite names starting with "1"', () => {
      const result = parseTLE(fixtures.edgeNameStartsWith1);

      expect(result.satelliteName).toBe('1KUNS-PF');
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should handle satellite names starting with "2"', () => {
      const result = parseTLE(fixtures.edgeNameStartsWith2);

      expect(result.satelliteName).toBe('2020-001A');
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should handle very long satellite names correctly', () => {
      const result = parseTLE(fixtures.edgeLongSatelliteName);

      expect(result.satelliteName).toBeDefined();
      expect(result.satelliteName.length).toBeGreaterThan(24);
    });

    test('should handle minimum satellite number (00001)', () => {
      const result = parseTLE(fixtures.edgeSatelliteNumberMin);

      expect(result.satelliteNumber1).toBe('00001');
      expect(result.satelliteNumber2).toBe('00001');
    });

    test('should handle maximum satellite number (99999)', () => {
      const result = parseTLE(fixtures.edgeSatelliteNumberMax);

      expect(result.satelliteNumber1).toBe('99999');
      expect(result.satelliteNumber2).toBe('99999');
    });

    test('should reject null input', () => {
      expect(() => parseTLE(null)).toThrow(TypeError);
    });

    test('should reject undefined input', () => {
      expect(() => parseTLE(undefined)).toThrow(TypeError);
    });

    test('should reject non-string input', () => {
      expect(() => parseTLE(12345)).toThrow(TypeError);
      expect(() => parseTLE({})).toThrow(TypeError);
      expect(() => parseTLE([])).toThrow(TypeError);
    });

    test('should handle empty string gracefully', () => {
      expect(() => parseTLE('')).toThrow();
    });

    test('should handle whitespace-only string gracefully', () => {
      expect(() => parseTLE('   \n  \t  ')).toThrow();
    });
  });

  describe('Cross-Field Validation Regression', () => {
    test('should detect satellite number mismatch between lines', () => {
      expect(() => {
        parseTLE(fixtures.invalidSatNumberMismatch, { validate: true });
      }).toThrow(TLEValidationError);
    });

    test('should validate line numbers are correct', () => {
      expect(() => {
        parseTLE(fixtures.invalidLineNumber, { validate: true });
      }).toThrow(TLEValidationError);
    });

    test('should validate classification codes', () => {
      expect(() => {
        parseTLE(fixtures.invalidClassification, { validate: true });
      }).toThrow(TLEValidationError);
    });
  });

  describe('Performance Regression Prevention', () => {
    test('should handle repeated parsing without performance degradation', () => {
      const iterations = 1000;
      const times = [];

      // Measure time for each parse
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        parseTLE(fixtures.validISS2Line);
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1_000_000); // Convert to ms
      }

      // Calculate average time for first 100 and last 100
      const firstHundred = times.slice(0, 100).reduce((a, b) => a + b) / 100;
      const lastHundred = times.slice(-100).reduce((a, b) => a + b) / 100;

      // Last hundred should not be significantly slower than first hundred
      // Allow up to 50% increase (due to GC, etc.)
      expect(lastHundred).toBeLessThan(firstHundred * 1.5);
    });

    test('should maintain consistent validation performance', () => {
      const iterations = 1000;

      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        validateTLE(fixtures.validISS2Line);
      }

      const end = process.hrtime.bigint();
      const totalTimeMs = Number(end - start) / 1_000_000;
      const avgTimeMs = totalTimeMs / iterations;

      // Average validation should be under 0.5ms
      expect(avgTimeMs).toBeLessThan(0.5);
    });
  });
});
