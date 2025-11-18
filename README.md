# TLE Parser

A robust parser for TLE (Two-Line Element) satellite data with comprehensive input validation.

## Features

- Parse TLE data with or without satellite name (2 or 3 line format)
- Automatic line ending normalization (CRLF, LF, CR)
- Comprehensive format validation
- NORAD checksum verification
- Field range validation
- Satellite number consistency checking
- Classification validation
- Flexible validation options
- **Robust edge case handling:**
  - Cross-platform line ending support (CRLF, LF, CR, and mixed)
  - Automatic whitespace normalization (leading/trailing/multiple empty lines)
  - Tab character handling and conversion
  - Unicode character support in satellite names

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

### Parsing Modes: Strict vs Permissive

```javascript
// Strict mode (default): Any validation error throws an exception
const result1 = parseTLE(tleData, { mode: 'strict' });

// Permissive mode: Parses imperfect data, collects non-critical errors as warnings
const result2 = parseTLE(tleData, { mode: 'permissive' });
console.log(result2.warnings); // Array of data quality issues

// Permissive mode example with invalid checksum
const imperfectTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
    // In permissive mode, this succeeds with warnings
    const result = parseTLE(imperfectTLE, { mode: 'permissive' });
    console.log('Parsed successfully!');
    console.log('Warnings:', result.warnings); // Contains checksum warning
} catch (error) {
    // Won't reach here for non-critical errors in permissive mode
}
```

**Mode Behavior:**

- **Strict Mode (default)**:
  - Any validation error throws immediately
  - Best for applications requiring perfect TLE data

- **Permissive Mode**:
  - Runs all validations but only throws on critical structural errors
  - Non-critical errors (checksums, satellite number mismatch, range violations, invalid classification) become warnings
  - Critical errors (invalid line count, line length, line numbers) still throw
  - Returns parsed data with `warnings` array
  - Best for working with imperfect or historical TLE data

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

// Combine mode with other options
const result3 = parseTLE(tleData, {
    mode: 'permissive',      // Use permissive mode
    validateRanges: false    // Disable range checking
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

### Line Ending Normalization

The parser automatically handles different line ending formats:

```javascript
const { parseTLE, normalizeLineEndings } = require('tle-parser');

// Works with CRLF (Windows-style) line endings
const tleCRLF = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const result1 = parseTLE(tleCRLF);

// Works with CR (old Mac-style) line endings
const tleCR = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const result2 = parseTLE(tleCR);

// Works with LF (Unix-style) line endings
const tleLF = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const result3 = parseTLE(tleLF);

// You can also normalize line endings manually
const normalized = normalizeLineEndings(tleCRLF);
console.log(normalized); // All line endings converted to \n
```

The parser automatically converts all line ending types (CRLF, CR, LF) to LF (`\n`) before processing, ensuring consistent parsing regardless of the source platform or file format.

## API Reference

### `parseTLE(tleString, options)`

Parses TLE data and returns an object with all fields.

**Parameters:**
- `tleString` (string): The TLE data (2 or 3 lines)
- `options` (object, optional):
  - `validate` (boolean, default: `true`): Enable/disable validation
  - `mode` (string, default: `'strict'`): Parsing mode - `'strict'` or `'permissive'`
  - `strictChecksums` (boolean, default: `true`): Enforce checksum validation
  - `validateRanges` (boolean, default: `true`): Validate field value ranges
  - `includeWarnings` (boolean, default: `true`): Include warnings in result

**Returns:** Object with parsed TLE fields and optional `warnings` array

**Throws:** Error if validation fails and `validate` is `true`

**Mode Details:**
- `'strict'`: Any validation error throws an exception (default behavior)
- `'permissive'`: Only critical structural errors throw; non-critical errors become warnings

### `validateTLE(tleString, options)`

Validates TLE format compliance without parsing.

**Parameters:**
- `tleString` (string): The TLE data
- `options` (object, optional):
  - `mode` (string, default: `'strict'`): Validation mode - `'strict'` or `'permissive'`
  - `strictChecksums` (boolean, default: `true`)
  - `validateRanges` (boolean, default: `true`)

**Returns:** Object with:
- `isValid` (boolean): Overall validation result
- `errors` (array): List of validation errors
- `warnings` (array): List of validation warnings

**Mode Details:**
- `'strict'`: Errors include all validation failures
- `'permissive'`: Only critical errors in `errors` array; non-critical issues in `warnings` array

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

### `normalizeLineEndings(text)`

Normalizes line endings to LF (\n), converting CRLF (\r\n) and CR (\r) to LF.

**Parameters:**
- `text` (string): Text with any line ending format

**Returns:** string with normalized line endings (all converted to \n)

### Other Validation Functions

- `validateLineStructure(line, expectedLineNumber)`: Validates line format
- `validateSatelliteNumber(line1, line2)`: Validates satellite number consistency
- `validateClassification(line1)`: Validates classification character (U, C, S)
- `validateNumericRange(value, fieldName, min, max)`: Validates numeric field ranges

### Edge Case Handling Functions

- `normalizeLineEndings(input)`: Normalizes CRLF, LF, and CR line endings to LF
- `parseTLELines(tleString)`: Parses TLE string into lines with robust whitespace handling

## Edge Case Handling

The parser automatically handles various edge cases and malformed input to ensure reliable parsing across different platforms and data sources:

### Line Ending Normalization

The parser automatically handles different line ending conventions:

```javascript
// Windows-style (CRLF)
const windowsTLE = '1 25544U...\r\n2 25544...';
parseTLE(windowsTLE); // ✓ Works

// Unix-style (LF)
const unixTLE = '1 25544U...\n2 25544...';
parseTLE(unixTLE); // ✓ Works

// Old Mac-style (CR)
const macTLE = '1 25544U...\r2 25544...';
parseTLE(macTLE); // ✓ Works

// Mixed line endings
const mixedTLE = 'ISS\r\n1 25544U...\n2 25544...';
parseTLE(mixedTLE); // ✓ Works
```

### Whitespace Handling

The parser handles various whitespace edge cases:

```javascript
// Leading/trailing whitespace
const withSpaces = '   \n  1 25544U...  \n  2 25544...   \n   ';
parseTLE(withSpaces); // ✓ Works - whitespace is trimmed

// Multiple empty lines
const emptyLines = '\n\n\n1 25544U...\n\n\n2 25544...\n\n\n';
parseTLE(emptyLines); // ✓ Works - empty lines are filtered

// Tabs in input
const withTabs = '\t1 25544U...\t\n\t2 25544...\t';
parseTLE(withTabs); // ✓ Works - tabs are converted to spaces and trimmed

// Whitespace-only lines
const messyInput = 'ISS\n  \t  \n1 25544U...\n\t\t\n2 25544...';
parseTLE(messyInput); // ✓ Works - whitespace-only lines are filtered
```

### Unicode Support

The parser supports Unicode characters in satellite names:

```javascript
const unicodeTLE = `СПУТНИК-1 🛰️
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(unicodeTLE);
console.log(result.satelliteName); // 'СПУТНИК-1 🛰️'
```

### Complex Scenarios

The parser can handle combinations of edge cases:

```javascript
// Complex whitespace with mixed line endings, tabs, and empty lines
const complexInput = '\t  \r\n\r\n  ISS  \t\r\n\r1 25544U...  \t\r\n\n\r2 25544...\t  \n\r\n';
parseTLE(complexInput); // ✓ Works - all edge cases handled automatically
```

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

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes 111 test cases covering:
- Valid TLE parsing (2-line and 3-line formats)
- Checksum calculation and validation
- Invalid input handling
- Field range validation
- Line ending variations (CRLF, LF, CR, mixed)
- Whitespace handling (tabs, empty lines, excessive whitespace)
- Unicode support
- Complex edge cases and error conditions

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

