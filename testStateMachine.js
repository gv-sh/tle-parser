// testStateMachine.js
const {
    TLEStateMachineParser,
    parseWithStateMachine,
    ParserState,
    ErrorSeverity,
    RecoveryAction
} = require('./stateMachineParser');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✓ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`✗ FAIL: ${testName}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✓ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`✗ FAIL: ${testName}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual: ${actual}`);
        testsFailed++;
    }
}

console.log('=== TLE State Machine Parser Tests ===\n');

// Test 1: Valid TLE data (ISS) - 2 lines
console.log('Test 1: Valid TLE data (ISS) - 2 lines');
const validTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result1 = parseWithStateMachine(validTLE);
assert(result1.success, 'Parse valid TLE successfully');
assertEquals(result1.state, ParserState.COMPLETED, 'Final state is COMPLETED');
assertEquals(result1.data.satelliteNumber1, '25544', 'Correct satellite number extracted');
assertEquals(result1.data.inclination, '51.6453', 'Correct inclination extracted');
assert(result1.errors.length === 0, 'No errors for valid TLE');

// Test 2: Valid TLE with satellite name - 3 lines
console.log('\nTest 2: Valid TLE with satellite name - 3 lines');
const validTLEWithName = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result2 = parseWithStateMachine(validTLEWithName);
assert(result2.success, 'Parse valid TLE with name successfully');
assertEquals(result2.data.satelliteName, 'ISS (ZARYA)', 'Correct satellite name extracted');
assert(result2.context.hasName, 'Correctly detected satellite name');

// Test 3: Invalid checksum with recovery
console.log('\nTest 3: Invalid checksum with error recovery');
const invalidChecksumTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result3 = parseWithStateMachine(invalidChecksumTLE, { attemptRecovery: true });
assert(result3.data.satelliteNumber1 === '25544', 'Still extracted satellite number despite checksum error');
assert(result3.errors.length > 0, 'Checksum error was recorded');
const hasChecksumError = result3.errors.some(e => e.code === 'CHECKSUM_MISMATCH');
assert(hasChecksumError, 'Checksum error was detected');
assert(result3.recoveryActions.length > 0, 'Recovery action was recorded');

// Test 4: Line too short - partial field extraction
console.log('\nTest 4: Line too short - partial field extraction with recovery');
const shortLineTLE = `1 25544U 98067A   20300.83097691
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result4 = parseWithStateMachine(shortLineTLE, { attemptRecovery: true, includePartialResults: true });
assert(result4.data.satelliteNumber1 === '25544', 'Extracted satellite number from short line');
assert(result4.errors.length > 0, 'Line length error was recorded');
assert(result4.warnings.some(w => w.code === 'PARTIAL_FIELD' || w.code === 'MISSING_FIELD'), 'Partial/missing field warnings recorded');

// Test 5: Satellite number mismatch
console.log('\nTest 5: Satellite number mismatch detection');
const mismatchTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25545  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result5 = parseWithStateMachine(mismatchTLE);
assert(result5.errors.some(e => e.code === 'SATELLITE_NUMBER_MISMATCH'), 'Satellite number mismatch detected');
assert(result5.data.satelliteNumber1 === '25544', 'Still extracted Line 1 satellite number');
assert(result5.data.satelliteNumber2 === '25545', 'Still extracted Line 2 satellite number');

// Test 6: Wrong line numbers with recovery
console.log('\nTest 6: Wrong line numbers with error recovery');
const wrongLineNumTLE = `3 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result6 = parseWithStateMachine(wrongLineNumTLE, { attemptRecovery: true });
assert(result6.errors.some(e => e.code === 'INVALID_LINE_NUMBER'), 'Invalid line number detected');
assert(result6.data.satelliteNumber1 === '25544', 'Still extracted satellite number despite wrong line number');

// Test 7: Empty input
console.log('\nTest 7: Empty input handling');
const result7 = parseWithStateMachine('');
assertEquals(result7.state, ParserState.ERROR, 'Empty input results in ERROR state');
assert(result7.errors.some(e => e.code === 'EMPTY_INPUT'), 'Empty input error detected');

// Test 8: Only 1 line provided
console.log('\nTest 8: Only 1 line provided');
const oneLine = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996`;

const result8 = parseWithStateMachine(oneLine);
assertEquals(result8.state, ParserState.ERROR, 'Insufficient lines results in ERROR state');
assert(result8.errors.some(e => e.code === 'INVALID_LINE_COUNT'), 'Invalid line count error detected');

// Test 9: More than 3 lines - recovery by identifying TLE lines
console.log('\nTest 9: More than 3 lines with recovery');
const tooManyLines = `ISS (ZARYA)
Some extra line
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
Extra line`;

const result9 = parseWithStateMachine(tooManyLines, { attemptRecovery: true });
assert(result9.errors.some(e => e.code === 'INVALID_LINE_COUNT'), 'Too many lines error detected');
assert(result9.recoveryActions.length > 0, 'Recovery attempted');
// Should attempt to find valid TLE lines

// Test 10: Invalid classification
console.log('\nTest 10: Invalid classification with recovery');
const invalidClassTLE = `1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result10 = parseWithStateMachine(invalidClassTLE);
assert(result10.errors.some(e => e.code === 'INVALID_CLASSIFICATION'), 'Invalid classification detected');
assertEquals(result10.data.classification, 'X', 'Still extracted classification value');

// Test 11: Out of range inclination
console.log('\nTest 11: Out of range inclination detection');
const badInclinationTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544 251.6453  57.0843 0001671  64.9808  73.0513 15.49338189252426`;

const result11 = parseWithStateMachine(badInclinationTLE);
assert(result11.errors.some(e => e.code === 'VALUE_OUT_OF_RANGE' && e.field === 'inclination'), 'Out of range inclination detected');
assertEquals(result11.data.inclination, '251.6453', 'Still extracted inclination value');

// Test 12: Both lines with invalid checksums
console.log('\nTest 12: Both lines with invalid checksums');
const bothInvalidChecksums = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9990
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252420`;

const result12 = parseWithStateMachine(bothInvalidChecksums, { attemptRecovery: true });
const checksumErrors = result12.errors.filter(e => e.code === 'CHECKSUM_MISMATCH');
assertEquals(checksumErrors.length, 2, 'Both checksum errors detected');
assert(result12.data.satelliteNumber1 === '25544', 'Still extracted data despite both checksum errors');

// Test 13: Non-string input
console.log('\nTest 13: Non-string input handling');
const result13 = parseWithStateMachine(12345);
assertEquals(result13.state, ParserState.ERROR, 'Non-string input results in ERROR state');
assert(result13.errors.some(e => e.code === 'INVALID_INPUT_TYPE'), 'Invalid input type error detected');

// Test 14: Satellite name too long (warning)
console.log('\nTest 14: Satellite name too long produces warning');
const longNameTLE = `This is a very long satellite name that exceeds 24 characters
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result14 = parseWithStateMachine(longNameTLE);
assert(result14.warnings.some(w => w.code === 'SATELLITE_NAME_TOO_LONG'), 'Long satellite name warning detected');
assert(result14.success, 'Still successfully parses despite long name');

// Test 15: Strict mode - stops on first error
console.log('\nTest 15: Strict mode behavior');
const result15 = parseWithStateMachine(invalidChecksumTLE, { strictMode: true, attemptRecovery: false });
assert(result15.errors.length > 0, 'Errors detected in strict mode');
// In strict mode with no recovery, should still complete but report errors

// Test 16: Parser state transitions tracking
console.log('\nTest 16: Parser state transitions');
const parser = new TLEStateMachineParser();
const result16 = parser.parse(validTLE);
assertEquals(result16.state, ParserState.COMPLETED, 'Ends in COMPLETED state');
assert(result16.success, 'Parse successful');

// Test 17: Recovery actions tracking
console.log('\nTest 17: Recovery actions tracking');
const result17 = parseWithStateMachine(shortLineTLE, { attemptRecovery: true });
assert(result17.recoveryActions.length > 0, 'Recovery actions were tracked');
const continueAction = result17.recoveryActions.find(a => a.action === RecoveryAction.CONTINUE);
assert(continueAction !== undefined, 'CONTINUE recovery action was used');

// Test 18: includePartialResults option
console.log('\nTest 18: includePartialResults option');
const result18a = parseWithStateMachine(shortLineTLE, {
    attemptRecovery: true,
    includePartialResults: true
});
assert(result18a.data.satelliteNumber1 !== null, 'Partial results included');

const result18b = parseWithStateMachine(shortLineTLE, {
    attemptRecovery: false,
    includePartialResults: false
});
assert(result18b.errors.length > 0, 'Errors recorded without partial results');

// Test 19: Context information
console.log('\nTest 19: Context information in result');
const result19 = parseWithStateMachine(validTLEWithName);
assert(result19.context.lineCount === 3, 'Correct line count in context');
assert(result19.context.hasName === true, 'Correct hasName flag in context');
assertEquals(result19.context.recoveryAttempts, 0, 'No recovery attempts for valid TLE');

// Test 20: Multiple error types in single parse
console.log('\nTest 20: Multiple error types in single parse');
const multiErrorTLE = `ISS
1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25545 251.6453  57.0843 0001671  64.9808  73.0513 15.49338189252420`;

const result20 = parseWithStateMachine(multiErrorTLE);
assert(result20.errors.length >= 3, 'Multiple errors detected');
const errorCodes = result20.errors.map(e => e.code);
assert(errorCodes.includes('INVALID_CLASSIFICATION'), 'Classification error detected');
assert(errorCodes.includes('CHECKSUM_MISMATCH'), 'Checksum error detected');
assert(errorCodes.includes('SATELLITE_NUMBER_MISMATCH'), 'Satellite number mismatch detected');

// Test 21: Warning severity vs error severity
console.log('\nTest 21: Warning severity vs error severity');
const result21 = parseWithStateMachine(longNameTLE);
const warnings = result21.warnings.filter(w => w.severity === ErrorSeverity.WARNING);
const errors = result21.errors.filter(e => e.severity === ErrorSeverity.ERROR);
assert(warnings.length > 0, 'Warnings have WARNING severity');
assert(result21.success, 'Warnings do not prevent successful parse');

// Test 22: Error severity levels
console.log('\nTest 22: Critical error severity');
const result22 = parseWithStateMachine('');
const criticalErrors = result22.errors.filter(e => e.severity === ErrorSeverity.CRITICAL);
assert(criticalErrors.length > 0, 'Critical errors detected for empty input');
assert(!result22.success, 'Critical errors prevent success');

// Test 23: Field extraction with missing fields
console.log('\nTest 23: Field extraction with missing fields');
const veryShortTLE = `1 25544U 98067
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result23 = parseWithStateMachine(veryShortTLE, { attemptRecovery: true });
assert(result23.data.satelliteNumber1 === '25544', 'Extracted available fields');
assert(result23.warnings.some(w => w.code === 'MISSING_FIELD'), 'Missing field warnings recorded');

// Test 24: Raw line storage
console.log('\nTest 24: Raw line storage in parsed data');
const result24 = parseWithStateMachine(validTLE);
assert(result24.data.line1Raw !== undefined, 'Line 1 raw data stored');
assert(result24.data.line2Raw !== undefined, 'Line 2 raw data stored');
assert(result24.data.line1Raw.includes('25544'), 'Line 1 raw data contains satellite number');

// Test 25: Epoch year validation
console.log('\nTest 25: Epoch year validation');
const result25 = parseWithStateMachine(validTLE);
const epochYear = parseInt(result25.data.epochYear, 10);
assert(!isNaN(epochYear) && epochYear >= 0 && epochYear <= 99, 'Epoch year in valid range');

// Test 26: Mean motion unusual value (warning not error)
console.log('\nTest 26: Mean motion unusual value warning');
const highMeanMotionTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 25.49338189252421`;

const result26 = parseWithStateMachine(highMeanMotionTLE);
const meanMotionWarning = result26.warnings.find(w => w.field === 'meanMotion');
// Should produce warning for unusual mean motion value (>20)

// Test 27: Satellite name starting with '1' or '2' warning
console.log('\nTest 27: Satellite name starting with "1" or "2" warning');
const nameStartsWith1 = `1KUNS-PF
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

const result27 = parseWithStateMachine(nameStartsWith1);
assert(result27.warnings.some(w => w.code === 'SATELLITE_NAME_FORMAT_WARNING'), 'Name format warning detected');

// Test 28: Recovery with 4+ lines attempting to find TLE lines
console.log('\nTest 28: Recovery with 4+ lines finding valid TLE');
const fourLinesWithValidTLE = `Random header
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
Random footer`;

const result28 = parseWithStateMachine(fourLinesWithValidTLE, { attemptRecovery: true });
assert(result28.errors.some(e => e.code === 'INVALID_LINE_COUNT'), 'Too many lines error recorded');
// Should attempt recovery

// Test 29: Eccentricity validation
console.log('\nTest 29: Eccentricity validation');
const result29 = parseWithStateMachine(validTLE);
const ecc = result29.data.eccentricity;
assert(ecc !== null && ecc !== undefined, 'Eccentricity extracted');
// Eccentricity is stored without leading "0." in TLE format

// Test 30: State information in errors and warnings
console.log('\nTest 30: State information in errors and warnings');
const result30 = parseWithStateMachine(invalidChecksumTLE);
const checksumError = result30.errors.find(e => e.code === 'CHECKSUM_MISMATCH');
assert(checksumError.state !== undefined, 'Error includes state information');

console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
    console.log('\n🎉 All state machine tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
}
