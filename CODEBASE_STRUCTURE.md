# TLE Parser Codebase Structure Analysis

## Overview
**Project**: tle-parser - A robust parser for TLE (Two-Line Element) satellite data
**Current Status**: JavaScript with comprehensive validation and state machine error recovery
**Target**: TypeScript migration as part of Week 1 Foundation phase

---

## Directory Structure

```
/home/user/tle-parser/
├── .github/
│   └── workflows/
│       └── node.js.yml           # GitHub Actions CI/CD
├── __tests__/                     # Test suite (~3986 lines)
│   ├── fixtures/
│   │   ├── historical-tles.js    # Historical TLE test data
│   │   └── tle-samples.js        # Sample TLE fixtures
│   ├── benchmark.test.js         # Performance benchmarks (304 lines)
│   ├── historical.test.js        # Historical data tests (347 lines)
│   ├── index.test.js             # Main parser tests (734 lines)
│   ├── integration.test.js       # End-to-end tests (489 lines)
│   ├── property.test.js          # Property-based tests (781 lines)
│   ├── reference-validation.test.js # Reference validation (301 lines)
│   ├── regression.test.js        # Regression tests (428 lines)
│   └── stateMachineParser.test.js # State machine tests (602 lines)
├── .gitignore
├── jest.config.js                # Jest configuration
├── package.json                  # Dependencies and scripts
├── package-lock.json
├── tleConfig.json                # TLE field position mapping
├── errorCodes.js                 # Error code constants (31 lines)
├── index.js                      # Main parser module (989 lines)
├── stateMachineParser.js         # State machine parser (734 lines)
├── test.js                       # Legacy test file (47k)
├── testStateMachine.js           # Legacy state machine test (15k)
├── README.md                     # Project documentation
├── ROADMAP.md                    # Development roadmap
└── TESTING_SUMMARY.md            # Testing documentation
```

---

## Core Source Files

### 1. **index.js** (989 lines)
Main parser module with comprehensive validation and parsing functions.

**Custom Error Classes**:
```javascript
- TLEValidationError       // Validation errors with detailed error array
- TLEFormatError           // Format-specific errors with error codes
```

**Key Functions** (16 total):
1. `normalizeLineEndings(input)` - Normalize CRLF/LF/CR line endings
2. `parseTLELines(tleString)` - Parse and clean TLE lines
3. `calculateChecksum(line)` - Calculate NORAD checksum for TLE line
4. `validateChecksum(line)` - Validate TLE line checksum
5. `validateLineStructure(line, expectedLineNumber)` - Validate line format
6. `validateSatelliteNumber(line1, line2)` - Ensure satellite numbers match
7. `validateClassification(line1)` - Validate classification character
8. `validateNumericRange(value, fieldName, min, max)` - Range validation
9. `checkClassificationWarnings(line1)` - Check classification warnings
10. `checkEpochWarnings(line1)` - Check epoch-related warnings
11. `checkOrbitalParameterWarnings(line2)` - Check orbital parameter warnings
12. `checkDragAndEphemerisWarnings(line1)` - Check drag/ephemeris warnings
13. `validateTLE(tleString, options)` - Comprehensive TLE validation
14. `parseTLE(tleString, options)` - Main parsing function
15. Imports from stateMachineParser module

**Exported Items**:
```javascript
module.exports = {
    parseTLE,
    validateTLE,
    calculateChecksum,
    validateChecksum,
    validateLineStructure,
    validateSatelliteNumber,
    validateClassification,
    validateNumericRange,
    checkClassificationWarnings,
    checkEpochWarnings,
    checkOrbitalParameterWarnings,
    checkDragAndEphemerisWarnings,
    normalizeLineEndings,
    parseTLELines,
    TLEValidationError,
    TLEFormatError,
    ERROR_CODES,
    // State machine parser exports
    TLEStateMachineParser,
    parseWithStateMachine,
    ParserState,
    ErrorSeverity,
    RecoveryAction
};
```

**JSDoc Coverage**: 16 JSDoc blocks (~87 JSDoc annotations)

### 2. **stateMachineParser.js** (734 lines)
Advanced parser with state machine architecture and error recovery capability.

**Enums/Constants**:
```javascript
const ParserState = {
    INITIAL, DETECTING_FORMAT, PARSING_NAME, PARSING_LINE1, 
    PARSING_LINE2, VALIDATING, COMPLETED, ERROR
};

const ErrorSeverity = {
    WARNING, ERROR, CRITICAL
};

const RecoveryAction = {
    CONTINUE, SKIP_FIELD, USE_DEFAULT, ATTEMPT_FIX, ABORT
};
```

**Main Class**: `TLEStateMachineParser`
- **Constructor**: Accepts options object (attemptRecovery, maxRecoveryAttempts, includePartialResults, strictMode)
- **Key Methods**:
  - `reset()` - Reset parser state
  - `addIssue(severity, code, message, details)` - Record errors/warnings
  - `recordRecovery(action, description, context)` - Track recovery attempts
  - `transition(newState, reason)` - State transitions
  - `parse(tleString)` - Main parsing method
  - `detectFormat(tleString)` - Detect 2 or 3-line format
  - `executeStateMachine()` - Run state machine
  - `parseSatelliteName()` - Parse satellite name
  - `parseLine1()` - Parse TLE line 1
  - `parseLine2()` - Parse TLE line 2
  - `validateSatelliteData()` - Validate parsed data
  - `getResult()` - Get final result

**Helper Function**:
- `parseWithStateMachine(tleString, options)` - Convenience function

**Exported Items**:
```javascript
module.exports = {
    TLEStateMachineParser,
    parseWithStateMachine,
    ParserState,
    ErrorSeverity,
    RecoveryAction
};
```

**JSDoc Coverage**: 20 JSDoc blocks

### 3. **errorCodes.js** (31 lines)
Centralized error code constants for structured error handling.

**Error Codes** (24 total):
- Input validation: INVALID_INPUT_TYPE, EMPTY_INPUT, INVALID_LINE_COUNT
- Format validation: INVALID_LINE_LENGTH, INVALID_LINE_NUMBER, CHECKSUM_MISMATCH, INVALID_CHECKSUM_CHARACTER
- Data validation: SATELLITE_NUMBER_MISMATCH, INVALID_SATELLITE_NUMBER, INVALID_CLASSIFICATION, VALUE_OUT_OF_RANGE, INVALID_NUMBER_FORMAT
- Warnings: SATELLITE_NAME_TOO_LONG, SATELLITE_NAME_FORMAT_WARNING, CLASSIFIED_DATA_WARNING, STALE_TLE_WARNING, HIGH_ECCENTRICITY_WARNING, LOW_MEAN_MOTION_WARNING, DEPRECATED_EPOCH_YEAR_WARNING, REVOLUTION_NUMBER_ROLLOVER_WARNING, NEAR_ZERO_DRAG_WARNING, NON_STANDARD_EPHEMERIS_WARNING, NEGATIVE_DECAY_WARNING

---

## Configuration Files

### **tleConfig.json**
Maps TLE field names to character position ranges in the data lines.

**Line 1 Fields**:
```json
{
  "lineNumber1": [0, 1],
  "satelliteNumber1": [2, 7],
  "classification": [7, 8],
  "internationalDesignatorYear": [9, 11],
  "internationalDesignatorLaunchNumber": [11, 14],
  "internationalDesignatorPiece": [14, 17],
  "epochYear": [18, 20],
  "epoch": [20, 32],
  "firstDerivative": [33, 43],
  "secondDerivative": [44, 52],
  "bStar": [53, 61],
  "ephemerisType": [62, 63],
  "elementSetNumber": [64, 68],
  "checksum1": [68, 69]
}
```

**Line 2 Fields**:
```json
{
  "lineNumber2": [0, 1],
  "satelliteNumber2": [2, 7],
  "inclination": [8, 16],
  "rightAscension": [17, 25],
  "eccentricity": [26, 33],
  "argumentOfPerigee": [34, 42],
  "meanAnomaly": [43, 51],
  "meanMotion": [52, 63],
  "revolutionNumber": [63, 68],
  "checksum2": [68, 69]
}
```

### **jest.config.js**
Jest testing configuration:
- **Test Environment**: node
- **Coverage Directory**: coverage
- **Coverage Threshold**: 90% for branches, functions, lines, statements
- **Test Match**: `__tests__/**/*.test.js`
- **Test Timeout**: 10 seconds
- **Coverage Source Files**: index.js, stateMachineParser.js (excluding test.js, testStateMachine.js)

### **package.json**
```json
{
  "name": "tle-parser",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose",
    "test:legacy": "node test.js"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "fast-check": "^4.3.0",
    "jest": "^30.2.0",
    "satellite.js": "^6.0.1"
  }
}
```

---

## Test Suite Structure

### Test Coverage (3,986 lines)
1. **index.test.js** (734 lines) - Comprehensive parser function tests
2. **stateMachineParser.test.js** (602 lines) - State machine behavior
3. **property.test.js** (781 lines) - Property-based testing (fast-check)
4. **integration.test.js** (489 lines) - End-to-end scenarios
5. **historical.test.js** (347 lines) - Historical TLE format variations
6. **regression.test.js** (428 lines) - Specific bug fixes
7. **benchmark.test.js** (304 lines) - Performance metrics
8. **reference-validation.test.js** (301 lines) - Against reference implementations

### Test Fixtures
- **tle-samples.js** - Valid and invalid TLE samples (ISS, GPS, Hubble, Starlink)
- **historical-tles.js** - Historical TLE data for format variation testing

---

## Entry Points & Main Functions

### 1. **Primary Entry Point: `parseTLE()`**
```javascript
parseTLE(tleString, options = {})
// Options: {
//   validate: boolean (default: true),
//   strictChecksums: boolean (default: true),
//   validateRanges: boolean (default: true),
//   mode: 'strict' | 'permissive' (default: 'strict'),
//   includeWarnings: boolean (default: true),
//   includeComments: boolean (default: true)
// }
```

**Returns**: Parsed TLE object with satellite name and all orbital parameters
**Throws**: TLEValidationError or TLEFormatError on validation failure (strict mode)

### 2. **State Machine Entry Point: `parseWithStateMachine()`**
```javascript
parseWithStateMachine(tleString, options = {})
// Options: {
//   attemptRecovery: boolean (default: true),
//   maxRecoveryAttempts: number (default: 10),
//   includePartialResults: boolean (default: true),
//   strictMode: boolean (default: false)
// }
```

**Returns**: Object with:
- `data` - Parsed data (or partial if recovery enabled)
- `errors` - Array of critical errors
- `warnings` - Array of warnings
- `recoveryActions` - Array of attempted recoveries

### 3. **Validation Entry Point: `validateTLE()`**
```javascript
validateTLE(tleString, options = {})
```

**Returns**: Validation result object with:
- `isValid` - boolean
- `errors` - Array of structured errors
- `warnings` - Array of warnings

---

## Module Structure & Dependencies

### Internal Dependencies
```
index.js
├── requires: fs, path
├── requires: ./errorCodes.js
├── requires: ./tleConfig.json
├── requires: ./stateMachineParser.js
└── uses: Error, RegExp

stateMachineParser.js
├── requires: ./errorCodes.js
└── uses: Error, Date
```

### External Dependencies
- **@types/jest** - TypeScript types for Jest (DevDep)
- **fast-check** - Property-based testing (DevDep)
- **jest** - Testing framework (DevDep)
- **satellite.js** - Optional orbital calculation library (DevDep)

**No runtime dependencies** - Pure JavaScript, self-contained.

---

## Type Definitions & JSDoc Status

### Current JSDoc Coverage
- **index.js**: 16 JSDoc blocks with ~87 annotations
  - Function parameter types: `@param {string}`, `@param {object}`, `@param {number}`
  - Return types: `@returns {object}`, `@returns {Array<string>}`, etc.
  - Custom types: Referenced but not formally defined

- **stateMachineParser.js**: 20 JSDoc blocks
  - Class documentation
  - Method documentation with param types
  - Enum/constant definitions (not fully typed)

- **errorCodes.js**: No JSDoc (simple object)

### Type System Gaps
1. No TypeScript type definitions
2. Custom types (TLEValidationError, TLEFormatError) lack structured type definitions
3. Complex return objects lack formal interfaces
4. Enum-like objects (ParserState, ErrorSeverity, RecoveryAction) are plain objects
5. Options objects lack interface definitions
6. No generic type support for extensibility
7. No discriminated unions for parser result types
8. No branded types for validated values

---

## Build & Compilation Setup

### Current Setup
- **Module System**: CommonJS (require/module.exports)
- **No Build Pipeline**: Direct Node.js execution
- **No TypeScript Compilation**: Pure JavaScript
- **No Bundling**: Single files

### CI/CD (GitHub Actions)
```yaml
on: push/pull_request to main
jobs:
  - Node.js 14 and 16
  - Steps: checkout → setup Node → npm install → npm test
```

### Test Running
```bash
npm test              # Run all tests with Jest
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
npm run test:verbose  # Detailed test output
npm run test:legacy   # Run legacy test.js
```

---

## Current Code Patterns & Conventions

### Error Handling Pattern
```javascript
// Structured error objects
{
  code: ERROR_CODES.CHECKSUM_MISMATCH,
  message: 'Human readable message',
  field: 'fieldName',
  expected: value,
  actual: value,
  severity: 'error'
}
```

### Validation Pattern
```javascript
// Return validation result with error array
{
  isValid: boolean,
  errors: Array<ErrorObject>,
  warnings: Array<WarningObject>
}
```

### Options Pattern
```javascript
function parse(input, options = {}) {
  const config = {
    defaultValue: value,
    ...options  // Override with user options
  };
}
```

### State Machine Pattern
```javascript
class StateMachine {
  constructor(options = {}) {
    this.options = { ...defaults, ...options };
    this.reset();
  }
  
  transition(newState, reason) { }
  parse(input) { }
  getResult() { }
}
```

---

## Key Data Structures

### Parsed TLE Object
```javascript
{
  satelliteName: string | null,
  lineNumber1: string,
  satelliteNumber1: string,
  classification: string,
  internationalDesignatorYear: string,
  internationalDesignatorLaunchNumber: string,
  internationalDesignatorPiece: string,
  epochYear: string,
  epoch: string,
  firstDerivative: string,
  secondDerivative: string,
  bStar: string,
  ephemerisType: string,
  elementSetNumber: string,
  checksum1: string,
  lineNumber2: string,
  satelliteNumber2: string,
  inclination: string,
  rightAscension: string,
  eccentricity: string,
  argumentOfPerigee: string,
  meanAnomaly: string,
  meanMotion: string,
  revolutionNumber: string,
  checksum2: string,
  warnings?: Array<WarningObject>,
  comments?: Array<string>
}
```

### Parser Context (State Machine)
```javascript
{
  lineCount: number,
  hasName: boolean,
  nameLineIndex: number,
  line1Index: number,
  line2Index: number,
  lines: Array<string>,
  recoveryAttempts: number
}
```

---

## Special Features & Capabilities

### 1. **Line Ending Normalization**
- Handles CRLF, LF, CR, and mixed line endings
- Cross-platform support (Windows, Unix, Mac)

### 2. **Whitespace Handling**
- Automatic trim of leading/trailing whitespace
- Removes empty lines
- Converts tabs to spaces

### 3. **Comment Support**
- Parses metadata lines starting with `#`
- Includes in result if requested

### 4. **Flexible Validation Modes**
- **Strict Mode**: Any error throws immediately
- **Permissive Mode**: Collects non-critical errors as warnings

### 5. **Error Recovery**
- State machine can recover from malformed data
- Attempt partial parsing with recovery actions recorded
- Extract valid data even from corrupted inputs

### 6. **Warning System**
- Classification deprecation warnings
- Epoch staleness warnings
- Orbital parameter anomaly warnings
- Drag coefficient warnings

### 7. **Comprehensive Checksums**
- NORAD checksum algorithm for both lines
- Field-level checksum validation
- Detailed checksum mismatch reporting

---

## Development & Migration Readiness

### Strengths for TypeScript Migration
✓ Good separation of concerns
✓ Extensive JSDoc comments
✓ Clear function signatures
✓ Error code constants centralized
✓ Configuration externalized to JSON
✓ Comprehensive test coverage (95%+)
✓ No external dependencies needed for core functionality
✓ Modular class-based architecture

### Areas to Address in Migration
- Formalize TypeScript interfaces
- Create type definitions for all public APIs
- Define discriminated union types
- Create branded types for validated values
- Add strict null checking
- Generate declaration files
- Create type guard functions
- Add generics for extensibility

---

## File Statistics

| File | Lines | Type | Purpose |
|------|-------|------|---------|
| index.js | 989 | Source | Main parser |
| stateMachineParser.js | 734 | Source | State machine parser |
| errorCodes.js | 31 | Source | Error constants |
| __tests__/index.test.js | 734 | Test | Parser tests |
| __tests__/stateMachineParser.test.js | 602 | Test | SM tests |
| __tests__/property.test.js | 781 | Test | Property tests |
| __tests__/integration.test.js | 489 | Test | Integration tests |
| __tests__/historical.test.js | 347 | Test | Historical tests |
| __tests__/regression.test.js | 428 | Test | Regression tests |
| __tests__/benchmark.test.js | 304 | Test | Benchmarks |
| __tests__/reference-validation.test.js | 301 | Test | Reference tests |
| jest.config.js | 27 | Config | Test configuration |
| package.json | 36 | Config | Project metadata |
| tleConfig.json | 25 | Data | Field mappings |
| test.js | 47,404 | Legacy | Old test suite |
| testStateMachine.js | 15,893 | Legacy | Old SM tests |

**Total Source Code**: ~1,754 lines
**Total Test Code**: ~3,986 lines
**Total Project**: ~68,000 lines (including legacy tests)

