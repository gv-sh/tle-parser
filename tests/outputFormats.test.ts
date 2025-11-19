/**
 * Tests for Output Formats & Serialization
 */

import { parseTLE } from '../src/index';
import {
  formatAsJSON,
  formatAsCSV,
  formatAsXML,
  formatAsYAML,
  formatAsHuman,
  reconstructTLE,
  formatTLE
} from '../src/outputFormats';
import type { ParsedTLE } from '../src/types';

// Sample TLE data for testing
const sampleTLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

const sampleTLE2 = `STARLINK-1007
1 44713U 19074A   21156.50901544  .00001976  00000-0  14642-3 0  9990
2 44713  53.0548 286.5505 0001388  94.2661 265.8674 15.06391802 91981`;

describe('Output Formats & Serialization', () => {
  let parsedTLE: ParsedTLE;
  let parsedTLEs: ParsedTLE[];

  beforeAll(() => {
    parsedTLE = parseTLE(sampleTLE, { validate: false });
    parsedTLEs = [
      parseTLE(sampleTLE, { validate: false }),
      parseTLE(sampleTLE2, { validate: false })
    ];
  });

  describe('JSON Output', () => {
    test('should format single TLE as JSON', () => {
      const json = formatAsJSON(parsedTLE);
      expect(json).toBeTruthy();
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.satelliteName).toBe('ISS (ZARYA)');
      expect(parsed.satelliteNumber1).toBe('25544');
    });

    test('should format multiple TLEs as JSON array', () => {
      const json = formatAsJSON(parsedTLEs);
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].satelliteName).toBe('ISS (ZARYA)');
      expect(parsed[1].satelliteName).toBe('STARLINK-1007');
    });

    test('should pretty-print JSON when requested', () => {
      const json = formatAsJSON(parsedTLE, { pretty: true });
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    test('should support compact mode', () => {
      const json = formatAsJSON(parsedTLE, { verbosity: 'compact' });
      const parsed = JSON.parse(json);
      expect(parsed.satelliteName).toBeDefined();
      expect(parsed.satelliteNumber).toBeDefined();
      expect(parsed.inclination).toBeDefined();
      // Should not have verbose fields like checksum
      expect(Object.keys(parsed).length).toBeLessThan(10);
    });

    test('should exclude warnings when requested', () => {
      const json = formatAsJSON(parsedTLE, { includeWarnings: false });
      const parsed = JSON.parse(json);
      expect(parsed.warnings).toBeUndefined();
    });
  });

  describe('CSV Output', () => {
    test('should format single TLE as CSV with header', () => {
      const csv = formatAsCSV(parsedTLE, { includeHeader: true });
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + data
      expect(lines[0]).toContain('satelliteName');
    });

    test('should format multiple TLEs as CSV', () => {
      const csv = formatAsCSV(parsedTLEs, { includeHeader: true });
      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // Header + 2 data rows
    });

    test('should support custom delimiter', () => {
      const csv = formatAsCSV(parsedTLE, { delimiter: ';' });
      expect(csv).toContain(';');
    });

    test('should support CSV without quotes', () => {
      const csv = formatAsCSV(parsedTLE, { quote: false });
      expect(csv).not.toContain('"');
    });

    test('should support compact mode', () => {
      const csv = formatAsCSV(parsedTLE, { verbosity: 'compact', includeHeader: true });
      const lines = csv.split('\n');
      const headerFields = lines[0].split(',');
      expect(headerFields.length).toBeLessThan(10); // Fewer fields in compact mode
    });
  });

  describe('XML Output', () => {
    test('should format single TLE as XML', () => {
      const xml = formatAsXML(parsedTLE);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<tles>');
      expect(xml).toContain('<tle>');
      expect(xml).toContain('</tle>');
      expect(xml).toContain('</tles>');
      expect(xml).toContain('<satelliteName>ISS (ZARYA)</satelliteName>');
    });

    test('should format multiple TLEs as XML', () => {
      const xml = formatAsXML(parsedTLEs);
      const tleCount = (xml.match(/<tle>/g) || []).length;
      expect(tleCount).toBe(2);
    });

    test('should pretty-print XML when requested', () => {
      const xml = formatAsXML(parsedTLE, { pretty: true });
      expect(xml).toContain('\n');
      expect(xml).toContain('  '); // Indentation
    });

    test('should escape XML special characters', () => {
      const testTLE = { ...parsedTLE, satelliteName: 'Test <>&"' };
      const xml = formatAsXML(testTLE as ParsedTLE);
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });
  });

  describe('YAML Output', () => {
    test('should format single TLE as YAML', () => {
      const yaml = formatAsYAML(parsedTLE);
      expect(yaml).toContain('satelliteName:');
      expect(yaml).toContain('satelliteNumber1:');
      expect(yaml).toContain('ISS (ZARYA)');
    });

    test('should format multiple TLEs as YAML', () => {
      const yaml = formatAsYAML(parsedTLEs);
      expect(yaml).toContain('tles:');
      expect(yaml).toContain('ISS (ZARYA)');
      expect(yaml).toContain('STARLINK-1007');
    });

    test('should quote strings with special characters', () => {
      const testTLE = { ...parsedTLE, satelliteName: 'Test: #Special' };
      const yaml = formatAsYAML(testTLE as ParsedTLE);
      expect(yaml).toContain('"Test: #Special"');
    });
  });

  describe('Human-Readable Output', () => {
    test('should format TLE in human-readable format', () => {
      const human = formatAsHuman(parsedTLE);
      expect(human).toContain('ISS (ZARYA)');
      expect(human).toContain('Satellite Number:');
      expect(human).toContain('Orbital Parameters:');
    });

    test('should include colors when requested', () => {
      const human = formatAsHuman(parsedTLE, { colors: true });
      expect(human).toContain('\x1b['); // ANSI color codes
    });

    test('should not include colors when disabled', () => {
      const human = formatAsHuman(parsedTLE, { colors: false });
      expect(human).not.toContain('\x1b[');
    });

    test('should support verbose mode', () => {
      const verbose = formatAsHuman(parsedTLE, { verbosity: 'verbose' });
      expect(verbose).toContain('Additional Parameters:');
      expect(verbose).toContain('B* Drag Term:');
    });

    test('should not show additional parameters in normal mode', () => {
      const normal = formatAsHuman(parsedTLE, { verbosity: 'normal' });
      expect(normal).not.toContain('Additional Parameters:');
    });
  });

  describe('TLE Reconstruction', () => {
    test('should reconstruct TLE from parsed object', () => {
      const reconstructed = reconstructTLE(parsedTLE);
      const lines = reconstructed.split('\n');
      expect(lines.length).toBe(3); // Name + 2 TLE lines
      expect(lines[0]).toBe('ISS (ZARYA)');
      expect(lines[1][0]).toBe('1');
      expect(lines[2][0]).toBe('2');
    });

    test('should reconstruct TLE without name when requested', () => {
      const reconstructed = reconstructTLE(parsedTLE, { includeName: false });
      const lines = reconstructed.split('\n');
      expect(lines.length).toBe(2); // Only 2 TLE lines
      expect(lines[0][0]).toBe('1');
      expect(lines[1][0]).toBe('2');
    });

    test('should maintain proper line length (69 characters)', () => {
      const reconstructed = reconstructTLE(parsedTLE);
      const lines = reconstructed.split('\n');
      expect(lines[1].length).toBe(69);
      expect(lines[2].length).toBe(69);
    });

    test('should calculate correct checksums', () => {
      const reconstructed = reconstructTLE(parsedTLE);
      const lines = reconstructed.split('\n');

      // Line 1 checksum
      let checksum1 = 0;
      const line1 = lines[1];
      for (let i = 0; i < line1.length - 1; i++) {
        const char = line1[i];
        if (char >= '0' && char <= '9') {
          checksum1 += parseInt(char, 10);
        } else if (char === '-') {
          checksum1 += 1;
        }
      }
      expect((checksum1 % 10).toString()).toBe(line1[68]);

      // Line 2 checksum
      let checksum2 = 0;
      const line2 = lines[2];
      for (let i = 0; i < line2.length - 1; i++) {
        const char = line2[i];
        if (char >= '0' && char <= '9') {
          checksum2 += parseInt(char, 10);
        } else if (char === '-') {
          checksum2 += 1;
        }
      }
      expect((checksum2 % 10).toString()).toBe(line2[68]);
    });

    test('reconstructed TLE should be parseable', () => {
      const reconstructed = reconstructTLE(parsedTLE);
      expect(() => parseTLE(reconstructed, { validate: true })).not.toThrow();
    });

    test('round-trip parsing should preserve essential data', () => {
      const reconstructed = reconstructTLE(parsedTLE);
      const reparsed = parseTLE(reconstructed, { validate: false });

      expect(reparsed.satelliteName).toBe(parsedTLE.satelliteName);
      expect(reparsed.satelliteNumber).toBe(parsedTLE.satelliteNumber);
      expect(reparsed.classification).toBe(parsedTLE.classification);
      expect(reparsed.inclination).toBe(parsedTLE.inclination);
    });
  });

  describe('Universal formatTLE Function', () => {
    test('should format as JSON when specified', () => {
      const output = formatTLE(parsedTLE, { format: 'json' });
      expect(() => JSON.parse(output)).not.toThrow();
    });

    test('should format as CSV when specified', () => {
      const output = formatTLE(parsedTLE, { format: 'csv' });
      expect(output).toContain('satelliteName');
    });

    test('should format as XML when specified', () => {
      const output = formatTLE(parsedTLE, { format: 'xml' });
      expect(output).toContain('<?xml');
    });

    test('should format as YAML when specified', () => {
      const output = formatTLE(parsedTLE, { format: 'yaml' });
      expect(output).toContain('satelliteName:');
    });

    test('should format as human-readable when specified', () => {
      const output = formatTLE(parsedTLE, { format: 'human' });
      expect(output).toContain('Orbital Parameters:');
    });

    test('should reconstruct TLE when format is "tle"', () => {
      const output = formatTLE(parsedTLE, { format: 'tle' });
      const lines = output.split('\n');
      expect(lines[0]).toBe('ISS (ZARYA)');
      expect(lines[1][0]).toBe('1');
      expect(lines[2][0]).toBe('2');
    });

    test('should default to JSON format', () => {
      const output = formatTLE(parsedTLE);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    test('should throw error for unsupported format', () => {
      expect(() => formatTLE(parsedTLE, { format: 'invalid' as any })).toThrow();
    });

    test('should handle array of TLEs for human format', () => {
      const output = formatTLE(parsedTLEs, { format: 'human' });
      expect(output).toContain('ISS (ZARYA)');
      expect(output).toContain('STARLINK-1007');
    });

    test('should handle array of TLEs for TLE reconstruction', () => {
      const output = formatTLE(parsedTLEs, { format: 'tle' });
      const blocks = output.split('\n\n');
      expect(blocks.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle TLE without satellite name', () => {
      const noNameTLE = `1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;
      const parsed = parseTLE(noNameTLE, { validate: false });
      const json = formatAsJSON(parsed);
      expect(json).toBeTruthy();
    });

    test('should handle empty array', () => {
      const json = formatAsJSON([]);
      expect(json).toBe('[]');
    });

    test('should handle special characters in satellite name', () => {
      const specialTLE = { ...parsedTLE, satelliteName: 'Test & <Special> "Name"' };
      const xml = formatAsXML(specialTLE as ParsedTLE);
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&quot;');
    });

    test('should handle very long satellite names', () => {
      const longName = 'A'.repeat(100);
      const longNameTLE = { ...parsedTLE, satelliteName: longName };
      const csv = formatAsCSV(longNameTLE as ParsedTLE);
      expect(csv).toContain(longName);
    });

    test('should handle missing fields gracefully', () => {
      const partialTLE = {
        satelliteName: 'Test',
        satelliteNumber: '12345'
      } as ParsedTLE;

      const json = formatAsJSON(partialTLE);
      expect(json).toBeTruthy();

      const reconstructed = reconstructTLE(partialTLE);
      expect(reconstructed).toBeTruthy();
    });
  });

  describe('Format Options Propagation', () => {
    test('should respect includeWarnings option across formats', () => {
      const tleWithWarnings = {
        ...parsedTLE,
        warnings: [{ code: 'TEST', message: 'Test warning', severity: 'warning' as const }]
      };

      const jsonWith = formatAsJSON(tleWithWarnings, { includeWarnings: true });
      expect(jsonWith).toContain('warnings');

      const jsonWithout = formatAsJSON(tleWithWarnings, { includeWarnings: false });
      expect(jsonWithout).not.toContain('warnings');
    });

    test('should respect includeComments option across formats', () => {
      const tleWithComments = {
        ...parsedTLE,
        comments: ['# Test comment']
      };

      const jsonWith = formatAsJSON(tleWithComments, { includeComments: true });
      expect(jsonWith).toContain('comments');

      const jsonWithout = formatAsJSON(tleWithComments, { includeComments: false });
      expect(jsonWithout).not.toContain('comments');
    });
  });
});
