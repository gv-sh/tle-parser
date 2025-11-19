# Error Handling Guide

Comprehensive guide to handling errors and warnings in the TLE parser.

## Table of Contents

- [Error Types](#error-types)
- [Error Codes Reference](#error-codes-reference)
- [Warning Codes Reference](#warning-codes-reference)
- [Handling Patterns](#handling-patterns)
- [Parsing Modes](#parsing-modes)
- [Error Recovery](#error-recovery)
- [Best Practices](#best-practices)

---

## Error Types

### TLEValidationError

Thrown when TLE validation fails in strict mode.

```typescript
class TLEValidationError extends Error {
  errors: readonly TLEError[];     // All errors encountered
  warnings: readonly TLEWarning[]; // Warnings (if any)
}
```

**Example:**

```javascript
const { parseTLE, TLEValidationError } = require('tle-parser');

try {
  parseTLE(invalidTLE);
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error('Validation failed');
    error.errors.forEach(err => {
      console.error(`${err.code}: ${err.message}`);
    });
  }
}
```

---

### TLEFormatError

Thrown when TLE format is fundamentally invalid (e.g., wrong input type).

```typescript
class TLEFormatError extends Error {
  code: string;                        // Error code
  details: Record<string, unknown>;    // Additional context
}
```

**Example:**

```javascript
const { parseTLE, TLEFormatError } = require('tle-parser');

try {
  parseTLE(null);  // Invalid input type
} catch (error) {
  if (error instanceof TLEFormatError) {
    console.error(`Format error: ${error.code}`);
    console.error('Details:', error.details);
  }
}
```

---

### TLEError Interface

Base structure for all errors and warnings.

```typescript
interface TLEError {
  code: string;                        // Machine-readable code
  message: string;                     // Human-readable message
  line?: number;                       // Line number (1 or 2)
  field?: string;                      // Field name
  expected?: unknown;                  // Expected value
  actual?: unknown;                    // Actual value
  severity: 'error' | 'warning' | 'info';
  position?: number;                   // Character position
  details?: Record<string, unknown>;   // Additional context
}
```

---

### TLEWarning Interface

Non-critical issues that don't prevent parsing.

```typescript
interface TLEWarning extends TLEError {
  severity: 'warning';
}
```

---

## Error Codes Reference

### Input and Structure Errors

#### INVALID_INPUT_TYPE

**Severity:** Error
**Description:** Input is not a string

```javascript
// Triggers:
parseTLE(null);
parseTLE(123);
parseTLE({});

// Error details:
{
  code: 'INVALID_INPUT_TYPE',
  message: 'TLE input must be a string',
  severity: 'error',
  details: {
    receivedType: 'object'
  }
}
```

---

#### EMPTY_INPUT

**Severity:** Error
**Description:** Input string is empty or only whitespace

```javascript
// Triggers:
parseTLE('');
parseTLE('   ');

// Error details:
{
  code: 'EMPTY_INPUT',
  message: 'TLE input cannot be empty',
  severity: 'error'
}
```

---

#### INVALID_LINE_COUNT

**Severity:** Error
**Description:** Wrong number of TLE data lines

```javascript
// Triggers:
parseTLE('1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996');
// Only 1 line, need 2

// Error details:
{
  code: 'INVALID_LINE_COUNT',
  message: 'TLE must have exactly 2 data lines',
  severity: 'error',
  expected: 2,
  actual: 1
}
```

---

#### INVALID_LINE_LENGTH

**Severity:** Error
**Description:** Line is not exactly 69 characters

```javascript
// Triggers:
const shortLine = '1 25544U 98067A   20300.83097691';  // Too short

// Error details:
{
  code: 'INVALID_LINE_LENGTH',
  message: 'TLE line must be exactly 69 characters',
  severity: 'error',
  line: 1,
  expected: 69,
  actual: 32
}
```

---

#### INVALID_LINE_NUMBER

**Severity:** Error
**Description:** Line doesn't start with correct line number

```javascript
// Triggers:
const badLine = '3 25544U 98067A...';  // Should be "1" or "2"

// Error details:
{
  code: 'INVALID_LINE_NUMBER',
  message: 'Invalid line number',
  severity: 'error',
  line: 1,
  expected: '1',
  actual: '3'
}
```

---

### Checksum Errors

#### CHECKSUM_MISMATCH

**Severity:** Error (strict) / Warning (permissive)
**Description:** Calculated checksum doesn't match

```javascript
// Triggers:
const badChecksum = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995';
// Last digit should be 6, not 5

// Error details:
{
  code: 'CHECKSUM_MISMATCH',
  message: 'Checksum validation failed',
  severity: 'error',
  line: 1,
  expected: 6,
  actual: 5
}

// In permissive mode:
const result = parseTLE(badChecksum, { mode: 'permissive' });
// Returns data with warning instead of throwing
```

---

#### INVALID_CHECKSUM_CHARACTER

**Severity:** Error
**Description:** Last character is not a digit

```javascript
// Triggers:
const badChar = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999X';

// Error details:
{
  code: 'INVALID_CHECKSUM_CHARACTER',
  message: 'Checksum must be a single digit',
  severity: 'error',
  line: 1,
  actual: 'X'
}
```

---

### Field Validation Errors

#### SATELLITE_NUMBER_MISMATCH

**Severity:** Error
**Description:** Satellite numbers differ between lines

```javascript
// Triggers:
const mismatch = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25545  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
// Line 2 has 25545 instead of 25544

// Error details:
{
  code: 'SATELLITE_NUMBER_MISMATCH',
  message: 'Satellite numbers must match between lines',
  severity: 'error',
  field: 'satelliteNumber',
  expected: '25544',
  actual: '25545'
}
```

---

#### INVALID_SATELLITE_NUMBER

**Severity:** Error
**Description:** Satellite number is not 5 digits

```javascript
// Triggers:
const badSatNum = '1 ABC45U 98067A...';

// Error details:
{
  code: 'INVALID_SATELLITE_NUMBER',
  message: 'Satellite number must be 5 digits',
  severity: 'error',
  line: 1,
  actual: 'ABC45'
}
```

---

#### INVALID_CLASSIFICATION

**Severity:** Error
**Description:** Classification is not U, C, or S

```javascript
// Triggers:
const badClass = '1 25544X 98067A...';  // 'X' is not valid

// Error details:
{
  code: 'INVALID_CLASSIFICATION',
  message: 'Classification must be U, C, or S',
  severity: 'error',
  line: 1,
  field: 'classification',
  expected: ['U', 'C', 'S'],
  actual: 'X'
}
```

---

#### VALUE_OUT_OF_RANGE

**Severity:** Error
**Description:** Numeric value outside valid range

```javascript
// Triggers:
const badInclination = '2 25544  185.6453  57.0843...';
// Inclination > 180°

// Error details:
{
  code: 'VALUE_OUT_OF_RANGE',
  message: 'Value out of valid range',
  severity: 'error',
  line: 2,
  field: 'inclination',
  min: 0,
  max: 180,
  actual: 185.6453
}
```

---

#### INVALID_NUMBER_FORMAT

**Severity:** Error
**Description:** Field is not a valid number

```javascript
// Triggers:
const badNumber = '2 25544  XX.XXXX  57.0843...';

// Error details:
{
  code: 'INVALID_NUMBER_FORMAT',
  message: 'Invalid number format',
  severity: 'error',
  line: 2,
  field: 'inclination',
  actual: 'XX.XXXX'
}
```

---

#### SATELLITE_NAME_TOO_LONG

**Severity:** Warning
**Description:** Satellite name exceeds typical length

```javascript
// Triggers:
const longName = 'A'.repeat(100) + '\n1 25544U...';

// Warning details:
{
  code: 'SATELLITE_NAME_TOO_LONG',
  message: 'Satellite name exceeds recommended length',
  severity: 'warning',
  field: 'satelliteName',
  actual: 100,
  expected: 24
}
```

---

## Warning Codes Reference

### CLASSIFIED_DATA_WARNING

**Description:** TLE contains classified or secret data

```javascript
// Triggers:
const classified = '1 25544C 98067A...';  // Classification = 'C'
const secret = '1 25544S 98067A...';      // Classification = 'S'

// Warning:
{
  code: 'CLASSIFIED_DATA_WARNING',
  message: 'TLE contains classified data (accuracy may be reduced)',
  severity: 'warning',
  field: 'classification',
  actual: 'C'
}
```

---

### STALE_TLE_WARNING

**Description:** TLE epoch is more than 30 days old

```javascript
// Triggers when epoch is > 30 days in the past

// Warning:
{
  code: 'STALE_TLE_WARNING',
  message: 'TLE data is stale (more than 30 days old)',
  severity: 'warning',
  field: 'epoch',
  details: {
    ageInDays: 45
  }
}
```

**Impact:** Older TLEs have reduced accuracy for current predictions.

---

### HIGH_ECCENTRICITY_WARNING

**Description:** Eccentricity > 0.25

```javascript
// Triggers:
const highEcc = '2 25544  51.6453  57.0843 3000000...';
// Eccentricity = 0.3

// Warning:
{
  code: 'HIGH_ECCENTRICITY_WARNING',
  message: 'High orbital eccentricity detected',
  severity: 'warning',
  field: 'eccentricity',
  actual: 0.3,
  threshold: 0.25
}
```

**Impact:** Highly elliptical orbits may have reduced propagation accuracy.

---

### LOW_MEAN_MOTION_WARNING

**Description:** Mean motion < 1.0 rev/day

```javascript
// Triggers:
const lowMM = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 0.50000000252428';
// Mean motion = 0.5 rev/day

// Warning:
{
  code: 'LOW_MEAN_MOTION_WARNING',
  message: 'Low mean motion (high altitude orbit)',
  severity: 'warning',
  field: 'meanMotion',
  actual: 0.5,
  threshold: 1.0
}
```

**Impact:** High-altitude orbits (GEO, HEO) may require deep-space propagator.

---

### DEPRECATED_EPOCH_YEAR_WARNING

**Description:** Epoch year is in the 1900s

```javascript
// Triggers:
const oldEpoch = '1 25544U 98067A   95300.83097691...';
// Year = 95 → 1995

// Warning:
{
  code: 'DEPRECATED_EPOCH_YEAR_WARNING',
  message: 'Epoch year is in the 1900s',
  severity: 'warning',
  field: 'epochYear',
  actual: 1995
}
```

---

### REVOLUTION_NUMBER_ROLLOVER_WARNING

**Description:** Revolution number > 99,000 (approaching rollover)

```javascript
// Triggers:
const highRevs = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.4933818999500';
// Rev number = 99500

// Warning:
{
  code: 'REVOLUTION_NUMBER_ROLLOVER_WARNING',
  message: 'Revolution number approaching rollover limit',
  severity: 'warning',
  field: 'revolutionNumber',
  actual: 99500,
  max: 99999
}
```

---

### NEAR_ZERO_DRAG_WARNING

**Description:** B* drag term is zero or very small

```javascript
// Triggers:
const noDrag = '1 25544U 98067A   20300.83097691  .00001534  00000-0  00000-0 0  9996';
// B* = 0

// Warning:
{
  code: 'NEAR_ZERO_DRAG_WARNING',
  message: 'B* drag term is zero or negligible',
  severity: 'warning',
  field: 'bStar',
  actual: 0
}
```

---

### NON_STANDARD_EPHEMERIS_WARNING

**Description:** Ephemeris type is not 0

```javascript
// Triggers:
const nonStd = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 4  9996';
// Ephemeris type = 4

// Warning:
{
  code: 'NON_STANDARD_EPHEMERIS_WARNING',
  message: 'Non-standard ephemeris type',
  severity: 'warning',
  field: 'ephemerisType',
  actual: '4',
  expected: '0'
}
```

---

### NEGATIVE_DECAY_WARNING

**Description:** First derivative is negative (orbit decaying)

```javascript
// Triggers:
const decay = '1 25544U 98067A   20300.83097691 -.00001534  00000-0  35580-4 0  9996';
// First derivative is negative

// Warning:
{
  code: 'NEGATIVE_DECAY_WARNING',
  message: 'Negative orbital decay detected',
  severity: 'warning',
  field: 'firstDerivative',
  actual: -0.00001534
}
```

**Meaning:** Orbit is decaying due to atmospheric drag.

---

## Handling Patterns

### Basic Try-Catch

```javascript
const { parseTLE, TLEValidationError } = require('tle-parser');

try {
  const result = parseTLE(tleData);
  // Use result
} catch (error) {
  if (error instanceof TLEValidationError) {
    // Handle validation errors
    console.error('Validation failed:', error.errors);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

---

### Error Categorization

```javascript
try {
  const result = parseTLE(tleData);
} catch (error) {
  if (error instanceof TLEValidationError) {
    // Separate critical errors from warnings
    const critical = error.errors.filter(e => e.severity === 'error');
    const warnings = error.errors.filter(e => e.severity === 'warning');

    if (critical.length > 0) {
      console.error('Critical errors:');
      critical.forEach(e => console.error(`  - ${e.code}: ${e.message}`));
    }

    if (warnings.length > 0) {
      console.warn('Warnings:');
      warnings.forEach(w => console.warn(`  - ${w.code}: ${w.message}`));
    }
  }
}
```

---

### Specific Error Handling

```javascript
try {
  const result = parseTLE(tleData);
} catch (error) {
  if (error instanceof TLEValidationError) {
    const hasChecksumError = error.errors.some(e => e.code === 'CHECKSUM_MISMATCH');
    const hasSatNumMismatch = error.errors.some(e => e.code === 'SATELLITE_NUMBER_MISMATCH');

    if (hasChecksumError) {
      console.error('Data integrity issue: checksum mismatch');
      // Maybe retry download
    }

    if (hasSatNumMismatch) {
      console.error('Data corruption: satellite number mismatch');
      // This is more serious
    }
  }
}
```

---

### Permissive Mode with Warning Handling

```javascript
const result = parseTLE(tleData, { mode: 'permissive' });

// Check for warnings
if (result.warnings && result.warnings.length > 0) {
  const staleWarning = result.warnings.find(w => w.code === 'STALE_TLE_WARNING');
  if (staleWarning) {
    console.warn('TLE is stale - consider updating');
  }

  const classifiedWarning = result.warnings.find(w => w.code === 'CLASSIFIED_DATA_WARNING');
  if (classifiedWarning) {
    console.warn('TLE is classified - accuracy may be reduced');
  }
}

// Use the data
console.log('Satellite:', result.satelliteName);
```

---

### Graceful Degradation

```javascript
function parseTLESafely(tleData) {
  try {
    // Try strict mode first
    return {
      success: true,
      data: parseTLE(tleData),
      mode: 'strict'
    };
  } catch (error) {
    // Fall back to permissive mode
    try {
      const result = parseTLE(tleData, { mode: 'permissive' });
      return {
        success: true,
        data: result,
        mode: 'permissive',
        warnings: result.warnings
      };
    } catch (permissiveError) {
      // Even permissive mode failed
      return {
        success: false,
        error: permissiveError,
        mode: 'failed'
      };
    }
  }
}

const result = parseTLESafely(tleData);
if (result.success) {
  console.log(`Parsed in ${result.mode} mode`);
  // Use result.data
} else {
  console.error('Parsing failed completely');
}
```

---

### Async Error Handling

```javascript
async function fetchAndParseTLE(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const tleData = await response.text();
    const parsed = parseTLE(tleData, {
      mode: 'permissive',
      includeWarnings: true
    });

    return {
      success: true,
      data: parsed,
      warnings: parsed.warnings || []
    };
  } catch (error) {
    if (error instanceof TLEValidationError) {
      return {
        success: false,
        validationErrors: error.errors,
        warnings: error.warnings
      };
    } else {
      return {
        success: false,
        networkError: error.message
      };
    }
  }
}
```

---

## Parsing Modes

### Strict Mode (Default)

```javascript
// Strict mode - any validation error throws
const result = parseTLE(tleData);
// or
const result = parseTLE(tleData, { mode: 'strict' });
```

**Behavior:**
- Throws on any validation error
- Warnings still included in successful parses
- Best for critical applications

**Use when:**
- Data integrity is critical
- You want to catch all issues immediately
- You're validating TLE quality

---

### Permissive Mode

```javascript
// Permissive mode - tries to extract data even with errors
const result = parseTLE(tleData, { mode: 'permissive' });
```

**Behavior:**
- Returns data even with non-critical errors
- Errors become warnings
- Still throws on fundamental format issues

**Use when:**
- Working with historical or imperfect data
- You need best-effort parsing
- Partial data is better than no data

**Still throws on:**
- Invalid input type
- Empty input
- Completely malformed data

---

## Error Recovery

### Using State Machine Parser

```javascript
const { parseWithStateMachine } = require('tle-parser');

const result = parseWithStateMachine(corruptedTLE, {
  attemptRecovery: true,
  includePartialResults: true,
  maxRecoveryAttempts: 10
});

if (result.success) {
  console.log('Fully recovered:', result.data);
} else if (result.data) {
  console.log('Partial recovery:', result.parsedFields);
  console.log('Failed fields:', result.failedFields);
  // Use partial data carefully
} else {
  console.error('Recovery failed:', result.errors);
}
```

---

### Custom Recovery Logic

```javascript
function parseWithFallback(tleData) {
  // Try standard parser
  try {
    return parseTLE(tleData);
  } catch (primaryError) {
    // Try permissive mode
    try {
      return parseTLE(tleData, { mode: 'permissive' });
    } catch (permissiveError) {
      // Try state machine
      const stateMachineResult = parseWithStateMachine(tleData, {
        attemptRecovery: true,
        includePartialResults: true
      });

      if (stateMachineResult.data) {
        return stateMachineResult.data;
      }

      // All methods failed
      throw new Error('All parsing methods failed');
    }
  }
}
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
// Bad
const result = parseTLE(tleData);  // May throw

// Good
try {
  const result = parseTLE(tleData);
  // Use result
} catch (error) {
  // Handle error
}
```

---

### 2. Check Warnings Even on Success

```javascript
const result = parseTLE(tleData, { includeWarnings: true });

if (result.warnings && result.warnings.length > 0) {
  // Log or handle warnings
  console.warn(`Parsed with ${result.warnings.length} warnings`);
}
```

---

### 3. Use Appropriate Mode for Your Use Case

```javascript
// Critical satellite operations - use strict
const criticalResult = parseTLE(tleData, { mode: 'strict' });

// Historical data analysis - use permissive
const historicalResult = parseTLE(tleData, { mode: 'permissive' });
```

---

### 4. Provide Context in Error Messages

```javascript
try {
  const result = parseTLE(tleData);
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error(`Failed to parse TLE for satellite ${satelliteName}:`);
    error.errors.forEach(e => {
      console.error(`  Line ${e.line}, field ${e.field}: ${e.message}`);
    });
  }
}
```

---

### 5. Log Errors for Debugging

```javascript
const winston = require('winston');

try {
  const result = parseTLE(tleData);
} catch (error) {
  if (error instanceof TLEValidationError) {
    winston.error('TLE validation failed', {
      errorCount: error.errors.length,
      errors: error.errors.map(e => ({
        code: e.code,
        message: e.message,
        line: e.line,
        field: e.field
      })),
      tleData: tleData.substring(0, 100) // Log first 100 chars
    });
  }
}
```

---

### 6. Validate Before Processing

```javascript
const { validateTLE, parseTLE } = require('tle-parser');

// Quick validation check
const validation = validateTLE(tleData);

if (validation.valid) {
  // Safe to parse
  const result = parseTLE(tleData);
  processSatellite(result);
} else {
  console.error('Invalid TLE:', validation.errors);
  // Don't waste time on full parse
}
```

---

### 7. Type Guards for TypeScript

```typescript
import { parseTLE, TLEValidationError, TLEFormatError } from 'tle-parser';

function handleTLEError(error: unknown): void {
  if (error instanceof TLEValidationError) {
    console.error('Validation:', error.errors);
  } else if (error instanceof TLEFormatError) {
    console.error('Format:', error.code, error.details);
  } else if (error instanceof Error) {
    console.error('Other:', error.message);
  } else {
    console.error('Unknown error');
  }
}
```

---

## See Also

- [API Reference](../api/API_REFERENCE.md) - Complete API documentation
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [Usage Examples](USAGE_EXAMPLES.md) - Practical examples
