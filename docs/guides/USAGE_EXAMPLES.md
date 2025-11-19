# Usage Examples

Comprehensive examples for common TLE parsing scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Input Formats](#input-formats)
- [Working with Options](#working-with-options)
- [Error Handling](#error-handling)
- [Validation Scenarios](#validation-scenarios)
- [Real-World Applications](#real-world-applications)
- [Integration Examples](#integration-examples)
- [Advanced Use Cases](#advanced-use-cases)

---

## Basic Usage

### Parse a Simple TLE

```javascript
const { parseTLE } = require('tle-parser');

const tle = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tle);

console.log(result.satelliteNumber1);  // "25544"
console.log(result.satelliteName);     // null (no name line)
console.log(result.inclination);       // "51.6453"
console.log(result.meanMotion);        // "15.49338189"
```

### TypeScript Usage

```typescript
import { parseTLE, ParsedTLE, TLEValidationError } from 'tle-parser';

const tle: string = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
  const result: ParsedTLE = parseTLE(tle);
  console.log(`Satellite: ${result.satelliteName}`);
  console.log(`Altitude indicator (mean motion): ${result.meanMotion} rev/day`);
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error('Validation failed:', error.errors);
  }
}
```

---

## Input Formats

### 2-Line Format

```javascript
const tle = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tle);
console.log(result.satelliteName);  // null
```

### 3-Line Format (with Satellite Name)

```javascript
const tle = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tle);
console.log(result.satelliteName);  // "ISS (ZARYA)"
```

### With Comments

```javascript
const tle = `# Source: CelesTrak
# Downloaded: 2025-01-15T12:00:00Z
# Orbital data for International Space Station
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tle, { includeComments: true });

console.log(result.satelliteName);  // "ISS (ZARYA)"
console.log(result.comments);       // Array of 3 comment lines
console.log(result.comments[0]);    // "# Source: CelesTrak"
```

### Different Line Endings

The parser automatically handles different line ending formats:

```javascript
// Windows (CRLF)
const windowsTLE = "ISS (ZARYA)\r\n1 25544U...\r\n2 25544...";

// Unix/Linux (LF)
const unixTLE = "ISS (ZARYA)\n1 25544U...\n2 25544...";

// Old Mac (CR)
const macTLE = "ISS (ZARYA)\r1 25544U...\r2 25544...";

// All work the same
const result1 = parseTLE(windowsTLE);
const result2 = parseTLE(unixTLE);
const result3 = parseTLE(macTLE);
```

### Multiple TLEs from a File

```javascript
const fs = require('fs');
const { parseTLE } = require('tle-parser');

// Read TLE file (common format has blank lines between TLEs)
const fileContent = fs.readFileSync('stations.txt', 'utf8');

// Split by double newlines to separate individual TLEs
const tleBlocks = fileContent.split(/\n\s*\n/);

const satellites = tleBlocks.map(block => {
  try {
    return parseTLE(block.trim());
  } catch (error) {
    console.error('Failed to parse TLE:', error.message);
    return null;
  }
}).filter(Boolean);

console.log(`Parsed ${satellites.length} satellites`);
satellites.forEach(sat => {
  console.log(`${sat.satelliteName}: ${sat.satelliteNumber1}`);
});
```

---

## Working with Options

### Permissive Mode (Error Recovery)

```javascript
const { parseTLE } = require('tle-parser');

// TLE with incorrect checksum
const badTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

// Strict mode (default) - throws error
try {
  parseTLE(badTLE);
} catch (error) {
  console.log('Strict mode failed:', error.message);
}

// Permissive mode - returns data with warnings
const result = parseTLE(badTLE, { mode: 'permissive' });
console.log('Satellite Number:', result.satelliteNumber1);
console.log('Warnings:', result.warnings);
// Warnings will include CHECKSUM_MISMATCH
```

### Disable Checksum Validation

```javascript
// Skip checksum validation entirely
const result = parseTLE(tle, {
  strictChecksums: false
});

// No checksum errors will be thrown
```

### Disable Range Validation

```javascript
// Allow out-of-range values (for historical or unusual data)
const result = parseTLE(tle, {
  validateRanges: false
});

// Values like inclination > 180 won't cause errors
```

### Exclude Warnings

```javascript
// Don't include warnings in the result
const result = parseTLE(tle, {
  includeWarnings: false
});

console.log(result.warnings);  // undefined
```

### Exclude Comments

```javascript
// Don't include comment lines
const result = parseTLE(tleWithComments, {
  includeComments: false
});

console.log(result.comments);  // undefined
```

### Combined Options

```javascript
const result = parseTLE(tle, {
  mode: 'permissive',           // Don't throw on non-critical errors
  strictChecksums: false,       // Skip checksum validation
  validateRanges: true,          // Still validate ranges
  includeWarnings: true,         // Include warnings
  includeComments: true          // Include comments
});
```

---

## Error Handling

### Try-Catch Pattern (Strict Mode)

```javascript
const { parseTLE, TLEValidationError } = require('tle-parser');

try {
  const result = parseTLE(tleData);
  console.log('Successfully parsed:', result.satelliteName);
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error('Validation failed with', error.errors.length, 'errors:');
    error.errors.forEach(err => {
      console.error(`- ${err.code}: ${err.message}`);
    });

    if (error.warnings.length > 0) {
      console.warn('Warnings:', error.warnings);
    }
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Graceful Degradation (Permissive Mode)

```javascript
const result = parseTLE(tleData, { mode: 'permissive' });

if (result.warnings && result.warnings.length > 0) {
  console.warn(`Parsed with ${result.warnings.length} warnings:`);
  result.warnings.forEach(warning => {
    console.warn(`- ${warning.code}: ${warning.message} (line ${warning.line})`);
  });
}

// Use the data even if there were warnings
console.log('Satellite:', result.satelliteName);
```

### Categorizing Errors

```javascript
try {
  const result = parseTLE(tleData);
} catch (error) {
  if (error instanceof TLEValidationError) {
    const criticalErrors = error.errors.filter(e => e.severity === 'error');
    const warnings = error.errors.filter(e => e.severity === 'warning');

    console.error('Critical errors:', criticalErrors.length);
    console.warn('Warnings:', warnings.length);

    // Log specific error types
    const checksumErrors = error.errors.filter(e => e.code === 'CHECKSUM_MISMATCH');
    if (checksumErrors.length > 0) {
      console.error('Checksum validation failed');
    }
  }
}
```

---

## Validation Scenarios

### Validate Without Full Parsing

```javascript
const { validateTLE } = require('tle-parser');

const validationResult = validateTLE(tleData);

if (validationResult.valid) {
  console.log('TLE is valid');
} else {
  console.error('Validation errors:', validationResult.errors);
}

if (validationResult.warnings.length > 0) {
  console.warn('Warnings:', validationResult.warnings);
}
```

### Check Specific Fields

```javascript
const {
  validateChecksum,
  validateSatelliteNumber,
  validateClassification
} = require('tle-parser');

const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const line2 = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';

// Check checksum
const checksumResult = validateChecksum(line1);
console.log('Checksum valid:', checksumResult.valid);
console.log('Expected:', checksumResult.expected);
console.log('Actual:', checksumResult.actual);

// Check satellite number consistency
const satNumResult = validateSatelliteNumber(line1, line2);
console.log('Satellite numbers match:', satNumResult.valid);

// Check classification
const classResult = validateClassification(line1);
console.log('Classification:', classResult.classification);
console.log('Valid:', classResult.valid);
```

### Calculate Checksum

```javascript
const { calculateChecksum } = require('tle-parser');

const lineWithoutChecksum = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999';
const checksum = calculateChecksum(lineWithoutChecksum);

console.log('Calculated checksum:', checksum);  // 6

// Append to create valid line
const validLine = lineWithoutChecksum + checksum;
```

---

## Real-World Applications

### Satellite Tracking Dashboard

```javascript
const { parseTLE } = require('tle-parser');
const axios = require('axios');

async function fetchAndParseTLEs(url) {
  try {
    const response = await axios.get(url);
    const tleBlocks = response.data.split(/\n\s*\n/);

    const satellites = [];

    for (const block of tleBlocks) {
      try {
        const tle = parseTLE(block.trim(), {
          mode: 'permissive',
          includeWarnings: true
        });

        // Calculate orbital period
        const period = 1440 / parseFloat(tle.meanMotion); // minutes

        satellites.push({
          name: tle.satelliteName,
          noradId: tle.satelliteNumber1,
          period: period.toFixed(2),
          inclination: parseFloat(tle.inclination),
          eccentricity: parseFloat('0.' + tle.eccentricity),
          hasWarnings: tle.warnings && tle.warnings.length > 0
        });
      } catch (error) {
        console.error('Failed to parse TLE:', error.message);
      }
    }

    return satellites;
  } catch (error) {
    console.error('Failed to fetch TLEs:', error.message);
    return [];
  }
}

// Usage
fetchAndParseTLEs('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle')
  .then(satellites => {
    console.log(`Loaded ${satellites.length} satellites`);
    satellites.forEach(sat => {
      console.log(`${sat.name}: ${sat.period} min period, ${sat.inclination}° inclination`);
    });
  });
```

### Ground Station Pass Predictor

```javascript
const { parseTLE } = require('tle-parser');

function analyzeOrbit(tle) {
  const parsed = parseTLE(tle);

  const meanMotion = parseFloat(parsed.meanMotion);
  const inclination = parseFloat(parsed.inclination);
  const eccentricity = parseFloat('0.' + parsed.eccentricity);

  // Calculate orbital period
  const periodMinutes = 1440 / meanMotion;

  // Determine orbit type
  let orbitType;
  if (meanMotion > 12) {
    orbitType = 'LEO';
  } else if (meanMotion > 1.5) {
    orbitType = 'MEO';
  } else if (Math.abs(meanMotion - 1.0) < 0.01) {
    orbitType = 'GEO/Geosynchronous';
  } else {
    orbitType = 'HEO';
  }

  // Determine if satellite passes over given latitude
  const stationLatitude = 40.0; // Example: 40°N
  const canSee = inclination >= Math.abs(stationLatitude);

  return {
    name: parsed.satelliteName,
    noradId: parsed.satelliteNumber1,
    period: periodMinutes.toFixed(2) + ' min',
    orbitType,
    inclination: inclination + '°',
    canSeeFromStation: canSee,
    eccentricity: eccentricity.toFixed(6)
  };
}

const issTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const analysis = analyzeOrbit(issTLE);
console.log(analysis);
// {
//   name: 'ISS (ZARYA)',
//   noradId: '25544',
//   period: '92.91 min',
//   orbitType: 'LEO',
//   inclination: '51.6453°',
//   canSeeFromStation: true,
//   eccentricity: '0.000167'
// }
```

### TLE Data Quality Checker

```javascript
const { parseTLE } = require('tle-parser');

function assessTLEQuality(tle) {
  const result = parseTLE(tle, {
    mode: 'permissive',
    includeWarnings: true
  });

  const quality = {
    score: 100,
    issues: [],
    staleness: null
  };

  // Check for warnings
  if (result.warnings) {
    result.warnings.forEach(warning => {
      switch (warning.code) {
        case 'STALE_TLE_WARNING':
          quality.score -= 30;
          quality.issues.push('TLE data is stale (>30 days old)');
          quality.staleness = 'stale';
          break;
        case 'CLASSIFIED_DATA_WARNING':
          quality.score -= 10;
          quality.issues.push('Classified data - may have reduced accuracy');
          break;
        case 'HIGH_ECCENTRICITY_WARNING':
          quality.score -= 5;
          quality.issues.push('Highly eccentric orbit - propagation may be less accurate');
          break;
        case 'CHECKSUM_MISMATCH':
          quality.score -= 50;
          quality.issues.push('Checksum error - data integrity compromised');
          break;
      }
    });
  }

  // Determine grade
  if (quality.score >= 90) {
    quality.grade = 'A';
  } else if (quality.score >= 70) {
    quality.grade = 'B';
  } else if (quality.score >= 50) {
    quality.grade = 'C';
  } else {
    quality.grade = 'F';
  }

  return {
    satellite: result.satelliteName || result.satelliteNumber1,
    quality
  };
}

const assessment = assessTLEQuality(tleData);
console.log(`${assessment.satellite}: Grade ${assessment.quality.grade} (${assessment.quality.score}/100)`);
assessment.quality.issues.forEach(issue => console.log(`  - ${issue}`));
```

### Batch Processing with Error Recovery

```javascript
const { parseTLE, parseWithStateMachine } = require('tle-parser');
const fs = require('fs');

function batchParseTLEs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tleBlocks = content.split(/\n\s*\n/);

  const results = {
    successful: [],
    failed: [],
    recovered: []
  };

  tleBlocks.forEach((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    try {
      // Try standard parser first
      const parsed = parseTLE(trimmed);
      results.successful.push({
        index,
        data: parsed,
        method: 'standard'
      });
    } catch (error) {
      // Try state machine parser for recovery
      const stateMachineResult = parseWithStateMachine(trimmed, {
        attemptRecovery: true,
        includePartialResults: true
      });

      if (stateMachineResult.success || stateMachineResult.data) {
        results.recovered.push({
          index,
          data: stateMachineResult.data,
          errors: stateMachineResult.errors,
          method: 'state-machine'
        });
      } else {
        results.failed.push({
          index,
          error: error.message,
          block: trimmed.substring(0, 100) + '...'
        });
      }
    }
  });

  return results;
}

const results = batchParseTLEs('all_satellites.txt');
console.log(`Successful: ${results.successful.length}`);
console.log(`Recovered: ${results.recovered.length}`);
console.log(`Failed: ${results.failed.length}`);
```

---

## Integration Examples

### Express.js API Endpoint

```javascript
const express = require('express');
const { parseTLE, TLEValidationError } = require('tle-parser');

const app = express();
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

app.post('/api/parse-tle', (req, res) => {
  try {
    const tleData = typeof req.body === 'string' ? req.body : req.body.tle;

    if (!tleData) {
      return res.status(400).json({ error: 'No TLE data provided' });
    }

    const result = parseTLE(tleData, {
      mode: 'permissive',
      includeWarnings: true
    });

    // Convert to more user-friendly format
    const response = {
      satellite: {
        name: result.satelliteName,
        noradId: result.satelliteNumber1,
        classification: result.classification
      },
      orbit: {
        inclination: parseFloat(result.inclination),
        eccentricity: parseFloat('0.' + result.eccentricity),
        meanMotion: parseFloat(result.meanMotion),
        period: (1440 / parseFloat(result.meanMotion)).toFixed(2) + ' minutes'
      },
      warnings: result.warnings || []
    };

    res.json(response);
  } catch (error) {
    if (error instanceof TLEValidationError) {
      res.status(422).json({
        error: 'TLE validation failed',
        details: error.errors
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

app.listen(3000, () => {
  console.log('TLE parser API listening on port 3000');
});
```

### React Component

```jsx
import React, { useState } from 'react';
import { parseTLE } from 'tle-parser';

function TLEParser() {
  const [tleInput, setTleInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleParse = () => {
    try {
      const parsed = parseTLE(tleInput, {
        mode: 'permissive',
        includeWarnings: true
      });
      setResult(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div className="tle-parser">
      <h2>TLE Parser</h2>
      <textarea
        value={tleInput}
        onChange={(e) => setTleInput(e.target.value)}
        placeholder="Paste TLE data here..."
        rows={5}
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
      <button onClick={handleParse}>Parse TLE</button>

      {error && (
        <div className="error" style={{ color: 'red' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div className="result">
          <h3>{result.satelliteName || 'Unnamed Satellite'}</h3>
          <table>
            <tbody>
              <tr>
                <td>NORAD ID:</td>
                <td>{result.satelliteNumber1}</td>
              </tr>
              <tr>
                <td>Inclination:</td>
                <td>{result.inclination}°</td>
              </tr>
              <tr>
                <td>Eccentricity:</td>
                <td>0.{result.eccentricity}</td>
              </tr>
              <tr>
                <td>Mean Motion:</td>
                <td>{result.meanMotion} rev/day</td>
              </tr>
              <tr>
                <td>Period:</td>
                <td>{(1440 / parseFloat(result.meanMotion)).toFixed(2)} min</td>
              </tr>
            </tbody>
          </table>

          {result.warnings && result.warnings.length > 0 && (
            <div className="warnings">
              <h4>Warnings:</h4>
              <ul>
                {result.warnings.map((warning, idx) => (
                  <li key={idx}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TLEParser;
```

### Command Line Tool

```javascript
#!/usr/bin/env node

const { parseTLE } = require('tle-parser');
const fs = require('fs');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: parse-tle <file>');
  console.error('       parse-tle --stdin');
  process.exit(1);
}

function displayTLE(parsed) {
  console.log('━'.repeat(60));
  console.log(`Satellite: ${parsed.satelliteName || 'N/A'}`);
  console.log(`NORAD ID: ${parsed.satelliteNumber1}`);
  console.log(`Classification: ${parsed.classification}`);
  console.log(`Int'l Designator: ${parsed.internationalDesignatorYear}${parsed.internationalDesignatorLaunchNumber}${parsed.internationalDesignatorPiece}`);
  console.log();
  console.log('Orbital Elements:');
  console.log(`  Inclination: ${parsed.inclination}°`);
  console.log(`  RAAN: ${parsed.rightAscension}°`);
  console.log(`  Eccentricity: 0.${parsed.eccentricity}`);
  console.log(`  Arg of Perigee: ${parsed.argumentOfPerigee}°`);
  console.log(`  Mean Anomaly: ${parsed.meanAnomaly}°`);
  console.log(`  Mean Motion: ${parsed.meanMotion} rev/day`);
  console.log(`  Period: ${(1440 / parseFloat(parsed.meanMotion)).toFixed(2)} minutes`);

  if (parsed.warnings && parsed.warnings.length > 0) {
    console.log();
    console.log('Warnings:');
    parsed.warnings.forEach(w => {
      console.log(`  ⚠ ${w.message}`);
    });
  }
  console.log('━'.repeat(60));
}

if (args[0] === '--stdin') {
  // Read from stdin
  let input = '';
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const result = parseTLE(input, { mode: 'permissive', includeWarnings: true });
      displayTLE(result);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });
} else {
  // Read from file
  const filePath = args[0];
  const content = fs.readFileSync(filePath, 'utf8');
  const tleBlocks = content.split(/\n\s*\n/);

  tleBlocks.forEach(block => {
    if (block.trim()) {
      try {
        const result = parseTLE(block, { mode: 'permissive', includeWarnings: true });
        displayTLE(result);
      } catch (error) {
        console.error('Error parsing TLE:', error.message);
      }
    }
  });
}
```

---

## Advanced Use Cases

### State Machine Parser with Recovery

```javascript
const { parseWithStateMachine } = require('tle-parser');

// Corrupted TLE missing last few characters
const corruptedTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.493381892524`;

const result = parseWithStateMachine(corruptedTLE, {
  attemptRecovery: true,
  includePartialResults: true,
  maxRecoveryAttempts: 10,
  includeStateHistory: true
});

console.log('Success:', result.success);
console.log('Final state:', result.state);
console.log('Parsed fields:', result.parsedFields);
console.log('Failed fields:', result.failedFields);
console.log('Recovery actions:', result.recoveryActions);

if (result.data) {
  console.log('Extracted satellite number:', result.data.satelliteNumber1);
  console.log('Extracted inclination:', result.data.inclination);
}

if (result.errors.length > 0) {
  console.error('Errors encountered:');
  result.errors.forEach(err => {
    console.error(`  - ${err.code}: ${err.message}`);
  });
}
```

### Custom Validation Pipeline

```javascript
const {
  parseTLELines,
  validateLineStructure,
  validateChecksum,
  validateSatelliteNumber,
  checkEpochWarnings,
  checkOrbitalParameterWarnings
} = require('tle-parser');

function customValidation(tleString) {
  const lines = parseTLELines(tleString);

  if (lines.length < 2) {
    return { valid: false, errors: ['Insufficient lines'] };
  }

  const line1 = lines[lines.length - 2];
  const line2 = lines[lines.length - 1];

  const errors = [];
  const warnings = [];

  // Validate structure
  const struct1 = validateLineStructure(line1, 1);
  const struct2 = validateLineStructure(line2, 2);
  if (!struct1.valid) errors.push(...struct1.errors);
  if (!struct2.valid) errors.push(...struct2.errors);

  // Validate checksums
  const checksum1 = validateChecksum(line1);
  const checksum2 = validateChecksum(line2);
  if (!checksum1.valid) errors.push(checksum1.error);
  if (!checksum2.valid) errors.push(checksum2.error);

  // Validate satellite number
  const satNum = validateSatelliteNumber(line1, line2);
  if (!satNum.valid) errors.push(satNum.error);

  // Collect warnings
  warnings.push(...checkEpochWarnings(line1));
  warnings.push(...checkOrbitalParameterWarnings(line2));

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

const validationResult = customValidation(tleData);
console.log('Valid:', validationResult.valid);
console.log('Errors:', validationResult.errors.length);
console.log('Warnings:', validationResult.warnings.length);
```

### Performance Monitoring

```javascript
const { parseTLE } = require('tle-parser');

function benchmarkParser(tleData, iterations = 1000) {
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    parseTLE(tleData);
  }

  const end = Date.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  return {
    totalTime: totalTime + 'ms',
    avgTime: avgTime.toFixed(3) + 'ms',
    throughput: (iterations / totalTime * 1000).toFixed(0) + ' TLEs/sec'
  };
}

const stats = benchmarkParser(issTLE);
console.log('Benchmark results:', stats);
```

---

## See Also

- [API Reference](../api/API_REFERENCE.md) - Complete API documentation
- [Error Handling Guide](ERROR_HANDLING.md) - Comprehensive error handling patterns
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Performance Guide](PERFORMANCE.md) - Optimization strategies
