# TLE Parser

A robust parser for TLE (Two-Line Element) satellite data with comprehensive input validation.

## Features

- Parse TLE data with or without satellite name (2 or 3 line format)
- Comprehensive format validation
- NORAD checksum verification
- Field range validation
- Satellite number consistency checking
- Classification validation
- Flexible validation options
- **State machine parser with error recovery** - Continue parsing even with malformed data
- Partial result extraction from corrupted TLE data
- Detailed error and warning tracking

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

The test suite includes 20+ test cases covering:
- Valid TLE parsing
- Checksum calculation and validation
- Invalid input handling
- Field range validation
- Edge cases and error conditions

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

