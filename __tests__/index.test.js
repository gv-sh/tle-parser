/**
 * Comprehensive Jest tests for TLE Parser
 */

const {
  parseTLE,
  validateTLE,
  calculateChecksum,
  validateChecksum,
  validateLineStructure,
  validateSatelliteNumber,
  validateClassification,
  validateNumericRange,
  checkClassificationWarnings,
  checkEpochWarnings,
  checkOrbitalParameterWarnings,
  checkDragAndEphemerisWarnings,
  normalizeLineEndings,
  parseTLELines,
  TLEValidationError,
  TLEFormatError,
  ERROR_CODES
} = require('../index');

const fixtures = require('./fixtures/tle-samples');

describe('TLE Parser - Core Parsing Functions', () => {
  describe('parseTLE()', () => {
    test('should parse valid 2-line TLE', () => {
      const result = parseTLE(fixtures.validISS2Line);
      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
      expect(result.inclination).toBe('51.6453');
    });

    test('should parse valid 3-line TLE with satellite name', () => {
      const result = parseTLE(fixtures.validISS3Line);
      expect(result).toBeDefined();
      expect(result.satelliteName).toBe('ISS (ZARYA)');
      expect(result.satelliteNumber1).toBe('25544');
    });

    test('should parse TLE with comments when includeComments is true', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: true });
      expect(result.comments).toBeDefined();
      expect(Array.isArray(result.comments)).toBe(true);
      expect(result.comments.length).toBeGreaterThan(0);
      expect(result.comments[0]).toContain('# Source:');
    });

    test('should not include comments when includeComments is false', () => {
      const result = parseTLE(fixtures.validISSWithComments, { includeComments: false });
      expect(result.comments).toBeUndefined();
    });

    test('should parse Hubble Space Telescope TLE', () => {
      const result = parseTLE(fixtures.validHubble);
      expect(result.satelliteName).toBe('HST');
      expect(result.satelliteNumber1).toBe('20580');
    });

    test('should parse GPS satellite TLE', () => {
      const result = parseTLE(fixtures.validGPS);
      expect(result.satelliteNumber1).toBe('40294');
    });

    test('should parse Starlink satellite TLE', () => {
      const result = parseTLE(fixtures.validStarlink);
      expect(result.satelliteName).toBe('STARLINK-1007');
      expect(result.satelliteNumber1).toBe('44713');
    });

    test('should include warnings when includeWarnings is true', () => {
      const result = parseTLE(fixtures.validISS2Line, { includeWarnings: true });
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should not include warnings when includeWarnings is false', () => {
      const result = parseTLE(fixtures.edgeLongSatelliteName, { includeWarnings: false });
      expect(result.warnings).toBeUndefined();
    });

    test('should parse without validation when validate is false', () => {
      const result = parseTLE(fixtures.invalidChecksum1, { validate: false });
      expect(result).toBeDefined();
      expect(result.satelliteNumber1).toBe('25544');
    });
  });

  describe('parseTLE() - Error Handling', () => {
    test('should throw TypeError for non-string input', () => {
      expect(() => parseTLE(12345)).toThrow(TypeError);
      expect(() => parseTLE(12345)).toThrow('must be a string');
    });

    test('should throw TypeError for null input', () => {
      expect(() => parseTLE(null)).toThrow(TypeError);
    });

    test('should throw TypeError for undefined input', () => {
      expect(() => parseTLE(undefined)).toThrow(TypeError);
    });

    test('should throw TLEFormatError for empty string', () => {
      try {
        parseTLE(fixtures.emptyString);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('TLEFormatError');
        expect(error.code).toBe(ERROR_CODES.EMPTY_INPUT);
      }
    });

    test('should throw error for only whitespace', () => {
      expect(() => parseTLE(fixtures.onlyWhitespace)).toThrow();
    });

    test('should throw error for only comments', () => {
      expect(() => parseTLE(fixtures.onlyComments)).toThrow();
    });

    test('should throw error for single line only', () => {
      expect(() => parseTLE(fixtures.singleLineOnly)).toThrow();
    });

    test('should throw error for too many lines', () => {
      expect(() => parseTLE(fixtures.tooManyLines)).toThrow();
    });

    test('should throw TypeError for invalid options type', () => {
      expect(() => parseTLE(fixtures.validISS2Line, 'invalid')).toThrow(TypeError);
      expect(() => parseTLE(fixtures.validISS2Line, 'invalid')).toThrow('Options must be an object');
    });

    test('should throw TypeError for array as options', () => {
      expect(() => parseTLE(fixtures.validISS2Line, [])).toThrow(TypeError);
    });
  });

  describe('parseTLE() - Validation Errors', () => {
    test('should throw TLEValidationError for invalid checksum on line 1', () => {
      try {
        parseTLE(fixtures.invalidChecksum1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('TLEValidationError');
        expect(error.errors).toBeDefined();
        expect(error.errors.some(e =>
          e.code === ERROR_CODES.CHECKSUM_MISMATCH && e.line === 1
        )).toBe(true);
      }
    });

    test('should throw TLEValidationError for invalid checksum on line 2', () => {
      try {
        parseTLE(fixtures.invalidChecksum2);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('TLEValidationError');
        expect(error.errors).toBeDefined();
        expect(error.errors.some(e =>
          e.code === ERROR_CODES.CHECKSUM_MISMATCH && e.line === 2
        )).toBe(true);
      }
    });

    test('should throw error for satellite number mismatch', () => {
      expect(() => parseTLE(fixtures.invalidSatNumberMismatch)).toThrow(TLEValidationError);
    });

    test('should throw error for invalid classification', () => {
      expect(() => parseTLE(fixtures.invalidClassification)).toThrow(TLEValidationError);
    });

    test('should throw error for out of range inclination', () => {
      expect(() => parseTLE(fixtures.invalidInclination)).toThrow(TLEValidationError);
    });

    test('should throw error for out of range epoch day', () => {
      expect(() => parseTLE(fixtures.invalidEpochDay)).toThrow(TLEValidationError);
    });

    test('should throw error for lines that are too short', () => {
      expect(() => parseTLE(fixtures.invalidLineShort)).toThrow(TLEValidationError);
    });

    test('should throw error for wrong line number', () => {
      expect(() => parseTLE(fixtures.invalidLineNumber)).toThrow(TLEValidationError);
    });
  });
});

describe('TLE Parser - Validation Functions', () => {
  describe('validateTLE()', () => {
    test('should validate correct TLE', () => {
      const result = validateTLE(fixtures.validISS2Line);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect checksum errors', () => {
      const result = validateTLE(fixtures.invalidChecksum1);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ERROR_CODES.CHECKSUM_MISMATCH)).toBe(true);
    });

    test('should detect satellite number mismatch', () => {
      const result = validateTLE(fixtures.invalidSatNumberMismatch);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid classification', () => {
      const result = validateTLE(fixtures.invalidClassification);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_CLASSIFICATION)).toBe(true);
    });

    test('should detect out of range values when validateRanges is true', () => {
      const result = validateTLE(fixtures.invalidInclination, { validateRanges: true });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should return warnings for deprecated values', () => {
      const result = validateTLE(fixtures.warningDeprecatedYear);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING)).toBe(true);
    });

    test('should throw TypeError for invalid input type', () => {
      expect(() => validateTLE(null)).toThrow(TypeError);
      expect(() => validateTLE(123)).toThrow(TypeError);
    });

    test('should throw TLEFormatError for empty string', () => {
      expect(() => validateTLE('')).toThrow(TLEFormatError);
    });

    test('should handle mode parameter - strict mode', () => {
      const result = validateTLE(fixtures.invalidChecksum1, { mode: 'strict' });
      expect(result.isValid).toBe(false);
    });

    test('should handle mode parameter - permissive mode', () => {
      const result = validateTLE(fixtures.invalidChecksum1, { mode: 'permissive' });
      // In permissive mode, checksum errors become warnings
      expect(result.warnings.some(w =>
        w.code === ERROR_CODES.CHECKSUM_MISMATCH
      )).toBe(true);
    });

    test('should throw TypeError for invalid mode', () => {
      expect(() => validateTLE(fixtures.validISS2Line, { mode: 'invalid' })).toThrow(TypeError);
    });
  });

  describe('calculateChecksum()', () => {
    test('should calculate correct checksum for line 1', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const checksum = calculateChecksum(line);
      expect(checksum).toBe(6);
    });

    test('should calculate correct checksum for line 2', () => {
      const line = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
      const checksum = calculateChecksum(line);
      expect(checksum).toBe(8);
    });

    test('should handle minus signs in checksum calculation', () => {
      const line = '1 25544U 98067A   20300.83097691 -.00001534  00000-0  35580-4 0  9997';
      const checksum = calculateChecksum(line);
      expect(checksum).toBeGreaterThanOrEqual(0);
      expect(checksum).toBeLessThanOrEqual(9);
    });

    test('should ignore letters in checksum calculation', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const checksum = calculateChecksum(line);
      expect(checksum).toBe(6); // U should be ignored
    });
  });

  describe('validateChecksum()', () => {
    test('should validate correct checksum', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateChecksum(line);
      expect(result.isValid).toBe(true);
      expect(result.expected).toBe(6);
      expect(result.actual).toBe(6);
    });

    test('should detect incorrect checksum', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995';
      const result = validateChecksum(line);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(ERROR_CODES.CHECKSUM_MISMATCH);
    });

    test('should detect invalid line length', () => {
      const line = '1 25544U';
      const result = validateChecksum(line);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.INVALID_LINE_LENGTH);
    });

    test('should detect non-numeric checksum character', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999X';
      const result = validateChecksum(line);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.INVALID_CHECKSUM_CHARACTER);
    });
  });

  describe('validateLineStructure()', () => {
    test('should validate correct line structure', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateLineStructure(line, 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect wrong line number', () => {
      const line = '2 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateLineStructure(line, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_LINE_NUMBER)).toBe(true);
    });

    test('should detect line length error', () => {
      const line = '1 25544U';
      const result = validateLineStructure(line, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_LINE_LENGTH)).toBe(true);
    });

    test('should detect checksum error', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995';
      const result = validateLineStructure(line, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.CHECKSUM_MISMATCH)).toBe(true);
    });

    test('should return structured error with expected/actual values', () => {
      const line = '1 25544U';
      const result = validateLineStructure(line, 1);
      expect(result.errors[0].expected).toBe(69);
      expect(result.errors[0].actual).toBe(8);
    });
  });

  describe('validateSatelliteNumber()', () => {
    test('should validate matching satellite numbers', () => {
      const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const line2 = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
      const result = validateSatelliteNumber(line1, line2);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should detect satellite number mismatch', () => {
      const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const line2 = '2 25545  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
      const result = validateSatelliteNumber(line1, line2);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.SATELLITE_NUMBER_MISMATCH);
    });

    test('should detect invalid satellite number format', () => {
      const line1 = '1 2554AU 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const line2 = '2 2554A  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
      const result = validateSatelliteNumber(line1, line2);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.INVALID_SATELLITE_NUMBER);
    });
  });

  describe('validateClassification()', () => {
    test('should validate U (Unclassified)', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateClassification(line);
      expect(result.isValid).toBe(true);
    });

    test('should validate C (Classified)', () => {
      const line = '1 25544C 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateClassification(line);
      expect(result.isValid).toBe(true);
    });

    test('should validate S (Secret)', () => {
      const line = '1 25544S 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateClassification(line);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid classification', () => {
      const line = '1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const result = validateClassification(line);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.INVALID_CLASSIFICATION);
    });
  });

  describe('validateNumericRange()', () => {
    test('should validate value in range', () => {
      const result = validateNumericRange('50.5', 'Test Field', 0, 100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should detect value below minimum', () => {
      const result = validateNumericRange('-10', 'Test Field', 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.VALUE_OUT_OF_RANGE);
    });

    test('should detect value above maximum', () => {
      const result = validateNumericRange('150', 'Test Field', 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.VALUE_OUT_OF_RANGE);
    });

    test('should detect non-numeric value', () => {
      const result = validateNumericRange('abc', 'Test Field', 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.INVALID_NUMBER_FORMAT);
    });

    test('should validate boundary values', () => {
      expect(validateNumericRange('0', 'Test', 0, 100).isValid).toBe(true);
      expect(validateNumericRange('100', 'Test', 0, 100).isValid).toBe(true);
    });
  });
});

describe('TLE Parser - Warning Functions', () => {
  describe('checkClassificationWarnings()', () => {
    test('should not warn for U (Unclassified)', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const warnings = checkClassificationWarnings(line);
      expect(warnings).toHaveLength(0);
    });

    test('should warn for C (Classified)', () => {
      const line = '1 25544C 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const warnings = checkClassificationWarnings(line);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].code).toBe(ERROR_CODES.CLASSIFIED_DATA_WARNING);
    });

    test('should warn for S (Secret)', () => {
      const line = '1 25544S 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const warnings = checkClassificationWarnings(line);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].code).toBe(ERROR_CODES.CLASSIFIED_DATA_WARNING);
    });
  });

  describe('checkEpochWarnings()', () => {
    test('should warn for deprecated epoch year (1990s)', () => {
      const line = '1 25544U 98067A   99300.83097691  .00001534  00000-0  35580-4 0  9992';
      const warnings = checkEpochWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING)).toBe(true);
    });

    test('should warn for stale TLE data', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const warnings = checkEpochWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.STALE_TLE_WARNING)).toBe(true);
    });

    test('should not warn for recent epoch', () => {
      // Create a TLE with current epoch
      const now = new Date();
      const year = now.getFullYear().toString().substr(-2);
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      const epochStr = year + dayOfYear.toString().padStart(3, '0') + '.00000000';
      const line = `1 25544U 98067A   ${epochStr}  .00001534  00000-0  35580-4 0  9991`;

      const warnings = checkEpochWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.STALE_TLE_WARNING)).toBe(false);
    });
  });

  describe('checkOrbitalParameterWarnings()', () => {
    test('should warn for high eccentricity', () => {
      const line = '2 25544  51.6453  57.0843 3001671  64.9808  73.0513 15.49338189252421';
      const warnings = checkOrbitalParameterWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.HIGH_ECCENTRICITY_WARNING)).toBe(true);
    });

    test('should warn for low mean motion', () => {
      const line = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513  0.49338189252422';
      const warnings = checkOrbitalParameterWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.LOW_MEAN_MOTION_WARNING)).toBe(true);
    });

    test('should warn for revolution number near rollover', () => {
      const line = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189952425';
      const warnings = checkOrbitalParameterWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.REVOLUTION_NUMBER_ROLLOVER_WARNING)).toBe(true);
    });

    test('should not warn for normal orbital parameters', () => {
      const line = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
      const warnings = checkOrbitalParameterWarnings(line);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('checkDragAndEphemerisWarnings()', () => {
    test('should warn for zero drag term', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  00000-0 0  9991';
      const warnings = checkDragAndEphemerisWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.NEAR_ZERO_DRAG_WARNING)).toBe(true);
    });

    test('should warn for negative first derivative', () => {
      const line = '1 25544U 98067A   20300.83097691 -.00001534  00000-0  35580-4 0  9997';
      const warnings = checkDragAndEphemerisWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.NEGATIVE_DECAY_WARNING)).toBe(true);
    });

    test('should warn for non-standard ephemeris type', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 2  9998';
      const warnings = checkDragAndEphemerisWarnings(line);
      expect(warnings.some(w => w.code === ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING)).toBe(true);
    });

    test('should not warn for standard values', () => {
      const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
      const warnings = checkDragAndEphemerisWarnings(line);
      expect(warnings).toHaveLength(0);
    });
  });
});

describe('TLE Parser - Utility Functions', () => {
  describe('normalizeLineEndings()', () => {
    test('should normalize CRLF to LF', () => {
      const input = 'line1\r\nline2\r\nline3';
      const result = normalizeLineEndings(input);
      expect(result).toBe('line1\nline2\nline3');
    });

    test('should normalize CR to LF', () => {
      const input = 'line1\rline2\rline3';
      const result = normalizeLineEndings(input);
      expect(result).toBe('line1\nline2\nline3');
    });

    test('should leave LF unchanged', () => {
      const input = 'line1\nline2\nline3';
      const result = normalizeLineEndings(input);
      expect(result).toBe('line1\nline2\nline3');
    });

    test('should handle mixed line endings', () => {
      const input = 'line1\r\nline2\nline3\rline4';
      const result = normalizeLineEndings(input);
      expect(result).toBe('line1\nline2\nline3\nline4');
    });
  });

  describe('parseTLELines()', () => {
    test('should parse lines and remove empty lines', () => {
      const input = 'line1\n\nline2\n\nline3';
      const result = parseTLELines(input);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('line1');
      expect(result[1]).toBe('line2');
      expect(result[2]).toBe('line3');
    });

    test('should trim whitespace from lines', () => {
      const input = '  line1  \n  line2  ';
      const result = parseTLELines(input);
      expect(result[0]).toBe('line1');
      expect(result[1]).toBe('line2');
    });

    test('should replace tabs with spaces', () => {
      const input = 'line1\tdata\nline2\tdata';
      const result = parseTLELines(input);
      expect(result[0]).toBe('line1 data');
      expect(result[1]).toBe('line2 data');
    });

    test('should handle CRLF line endings', () => {
      const result = parseTLELines(fixtures.lineEndingCRLF);
      expect(result).toHaveLength(2);
    });

    test('should handle CR line endings', () => {
      const result = parseTLELines(fixtures.lineEndingCR);
      expect(result).toHaveLength(2);
    });
  });
});

describe('TLE Parser - Edge Cases', () => {
  test('should handle satellite number at maximum (99999)', () => {
    const result = parseTLE(fixtures.edgeSatelliteNumberMax);
    expect(result.satelliteNumber1).toBe('99999');
  });

  test('should handle satellite number at minimum (00001)', () => {
    const result = parseTLE(fixtures.edgeSatelliteNumberMin);
    expect(result.satelliteNumber1).toBe('00001');
  });

  test('should warn for long satellite name', () => {
    const result = parseTLE(fixtures.edgeLongSatelliteName);
    expect(result.warnings).toBeDefined();
    expect(result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_TOO_LONG)).toBe(true);
  });

  test('should warn for satellite name starting with "1"', () => {
    const result = parseTLE(fixtures.edgeNameStartsWith1);
    expect(result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING)).toBe(true);
  });

  test('should warn for satellite name starting with "2"', () => {
    const result = parseTLE(fixtures.edgeNameStartsWith2);
    expect(result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING)).toBe(true);
  });

  test('should handle whitespace with tabs', () => {
    const result = parseTLE(fixtures.whitespaceWithTabs);
    expect(result).toBeDefined();
    expect(result.satelliteNumber1).toBe('25544');
  });

  test('should handle mixed whitespace', () => {
    const result = parseTLE(fixtures.whitespaceMixedSpaces);
    expect(result).toBeDefined();
    expect(result.satelliteNumber1).toBe('25544');
  });

  test('should handle TLE with multiple warnings', () => {
    const result = parseTLE(fixtures.warningMultiple);
    expect(result.warnings.length).toBeGreaterThanOrEqual(5);
  });
});

describe('TLE Parser - Error Classes', () => {
  test('TLEValidationError should have correct properties', () => {
    const errors = [{ code: 'TEST', message: 'Test error' }];
    const warnings = [{ code: 'WARN', message: 'Test warning' }];
    const error = new TLEValidationError('Test message', errors, warnings);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TLEValidationError');
    expect(error.message).toBe('Test message');
    expect(error.errors).toEqual(errors);
    expect(error.warnings).toEqual(warnings);
  });

  test('TLEFormatError should have correct properties', () => {
    const error = new TLEFormatError('Test message', 'TEST_CODE', { detail: 'test' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TLEFormatError');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'test' });
  });
});

describe('TLE Parser - ERROR_CODES', () => {
  test('ERROR_CODES should be exported', () => {
    expect(ERROR_CODES).toBeDefined();
    expect(typeof ERROR_CODES).toBe('object');
  });

  test('ERROR_CODES should contain expected codes', () => {
    expect(ERROR_CODES.INVALID_INPUT_TYPE).toBeDefined();
    expect(ERROR_CODES.EMPTY_INPUT).toBeDefined();
    expect(ERROR_CODES.INVALID_LINE_COUNT).toBeDefined();
    expect(ERROR_CODES.INVALID_LINE_LENGTH).toBeDefined();
    expect(ERROR_CODES.INVALID_LINE_NUMBER).toBeDefined();
    expect(ERROR_CODES.CHECKSUM_MISMATCH).toBeDefined();
    expect(ERROR_CODES.SATELLITE_NUMBER_MISMATCH).toBeDefined();
    expect(ERROR_CODES.INVALID_CLASSIFICATION).toBeDefined();
    expect(ERROR_CODES.VALUE_OUT_OF_RANGE).toBeDefined();
    expect(ERROR_CODES.CLASSIFIED_DATA_WARNING).toBeDefined();
    expect(ERROR_CODES.STALE_TLE_WARNING).toBeDefined();
    expect(ERROR_CODES.HIGH_ECCENTRICITY_WARNING).toBeDefined();
    expect(ERROR_CODES.LOW_MEAN_MOTION_WARNING).toBeDefined();
    expect(ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING).toBeDefined();
  });
});

describe('TLE Parser - Integration Tests', () => {
  test('should parse real ISS TLE end-to-end', () => {
    const result = parseTLE(fixtures.validISS3Line);

    expect(result.satelliteName).toBe('ISS (ZARYA)');
    expect(result.satelliteNumber1).toBe('25544');
    expect(result.satelliteNumber2).toBe('25544');
    expect(result.classification).toBe('U');
    expect(result.internationalDesignatorYear).toBe('98');
    expect(result.internationalDesignatorLaunchNumber).toBe('067');
    expect(result.internationalDesignatorPiece).toBe('A');
    expect(result.inclination).toBe('51.6453');
    expect(result.checksum1).toBe('6');
    expect(result.checksum2).toBe('8');
  });

  test('should validate and parse in one workflow', () => {
    const validation = validateTLE(fixtures.validHubble);
    expect(validation.isValid).toBe(true);

    const parsed = parseTLE(fixtures.validHubble);
    expect(parsed.satelliteName).toBe('HST');
    expect(parsed.satelliteNumber1).toBe('20580');
  });

  test('should handle all warning types in comprehensive TLE', () => {
    const result = parseTLE(fixtures.warningMultiple);

    const warningCodes = result.warnings.map(w => w.code);
    expect(warningCodes).toContain(ERROR_CODES.CLASSIFIED_DATA_WARNING);
    expect(warningCodes).toContain(ERROR_CODES.DEPRECATED_EPOCH_YEAR_WARNING);
    expect(warningCodes).toContain(ERROR_CODES.NEGATIVE_DECAY_WARNING);
    expect(warningCodes).toContain(ERROR_CODES.NEAR_ZERO_DRAG_WARNING);
    expect(warningCodes).toContain(ERROR_CODES.NON_STANDARD_EPHEMERIS_WARNING);
  });
});
