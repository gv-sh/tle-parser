# API Reference

Complete reference documentation for the TLE Parser library.

## Table of Contents

- [Main Functions](#main-functions)
  - [parseTLE()](#parsetle)
  - [validateTLE()](#validatetle)
  - [parseWithStateMachine()](#parsewithstatemachine)
- [Validation Functions](#validation-functions)
  - [validateLineStructure()](#validatelinestructure)
  - [validateChecksum()](#validatechecksum)
  - [calculateChecksum()](#calculatechecksum)
  - [validateSatelliteNumber()](#validatesatellitenumber)
  - [validateClassification()](#validateclassification)
  - [validateNumericRange()](#validatenumericrange)
- [Warning Detection](#warning-detection)
  - [checkClassificationWarnings()](#checkclassificationwarnings)
  - [checkEpochWarnings()](#checkepochwarnings)
  - [checkOrbitalParameterWarnings()](#checkorbitalparameterwarnings)
  - [checkDragAndEphemerisWarnings()](#checkdragandephemeriswarnings)
- [Utility Functions](#utility-functions)
  - [normalizeLineEndings()](#normalizelineendings)
  - [parseTLELines()](#parsetlelines)
- [Types](#types)
- [Error Codes](#error-codes)

---

## Main Functions

### parseTLE()

Parses a Two-Line Element Set string into a structured object.

```typescript
function parseTLE(tleString: string, options?: TLEParseOptions): ParsedTLE
```

#### Parameters

**tleString** (string)
- The TLE data to parse
- Can be 2-line format (just the data lines) or 3-line format (with satellite name)
- Supports comment lines starting with `#`
- Automatically normalizes different line ending formats (CRLF, LF, CR)

**options** (TLEParseOptions, optional)
- Configuration object for parsing behavior

```typescript
interface TLEParseOptions {
  // Enable/disable validation (default: true)
  validate?: boolean;

  // Parsing mode (default: 'strict')
  // - 'strict': Any validation error throws TLEValidationError
  // - 'permissive': Non-critical errors become warnings, returns partial data
  mode?: 'strict' | 'permissive';

  // Enforce checksum validation (default: true)
  strictChecksums?: boolean;

  // Validate field ranges (default: true)
  validateRanges?: boolean;

  // Include warnings in result (default: true)
  includeWarnings?: boolean;

  // Include comment lines in result (default: true)
  includeComments?: boolean;
}
```

#### Returns

**ParsedTLE** - Object containing all parsed TLE fields

```typescript
interface ParsedTLE {
  // Satellite identification
  satelliteName: string | null;

  // Line 1 fields
  lineNumber1: string;              // Always "1"
  satelliteNumber1: string;         // NORAD catalog number (5 digits)
  classification: string;           // U=Unclassified, C=Classified, S=Secret
  internationalDesignatorYear: string;     // Last 2 digits of launch year
  internationalDesignatorLaunchNumber: string;  // Launch number of the year
  internationalDesignatorPiece: string;    // Piece of the launch
  epochYear: string;                // Last 2 digits of epoch year
  epoch: string;                    // Day of year and fractional portion
  firstDerivative: string;          // First time derivative of mean motion
  secondDerivative: string;         // Second time derivative (scientific notation)
  bStar: string;                    // Drag term (scientific notation)
  ephemerisType: string;            // Usually "0"
  elementSetNumber: string;         // Element set number
  checksum1: string;                // Modulo-10 checksum

  // Line 2 fields
  lineNumber2: string;              // Always "2"
  satelliteNumber2: string;         // NORAD catalog number (must match line 1)
  inclination: string;              // Inclination in degrees [0-180]
  rightAscension: string;           // Right ascension of ascending node [0-360]
  eccentricity: string;             // Eccentricity (decimal point assumed)
  argumentOfPerigee: string;        // Argument of perigee in degrees [0-360]
  meanAnomaly: string;              // Mean anomaly in degrees [0-360]
  meanMotion: string;               // Mean motion (revolutions per day)
  revolutionNumber: string;         // Revolution number at epoch
  checksum2: string;                // Modulo-10 checksum

  // Optional metadata
  warnings?: readonly TLEWarning[]; // Non-critical issues detected
  comments?: readonly string[];     // Comment lines from input
}
```

#### Throws

**TLEValidationError** - When validation fails in strict mode

```typescript
class TLEValidationError extends Error {
  errors: readonly TLEError[];
  warnings: readonly TLEWarning[];
}
```

**TLEFormatError** - When input format is invalid

```typescript
class TLEFormatError extends Error {
  code: string;
  details: Record<string, unknown>;
}
```

#### Examples

**Basic 2-line TLE:**

```typescript
import { parseTLE } from 'tle-parser';

const tle = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tle);

console.log(result.satelliteNumber1);  // "25544" (ISS)
console.log(result.inclination);       // "51.6453"
console.log(result.meanMotion);        // "15.49338189"
```

**3-line TLE with satellite name:**

```typescript
const tleWithName = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tleWithName);
console.log(result.satelliteName);  // "ISS (ZARYA)"
```

**With comments:**

```typescript
const tleWithComments = `# Source: CelesTrak
# Downloaded: 2025-01-15
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseTLE(tleWithComments, { includeComments: true });
console.log(result.comments);  // ["# Source: CelesTrak", "# Downloaded: 2025-01-15"]
```

**Permissive mode:**

```typescript
// TLE with checksum error
const badTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

// Strict mode (default) - throws error
try {
  parseTLE(badTLE);
} catch (error) {
  console.error(error.message); // "TLE validation failed"
}

// Permissive mode - returns data with warnings
const result = parseTLE(badTLE, { mode: 'permissive' });
console.log(result.satelliteNumber1);  // "25544"
console.log(result.warnings);  // Array with checksum warning
```

**Disable specific validation:**

```typescript
// Skip checksum validation
const result = parseTLE(tle, {
  strictChecksums: false
});

// Skip range validation
const result2 = parseTLE(tle, {
  validateRanges: false
});

// Skip all validation
const result3 = parseTLE(tle, {
  validate: false
});
```

---

### validateTLE()

Validates a TLE string without parsing all fields. Useful for quick validation checks.

```typescript
function validateTLE(
  tleString: string,
  options?: TLEValidateOptions
): LegacyValidationResult
```

#### Parameters

**tleString** (string)
- The TLE data to validate

**options** (TLEValidateOptions, optional)

```typescript
interface TLEValidateOptions {
  strictChecksums?: boolean;
  validateRanges?: boolean;
}
```

#### Returns

```typescript
interface LegacyValidationResult {
  valid: boolean;
  errors: TLEError[];
  warnings: TLEWarning[];
}
```

#### Example

```typescript
import { validateTLE } from 'tle-parser';

const tle = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = validateTLE(tle);

if (result.valid) {
  console.log('TLE is valid');
} else {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

---

### parseWithStateMachine()

Advanced parser that uses a state machine for error recovery. Useful for parsing corrupted or incomplete TLE data.

```typescript
function parseWithStateMachine(
  tleString: string,
  options?: StateMachineParserOptions
): StateMachineParseResult
```

#### Parameters

**tleString** (string)
- The TLE data to parse

**options** (StateMachineParserOptions, optional)

```typescript
interface StateMachineParserOptions {
  // Attempt to recover from errors (default: true)
  attemptRecovery?: boolean;

  // Include partial results even if parsing fails (default: true)
  includePartialResults?: boolean;

  // Maximum number of recovery attempts (default: 10)
  maxRecoveryAttempts?: number;

  // Stop parsing on critical errors (default: false)
  stopOnCriticalError?: boolean;

  // Include state transition history (default: false)
  includeStateHistory?: boolean;
}
```

#### Returns

```typescript
interface StateMachineParseResult {
  // Whether parsing succeeded
  success: boolean;

  // Parsed data (may be partial if success is false)
  data: ParsedTLE | null;

  // Final parser state
  state: ParserState;

  // Errors encountered
  errors: TLEError[];

  // Warnings generated
  warnings: TLEWarning[];

  // Recovery actions taken
  recoveryActions?: RecoveryAction[];

  // State transition history (if includeStateHistory: true)
  stateHistory?: ParserState[];

  // Which fields were successfully parsed
  parsedFields?: string[];

  // Which fields failed to parse
  failedFields?: string[];
}
```

#### Example

```typescript
import { parseWithStateMachine } from 'tle-parser';

// Corrupted TLE with missing checksum
const corruptedTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result = parseWithStateMachine(corruptedTLE, {
  attemptRecovery: true,
  includePartialResults: true,
  includeStateHistory: true
});

console.log('Success:', result.success);
console.log('Parsed fields:', result.parsedFields);
console.log('Failed fields:', result.failedFields);
console.log('Recovery actions:', result.recoveryActions);

if (result.data) {
  // Even with errors, we got some data
  console.log('Satellite number:', result.data.satelliteNumber1);
}
```

---

## Validation Functions

### validateLineStructure()

Validates the basic structure of a TLE line.

```typescript
function validateLineStructure(
  line: string,
  expectedLineNumber: number
): LineValidationResult
```

#### Parameters

- **line** (string): The line to validate
- **expectedLineNumber** (number): Expected line number (1 or 2)

#### Returns

```typescript
interface LineValidationResult {
  valid: boolean;
  errors: TLEError[];
}
```

#### Example

```typescript
import { validateLineStructure } from 'tle-parser';

const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const result = validateLineStructure(line1, 1);

console.log(result.valid);  // true
```

---

### validateChecksum()

Validates the checksum of a TLE line.

```typescript
function validateChecksum(line: string): ChecksumValidationResult
```

#### Parameters

- **line** (string): The TLE line to validate

#### Returns

```typescript
interface ChecksumValidationResult {
  valid: boolean;
  expected: number;
  actual: number;
  error?: TLEError;
}
```

#### Example

```typescript
import { validateChecksum } from 'tle-parser';

const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const result = validateChecksum(line);

console.log(result.valid);     // true
console.log(result.expected);  // 6
console.log(result.actual);    // 6
```

---

### calculateChecksum()

Calculates the modulo-10 checksum for a TLE line.

```typescript
function calculateChecksum(line: string): number
```

#### Parameters

- **line** (string): The TLE line (excluding the checksum digit)

#### Returns

- **number**: The calculated checksum (0-9)

#### Algorithm

The checksum is calculated by:
1. Adding all digits in the line
2. Adding 1 for each minus sign (-)
3. Taking modulo 10 of the sum

#### Example

```typescript
import { calculateChecksum } from 'tle-parser';

const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  999';
const checksum = calculateChecksum(line);

console.log(checksum);  // 6
```

---

### validateSatelliteNumber()

Validates that satellite numbers match between line 1 and line 2.

```typescript
function validateSatelliteNumber(
  line1: string,
  line2: string
): SatelliteNumberValidationResult
```

#### Returns

```typescript
interface SatelliteNumberValidationResult {
  valid: boolean;
  satelliteNumber1?: string;
  satelliteNumber2?: string;
  error?: TLEError;
}
```

#### Example

```typescript
import { validateSatelliteNumber } from 'tle-parser';

const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const line2 = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';

const result = validateSatelliteNumber(line1, line2);
console.log(result.valid);  // true
```

---

### validateClassification()

Validates the classification character in line 1.

```typescript
function validateClassification(line1: string): ClassificationValidationResult
```

#### Returns

```typescript
interface ClassificationValidationResult {
  valid: boolean;
  classification?: string;
  error?: TLEError;
}
```

Valid classifications:
- **U**: Unclassified
- **C**: Classified
- **S**: Secret

#### Example

```typescript
import { validateClassification } from 'tle-parser';

const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const result = validateClassification(line1);

console.log(result.valid);           // true
console.log(result.classification);  // "U"
```

---

### validateNumericRange()

Validates that a numeric field is within expected range.

```typescript
function validateNumericRange(
  value: string,
  fieldName: string,
  min: number,
  max: number
): NumericRangeValidationResult
```

#### Parameters

- **value** (string): The value to validate
- **fieldName** (string): Name of the field (for error messages)
- **min** (number): Minimum allowed value
- **max** (number): Maximum allowed value

#### Returns

```typescript
interface NumericRangeValidationResult {
  valid: boolean;
  numericValue?: number;
  error?: TLEError;
}
```

#### Example

```typescript
import { validateNumericRange } from 'tle-parser';

const result = validateNumericRange('51.6453', 'inclination', 0, 180);
console.log(result.valid);         // true
console.log(result.numericValue);  // 51.6453
```

---

## Warning Detection

Warning detection functions identify non-critical issues in TLE data.

### checkClassificationWarnings()

Checks for classified or secret data warnings.

```typescript
function checkClassificationWarnings(line1: string): TLEWarning[]
```

Generates warnings when classification is 'C' (Classified) or 'S' (Secret).

#### Example

```typescript
import { checkClassificationWarnings } from 'tle-parser';

const line1 = '1 12345C 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const warnings = checkClassificationWarnings(line1);

console.log(warnings.length);  // 1
console.log(warnings[0].code); // "CLASSIFIED_DATA_WARNING"
```

---

### checkEpochWarnings()

Checks for stale or deprecated epoch warnings.

```typescript
function checkEpochWarnings(line1: string): TLEWarning[]
```

Generates warnings for:
- TLE data older than 30 days (STALE_TLE_WARNING)
- Epoch years in the 1900s (DEPRECATED_EPOCH_YEAR_WARNING)

#### Example

```typescript
import { checkEpochWarnings } from 'tle-parser';

const line1 = '1 25544U 98067A   95300.83097691  .00001534  00000-0  35580-4 0  9996';
const warnings = checkEpochWarnings(line1);

// May include DEPRECATED_EPOCH_YEAR_WARNING and/or STALE_TLE_WARNING
console.log(warnings);
```

---

### checkOrbitalParameterWarnings()

Checks for unusual orbital parameters in line 2.

```typescript
function checkOrbitalParameterWarnings(line2: string): TLEWarning[]
```

Generates warnings for:
- High eccentricity (> 0.25): HIGH_ECCENTRICITY_WARNING
- Low mean motion (< 1.0 rev/day): LOW_MEAN_MOTION_WARNING
- Revolution number near rollover (> 99000): REVOLUTION_NUMBER_ROLLOVER_WARNING

#### Example

```typescript
import { checkOrbitalParameterWarnings } from 'tle-parser';

const line2 = '2 25544  51.6453  57.0843 0851671  64.9808  73.0513 15.49338189252428';
const warnings = checkOrbitalParameterWarnings(line2);

// May include HIGH_ECCENTRICITY_WARNING
console.log(warnings);
```

---

### checkDragAndEphemerisWarnings()

Checks for drag term and ephemeris type warnings.

```typescript
function checkDragAndEphemerisWarnings(line1: string): TLEWarning[]
```

Generates warnings for:
- B* drag term is zero: NEAR_ZERO_DRAG_WARNING
- Negative first derivative (decay): NEGATIVE_DECAY_WARNING
- Non-standard ephemeris type (not 0): NON_STANDARD_EPHEMERIS_WARNING

#### Example

```typescript
import { checkDragAndEphemerisWarnings } from 'tle-parser';

const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  00000-0 0  9996';
const warnings = checkDragAndEphemerisWarnings(line1);

// May include NEAR_ZERO_DRAG_WARNING
console.log(warnings);
```

---

## Utility Functions

### normalizeLineEndings()

Normalizes line endings to LF (\\n).

```typescript
function normalizeLineEndings(input: string): string
```

Handles:
- CRLF (\\r\\n) - Windows
- CR (\\r) - Old Mac
- LF (\\n) - Unix/Linux
- Mixed line endings

#### Example

```typescript
import { normalizeLineEndings } from 'tle-parser';

const windowsFormat = 'line1\r\nline2\r\nline3';
const normalized = normalizeLineEndings(windowsFormat);

console.log(normalized);  // 'line1\nline2\nline3'
```

---

### parseTLELines()

Splits TLE string into individual lines and filters empty/comment lines.

```typescript
function parseTLELines(tleString: string): string[]
```

Returns only the meaningful data lines (satellite name and TLE lines 1-2).

#### Example

```typescript
import { parseTLELines } from 'tle-parser';

const tle = `# Comment
ISS (ZARYA)

1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const lines = parseTLELines(tle);
console.log(lines);
// ['ISS (ZARYA)', '1 25544U...', '2 25544...']
```

---

## Types

### Core Types

```typescript
// Parser modes
type ParsingMode = 'strict' | 'permissive';

// Parser states (for state machine)
enum ParserState {
  INITIAL = 'INITIAL',
  DETECTING_FORMAT = 'DETECTING_FORMAT',
  PARSING_NAME = 'PARSING_NAME',
  PARSING_LINE1 = 'PARSING_LINE1',
  PARSING_LINE2 = 'PARSING_LINE2',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Error severity
enum ErrorSeverityEnum {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Recovery actions
enum RecoveryAction {
  CONTINUE = 'CONTINUE',
  SKIP_FIELD = 'SKIP_FIELD',
  USE_DEFAULT = 'USE_DEFAULT',
  ATTEMPT_FIX = 'ATTEMPT_FIX',
  ABORT = 'ABORT'
}
```

### Error Types

```typescript
interface TLEError {
  code: string;                        // Machine-readable error code
  message: string;                     // Human-readable message
  line?: number;                       // Line number (1 or 2)
  field?: string;                      // Field name
  expected?: unknown;                  // Expected value
  actual?: unknown;                    // Actual value
  severity: 'error' | 'warning' | 'info';
  position?: number;                   // Character position
  details?: Record<string, unknown>;   // Additional details
  [key: string]: unknown;             // Extensible
}

interface TLEWarning extends TLEError {
  severity: 'warning';
}
```

---

## Error Codes

### Critical Errors

| Code | Description | Severity |
|------|-------------|----------|
| `INVALID_INPUT_TYPE` | Input is not a string | Error |
| `EMPTY_INPUT` | Input string is empty | Error |
| `INVALID_LINE_COUNT` | Wrong number of lines (not 2 or 3) | Error |
| `INVALID_LINE_LENGTH` | Line length is not 69 characters | Error |
| `INVALID_LINE_NUMBER` | Line doesn't start with "1" or "2" | Error |
| `CHECKSUM_MISMATCH` | Calculated checksum doesn't match | Error |
| `INVALID_CHECKSUM_CHARACTER` | Last character is not a digit | Error |
| `SATELLITE_NUMBER_MISMATCH` | Satellite numbers differ between lines | Error |
| `INVALID_SATELLITE_NUMBER` | Satellite number is not 5 digits | Error |
| `INVALID_CLASSIFICATION` | Classification is not U, C, or S | Error |
| `VALUE_OUT_OF_RANGE` | Numeric value outside valid range | Error |
| `INVALID_NUMBER_FORMAT` | Field is not a valid number | Error |
| `SATELLITE_NAME_TOO_LONG` | Name exceeds 24 characters | Error |

### Warnings

| Code | Description |
|------|-------------|
| `CLASSIFIED_DATA_WARNING` | TLE contains classified data (C or S) |
| `STALE_TLE_WARNING` | TLE is older than 30 days |
| `HIGH_ECCENTRICITY_WARNING` | Eccentricity > 0.25 (unusual orbit) |
| `LOW_MEAN_MOTION_WARNING` | Mean motion < 1.0 rev/day (high altitude) |
| `DEPRECATED_EPOCH_YEAR_WARNING` | Epoch year is in the 1900s |
| `REVOLUTION_NUMBER_ROLLOVER_WARNING` | Revolution number > 99,000 |
| `NEAR_ZERO_DRAG_WARNING` | B* drag term is zero or very small |
| `NON_STANDARD_EPHEMERIS_WARNING` | Ephemeris type is not 0 |
| `NEGATIVE_DECAY_WARNING` | First derivative is negative (decay) |

---

## TypeScript Usage

All types are exported and available for TypeScript projects:

```typescript
import {
  parseTLE,
  ParsedTLE,
  TLEParseOptions,
  TLEError,
  TLEWarning,
  TLEValidationError
} from 'tle-parser';

const options: TLEParseOptions = {
  mode: 'permissive',
  includeWarnings: true
};

try {
  const result: ParsedTLE = parseTLE(tleData, options);

  if (result.warnings && result.warnings.length > 0) {
    result.warnings.forEach((warning: TLEWarning) => {
      console.warn(`${warning.code}: ${warning.message}`);
    });
  }
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error('Validation failed:', error.errors);
  }
}
```

---

## See Also

- [Usage Examples](../guides/USAGE_EXAMPLES.md) - Common use cases and patterns
- [Error Handling](../guides/ERROR_HANDLING.md) - Comprehensive error handling guide
- [TLE Format Guide](../guides/TLE_FORMAT.md) - Understanding TLE structure
- [Troubleshooting](../guides/TROUBLESHOOTING.md) - Common issues and solutions
