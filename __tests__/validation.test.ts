/**
 * Comprehensive tests for validation and normalization features
 */

import {
  // Epoch validation
  convertEpochToDate,
  validateEpochDate,
  calculateEpochAge,
  validateEpochAge,

  // Orbital parameter validation
  validateOrbitalParameter,
  validateAllOrbitalParameters,
  ORBITAL_PARAMETER_RANGES,

  // Checksum validation
  calculateChecksum,
  validateChecksum,

  // Scientific notation
  normalizeAssumedDecimalNotation,
  normalizeScientificNotation,

  // Satellite number validation
  validateSatelliteNumber,
  SATELLITE_NUMBER_RANGES,

  // International designator
  validateInternationalDesignator,

  // Anomaly detection
  detectAnomalies,

  // Quality scoring
  calculateQualityScore,

  // Field sanitization
  sanitizeField,
  sanitizeAllFields,

  // Validation rules
  ValidationRuleManager,
  createValidationRule,
  DEFAULT_VALIDATION_RULES,

  // Report generation
  generateValidationReport,

  // Types
  type ParsedTLE
} from '../src';

describe('Epoch Date Validation and Conversion', () => {
  describe('convertEpochToDate', () => {
    test('should convert 2-digit year 57-99 to 1957-1999', () => {
      const epoch = convertEpochToDate(57, 1.0);
      expect(epoch.year).toBe(1957);
      expect(epoch.twoDigitYear).toBe(57);
    });

    test('should convert 2-digit year 00-56 to 2000-2056', () => {
      const epoch = convertEpochToDate(24, 1.0);
      expect(epoch.year).toBe(2024);
      expect(epoch.twoDigitYear).toBe(24);
    });

    test('should correctly calculate day of year with fractional part', () => {
      const epoch = convertEpochToDate(24, 100.5);
      expect(epoch.dayOfYear).toBe(100.5);
      // April 9th, 2024 at noon
      expect(epoch.date.getUTCMonth()).toBe(3); // April (0-indexed)
      expect(epoch.date.getUTCDate()).toBe(9);
    });

    test('should include ISO date string', () => {
      const epoch = convertEpochToDate(24, 1.0);
      expect(epoch.isoDate).toMatch(/^2024-01-01/);
    });

    test('should calculate Julian Date', () => {
      const epoch = convertEpochToDate(24, 1.0);
      expect(epoch.julianDate).toBeGreaterThan(2400000);
      expect(epoch.julianDate).toBeLessThan(2500000);
    });

    test('should calculate Modified Julian Date', () => {
      const epoch = convertEpochToDate(24, 1.0);
      expect(epoch.modifiedJulianDate).toBe(epoch.julianDate - 2400000.5);
    });

    test('should handle leap year correctly', () => {
      const epoch = convertEpochToDate(24, 366.0); // 2024 is a leap year
      expect(epoch.date.getUTCMonth()).toBe(11); // December
      expect(epoch.date.getUTCDate()).toBe(31);
    });
  });

  describe('validateEpochDate', () => {
    test('should accept valid epoch dates', () => {
      const result = validateEpochDate(24, 100.5);
      expect(result.valid).toBe(true);
    });

    test('should reject year below minimum (1957)', () => {
      const result = validateEpochDate(56, 1.0);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('year');
    });

    test('should reject day of year < 1', () => {
      const result = validateEpochDate(24, 0.5);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('day');
    });

    test('should reject day of year > 366', () => {
      const result = validateEpochDate(24, 367.0);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('day');
    });

    test('should reject day 366 for non-leap years', () => {
      const result = validateEpochDate(23, 366.0); // 2023 is not a leap year
      expect(result.valid).toBe(false);
      expect(result.message).toContain('366');
    });

    test('should accept day 366 for leap years', () => {
      const result = validateEpochDate(24, 366.0); // 2024 is a leap year
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateEpochAge', () => {
    test('should calculate positive age for past epochs', () => {
      const referenceDate = new Date('2024-06-15T00:00:00Z');
      const age = calculateEpochAge(24, 1.0, referenceDate); // Jan 1, 2024
      expect(age).toBeGreaterThan(150); // Roughly 165 days
      expect(age).toBeLessThan(180);
    });

    test('should calculate negative age for future epochs', () => {
      const referenceDate = new Date('2024-01-01T00:00:00Z');
      const age = calculateEpochAge(24, 180.0, referenceDate); // June 28, 2024
      expect(age).toBeLessThan(0);
      expect(age).toBeGreaterThan(-180);
    });

    test('should calculate near-zero age for current epochs', () => {
      const now = new Date();
      const year = now.getFullYear() % 100;
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      const age = calculateEpochAge(year, dayOfYear, now);
      expect(Math.abs(age)).toBeLessThan(1);
    });
  });

  describe('validateEpochAge', () => {
    test('should pass for recent epochs', () => {
      const referenceDate = new Date('2024-06-15T00:00:00Z');
      const result = validateEpochAge(24, 160.0, { referenceDate }); // ~5 days old
      expect(result.valid).toBe(true);
    });

    test('should warn for stale epochs', () => {
      const referenceDate = new Date('2024-06-15T00:00:00Z');
      const result = validateEpochAge(24, 1.0, { referenceDate, maxAge: 30 }); // ~165 days old
      expect(result.valid).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('days old');
    });

    test('should reject future epochs when not allowed', () => {
      const referenceDate = new Date('2024-01-01T00:00:00Z');
      const result = validateEpochAge(24, 180.0, { referenceDate, allowFuture: false });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('future');
    });

    test('should allow future epochs when configured', () => {
      const referenceDate = new Date('2024-01-01T00:00:00Z');
      const result = validateEpochAge(24, 180.0, { referenceDate, allowFuture: true });
      expect(result.valid).toBe(true);
    });
  });
});

describe('Orbital Parameter Validation', () => {
  describe('validateOrbitalParameter', () => {
    test('should accept mean motion in valid range', () => {
      const result = validateOrbitalParameter('meanMotion', 15.5);
      expect(result.valid).toBe(true);
    });

    test('should reject mean motion below minimum', () => {
      const result = validateOrbitalParameter('meanMotion', -1.0);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('outside valid range');
    });

    test('should reject mean motion above maximum', () => {
      const result = validateOrbitalParameter('meanMotion', 25.0);
      expect(result.valid).toBe(false);
    });

    test('should warn when outside typical range', () => {
      const result = validateOrbitalParameter('meanMotion', 19.0, true);
      expect(result.valid).toBe(true);
      expect(result.message).toContain('outside typical range');
    });

    test('should validate eccentricity range (0-1)', () => {
      expect(validateOrbitalParameter('eccentricity', 0.0).valid).toBe(true);
      expect(validateOrbitalParameter('eccentricity', 0.5).valid).toBe(true);
      expect(validateOrbitalParameter('eccentricity', 0.999).valid).toBe(true);
      expect(validateOrbitalParameter('eccentricity', 1.5).valid).toBe(false);
      expect(validateOrbitalParameter('eccentricity', -0.1).valid).toBe(false);
    });

    test('should validate inclination range (0-180)', () => {
      expect(validateOrbitalParameter('inclination', 0.0).valid).toBe(true);
      expect(validateOrbitalParameter('inclination', 90.0).valid).toBe(true);
      expect(validateOrbitalParameter('inclination', 180.0).valid).toBe(true);
      expect(validateOrbitalParameter('inclination', 200.0).valid).toBe(false);
    });

    test('should validate angle parameters (0-360)', () => {
      expect(validateOrbitalParameter('rightAscension', 180.0).valid).toBe(true);
      expect(validateOrbitalParameter('argumentOfPerigee', 270.0).valid).toBe(true);
      expect(validateOrbitalParameter('meanAnomaly', 359.9).valid).toBe(true);
      expect(validateOrbitalParameter('meanAnomaly', 361.0).valid).toBe(false);
    });
  });

  describe('ORBITAL_PARAMETER_RANGES', () => {
    test('should have all expected parameter ranges', () => {
      expect(ORBITAL_PARAMETER_RANGES.meanMotion).toBeDefined();
      expect(ORBITAL_PARAMETER_RANGES.eccentricity).toBeDefined();
      expect(ORBITAL_PARAMETER_RANGES.inclination).toBeDefined();
      expect(ORBITAL_PARAMETER_RANGES.bStar).toBeDefined();
    });

    test('should have min/max for all parameters', () => {
      for (const [name, range] of Object.entries(ORBITAL_PARAMETER_RANGES)) {
        expect(range.min).toBeDefined();
        expect(range.max).toBeDefined();
        expect(range.min).toBeLessThan(range.max);
      }
    });
  });
});

describe('Checksum Validation', () => {
  const validLine1 = '1 25544U 98067A   24001.50000000  .00002182  00000-0  41420-4 0  9990';
  const validLine2 = '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456';

  describe('calculateChecksum', () => {
    test('should calculate correct checksum for ISS line 1', () => {
      const checksum = calculateChecksum(validLine1);
      expect(checksum).toBe(0);
    });

    test('should calculate correct checksum for ISS line 2', () => {
      const checksum = calculateChecksum(validLine2);
      expect(checksum).toBe(6);
    });

    test('should count digits', () => {
      const line = '1 25544U 98067A   24001.50000000  .00002182  00000-0  41420-4 0  999';
      const checksum = calculateChecksum(line);
      // Count digits and minus signs
      expect(typeof checksum).toBe('number');
      expect(checksum).toBeGreaterThanOrEqual(0);
      expect(checksum).toBeLessThanOrEqual(9);
    });

    test('should count minus signs as 1', () => {
      const line = '1 00000U 00000A   00000.00000000  .00000000  00000-0  00000-0 0  000';
      // Two minus signs at positions 33 and 50
      const checksum = calculateChecksum(line);
      expect(checksum).toBe(2);
    });

    test('should ignore letters, spaces, and plus signs', () => {
      const line = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ                              +++++++';
      const checksum = calculateChecksum(line);
      expect(checksum).toBe(0);
    });
  });

  describe('validateChecksum', () => {
    test('should validate correct checksums', () => {
      const result1 = validateChecksum(validLine1, 1);
      expect(result1.valid).toBe(true);

      const result2 = validateChecksum(validLine2, 2);
      expect(result2.valid).toBe(true);
    });

    test('should detect incorrect checksums', () => {
      const badLine = validLine1.slice(0, -1) + '5'; // Change last digit
      const result = validateChecksum(badLine, 1);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('checksum mismatch');
    });

    test('should reject lines that are too short', () => {
      const result = validateChecksum('1 25544U', 1);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too short');
    });

    test('should reject non-digit checksums', () => {
      const badLine = validLine1.slice(0, -1) + 'X';
      const result = validateChecksum(badLine, 1);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not a digit');
    });
  });
});

describe('Scientific Notation Normalization', () => {
  describe('normalizeAssumedDecimalNotation', () => {
    test('should parse positive mantissa with negative exponent', () => {
      const result = normalizeAssumedDecimalNotation(' 12345-3');
      expect(result).toBeCloseTo(0.00012345, 8);
    });

    test('should parse negative mantissa with negative exponent', () => {
      const result = normalizeAssumedDecimalNotation('-12345-3');
      expect(result).toBeCloseTo(-0.00012345, 8);
    });

    test('should parse positive mantissa with positive exponent', () => {
      const result = normalizeAssumedDecimalNotation(' 12345+2');
      expect(result).toBeCloseTo(12.345, 8);
    });

    test('should parse TLE B* drag term format', () => {
      // Example: " 41420-4" = 0.41420e-4 = 0.000041420
      const result = normalizeAssumedDecimalNotation(' 41420-4');
      expect(result).toBeCloseTo(0.000041420, 10);
    });

    test('should handle values without exponent', () => {
      const result = normalizeAssumedDecimalNotation('12345');
      expect(result).toBeCloseTo(0.12345, 8);
    });

    test('should handle zero values', () => {
      const result = normalizeAssumedDecimalNotation(' 00000-0');
      expect(result).toBe(0);
    });
  });

  describe('normalizeScientificNotation', () => {
    test('should normalize assumed decimal notation', () => {
      const result = normalizeScientificNotation(' 12345-3', 'assumedDecimal');
      expect(result).toBeCloseTo(0.00012345, 8);
    });

    test('should parse standard notation', () => {
      const result = normalizeScientificNotation('3.14159', 'standard');
      expect(result).toBeCloseTo(3.14159, 8);
    });

    test('should parse integer notation', () => {
      const result = normalizeScientificNotation('12345', 'integer');
      expect(result).toBe(12345);
    });
  });
});

describe('Satellite Number Validation', () => {
  describe('validateSatelliteNumber', () => {
    test('should accept valid 5-digit satellite numbers', () => {
      const result = validateSatelliteNumber(25544); // ISS
      expect(result.valid).toBe(true);
      expect(result.context.format).toBe('5-digit');
    });

    test('should accept valid 6-digit satellite numbers', () => {
      const result = validateSatelliteNumber(100000);
      expect(result.valid).toBe(true);
      expect(result.context.format).toBe('6-digit');
    });

    test('should accept satellite number as string', () => {
      const result = validateSatelliteNumber('25544');
      expect(result.valid).toBe(true);
    });

    test('should reject satellite number below minimum', () => {
      const result = validateSatelliteNumber(0);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('outside valid range');
    });

    test('should reject satellite number above maximum', () => {
      const result = validateSatelliteNumber(1000000);
      expect(result.valid).toBe(false);
    });

    test('should reject non-numeric values', () => {
      const result = validateSatelliteNumber('ABC');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not a valid integer');
    });

    test('should accept boundary values', () => {
      expect(validateSatelliteNumber(SATELLITE_NUMBER_RANGES.min).valid).toBe(true);
      expect(validateSatelliteNumber(SATELLITE_NUMBER_RANGES.max).valid).toBe(true);
    });
  });
});

describe('International Designator Validation', () => {
  describe('validateInternationalDesignator', () => {
    test('should accept valid designators', () => {
      const result = validateInternationalDesignator('98067A'); // ISS
      expect(result.valid).toBe(true);
      expect(result.context.year).toBe(98);
      expect(result.context.launchNumber).toBe(67);
      expect(result.context.piece).toBe('A');
    });

    test('should accept designators with 3-digit launch numbers', () => {
      const result = validateInternationalDesignator('21125A');
      expect(result.valid).toBe(true);
      expect(result.context.launchNumber).toBe(125);
    });

    test('should accept multi-letter piece designators', () => {
      const result = validateInternationalDesignator('98067AB');
      expect(result.valid).toBe(true);
      expect(result.context.piece).toBe('AB');
    });

    test('should reject invalid format', () => {
      const result = validateInternationalDesignator('INVALID');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid international designator format');
    });

    test('should reject year out of range', () => {
      const result = validateInternationalDesignator('50001A'); // Year 1950, before Sputnik
      expect(result.valid).toBe(false);
      expect(result.message).toContain('year');
    });

    test('should reject launch number out of range', () => {
      const result = validateInternationalDesignator('241000A'); // Launch 1000
      expect(result.valid).toBe(false);
      expect(result.message).toContain('launch number');
    });

    test('should reject lowercase piece designators', () => {
      const result = validateInternationalDesignator('98067a');
      expect(result.valid).toBe(false);
    });

    test('should convert 2-digit year correctly', () => {
      const result1 = validateInternationalDesignator('57001A');
      expect(result1.context.fullYear).toBe(1957);

      const result2 = validateInternationalDesignator('24001A');
      expect(result2.context.fullYear).toBe(2024);
    });
  });
});

describe('Anomaly Detection', () => {
  const normalTLE = {
    eccentricity: '0001234',
    meanMotion: '15.50000000',
    inclination: '51.6400',
    bStar: ' 41420-4',
    meanMotionFirstDerivative: '0.00000000',
    revolutionNumber: '12345'
  };

  describe('detectAnomalies', () => {
    test('should detect no anomalies for normal orbital parameters', () => {
      const anomalies = detectAnomalies(normalTLE);
      const highSeverity = anomalies.filter(a => a.severity === 'error' || a.severity === 'warning');
      expect(highSeverity.length).toBe(0);
    });

    test('should detect high eccentricity', () => {
      const tle = { ...normalTLE, eccentricity: '0750000' }; // 0.75
      const anomalies = detectAnomalies(tle);
      const highEcc = anomalies.find(a => a.type === 'HIGH_ECCENTRICITY');
      expect(highEcc).toBeDefined();
      expect(highEcc.severity).toBe('warning');
    });

    test('should detect very high eccentricity as error', () => {
      const tle = { ...normalTLE, eccentricity: '0950000' }; // 0.95
      const anomalies = detectAnomalies(tle);
      const highEcc = anomalies.find(a => a.type === 'HIGH_ECCENTRICITY');
      expect(highEcc.severity).toBe('error');
    });

    test('should detect low mean motion (high orbit)', () => {
      const tle = { ...normalTLE, meanMotion: '0.50000000' };
      const anomalies = detectAnomalies(tle);
      const lowMM = anomalies.find(a => a.type === 'LOW_MEAN_MOTION');
      expect(lowMM).toBeDefined();
    });

    test('should detect high mean motion (low orbit)', () => {
      const tle = { ...normalTLE, meanMotion: '19.00000000' };
      const anomalies = detectAnomalies(tle);
      const highMM = anomalies.find(a => a.type === 'HIGH_MEAN_MOTION');
      expect(highMM).toBeDefined();
    });

    test('should detect retrograde orbit', () => {
      const tle = { ...normalTLE, inclination: '120.0000' };
      const anomalies = detectAnomalies(tle);
      const retro = anomalies.find(a => a.type === 'RETROGRADE_ORBIT');
      expect(retro).toBeDefined();
      expect(retro.severity).toBe('info');
    });

    test('should detect high drag coefficient', () => {
      const tle = { ...normalTLE, bStar: ' 50000-2' }; // 0.05
      const anomalies = detectAnomalies(tle);
      const highDrag = anomalies.find(a => a.type === 'HIGH_DRAG');
      expect(highDrag).toBeDefined();
    });

    test('should detect rapid orbital change', () => {
      const tle = { ...normalTLE, meanMotionFirstDerivative: '0.02000000' };
      const anomalies = detectAnomalies(tle);
      const rapid = anomalies.find(a => a.type === 'RAPID_ORBITAL_CHANGE');
      expect(rapid).toBeDefined();
    });

    test('should detect new satellites', () => {
      const tle = { ...normalTLE, revolutionNumber: '50' };
      const anomalies = detectAnomalies(tle);
      const newSat = anomalies.find(a => a.type === 'NEW_SATELLITE');
      expect(newSat).toBeDefined();
      expect(newSat.severity).toBe('info');
    });

    test('should detect circular orbit', () => {
      const tle = { ...normalTLE, eccentricity: '0000000' };
      const anomalies = detectAnomalies(tle);
      const circular = anomalies.find(a => a.type === 'CIRCULAR_ORBIT');
      expect(circular).toBeDefined();
    });
  });
});

describe('Data Quality Scoring', () => {
  describe('calculateQualityScore', () => {
    const mockTLE = {
      satelliteNumber1: '25544',
      satelliteNumber2: '25544',
      classification: 'U',
      internationalDesignatorYear: '98',
      internationalDesignatorLaunchNumber: '067',
      internationalDesignatorPiece: 'A'
    };

    test('should give high score for perfect TLE', () => {
      const score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 1, // 1 day old
        anomalies: []
      });

      expect(score.overall).toBeGreaterThan(80);
      expect(score.grade).toMatch(/A|B/);
    });

    test('should penalize checksum errors', () => {
      const score = calculateQualityScore(mockTLE, {
        checksumValid: false,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 1,
        anomalies: []
      });

      expect(score.components.checksumScore).toBe(0);
      expect(score.overall).toBeLessThan(90);
    });

    test('should penalize stale epochs', () => {
      const score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 100, // 100 days old
        anomalies: []
      });

      expect(score.components.epochScore).toBeLessThan(15);
    });

    test('should penalize anomalies', () => {
      const score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 1,
        anomalies: [
          { hasAnomaly: true, severity: 'error', score: 0.8 }
        ]
      });

      expect(score.components.anomalyScore).toBeLessThan(10);
    });

    test('should assign correct grades', () => {
      const grades = [];

      // Perfect score
      let score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 0.5,
        anomalies: []
      });
      grades.push(score.grade);

      // Good score with minor issues
      score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 10,
        anomalies: [{ hasAnomaly: true, severity: 'info', score: 0.1 }]
      });
      grades.push(score.grade);

      expect(grades).toContain('A');
      expect(grades.some(g => ['A', 'B', 'C'].includes(g))).toBe(true);
    });

    test('should include assessment text', () => {
      const score = calculateQualityScore(mockTLE, {
        checksumValid: true,
        formatValid: true,
        rangeErrors: [],
        rangeResults: [],
        epochAge: 1,
        anomalies: []
      });

      expect(score.assessment).toBeDefined();
      expect(typeof score.assessment).toBe('string');
      expect(score.assessment.length).toBeGreaterThan(0);
    });
  });
});

describe('Field Sanitization', () => {
  describe('sanitizeField', () => {
    test('should remove null bytes', () => {
      const result = sanitizeField('test\0value', 'satelliteName');
      expect(result.value).toBe('testvalue');
      expect(result.modified).toBe(true);
      expect(result.modifications).toContain('Removed null bytes');
    });

    test('should normalize tabs to spaces', () => {
      const result = sanitizeField('test\tvalue', 'satelliteName');
      expect(result.value).toBe('test value');
      expect(result.modified).toBe(true);
      expect(result.modifications).toContain('Normalized tabs to spaces');
    });

    test('should remove non-printable characters', () => {
      const result = sanitizeField('test\x01\x02value', 'satelliteName');
      expect(result.value).toBe('testvalue');
      expect(result.modified).toBe(true);
    });

    test('should sanitize satellite names', () => {
      const result = sanitizeField('ISS@#$(ZARYA)', 'satelliteName');
      expect(result.value).toBe('ISS(ZARYA)');
      expect(result.modified).toBe(true);
    });

    test('should normalize classification to single uppercase letter', () => {
      const result = sanitizeField('unclassified', 'classification');
      expect(result.value).toBe('U');
      expect(result.modified).toBe(true);
    });

    test('should remove non-digits from numeric fields', () => {
      const result = sanitizeField('25544A', 'satelliteNumber1');
      expect(result.value).toBe('25544');
      expect(result.modified).toBe(true);
    });

    test('should normalize international designator piece', () => {
      const result = sanitizeField('a1', 'internationalDesignatorPiece');
      expect(result.value).toBe('A');
      expect(result.modified).toBe(true);
    });

    test('should trim whitespace', () => {
      const result = sanitizeField('  test  ', 'satelliteName');
      expect(result.value).toBe('test');
      expect(result.modified).toBe(true);
    });

    test('should not modify already clean fields', () => {
      const result = sanitizeField('ISS', 'satelliteName');
      expect(result.modified).toBe(false);
      expect(result.modifications).toBeUndefined();
    });
  });

  describe('sanitizeAllFields', () => {
    test('should sanitize all string fields in TLE', () => {
      const tle = {
        satelliteName: '  ISS  ',
        classification: 'u',
        satelliteNumber1: '25544',
        satelliteNumber2: '25544'
      };

      const results = sanitizeAllFields(tle);
      expect(results.size).toBeGreaterThan(0);
    });

    test('should only return modified fields', () => {
      const tle = {
        satelliteName: 'ISS',
        classification: 'U'
      };

      const results = sanitizeAllFields(tle);
      expect(results.size).toBe(0); // No modifications needed
    });
  });
});

describe('Validation Rule Customization', () => {
  describe('createValidationRule', () => {
    test('should create a custom validation rule', () => {
      const rule = createValidationRule(
        'testRule',
        'Test rule description',
        (value) => ({ valid: value > 0 })
      );

      expect(rule.name).toBe('testRule');
      expect(rule.description).toBe('Test rule description');
      expect(rule.enabled).toBe(true);
      expect(rule.severity).toBe('warning');
    });

    test('should allow custom severity', () => {
      const rule = createValidationRule(
        'testRule',
        'Test rule',
        (value) => ({ valid: true }),
        { severity: 'error' }
      );

      expect(rule.severity).toBe('error');
    });

    test('should allow disabling by default', () => {
      const rule = createValidationRule(
        'testRule',
        'Test rule',
        (value) => ({ valid: true }),
        { enabled: false }
      );

      expect(rule.enabled).toBe(false);
    });
  });

  describe('ValidationRuleManager', () => {
    test('should initialize with default rules', () => {
      const manager = new ValidationRuleManager();
      const rules = manager.getAllRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    test('should add custom rule', () => {
      const manager = new ValidationRuleManager([]);
      const rule = createValidationRule('custom', 'Custom rule', () => ({ valid: true }));

      manager.addRule(rule);
      expect(manager.getRule('custom')).toBeDefined();
    });

    test('should remove rule', () => {
      const manager = new ValidationRuleManager([]);
      const rule = createValidationRule('custom', 'Custom rule', () => ({ valid: true }));

      manager.addRule(rule);
      const removed = manager.removeRule('custom');

      expect(removed).toBe(true);
      expect(manager.getRule('custom')).toBeUndefined();
    });

    test('should enable rule', () => {
      const manager = new ValidationRuleManager();
      manager.enableRule('anomalyDetection');

      const rule = manager.getRule('anomalyDetection');
      expect(rule.enabled).toBe(true);
    });

    test('should disable rule', () => {
      const manager = new ValidationRuleManager();
      manager.disableRule('checksum');

      const rule = manager.getRule('checksum');
      expect(rule.enabled).toBe(false);
    });

    test('should get only enabled rules', () => {
      const manager = new ValidationRuleManager();
      manager.disableRule('anomalyDetection');

      const enabled = manager.getEnabledRules();
      expect(enabled.every(r => r.enabled)).toBe(true);
      expect(enabled.some(r => r.name === 'anomalyDetection')).toBe(false);
    });
  });

  describe('DEFAULT_VALIDATION_RULES', () => {
    test('should have standard validation rules', () => {
      expect(DEFAULT_VALIDATION_RULES).toBeDefined();
      expect(Array.isArray(DEFAULT_VALIDATION_RULES)).toBe(true);
      expect(DEFAULT_VALIDATION_RULES.length).toBeGreaterThan(0);
    });

    test('should include checksum rule', () => {
      const checksumRule = DEFAULT_VALIDATION_RULES.find(r => r.name === 'checksum');
      expect(checksumRule).toBeDefined();
      expect(checksumRule.severity).toBe('error');
    });

    test('should include epoch validation rules', () => {
      const epochRule = DEFAULT_VALIDATION_RULES.find(r => r.name === 'epochDate');
      expect(epochRule).toBeDefined();
    });
  });
});

describe('Validation Report Generation', () => {
  const validTLE = {
    satelliteName: 'ISS (ZARYA)',
    satelliteNumber1: '25544',
    satelliteNumber2: '25544',
    classification: 'U',
    internationalDesignatorYear: '98',
    internationalDesignatorLaunchNumber: '067',
    internationalDesignatorPiece: 'A',
    epochYear: '24',
    epochDay: '100.50000000',
    meanMotionFirstDerivative: '0.00000000',
    meanMotionSecondDerivative: '00000-0',
    bStar: ' 41420-4',
    ephemerisType: '0',
    elementSetNumber: '999',
    meanMotion: '15.54225995',
    eccentricity: '0006317',
    inclination: '51.6400',
    rightAscension: '208.9163',
    argumentOfPerigee: '69.9862',
    meanAnomaly: '25.2906',
    revolutionNumber: '12345'
  };

  const validLines = {
    line1: '1 25544U 98067A   24100.50000000  .00000000  00000-0  41420-4 0  9990',
    line2: '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456'
  };

  describe('generateValidationReport', () => {
    test('should generate report for valid TLE', () => {
      const report = generateValidationReport(validTLE, validLines);

      expect(report).toBeDefined();
      expect(report.isValid).toBeDefined();
      expect(report.qualityScore).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.warnings).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
    });

    test('should include summary statistics', () => {
      const report = generateValidationReport(validTLE, validLines);

      expect(report.summary).toBeDefined();
      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(report.summary.passedChecks).toBeGreaterThanOrEqual(0);
      expect(report.summary.failedChecks).toBeGreaterThanOrEqual(0);
      expect(report.summary.warningCount).toBe(report.warnings.length);
      expect(report.summary.errorCount).toBe(report.errors.length);
    });

    test('should list applied rules', () => {
      const report = generateValidationReport(validTLE, validLines);

      expect(report.rulesApplied).toBeDefined();
      expect(Array.isArray(report.rulesApplied)).toBe(true);
      expect(report.rulesApplied.length).toBeGreaterThan(0);
    });

    test('should detect checksum errors', () => {
      const badLines = {
        line1: validLines.line1.slice(0, -1) + '5', // Wrong checksum
        line2: validLines.line2
      };

      const report = generateValidationReport(validTLE, badLines, {
        validateChecksums: true
      });

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.code === 'CHECKSUM_MISMATCH')).toBe(true);
    });

    test('should respect validation options', () => {
      const report = generateValidationReport(validTLE, validLines, {
        validateChecksums: false,
        validateEpoch: false,
        validateRanges: false
      });

      expect(report.rulesApplied).not.toContain('checksum');
      expect(report.rulesApplied).not.toContain('epochDate');
      expect(report.rulesApplied).not.toContain('orbitalParameterRanges');
    });

    test('should include anomalies when requested', () => {
      const report = generateValidationReport(validTLE, validLines, {
        detectAnomalies: true
      });

      expect(report.anomalies).toBeDefined();
      expect(Array.isArray(report.anomalies)).toBe(true);
    });

    test('should include quality score by default', () => {
      const report = generateValidationReport(validTLE, validLines);

      expect(report.qualityScore).toBeDefined();
      expect(report.qualityScore.overall).toBeDefined();
      expect(report.qualityScore.grade).toMatch(/[A-F]/);
      expect(report.qualityScore.assessment).toBeDefined();
    });

    test('should include sanitized fields when requested', () => {
      const tleWithIssues = {
        ...validTLE,
        satelliteName: '  ISS  ',
        classification: 'u'
      };

      const report = generateValidationReport(tleWithIssues, validLines, {
        sanitizeFields: true
      });

      expect(report.sanitizedFields).toBeDefined();
      expect(Array.isArray(report.sanitizedFields)).toBe(true);
    });

    test('should validate satellite number consistency', () => {
      const inconsistentTLE = {
        ...validTLE,
        satelliteNumber2: '99999' // Different from line 1
      };

      const report = generateValidationReport(inconsistentTLE, validLines);

      const mismatchWarning = report.warnings.find(
        w => w.code === 'SATELLITE_NUMBER_MISMATCH'
      );
      expect(mismatchWarning).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete validation workflow', () => {
    const tle = {
      satelliteName: 'ISS (ZARYA)',
      satelliteNumber1: '25544',
      satelliteNumber2: '25544',
      classification: 'U',
      internationalDesignatorYear: '98',
      internationalDesignatorLaunchNumber: '067',
      internationalDesignatorPiece: 'A',
      epochYear: '24',
      epochDay: '100.50000000',
      meanMotionFirstDerivative: '0.00000000',
      meanMotionSecondDerivative: '00000-0',
      bStar: ' 41420-4',
      ephemerisType: '0',
      elementSetNumber: '999',
      meanMotion: '15.54225995',
      eccentricity: '0006317',
      inclination: '51.6400',
      rightAscension: '208.9163',
      argumentOfPerigee: '69.9862',
      meanAnomaly: '25.2906',
      revolutionNumber: '12345'
    };

    const lines = {
      line1: '1 25544U 98067A   24100.50000000  .00000000  00000-0  41420-4 0  9990',
      line2: '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456'
    };

    // Generate comprehensive validation report
    const report = generateValidationReport(tle, lines, {
      validateChecksums: true,
      validateEpoch: true,
      validateRanges: true,
      detectAnomalies: true,
      calculateQuality: true,
      sanitizeFields: true,
      strict: false
    });

    // Verify report structure
    expect(report.isValid).toBeDefined();
    expect(report.qualityScore).toBeDefined();
    expect(report.errors).toBeDefined();
    expect(report.warnings).toBeDefined();
    expect(report.anomalies).toBeDefined();
    expect(report.summary).toBeDefined();

    // Verify quality assessment
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.qualityScore.grade);
    expect(report.qualityScore.overall).toBeGreaterThanOrEqual(0);
    expect(report.qualityScore.overall).toBeLessThanOrEqual(100);
  });
});
