/**
 * Performance Benchmarks for TLE Parser
 *
 * These benchmarks measure parsing speed and performance characteristics
 * to ensure the parser maintains acceptable performance as features are added.
 */

const {
  parseTLE,
  validateTLE,
  calculateChecksum,
  normalizeLineEndings
} = require('../index');

const fixtures = require('./fixtures/tle-samples');

/**
 * Helper function to measure execution time
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} - Performance metrics
 */
function benchmark(fn, iterations = 1000) {
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const endTime = process.hrtime.bigint();
  const totalTimeNs = Number(endTime - startTime);
  const totalTimeMs = totalTimeNs / 1_000_000;
  const avgTimeMs = totalTimeMs / iterations;
  const opsPerSecond = Math.floor((iterations / totalTimeMs) * 1000);

  return {
    totalTimeMs,
    avgTimeMs,
    opsPerSecond,
    iterations
  };
}

describe('TLE Parser - Performance Benchmarks', () => {
  describe('parseTLE() Performance', () => {
    test('should parse 2-line TLE in under 1ms on average', () => {
      const metrics = benchmark(() => {
        parseTLE(fixtures.validISS2Line);
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(1);
      expect(metrics.opsPerSecond).toBeGreaterThan(1000);
    });

    test('should parse 3-line TLE in under 1ms on average', () => {
      const metrics = benchmark(() => {
        parseTLE(fixtures.validISS3Line);
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(1);
      expect(metrics.opsPerSecond).toBeGreaterThan(1000);
    });

    test('should parse TLE with comments efficiently', () => {
      const metrics = benchmark(() => {
        parseTLE(fixtures.validISSWithComments, { includeComments: true });
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(1.5);
      expect(metrics.opsPerSecond).toBeGreaterThan(600);
    });

    test('should parse without validation faster than with validation', () => {
      const withValidation = benchmark(() => {
        parseTLE(fixtures.validISS2Line, { validate: true });
      }, 1000);

      const withoutValidation = benchmark(() => {
        parseTLE(fixtures.validISS2Line, { validate: false });
      }, 1000);

      expect(withoutValidation.avgTimeMs).toBeLessThan(withValidation.avgTimeMs);
    });
  });

  describe('validateTLE() Performance', () => {
    test('should validate TLE in under 0.5ms on average', () => {
      const metrics = benchmark(() => {
        validateTLE(fixtures.validISS2Line);
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(0.5);
      expect(metrics.opsPerSecond).toBeGreaterThan(2000);
    });

    test('should validate with range checking efficiently', () => {
      const metrics = benchmark(() => {
        validateTLE(fixtures.validISS2Line, { validateRanges: true });
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(1);
      expect(metrics.opsPerSecond).toBeGreaterThan(1000);
    });

    test('should validate invalid TLE quickly', () => {
      const metrics = benchmark(() => {
        try {
          validateTLE(fixtures.invalidChecksum1);
        } catch (error) {
          // Expected to throw
        }
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(0.5);
    });
  });

  describe('calculateChecksum() Performance', () => {
    test('should calculate checksum in under 0.02ms on average', () => {
      const line1 = '1 25544U 98067A   20001.00000000  .00002182  00000-0  41420-4 0  9990';

      const metrics = benchmark(() => {
        calculateChecksum(line1);
      }, 10000);

      expect(metrics.avgTimeMs).toBeLessThan(0.02);
      expect(metrics.opsPerSecond).toBeGreaterThan(50000);
    });

    test('should handle repeated checksum calculations efficiently', () => {
      const line1 = '1 25544U 98067A   20001.00000000  .00002182  00000-0  41420-4 0  9990';
      const line2 = '2 25544  51.6453 339.8014 0001671  86.9590 273.1746 15.48919393207139';

      const metrics = benchmark(() => {
        calculateChecksum(line1);
        calculateChecksum(line2);
      }, 5000);

      expect(metrics.avgTimeMs).toBeLessThan(0.05);
    });
  });

  describe('Batch Parsing Performance', () => {
    test('should handle batch parsing of multiple TLEs efficiently', () => {
      const tles = [
        fixtures.validISS2Line,
        fixtures.validHubble,
        fixtures.validGPS,
        fixtures.validStarlink
      ];

      const metrics = benchmark(() => {
        tles.forEach(tle => parseTLE(tle));
      }, 100);

      // Average time per TLE should be under 1ms
      const avgPerTLE = metrics.avgTimeMs / tles.length;
      expect(avgPerTLE).toBeLessThan(1);
    });

    test('should scale linearly with number of TLEs', () => {
      const singleTLE = benchmark(() => {
        parseTLE(fixtures.validISS2Line);
      }, 1000);

      const tenTLEs = benchmark(() => {
        for (let i = 0; i < 10; i++) {
          parseTLE(fixtures.validISS2Line);
        }
      }, 100);

      // 10 TLEs should take roughly 10x as long (with some overhead tolerance)
      const expectedTime = singleTLE.avgTimeMs * 10;
      const tolerance = expectedTime * 0.5; // 50% tolerance for overhead

      expect(tenTLEs.avgTimeMs).toBeLessThan(expectedTime + tolerance);
      expect(tenTLEs.avgTimeMs).toBeGreaterThan(expectedTime - tolerance);
    });
  });

  describe('normalizeLineEndings() Performance', () => {
    test('should normalize line endings in under 0.01ms on average', () => {
      const input = 'Line 1\r\nLine 2\nLine 3\rLine 4';

      const metrics = benchmark(() => {
        normalizeLineEndings(input);
      }, 10000);

      expect(metrics.avgTimeMs).toBeLessThan(0.01);
      expect(metrics.opsPerSecond).toBeGreaterThan(100000);
    });

    test('should handle large inputs efficiently', () => {
      // Create a large input with mixed line endings
      const lines = new Array(1000).fill('1 25544U 98067A   20001.00000000  .00002182  00000-0  41420-4 0  9990');
      const largeInput = lines.join('\r\n');

      const metrics = benchmark(() => {
        normalizeLineEndings(largeInput);
      }, 100);

      expect(metrics.avgTimeMs).toBeLessThan(10);
    });
  });

  describe('Performance with Warnings', () => {
    test('should handle warning detection efficiently', () => {
      const withWarnings = benchmark(() => {
        parseTLE(fixtures.validISS2Line, { includeWarnings: true });
      }, 1000);

      const withoutWarnings = benchmark(() => {
        parseTLE(fixtures.validISS2Line, { includeWarnings: false });
      }, 1000);

      // Warning detection should add minimal overhead
      const overhead = withWarnings.avgTimeMs - withoutWarnings.avgTimeMs;
      expect(overhead).toBeLessThan(0.5);
    });

    test('should detect multiple warnings efficiently', () => {
      const metrics = benchmark(() => {
        parseTLE(fixtures.warningMultiple, { includeWarnings: true });
      }, 1000);

      expect(metrics.avgTimeMs).toBeLessThan(2);
    });
  });

  describe('Performance Regression Prevention', () => {
    test('should maintain baseline performance for typical use case', () => {
      // This test establishes a performance baseline
      // If this test fails, it indicates a performance regression
      const metrics = benchmark(() => {
        const result = parseTLE(fixtures.validISS2Line, {
          validate: true,
          strictChecksums: true,
          validateRanges: true,
          includeWarnings: true
        });
        expect(result).toBeDefined();
      }, 1000);

      // Baseline: Full validation + warnings should complete in under 2ms
      expect(metrics.avgTimeMs).toBeLessThan(2);
      expect(metrics.opsPerSecond).toBeGreaterThan(500);
    });

    test('should handle worst-case scenario efficiently', () => {
      // Worst case: 3-line TLE with comments, full validation, warnings
      const metrics = benchmark(() => {
        const result = parseTLE(fixtures.validISSWithComments, {
          validate: true,
          strictChecksums: true,
          validateRanges: true,
          includeWarnings: true,
          includeComments: true
        });
        expect(result).toBeDefined();
      }, 500);

      // Even worst case should complete in under 3ms
      expect(metrics.avgTimeMs).toBeLessThan(3);
      expect(metrics.opsPerSecond).toBeGreaterThan(300);
    });
  });

  describe('Memory Efficiency', () => {
    test('should not leak memory during repeated parsing', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Parse many TLEs
      for (let i = 0; i < 10000; i++) {
        parseTLE(fixtures.validISS2Line);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncreaseMB = (finalMemory - initialMemory) / 1024 / 1024;

      // Memory increase should be minimal (less than 10MB for 10k parses)
      expect(memoryIncreaseMB).toBeLessThan(10);
    });

    test('should handle large batch without excessive memory', () => {
      const tles = new Array(1000).fill(fixtures.validISS2Line);

      const beforeMemory = process.memoryUsage().heapUsed;

      const results = tles.map(tle => parseTLE(tle));

      const afterMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (afterMemory - beforeMemory) / 1024 / 1024;

      expect(results.length).toBe(1000);
      // Memory for 1000 parsed TLEs should be reasonable (less than 50MB)
      expect(memoryUsedMB).toBeLessThan(50);
    });
  });
});
