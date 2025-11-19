# Troubleshooting Guide

Solutions to common problems when working with the TLE parser.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Parsing Errors](#parsing-errors)
- [Data Quality Issues](#data-quality-issues)
- [Performance Problems](#performance-problems)
- [Integration Issues](#integration-issues)
- [Common Mistakes](#common-mistakes)
- [Debugging Tips](#debugging-tips)

---

## Installation Issues

### NPM Install Fails

**Problem:** `npm install tle-parser` fails

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Try with specific registry
npm install tle-parser --registry https://registry.npmjs.org/

# Check node version (requires Node.js >= 12)
node --version

# Update npm
npm install -g npm@latest
```

---

### TypeScript Definition Errors

**Problem:** TypeScript can't find type definitions

**Solution:**

```bash
# Ensure you have TypeScript installed
npm install --save-dev typescript

# Check that @types are installed (they're included in the package)
npm list tle-parser
```

```typescript
// Make sure you're importing correctly
import { parseTLE, ParsedTLE } from 'tle-parser';  // Correct
// NOT: import * as TLEParser from 'tle-parser';   // May cause issues
```

---

### Module Resolution Errors

**Problem:** "Cannot find module 'tle-parser'"

**Solution:**

```bash
# Check if installed
npm list tle-parser

# Reinstall
npm uninstall tle-parser
npm install tle-parser

# If using yarn
yarn remove tle-parser
yarn add tle-parser
```

---

## Parsing Errors

### "TLE input must be a string"

**Problem:** Passing wrong data type

**Solution:**

```javascript
// Wrong
parseTLE(null);
parseTLE(undefined);
parseTLE(123);

// Correct
parseTLE(tleString);
parseTLE(Buffer.from(data).toString());  // If from file
parseTLE(response.text());  // If from fetch
```

---

### "TLE input cannot be empty"

**Problem:** Empty or whitespace-only string

**Solution:**

```javascript
// Check before parsing
if (tleData && tleData.trim()) {
  const result = parseTLE(tleData);
} else {
  console.error('No TLE data provided');
}

// When reading from file
const fs = require('fs');
const data = fs.readFileSync('tle.txt', 'utf8').trim();
if (data) {
  parseTLE(data);
}
```

---

### "TLE must have exactly 2 data lines"

**Problem:** Wrong number of lines

**Causes & Solutions:**

```javascript
// Cause 1: Single line
const oneLine = '1 25544U 98067A   20300.83097691...';
// Solution: Need both lines
const twoLines = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

// Cause 2: Extra blank lines
const extraLines = `

1 25544U...
2 25544...

`;
// Solution: Parser handles this automatically, but ensure data is complete

// Cause 3: More than 3 lines
const tooMany = `Line 0
Line 1
Line 2
Line 3`;
// Solution: Remove extra lines, keep only name (optional) + 2 TLE lines
```

---

### "TLE line must be exactly 69 characters"

**Problem:** Line is too short or too long

**Causes & Solutions:**

```javascript
// Cause 1: Line truncated
const shortLine = '1 25544U 98067A   20300.83097691';
// Solution: Get complete TLE from source

// Cause 2: Extra spaces at end
const extraSpaces = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996   ';
// Solution: Parser auto-trims, but check your source

// Cause 3: Tabs instead of spaces
const tabbed = '1\t25544U...';
// Solution: Convert tabs to spaces
const fixed = tabbed.replace(/\t/g, ' ');

// Debug: Check line length
console.log('Line length:', line.length);
console.log('Should be: 69');
```

---

### "Checksum validation failed"

**Problem:** Checksum doesn't match calculated value

**Solutions:**

```javascript
// Solution 1: Use permissive mode
const result = parseTLE(tleData, { mode: 'permissive' });
// Data returned with warning instead of error

// Solution 2: Disable checksum validation
const result = parseTLE(tleData, { strictChecksums: false });

// Solution 3: Fix the checksum
const { calculateChecksum } = require('tle-parser');
const lineWithoutChecksum = line.substring(0, 68);
const correctChecksum = calculateChecksum(lineWithoutChecksum);
const fixedLine = lineWithoutChecksum + correctChecksum;

// Solution 4: Verify data source
// Checksum errors often indicate data corruption
// Try re-downloading from source
```

---

### "Satellite numbers must match between lines"

**Problem:** Different satellite numbers in line 1 and line 2

**Causes:**

1. Data corruption
2. Mixed TLEs from different satellites
3. Manual editing error

**Solutions:**

```javascript
// Debug: Check satellite numbers
const lines = tleData.split('\n');
const satNum1 = lines[0].substring(2, 7);
const satNum2 = lines[1].substring(2, 7);
console.log('Line 1 sat #:', satNum1);
console.log('Line 2 sat #:', satNum2);

// If they don't match, you have mixed TLE lines
// Ensure you're parsing complete, unmixed TLEs

// Solution: Use permissive mode if you need partial data
const result = parseTLE(tleData, { mode: 'permissive' });
```

---

### "Classification must be U, C, or S"

**Problem:** Invalid classification character

**Solution:**

```javascript
// Check classification (column 8 of line 1)
const classification = line1[7];
console.log('Classification:', classification);

// Valid: U, C, S
// If you see something else, the TLE is corrupted

// Workaround: Manual fix if you know the correct classification
const fixedLine1 = line1.substring(0, 7) + 'U' + line1.substring(8);
```

---

## Data Quality Issues

### Stale TLE Warnings

**Problem:** "TLE data is stale (more than 30 days old)"

**Impact:** Reduced accuracy for current predictions

**Solutions:**

```javascript
// Solution 1: Get fresh TLE data
// Sources:
// - https://celestrak.org/
// - https://www.space-track.org/ (requires free account)

// Solution 2: Accept stale data for historical analysis
const result = parseTLE(staleTLE, {
  mode: 'permissive',
  includeWarnings: true
});

if (result.warnings) {
  const staleWarning = result.warnings.find(w => w.code === 'STALE_TLE_WARNING');
  if (staleWarning) {
    console.warn('Using stale TLE - expect reduced accuracy');
  }
}

// Solution 3: Implement auto-update
async function getLatestTLE(noradId) {
  const response = await fetch(
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`
  );
  return response.text();
}
```

---

### High Eccentricity Warnings

**Problem:** Eccentricity > 0.25

**Impact:** May indicate highly elliptical orbit (HEO) requiring special handling

**Solution:**

```javascript
const result = parseTLE(tleData, { includeWarnings: true });

if (result.warnings) {
  const highEcc = result.warnings.find(w => w.code === 'HIGH_ECCENTRICITY_WARNING');
  if (highEcc) {
    console.warn('Highly elliptical orbit detected');
    // Use deep-space propagator if implementing SGP4/SDP4
    // Be aware of large altitude variations
  }
}
```

---

### Classified Data Warnings

**Problem:** Classification is 'C' or 'S'

**Impact:** TLE may have intentionally reduced accuracy

**Solution:**

```javascript
// Classified TLEs often have:
// - Reduced precision
// - Delayed updates
// - Intentional errors

// Accept the limitations
const result = parseTLE(classifiedTLE, {
  mode: 'permissive',
  includeWarnings: true
});

if (result.classification !== 'U') {
  console.warn('Classified TLE - accuracy may be limited');
  // Don't use for critical applications
}
```

---

## Performance Problems

### Slow Parsing of Large Files

**Problem:** Parsing thousands of TLEs is slow

**Solution:**

```javascript
// Solution 1: Batch processing with async
const fs = require('fs').promises;

async function parseLargeTLEFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const tleBlocks = content.split(/\n\s*\n/);

  const results = [];

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < tleBlocks.length; i += batchSize) {
    const batch = tleBlocks.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (block) => {
        try {
          return parseTLE(block.trim());
        } catch (error) {
          return null;
        }
      })
    );

    results.push(...batchResults.filter(Boolean));

    // Allow event loop to process other tasks
    await new Promise(resolve => setImmediate(resolve));
  }

  return results;
}

// Solution 2: Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');

// worker.js
const { parentPort } = require('worker_threads');
const { parseTLE } = require('tle-parser');

parentPort.on('message', (tleData) => {
  try {
    const result = parseTLE(tleData);
    parentPort.postMessage({ success: true, data: result });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
});

// Solution 3: Parse only what you need
const { validateTLE } = require('tle-parser');

// Quick validation without full parsing
const isValid = validateTLE(tleData).valid;
if (isValid) {
  // Only parse if valid
  const result = parseTLE(tleData);
}
```

---

### Memory Issues with Large Datasets

**Problem:** Out of memory when processing many TLEs

**Solution:**

```javascript
// Solution 1: Streaming processing
const fs = require('fs');
const readline = require('readline');

async function processLargeTLEFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let buffer = [];

  for await (const line of rl) {
    buffer.push(line);

    // Process when we have 2-3 lines
    if (buffer.length === 3 || (buffer.length === 2 && buffer[0][0] === '1')) {
      const tleData = buffer.join('\n');
      try {
        const result = parseTLE(tleData);
        // Process result immediately, don't store all in memory
        await processSatellite(result);
      } catch (error) {
        // Handle error
      }
      buffer = [];
    }
  }
}

// Solution 2: Only keep what you need
const satellites = tleBlocks.map(block => {
  const parsed = parseTLE(block);
  // Only extract fields you need
  return {
    id: parsed.satelliteNumber1,
    name: parsed.satelliteName,
    period: 1440 / parseFloat(parsed.meanMotion)
  };
});
```

---

## Integration Issues

### CORS Errors When Fetching TLEs

**Problem:** Browser CORS errors when fetching from external sources

**Solution:**

```javascript
// Solution 1: Use server-side proxy
// Backend (Express.js)
app.get('/api/tle/:noradId', async (req, res) => {
  const noradId = req.params.noradId;
  const response = await fetch(
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`
  );
  const tle = await response.text();
  res.send(tle);
});

// Frontend
const response = await fetch(`/api/tle/25544`);
const tle = await response.text();
const result = parseTLE(tle);

// Solution 2: Use CORS proxy (development only)
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const tleUrl = 'https://celestrak.org/...';
const response = await fetch(proxyUrl + tleUrl);

// Solution 3: Download and serve TLEs locally
```

---

### Webpack/Bundle Size Issues

**Problem:** Parser increases bundle size significantly

**Solution:**

```javascript
// Solution 1: Use dynamic imports
const loadParser = async () => {
  const { parseTLE } = await import('tle-parser');
  return parseTLE;
};

// Use when needed
const parseTLE = await loadParser();
const result = parseTLE(tleData);

// Solution 2: Server-side parsing
// Move TLE parsing to backend API
// Frontend only receives processed data

// Solution 3: Tree shaking
// Import only what you need
import { parseTLE } from 'tle-parser';
// NOT: import * as TLEParser from 'tle-parser';
```

---

### React/Vue State Management

**Problem:** Warnings array causes re-render issues

**Solution:**

```javascript
// React - memoize warnings
import { useMemo } from 'react';

function TLEComponent({ tleData }) {
  const parsed = useMemo(() => {
    try {
      return parseTLE(tleData, { includeWarnings: true });
    } catch (error) {
      return null;
    }
  }, [tleData]);

  // Use parsed.warnings
}

// Vue - use computed
export default {
  data() {
    return {
      tleData: ''
    };
  },
  computed: {
    parsedTLE() {
      try {
        return parseTLE(this.tleData, { includeWarnings: true });
      } catch (error) {
        return null;
      }
    },
    warnings() {
      return this.parsedTLE?.warnings || [];
    }
  }
};
```

---

## Common Mistakes

### Assuming Decimal Points

**Mistake:** Treating eccentricity as integer

```javascript
// Wrong
const eccentricity = parseInt(result.eccentricity);  // 1671

// Correct
const eccentricity = parseFloat('0.' + result.eccentricity);  // 0.0001671
```

---

### Incorrect Date Parsing

**Mistake:** Wrong epoch calculation

```javascript
// Wrong
const year = parseInt(result.epochYear);  // 20 (not a full year!)

// Correct - handle two-digit year
const year = parseInt(result.epochYear);
const fullYear = year < 57 ? 2000 + year : 1900 + year;  // 2020
```

---

### Not Handling Line Endings

**Mistake:** Assuming specific line ending format

```javascript
// Wrong
const lines = tleData.split('\n');  // May fail on Windows (\r\n)

// Correct - parser handles this automatically
const result = parseTLE(tleData);

// Or normalize yourself
const normalized = tleData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
```

---

### Ignoring Warnings

**Mistake:** Not checking warnings on successful parse

```javascript
// Wrong
const result = parseTLE(tleData);
useSatelliteData(result);  // May have warnings!

// Correct
const result = parseTLE(tleData, { includeWarnings: true });
if (result.warnings && result.warnings.length > 0) {
  console.warn('Parse succeeded with warnings:', result.warnings);
  // Decide if data is acceptable
}
useSatelliteData(result);
```

---

### Mixing TLE Lines

**Mistake:** Combining lines from different satellites

```javascript
// Wrong
const line1FromISS = '1 25544U 98067A...';
const line2FromHubble = '2 20580...';
const badTLE = line1FromISS + '\n' + line2FromHubble;
// This will fail with SATELLITE_NUMBER_MISMATCH

// Correct
// Always keep TLE lines together as received from source
```

---

## Debugging Tips

### Enable Verbose Logging

```javascript
function debugParseTLE(tleData) {
  console.log('=== TLE Parsing Debug ===');
  console.log('Input length:', tleData.length);
  console.log('Input (first 100 chars):', tleData.substring(0, 100));

  const lines = tleData.split(/\r?\n/);
  console.log('Number of lines:', lines.length);
  lines.forEach((line, idx) => {
    console.log(`Line ${idx}: length=${line.length}, content="${line}"`);
  });

  try {
    const result = parseTLE(tleData, {
      mode: 'permissive',
      includeWarnings: true
    });
    console.log('✓ Parse successful');
    console.log('Warnings:', result.warnings?.length || 0);
    return result;
  } catch (error) {
    console.error('✗ Parse failed');
    if (error instanceof TLEValidationError) {
      console.error('Errors:', error.errors);
      console.error('Warnings:', error.warnings);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}
```

---

### Validate Individual Components

```javascript
const {
  validateLineStructure,
  validateChecksum,
  validateSatelliteNumber
} = require('tle-parser');

function debugValidation(line1, line2) {
  console.log('=== Validation Debug ===');

  // Check line 1 structure
  const struct1 = validateLineStructure(line1, 1);
  console.log('Line 1 structure:', struct1.valid);
  if (!struct1.valid) console.error('  Errors:', struct1.errors);

  // Check line 2 structure
  const struct2 = validateLineStructure(line2, 2);
  console.log('Line 2 structure:', struct2.valid);
  if (!struct2.valid) console.error('  Errors:', struct2.errors);

  // Check checksums
  const check1 = validateChecksum(line1);
  console.log('Line 1 checksum:', check1.valid, `(expected: ${check1.expected}, actual: ${check1.actual})`);

  const check2 = validateChecksum(line2);
  console.log('Line 2 checksum:', check2.valid, `(expected: ${check2.expected}, actual: ${check2.actual})`);

  // Check satellite numbers
  const satNum = validateSatelliteNumber(line1, line2);
  console.log('Satellite numbers match:', satNum.valid);
  if (!satNum.valid) {
    console.error(`  Line 1: ${satNum.satelliteNumber1}`);
    console.error(`  Line 2: ${satNum.satelliteNumber2}`);
  }
}
```

---

### Test with Known Good TLE

```javascript
// ISS TLE (known good format)
const testTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

// Test your parsing logic
try {
  const result = parseTLE(testTLE);
  console.log('✓ Parser is working');
  console.log('Satellite:', result.satelliteName);
} catch (error) {
  console.error('✗ Parser has issues:', error);
}
```

---

### Compare with Reference Implementation

```javascript
// Compare with satellite.js or another TLE parser
const { parseTLE } = require('tle-parser');
const satellite = require('satellite.js');

const satrec = satellite.twoline2satrec(line1, line2);
const ourResult = parseTLE(line1 + '\n' + line2);

console.log('satellite.js inclination:', satrec.inclo * (180 / Math.PI));
console.log('tle-parser inclination:', parseFloat(ourResult.inclination));
// Should be very close
```

---

## Getting Help

If you're still stuck:

1. **Check Documentation:**
   - [API Reference](../api/API_REFERENCE.md)
   - [Usage Examples](USAGE_EXAMPLES.md)
   - [Error Handling Guide](ERROR_HANDLING.md)

2. **Search Issues:**
   - GitHub Issues: https://github.com/your-repo/tle-parser/issues

3. **Ask for Help:**
   - Create a new GitHub issue with:
     - Your TLE data (if not sensitive)
     - Error messages
     - Code snippet showing the problem
     - Expected vs actual behavior

4. **Minimal Reproducible Example:**

```javascript
const { parseTLE } = require('tle-parser');

const tleData = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
  const result = parseTLE(tleData);
  console.log(result);
} catch (error) {
  console.error('Error:', error);
  console.error('Error details:', error.errors || error.message);
}
```

---

## See Also

- [API Reference](../api/API_REFERENCE.md)
- [Error Handling Guide](ERROR_HANDLING.md)
- [Usage Examples](USAGE_EXAMPLES.md)
- [FAQ](../FAQ.md)
