# TLE Parser

A robust parser for TLE (Two-Line Element) satellite data with comprehensive input validation.

## Features

- Parse TLE data with or without satellite name (2 or 3 line format)
- Comprehensive format validation
- NORAD checksum verification
- Field range validation
- Satellite number consistency checking
- Classification validation
- Deprecation and unusual value warnings
- Flexible validation options

## Installation

Clone the repository:

```bash
git clone https://github.com/gv-sh/tle-parser.git
cd tle-parser
npm install
```

## Usage

### Basic Parsing with Validation

```javascript
const { parseTLE } = require('tle-parser');

const tleData = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
    const result = parseTLE(tleData);
    console.log(result);
    // Output includes all parsed TLE fields:
    // {
    //   satelliteName: null,
    //   lineNumber1: '1',
    //   satelliteNumber1: '25544',
    //   classification: 'U',
    //   inclination: '51.6453',
    //   ...
    // }
} catch (error) {
    console.error('Validation failed:', error.message);
}
```

### Parsing with Satellite Name

```javascript
const tleDataWithName = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tleDataWithName);
console.log(result.satelliteName); // 'ISS (ZARYA)'
```

### Parsing Without Validation

```javascript
// Skip validation if you trust the data source
const result = parseTLE(tleData, { validate: false });
```

### Custom Validation Options

```javascript
// Disable strict checksum validation
const result = parseTLE(tleData, {
    validate: true,
    strictChecksums: false,  // Allow checksum errors
    validateRanges: true      // Still validate field ranges
});

// Disable range validation
const result2 = parseTLE(tleData, {
    validate: true,
    strictChecksums: true,
    validateRanges: false     // Skip range checking
});
```

### Standalone Validation

```javascript
const { validateTLE } = require('tle-parser');

const validation = validateTLE(tleData);
if (validation.isValid) {
    console.log('TLE is valid!');
} else {
    console.log('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
}
```

### Working with Warnings

The parser automatically detects deprecated or unusual values and returns warnings. Warnings do not prevent parsing, but alert you to potential data quality issues.

```javascript
const { parseTLE } = require('tle-parser');

// TLE with classified data (unusual in public datasets)
const classifiedTLE = `1 25544C 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(classifiedTLE);

if (result.warnings && result.warnings.length > 0) {
    result.warnings.forEach(warning => {
        console.log(`WARNING [${warning.code}]: ${warning.message}`);
    });
}
// Output: WARNING [CLASSIFIED_DATA_WARNING]: Classification 'C' is unusual in public TLE data (typically 'U' for unclassified)
```

Warnings include structured information:
- `code`: Machine-readable warning code (e.g., `STALE_TLE_WARNING`)
- `message`: Human-readable description
- `field`: The field that triggered the warning
- `value`: The actual value
- `severity`: Always 'warning' for non-critical issues

### Checksum Calculation and Validation

```javascript
const { calculateChecksum, validateChecksum } = require('tle-parser');

const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';

// Calculate checksum
const checksum = calculateChecksum(line);
console.log('Checksum:', checksum); // 6

// Validate checksum
const result = validateChecksum(line);
console.log('Valid:', result.isValid);
console.log('Expected:', result.expected);
console.log('Actual:', result.actual);
```

## API Reference

### `parseTLE(tleString, options)`

Parses TLE data and returns an object with all fields.

**Parameters:**
- `tleString` (string): The TLE data (2 or 3 lines)
- `options` (object, optional):
  - `validate` (boolean, default: `true`): Enable/disable validation
  - `strictChecksums` (boolean, default: `true`): Enforce checksum validation
  - `validateRanges` (boolean, default: `true`): Validate field value ranges

**Returns:** Object with parsed TLE fields

**Throws:** Error if validation fails and `validate` is `true`

### `validateTLE(tleString, options)`

Validates TLE format compliance without parsing.

**Parameters:**
- `tleString` (string): The TLE data
- `options` (object, optional):
  - `strictChecksums` (boolean, default: `true`)
  - `validateRanges` (boolean, default: `true`)

**Returns:** Object with:
- `isValid` (boolean): Overall validation result
- `errors` (array): List of validation errors
- `warnings` (array): List of validation warnings

### `calculateChecksum(line)`

Calculates the NORAD checksum for a TLE line.

**Parameters:**
- `line` (string): A TLE line

**Returns:** number (0-9)

### `validateChecksum(line)`

Validates the checksum of a TLE line.

**Parameters:**
- `line` (string): A TLE line

**Returns:** Object with:
- `isValid` (boolean)
- `expected` (number): Calculated checksum
- `actual` (number): Checksum from line
- `error` (string): Error message if invalid

### Other Validation Functions

- `validateLineStructure(line, expectedLineNumber)`: Validates line format
- `validateSatelliteNumber(line1, line2)`: Validates satellite number consistency
- `validateClassification(line1)`: Validates classification character (U, C, S)
- `validateNumericRange(value, fieldName, min, max)`: Validates numeric field ranges

### Warning Check Functions

These functions check for deprecated or unusual values and return warnings:

- `checkClassificationWarnings(line1)`: Detects classified or secret data markers
- `checkEpochWarnings(line1)`: Detects stale TLE data and deprecated epoch years
- `checkOrbitalParameterWarnings(line2)`: Detects unusual orbital parameters
- `checkDragAndEphemerisWarnings(line1)`: Detects unusual drag coefficients and ephemeris types

## Validation Rules

The parser implements comprehensive validation according to TLE format specifications:

### Structural Validation
- Line count: Must be 2 or 3 lines (3 if satellite name included)
- Line length: Each data line must be exactly 69 characters
- Line numbers: Line 1 must start with '1', Line 2 with '2'

### Checksum Validation
- **Both Line 1 and Line 2 checksums are validated**
- Calculated by summing all digits (0-9) in the line
- Minus signs (-) count as 1
- All other characters are ignored
- Result is modulo 10
- The last character (position 69) of each line contains the checksum
- Validation compares the calculated checksum with the provided checksum

### Field Validation
- **Classification**: Must be U (Unclassified), C (Classified), or S (Secret)
- **Satellite Number**: Must match between Line 1 and Line 2
- **Inclination**: 0-180 degrees
- **Right Ascension**: 0-360 degrees
- **Eccentricity**: 0-1 (stored without leading "0.")
- **Argument of Perigee**: 0-360 degrees
- **Mean Anomaly**: 0-360 degrees
- **Epoch Year**: 00-99
- **Epoch Day**: 1-366.99999999
- **Mean Motion**: 0-20 revolutions/day (warning if exceeded)

## Deprecation and Unusual Value Warnings

The parser automatically detects and warns about deprecated or unusual values that may indicate data quality issues:

### Classification Warnings
- **CLASSIFIED_DATA_WARNING**: Classification is 'C' (Classified) or 'S' (Secret), which is unusual in public TLE data

### Epoch Warnings
- **STALE_TLE_WARNING**: TLE epoch is older than 30 days, indicating potentially outdated orbital data
- **DEPRECATED_EPOCH_YEAR_WARNING**: Epoch year is in the 1900s range (two-digit years 57-99), which is deprecated

### Orbital Parameter Warnings
- **HIGH_ECCENTRICITY_WARNING**: Eccentricity > 0.25, indicating a highly elliptical orbit (unusual for most satellites)
- **LOW_MEAN_MOTION_WARNING**: Mean motion < 1.0 rev/day, indicating a very high orbit (unusual except for some GEO satellites)
- **REVOLUTION_NUMBER_ROLLOVER_WARNING**: Revolution number > 90,000, approaching the rollover limit of 99,999

### Drag and Ephemeris Warnings
- **NEAR_ZERO_DRAG_WARNING**: B* drag term is exactly zero, which is unusual for satellites in Low Earth Orbit (LEO)
- **NEGATIVE_DECAY_WARNING**: First derivative of mean motion is negative, indicating orbital decay
- **NON_STANDARD_EPHEMERIS_WARNING**: Ephemeris type is not '0' (standard SGP4/SDP4)

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes 100 test cases covering:
- Valid TLE parsing (2-line and 3-line formats)
- Checksum calculation and validation
- Invalid input handling
- Field range validation
- Deprecation and unusual value warnings
- Edge cases and error conditions
- Structured error reporting

## TLE Format Reference

TLE (Two-Line Element Set) format is a data format used to convey orbital elements of Earth-orbiting objects. It was designed for use with NORAD's SGP4/SDP4 propagation models.

Example TLE:
```
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
```

For more information about the TLE format, see:
- [CelesTrak TLE Format FAQ](https://celestrak.org/columns/v04n03/)
- [Wikipedia: Two-line element set](https://en.wikipedia.org/wiki/Two-line_element_set)

## License

MIT

