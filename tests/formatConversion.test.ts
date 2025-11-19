/**
 * Tests for Format Conversion Module
 */

import {
  tleToOMM,
  ommToTLE,
  ommToXML,
  tleToSTK,
  stkToFile,
  tleToKVN,
  kvnToText,
  tleToOEM,
  oemToText,
  extractKeplerianElements,
  tleToStateVector,
  keplerianToCartesian,
  tleToGPSAlmanac,
  transformCoordinateFrame,
  tleToStellarium,
  tleToCelestia,
  tleToPlanetarium,
  tleToCustomFormat,
  createCustomFormat,
  tleToLegacyFormat,
  reconstructTLE,
  CoordinateFrame,
  PlanetariumFormat
} from '../src/formatConversion';
import { ParsedTLE } from '../src/types';

// Sample TLE data for testing
const sampleTLE: ParsedTLE = {
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

describe('OMM (Orbit Mean Elements Message) Conversion', () => {
  test('tleToOMM should convert TLE to OMM format', () => {
    const omm = tleToOMM(sampleTLE);

    expect(omm.CCSDS_OMM_VERS).toBe('2.0');
    expect(omm.OBJECT_NAME).toBe('ISS (ZARYA)');
    expect(omm.OBJECT_ID).toBe('25544');
    expect(omm.MEAN_ELEMENT_THEORY).toBe('SGP4');
    expect(omm.MEAN_MOTION).toBeCloseTo(parseFloat(sampleTLE.meanMotion), 5);
    expect(omm.INCLINATION).toBeCloseTo(parseFloat(sampleTLE.inclination), 4);
  });

  test('tleToOMM should use custom originator', () => {
    const omm = tleToOMM(sampleTLE, 'CUSTOM-ORG');

    expect(omm.ORIGINATOR).toBe('CUSTOM-ORG');
  });

  test('ommToXML should generate valid XML', () => {
    const omm = tleToOMM(sampleTLE);
    const xml = ommToXML(omm);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<omm');
    expect(xml).toContain('<OBJECT_NAME>ISS (ZARYA)</OBJECT_NAME>');
    expect(xml).toContain('</omm>');
  });

  test('ommToTLE should convert OMM back to TLE', () => {
    const omm = tleToOMM(sampleTLE);
    const tle = ommToTLE(omm);

    expect(tle).toContain('ISS (ZARYA)');
    expect(tle).toContain('1 25544');
    expect(tle).toContain('2 25544');
  });
});

describe('STK Ephemeris Format Conversion', () => {
  test('tleToSTK should convert TLE to STK format', () => {
    const stk = tleToSTK(sampleTLE);

    expect(stk.header.satelliteName).toBe('ISS (ZARYA)');
    expect(stk.header.coordinateSystem).toBe('TEME');
    expect(stk.header.centralBody).toBe('Earth');
    expect(stk.stateVectors.length).toBeGreaterThan(0);
  });

  test('stkToFile should generate STK file format', () => {
    const stk = tleToSTK(sampleTLE);
    const file = stkToFile(stk);

    expect(file).toContain('stk.v.11.0');
    expect(file).toContain('BEGIN Ephemeris');
    expect(file).toContain('END Ephemeris');
    expect(file).toContain('ISS (ZARYA)');
  });
});

describe('KVN (Keyhole Markup Language) Conversion', () => {
  test('tleToKVN should convert TLE to KVN format', () => {
    const kvn = tleToKVN(sampleTLE);

    expect(kvn.KVN_VERS).toBe('1.0');
    expect(kvn.OBJECT_NAME).toBe('ISS (ZARYA)');
    expect(kvn.OBJECT_ID).toBe('25544');
    expect(kvn.elements.MEAN_MOTION).toBeCloseTo(parseFloat(sampleTLE.meanMotion), 5);
  });

  test('kvnToText should generate KVN text format', () => {
    const kvn = tleToKVN(sampleTLE);
    const text = kvnToText(kvn);

    expect(text).toContain('KVN/1.0');
    expect(text).toContain('OBJECT_NAME = ISS (ZARYA)');
    expect(text).toContain('ELEMENTS');
  });
});

describe('CCSDS OEM Conversion', () => {
  test('tleToOEM should convert TLE to OEM format', () => {
    const oem = tleToOEM(sampleTLE);

    expect(oem.CCSDS_OEM_VERS).toBe('2.0');
    expect(oem.OBJECT_NAME).toBe('ISS (ZARYA)');
    expect(oem.OBJECT_ID).toBe('25544');
    expect(oem.REF_FRAME).toBe('TEME');
    expect(oem.ephemerisData.length).toBeGreaterThan(0);
  });

  test('oemToText should generate OEM text format', () => {
    const oem = tleToOEM(sampleTLE);
    const text = oemToText(oem);

    expect(text).toContain('CCSDS_OEM_VERS');
    expect(text).toContain('META_START');
    expect(text).toContain('META_STOP');
    expect(text).toContain('DATA_START');
    expect(text).toContain('DATA_STOP');
  });
});

describe('Keplerian Elements Extraction', () => {
  test('extractKeplerianElements should extract elements', () => {
    const elements = extractKeplerianElements(sampleTLE);

    expect(elements.semiMajorAxis).toBeGreaterThan(0);
    expect(elements.eccentricity).toBeCloseTo(parseFloat('0.' + sampleTLE.eccentricity), 6);
    expect(elements.inclination).toBeCloseTo(parseFloat(sampleTLE.inclination), 4);
    expect(elements.rightAscensionOfAscendingNode).toBeCloseTo(parseFloat(sampleTLE.rightAscension), 4);
    expect(elements.argumentOfPerigee).toBeCloseTo(parseFloat(sampleTLE.argumentOfPerigee), 4);
    expect(elements.meanAnomaly).toBeCloseTo(parseFloat(sampleTLE.meanAnomaly), 4);
  });

  test('extractKeplerianElements should calculate derived parameters', () => {
    const elements = extractKeplerianElements(sampleTLE);

    expect(elements.period).toBeGreaterThan(0);
    expect(elements.meanMotion).toBeGreaterThan(0);
    expect(elements.trueAnomaly).toBeDefined();
  });
});

describe('State Vector Conversion', () => {
  test('tleToStateVector should convert TLE to state vector', () => {
    const sv = tleToStateVector(sampleTLE);

    expect(sv.position).toBeDefined();
    expect(sv.velocity).toBeDefined();
    expect(sv.time).toBeDefined();
  });

  test('keplerianToCartesian should convert Keplerian elements', () => {
    const elements = extractKeplerianElements(sampleTLE);
    const result = keplerianToCartesian(elements);

    expect(result.position.x).toBeDefined();
    expect(result.position.y).toBeDefined();
    expect(result.position.z).toBeDefined();
    expect(result.velocity.vx).toBeDefined();
    expect(result.velocity.vy).toBeDefined();
    expect(result.velocity.vz).toBeDefined();
  });
});

describe('GPS Almanac Conversion', () => {
  test('tleToGPSAlmanac should convert TLE to GPS almanac', () => {
    const almanac = tleToGPSAlmanac(sampleTLE);

    expect(almanac.satelliteId).toBe('25544');
    expect(almanac.eccentricity).toBeCloseTo(parseFloat('0.' + sampleTLE.eccentricity), 6);
    expect(almanac.orbitalInclination).toBeGreaterThan(0);
    expect(almanac.week).toBeGreaterThan(0);
  });
});

describe('Coordinate Frame Transformations', () => {
  test('transformCoordinateFrame should return same vector for same frame', () => {
    const sv = tleToStateVector(sampleTLE);
    const transformed = transformCoordinateFrame(sv, CoordinateFrame.TEME, CoordinateFrame.TEME, new Date());

    expect(transformed).toEqual(sv);
  });

  test('transformCoordinateFrame should handle TEME to J2000', () => {
    const sv = tleToStateVector(sampleTLE);
    const transformed = transformCoordinateFrame(sv, CoordinateFrame.TEME, CoordinateFrame.J2000, new Date());

    expect(transformed.position).toBeDefined();
    expect(transformed.velocity).toBeDefined();
  });

  test('transformCoordinateFrame should handle J2000 to TEME', () => {
    const sv = tleToStateVector(sampleTLE);
    const transformed = transformCoordinateFrame(sv, CoordinateFrame.J2000, CoordinateFrame.TEME, new Date());

    expect(transformed.position).toBeDefined();
    expect(transformed.velocity).toBeDefined();
  });
});

describe('Planetarium Software Formats', () => {
  test('tleToStellarium should convert to Stellarium format', () => {
    const stellarium = tleToStellarium(sampleTLE);

    expect(stellarium).toContain('ISS (ZARYA)');
    expect(stellarium).toContain('[');
    expect(stellarium).toContain(']');
  });

  test('tleToCelestia should convert to Celestia SSC format', () => {
    const celestia = tleToCelestia(sampleTLE);

    expect(celestia).toContain('ISS (ZARYA)');
    expect(celestia).toContain('Sol/Earth');
    expect(celestia).toContain('EllipticalOrbit');
    expect(celestia).toContain('SemiMajorAxis');
  });

  test('tleToPlanetarium should support multiple formats', () => {
    const stellarium = tleToPlanetarium(sampleTLE, PlanetariumFormat.STELLARIUM);
    const celestia = tleToPlanetarium(sampleTLE, PlanetariumFormat.CELESTIA);

    expect(stellarium).toBeDefined();
    expect(celestia).toBeDefined();
    expect(stellarium).not.toBe(celestia);
  });
});

describe('Custom Format Definition System', () => {
  test('createCustomFormat should create format definition', () => {
    const format = createCustomFormat('Test Format', [
      { name: 'satNum', source: 'satelliteNumber1' },
      { name: 'inc', source: 'inclination' }
    ]);

    expect(format.name).toBe('Test Format');
    expect(format.version).toBe('1.0');
    expect(format.fields.length).toBe(2);
  });

  test('tleToCustomFormat should convert using custom format', () => {
    const format = createCustomFormat(
      'CSV Format',
      [
        { name: 'satNum', source: 'satelliteNumber1' },
        { name: 'inc', source: 'inclination' },
        { name: 'meanMotion', source: 'meanMotion' }
      ],
      { separator: ',' }
    );

    const output = tleToCustomFormat(sampleTLE, format);

    expect(output).toContain('25544');
    expect(output).toContain(',');
  });

  test('tleToCustomFormat should apply transformations', () => {
    const format = createCustomFormat(
      'Transform Format',
      [
        {
          name: 'satNum',
          source: 'satelliteNumber1',
          transform: (val) => `SAT-${val}`
        }
      ]
    );

    const output = tleToCustomFormat(sampleTLE, format);

    expect(output).toContain('SAT-25544');
  });
});

describe('Legacy TLE Format Support', () => {
  test('tleToLegacyFormat should convert to legacy format', () => {
    const legacy = tleToLegacyFormat(sampleTLE);

    expect(legacy).toContain('ISS (ZARYA)');
    expect(legacy).toContain('1 25544');
    expect(legacy).toContain('2 25544');
  });

  test('reconstructTLE should reconstruct TLE string', () => {
    const reconstructed = reconstructTLE(sampleTLE);

    expect(reconstructed).toContain('ISS (ZARYA)');
    expect(reconstructed).toContain('1 25544');
    expect(reconstructed).toContain('2 25544');
  });

  test('reconstructTLE should handle TLE without name', () => {
    const tleWithoutName = { ...sampleTLE, satelliteName: null };
    const reconstructed = reconstructTLE(tleWithoutName);

    expect(reconstructed).toContain('1 25544');
    expect(reconstructed).toContain('2 25544');
    expect(reconstructed).not.toContain('ISS (ZARYA)');
  });
});
