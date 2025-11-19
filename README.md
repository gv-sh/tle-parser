# TLE Parser

A robust parser for TLE (Two-Line Element) satellite data with comprehensive input validation.

## Features

### Core Features
- Parse TLE data with or without satellite name (2 or 3 line format)
- Support for metadata comments (lines starting with `#`)
- Automatic line ending normalization (CRLF, LF, CR)
- Comprehensive format validation
- NORAD checksum verification
- Field range validation
- Satellite number consistency checking
- Classification validation
- Deprecation and unusual value warnings
- Flexible validation options
- **State machine parser with error recovery** - Continue parsing even with malformed data
- Partial result extraction from corrupted TLE data
- Detailed error and warning tracking

### Advanced Features ⚡
- **Batch parsing** - Parse multiple TLEs from single input
- **Async/await support** - Non-blocking operations
- **Streaming parser** - Handle large TLE files efficiently
- **Multi-source parsing** - Parse from files, URLs, streams, and compressed archives
- **Incremental parsing** - Real-time data feed support
- **Filtering** - Filter by satellite number, name, epoch, inclination, etc.
- **Middleware/Plugin system** - Extend parser functionality
- **Caching layer** - LRU cache for frequently parsed TLEs
- **Parser profiles** - Presets for different use cases (strict, fast, realtime, etc.)
- **Parallel parsing** - Multi-core support for large datasets
- **Provider support** - Optimized for CelesTrak, Space-Track, AMSAT, etc.

### Robust Edge Case Handling
- Cross-platform line ending support (CRLF, LF, CR, and mixed)
- Automatic whitespace normalization (leading/trailing/multiple empty lines)
- Tab character handling and conversion
- Unicode character support in satellite names

### Modern Build System
- Multiple bundle formats (ESM, CommonJS, UMD, Browser)
- Tree-shaking support for optimal bundle sizes
- Source maps for debugging
- Minified production builds
- TypeScript definitions included

## Package Formats

This package is distributed in multiple formats to support different JavaScript environments:

- **ESM** (`import`) - Modern ES modules for Node.js 14+ and bundlers
- **CommonJS** (`require`) - Traditional Node.js format
- **UMD** - Universal format for browsers and Node.js
- **Browser** - Standalone browser bundles with no Node.js dependencies

The correct format is automatically selected based on your environment. See [BUILD.md](BUILD.md) for details.

## Documentation

Comprehensive documentation is available in the [docs](docs/) directory:

- **[Complete Documentation Index](docs/README.md)** - Start here for all documentation
- **[API Reference](docs/api/API_REFERENCE.md)** - Complete function documentation
- **[Usage Examples](docs/guides/USAGE_EXAMPLES.md)** - Practical code examples
- **[Advanced Features](docs/advanced-features.md)** - ⚡ Batch, streaming, filtering, caching, and more
- **[FAQ](docs/FAQ.md)** - Frequently asked questions

### Understanding TLEs
- **[TLE Format Guide](docs/guides/TLE_FORMAT.md)** - Detailed field descriptions
- **[TLE Structure Diagrams](docs/guides/TLE_STRUCTURE.md)** - Visual reference
- **[Orbital Mechanics](docs/guides/ORBITAL_MECHANICS.md)** - Physics concepts explained

### Guides
- **[Error Handling](docs/guides/ERROR_HANDLING.md)** - Error patterns and recovery
- **[Troubleshooting](docs/guides/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Performance Guide](docs/guides/PERFORMANCE.md)** - Optimization strategies

### Build & Development
- **[Build System Documentation](BUILD.md)** - Modern build pipeline, bundle formats, and publishing

## Installation

### From npm (coming soon)

```bash
npm install tle-parser
```

### From source

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

### Parsing with Comments

TLE data files often include metadata comments (lines starting with `#`). The parser automatically extracts and includes these comments in the result.

```javascript
const tleWithComments = `# Source: CelesTrak
# Downloaded: 2023-10-27 12:34:56 UTC
# Reference Frame: TEME
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tleWithComments);
console.log(result.comments);
// [
//   '# Source: CelesTrak',
//   '# Downloaded: 2023-10-27 12:34:56 UTC',
//   '# Reference Frame: TEME'
// ]

// Exclude comments from the result
const resultWithoutComments = parseTLE(tleWithComments, { includeComments: false });
console.log(resultWithoutComments.comments); // undefined
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
- `tleString` (string): The TLE data (2 or 3 lines, optionally with comment lines)
- `options` (object, optional):
  - `validate` (boolean, default: `true`): Enable/disable validation
  - `mode` (string, default: `'strict'`): Parsing mode - `'strict'` or `'permissive'`
  - `strictChecksums` (boolean, default: `true`): Enforce checksum validation
  - `validateRanges` (boolean, default: `true`): Validate field value ranges
  - `includeWarnings` (boolean, default: `true`): Include validation warnings in result
  - `includeComments` (boolean, default: `true`): Include comment lines in result

**Returns:** Object with parsed TLE fields, and optionally `warnings` and `comments` arrays

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

### Warning Check Functions

These functions check for deprecated or unusual values and return warnings:

- `checkClassificationWarnings(line1)`: Detects classified or secret data markers
- `checkEpochWarnings(line1)`: Detects stale TLE data and deprecated epoch years
- `checkOrbitalParameterWarnings(line2)`: Detects unusual orbital parameters
- `checkDragAndEphemerisWarnings(line1)`: Detects unusual drag coefficients and ephemeris types

### Edge Case Handling Functions

- `normalizeLineEndings(input)`: Normalizes CRLF, LF, and CR line endings to LF
- `parseTLELines(tleString)`: Parses TLE string into lines with robust whitespace handling

## State Machine Parser with Error Recovery

The library includes a state machine-based parser that provides enhanced error recovery capabilities. Unlike the standard parser that throws errors on invalid input, the state machine parser attempts to extract as much valid data as possible from malformed TLE data.

### Using the State Machine Parser

```javascript
const { parseWithStateMachine, ParserState, ErrorSeverity } = require('tle-parser');

// Parse TLE with error recovery
const result = parseWithStateMachine(tleData, {
    attemptRecovery: true,      // Try to recover from errors (default: true)
    includePartialResults: true, // Include partial data even on errors (default: true)
    strictMode: false            // Stop on first error (default: false)
});

// Check the result
console.log('Success:', result.success);
console.log('State:', result.state);
console.log('Data:', result.data);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
console.log('Recovery Actions:', result.recoveryActions);
```

### State Machine Parser Options

- `attemptRecovery` (boolean, default: `true`): Attempt to recover from errors and continue parsing
- `includePartialResults` (boolean, default: `true`): Return partial results even when errors occur
- `strictMode` (boolean, default: `false`): Stop parsing on first critical error
- `maxRecoveryAttempts` (number, default: `10`): Maximum number of recovery attempts

### Result Structure

The state machine parser returns a comprehensive result object:

```javascript
{
    success: boolean,              // True if parsing completed successfully
    state: ParserState,            // Final parser state (COMPLETED, ERROR, etc.)
    data: {                        // Parsed TLE data (may be partial)
        satelliteName: string,
        satelliteNumber1: string,
        inclination: string,
        // ... other TLE fields
        line1Raw: string,          // Raw Line 1 data
        line2Raw: string           // Raw Line 2 data
    },
    errors: [                      // Array of errors encountered
        {
            severity: 'error' | 'critical',
            code: string,
            message: string,
            state: string,         // Parser state when error occurred
            // ... additional error details
        }
    ],
    warnings: [                    // Array of warnings
        {
            severity: 'warning',
            code: string,
            message: string,
            // ... additional warning details
        }
    ],
    recoveryActions: [             // Array of recovery actions taken
        {
            action: string,        // Type of recovery action
            description: string,
            state: string,
            // ... additional context
        }
    ],
    context: {                     // Parse context information
        lineCount: number,
        hasName: boolean,
        recoveryAttempts: number
    }
}
```

### Error Recovery Capabilities

The state machine parser can recover from various error conditions:

1. **Checksum Errors**: Continue parsing even with invalid checksums
2. **Line Length Errors**: Extract available fields from short lines
3. **Invalid Line Numbers**: Still parse data despite incorrect line identifiers
4. **Missing Fields**: Use null values for missing fields while parsing the rest
5. **Too Many Lines**: Attempt to identify valid TLE lines from excess input
6. **Invalid Characters**: Continue parsing and report issues
7. **Satellite Number Mismatch**: Report mismatch but extract both values

### Example: Recovering from Corrupted TLE

```javascript
const { parseWithStateMachine } = require('tle-parser');

// TLE with invalid checksum and line length issues
const corruptedTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189`;

const result = parseWithStateMachine(corruptedTLE, {
    attemptRecovery: true,
    includePartialResults: true
});

if (result.success) {
    console.log('Parsing completed successfully');
} else {
    console.log('Parsing completed with errors');
}

// Access extracted data (even if partial)
console.log('Satellite:', result.data.satelliteName);
console.log('Sat Number:', result.data.satelliteNumber1);

// Review errors and warnings
result.errors.forEach(err => {
    console.log(`ERROR [${err.code}]: ${err.message}`);
});

result.warnings.forEach(warn => {
    console.log(`WARNING [${warn.code}]: ${warn.message}`);
});

// Review recovery actions
result.recoveryActions.forEach(action => {
    console.log(`RECOVERY: ${action.description}`);
});
```

### Advanced Usage: Custom Parser Instance

```javascript
const { TLEStateMachineParser, ParserState } = require('tle-parser');

const parser = new TLEStateMachineParser({
    attemptRecovery: true,
    maxRecoveryAttempts: 20
});

const result = parser.parse(tleData);

// Check final state
if (result.state === ParserState.COMPLETED) {
    console.log('Parse completed successfully');
} else if (result.state === ParserState.ERROR) {
    console.log('Parse ended in error state');
}

// Reuse parser for another TLE (state is automatically reset)
const result2 = parser.parse(anotherTLE);
```

### Parser States

The state machine progresses through the following states:

- `INITIAL`: Starting state
- `DETECTING_FORMAT`: Determining 2-line or 3-line format
- `PARSING_NAME`: Parsing satellite name (if present)
- `PARSING_LINE1`: Parsing TLE Line 1
- `PARSING_LINE2`: Parsing TLE Line 2
- `VALIDATING`: Cross-field validation
- `COMPLETED`: Successfully completed
- `ERROR`: Error state (may still contain partial results)

### Error Severity Levels

Errors are classified by severity:

- `WARNING`: Issues that don't prevent parsing (e.g., long satellite name)
- `ERROR`: Problems with data quality (e.g., checksum mismatch, out of range values)
- `CRITICAL`: Fatal errors that prevent parsing (e.g., empty input, wrong type)

### Recovery Actions

Recovery actions track how the parser handled errors:

- `CONTINUE`: Continue parsing despite error
- `SKIP_FIELD`: Skip problematic field
- `USE_DEFAULT`: Use default/null value
- `ATTEMPT_FIX`: Attempt to fix the issue
- `ABORT`: Cannot recover

### When to Use State Machine Parser vs Standard Parser

**Use State Machine Parser when:**
- Dealing with potentially corrupted or malformed TLE data
- You need to extract partial information from bad data
- You want detailed error reporting with context
- You need to process TLE data from unreliable sources
- You want to know exactly what went wrong and where

**Use Standard Parser when:**
- You need strict validation with fail-fast behavior
- You trust your TLE data source
- You want simple error handling (throw on error)
- You need the traditional API

Both parsers can be used together in the same application for different use cases.

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

### Comment Handling
- Comment lines start with `#` and are automatically filtered during validation
- Comments do not count toward the 2 or 3 line requirement
- Comments can appear anywhere in the TLE data (before, between, or after TLE lines)

### Structural Validation
- Line count: Must be 2 or 3 lines (3 if satellite name included), excluding comment lines
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

The test suite includes 110+ test cases covering:
- Valid TLE parsing (2-line and 3-line formats)
- Comment parsing and handling
- Checksum calculation and validation
- Invalid input handling
- Field range validation
- Deprecation and unusual value warnings
- Line ending variations (CRLF, LF, CR, mixed)
- Whitespace handling (tabs, empty lines, excessive whitespace)
- Unicode support
- Complex edge cases and error conditions
- Structured error reporting
- Option handling (includeComments, includeWarnings, etc.)

## TLE Format Reference

TLE (Two-Line Element Set) format is a data format used to convey orbital elements of Earth-orbiting objects. It was designed for use with NORAD's SGP4/SDP4 propagation models.

Example TLE with metadata comments:
```
# Source: CelesTrak
# Epoch: 2020-10-26 19:56:36 UTC
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
```

**Format components:**
- **Comment lines** (optional): Lines starting with `#` containing metadata
- **Line 0** (optional): Satellite name (up to 24 characters recommended)
- **Line 1**: Catalog number, epoch, ballistic coefficients
- **Line 2**: Orbital elements (inclination, RAAN, eccentricity, etc.)

For comprehensive TLE format documentation, see:
- **[TLE Format Guide](docs/guides/TLE_FORMAT.md)** - Complete field descriptions and specifications
- **[TLE Structure Diagrams](docs/guides/TLE_STRUCTURE.md)** - Visual breakdowns and reference tables
- **[Orbital Mechanics Guide](docs/guides/ORBITAL_MECHANICS.md)** - Understanding orbital parameters
- [CelesTrak TLE Format FAQ](https://celestrak.org/columns/v04n03/) - External reference
- [Wikipedia: Two-line element set](https://en.wikipedia.org/wiki/Two-line_element_set) - External reference

## License

MIT

