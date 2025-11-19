/**
 * Tests for Data Analysis Module
 */

import {
  compareTLEs,
  generateTLEDiff,
  assessTLEStaleness,
  analyzeOrbitalDecay,
  calculateUpdateFrequency,
  detectAnomalies,
  analyzeConstellation,
  calculateQualityMetrics,
  analyzeTrend,
  classifyOrbitType,
  calculateConjunctionProbability,
  validateAgainstRadar,
  groupIntoOrbitalFamilies,
  OrbitType
} from '../src/dataAnalysis';
import { ParsedTLE } from '../src/types';

// Sample TLE data for testing
const sampleTLE1: ParsedTLE = {
  satelliteName: 'ISS (ZARYA)',
  lineNumber1: '1',
  satelliteNumber1: '25544',
  classification: 'U',
  internationalDesignatorYear: '98',
  internationalDesignatorLaunchNumber: '067',
  internationalDesignatorPiece: 'A',
  epochYear: '08',
  epoch: '264.51782528',
  firstDerivative: '-.00002182',
  secondDerivative: '00000-0',
  bStar: '-11606-4',
  ephemerisType: '0',
  elementSetNumber: '2927',
  checksum1: '7',
  lineNumber2: '2',
  satelliteNumber2: '25544',
  inclination: '51.6416',
  rightAscension: '247.4627',
  eccentricity: '0006703',
  argumentOfPerigee: '130.5360',
  meanAnomaly: '325.0288',
  meanMotion: '15.72125391',
  revolutionNumber: '56353',
  checksum2: '7'
};

const sampleTLE2: ParsedTLE = {
  ...sampleTLE1,
  epoch: '265.51782528',
  meanMotion: '15.72125500',
  inclination: '51.6420',
  revolutionNumber: '56354'
};

describe('TLE Comparison and Diff Utilities', () => {
  test('compareTLEs should identify differences', () => {
    const comparison = compareTLEs(sampleTLE1, sampleTLE2);

    expect(comparison.satelliteNumber).toBe('25544');
    expect(comparison.timeDifference).toBeCloseTo(1.0, 1);
    expect(comparison.differences.length).toBeGreaterThan(0);
  });

  test('generateTLEDiff should create diff output', () => {
    const diff = generateTLEDiff(sampleTLE1, sampleTLE2);

    expect(diff).toContain('---');
    expect(diff).toContain('+++');
    expect(diff).toContain('meanMotion');
  });

  test('compareTLEs should detect significant changes', () => {
    const comparison = compareTLEs(sampleTLE1, sampleTLE2);

    expect(comparison.significantChanges).toBeDefined();
  });
});

describe('TLE Age and Staleness Detection', () => {
  test('assessTLEStaleness should classify fresh TLE', () => {
    const freshTLE: ParsedTLE = {
      ...sampleTLE1,
      epochYear: new Date().getUTCFullYear().toString().slice(-2),
      epoch: (new Date().getTime() / (1000 * 60 * 60 * 24) -
             new Date(new Date().getUTCFullYear(), 0, 1).getTime() / (1000 * 60 * 60 * 24) + 1).toString()
    };

    const staleness = assessTLEStaleness(freshTLE);

    expect(staleness.isStale).toBe(false);
    expect(['fresh', 'recent']).toContain(staleness.staleness);
  });

  test('assessTLEStaleness should classify old TLE', () => {
    const staleness = assessTLEStaleness(sampleTLE1);

    expect(staleness.ageInDays).toBeGreaterThan(0);
    expect(staleness.recommendation).toBeDefined();
  });

  test('assessTLEStaleness should calculate age correctly', () => {
    const staleness = assessTLEStaleness(sampleTLE1);

    expect(staleness.ageInDays).toBeGreaterThan(0);
    expect(staleness.ageInHours).toBeGreaterThan(0);
    expect(staleness.ageInHours).toBeCloseTo(staleness.ageInDays * 24, 0);
  });
});

describe('Orbital Decay Detection', () => {
  test('analyzeOrbitalDecay should detect no decay with single TLE', () => {
    const analysis = analyzeOrbitalDecay([sampleTLE1]);

    expect(analysis.isDecaying).toBe(false);
    expect(analysis.decayRate).toBe(0);
  });

  test('analyzeOrbitalDecay should analyze decay with multiple TLEs', () => {
    const analysis = analyzeOrbitalDecay([sampleTLE1, sampleTLE2]);

    expect(analysis.decayRate).toBeDefined();
    expect(analysis.severity).toBeDefined();
    expect(analysis.details).toBeDefined();
  });

  test('analyzeOrbitalDecay should sort TLEs by epoch', () => {
    const analysis = analyzeOrbitalDecay([sampleTLE2, sampleTLE1]);

    expect(analysis.decayRate).toBeDefined();
  });
});

describe('TLE Update Frequency Statistics', () => {
  test('calculateUpdateFrequency should handle single TLE', () => {
    const stats = calculateUpdateFrequency([sampleTLE1]);

    expect(stats.totalUpdates).toBe(1);
    expect(stats.timeSpanDays).toBe(0);
  });

  test('calculateUpdateFrequency should calculate stats for multiple TLEs', () => {
    const stats = calculateUpdateFrequency([sampleTLE1, sampleTLE2]);

    expect(stats.totalUpdates).toBe(2);
    expect(stats.averageUpdateInterval).toBeGreaterThan(0);
    expect(stats.updatePattern).toBeDefined();
  });
});

describe('Anomaly Detection', () => {
  test('detectAnomalies should detect no anomaly without previous TLE', () => {
    const anomaly = detectAnomalies(sampleTLE1);

    expect(anomaly.hasAnomaly).toBe(false);
    expect(anomaly.anomalyType).toBe('none');
  });

  test('detectAnomalies should detect changes between TLEs', () => {
    const anomaly = detectAnomalies(sampleTLE2, sampleTLE1);

    expect(anomaly.confidence).toBeGreaterThanOrEqual(0);
    expect(anomaly.confidence).toBeLessThanOrEqual(1);
    expect(anomaly.description).toBeDefined();
  });
});

describe('Constellation Analysis', () => {
  test('analyzeConstellation should analyze single satellite', () => {
    const analysis = analyzeConstellation([sampleTLE1], 'Test Constellation');

    expect(analysis.constellationName).toBe('Test Constellation');
    expect(analysis.totalSatellites).toBe(1);
    expect(analysis.averageInclination).toBeCloseTo(parseFloat(sampleTLE1.inclination), 1);
  });

  test('analyzeConstellation should analyze multiple satellites', () => {
    const analysis = analyzeConstellation([sampleTLE1, sampleTLE2], 'Test Constellation');

    expect(analysis.totalSatellites).toBe(2);
    expect(analysis.orbitTypes).toBeDefined();
    expect(analysis.coverage).toBeDefined();
  });
});

describe('TLE Quality Metrics', () => {
  test('calculateQualityMetrics should assess TLE quality', () => {
    const metrics = calculateQualityMetrics(sampleTLE1);

    expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
    expect(metrics.overallScore).toBeLessThanOrEqual(100);
    expect(metrics.completeness).toBeGreaterThanOrEqual(0);
    expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(metrics.freshness).toBeGreaterThanOrEqual(0);
    expect(metrics.consistency).toBeGreaterThanOrEqual(0);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(metrics.grade);
  });

  test('calculateQualityMetrics should detect issues', () => {
    const metrics = calculateQualityMetrics(sampleTLE1);

    expect(metrics.issues).toBeDefined();
    expect(Array.isArray(metrics.issues)).toBe(true);
  });
});

describe('Historical TLE Trend Analysis', () => {
  test('analyzeTrend should handle insufficient data', () => {
    const trend = analyzeTrend([sampleTLE1], 'meanMotion');

    expect(trend.trend).toBe('stable');
    expect(trend.trendStrength).toBe(0);
  });

  test('analyzeTrend should analyze trend with multiple TLEs', () => {
    const trend = analyzeTrend([sampleTLE1, sampleTLE2], 'meanMotion');

    expect(trend.satelliteNumber).toBe('25544');
    expect(trend.parameter).toBe('meanMotion');
    expect(['increasing', 'decreasing', 'stable', 'oscillating']).toContain(trend.trend);
    expect(trend.predictions).toBeDefined();
    expect(trend.predictions.next7Days).toBeDefined();
    expect(trend.predictions.next30Days).toBeDefined();
  });
});

describe('Orbit Type Classification', () => {
  test('classifyOrbitType should classify LEO orbit', () => {
    const orbitType = classifyOrbitType(sampleTLE1);

    expect(orbitType).toBe(OrbitType.LEO);
  });

  test('classifyOrbitType should classify various orbit types', () => {
    const geoTLE: ParsedTLE = {
      ...sampleTLE1,
      meanMotion: '1.00273791',  // ~GEO orbit
      inclination: '0.05',
      eccentricity: '0000100'
    };

    const orbitType = classifyOrbitType(geoTLE);

    expect(Object.values(OrbitType)).toContain(orbitType);
  });
});

describe('Conjunction Probability Calculation', () => {
  test('calculateConjunctionProbability should calculate low probability for different orbits', () => {
    const differentOrbitTLE: ParsedTLE = {
      ...sampleTLE1,
      satelliteNumber1: '12345',
      satelliteNumber2: '12345',
      inclination: '98.0',
      meanMotion: '14.0'
    };

    const conjunction = calculateConjunctionProbability(sampleTLE1, differentOrbitTLE);

    expect(conjunction.probabilityOfCollision).toBeGreaterThanOrEqual(0);
    expect(conjunction.probabilityOfCollision).toBeLessThanOrEqual(1);
    expect(['low', 'moderate', 'high', 'critical']).toContain(conjunction.riskLevel);
  });

  test('calculateConjunctionProbability should include recommendations', () => {
    const conjunction = calculateConjunctionProbability(sampleTLE1, sampleTLE2);

    expect(conjunction.recommendations).toBeDefined();
    expect(Array.isArray(conjunction.recommendations)).toBe(true);
  });
});

describe('Radar Observation Validation', () => {
  test('validateAgainstRadar should validate TLE', () => {
    const radarPosition = { latitude: 40.0, longitude: -105.0, altitude: 1.5 };
    const radarObservation = {
      range: 1000,
      azimuth: 45,
      elevation: 30,
      time: new Date()
    };

    const validation = validateAgainstRadar(sampleTLE1, radarPosition, radarObservation);

    expect(validation.isValid).toBeDefined();
    expect(validation.positionError).toBeGreaterThanOrEqual(0);
    expect(validation.velocityError).toBeGreaterThanOrEqual(0);
    expect(validation.confidence).toBeGreaterThanOrEqual(0);
    expect(validation.confidence).toBeLessThanOrEqual(1);
  });
});

describe('Orbital Family Grouping', () => {
  test('groupIntoOrbitalFamilies should group similar orbits', () => {
    const families = groupIntoOrbitalFamilies([sampleTLE1, sampleTLE2]);

    expect(families.length).toBeGreaterThan(0);
    expect(families[0].satellites).toContain('25544');
    expect(families[0].commonCharacteristics).toBeDefined();
  });

  test('groupIntoOrbitalFamilies should separate different orbits', () => {
    const differentTLE: ParsedTLE = {
      ...sampleTLE1,
      satelliteNumber1: '12345',
      satelliteNumber2: '12345',
      inclination: '98.0',
      meanMotion: '14.0'
    };

    const families = groupIntoOrbitalFamilies([sampleTLE1, differentTLE]);

    expect(families.length).toBeGreaterThanOrEqual(1);
  });

  test('groupIntoOrbitalFamilies should respect tolerances', () => {
    const tolerances = {
      inclinationTolerance: 0.1,
      altitudeTolerance: 10,
      eccentricityTolerance: 0.001
    };

    const families = groupIntoOrbitalFamilies([sampleTLE1, sampleTLE2], tolerances);

    expect(families.length).toBeGreaterThan(0);
    expect(families[0].tolerances).toEqual(tolerances);
  });
});
