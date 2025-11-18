// test.js
const {
    parseTLE,
    validateTLE,
    calculateChecksum,
    validateChecksum,
    validateLineStructure,
    validateSatelliteNumber,
    validateClassification,
    validateNumericRange,
    normalizeLineEndings,
    parseTLELines,
    TLEValidationError,
    TLEFormatError,
    ERROR_CODES
} = require('./index');

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

console.log('=== TLE Parser Validation Tests ===\n');

// Test 1: Valid TLE data (ISS)
console.log('Test 1: Valid TLE data (ISS)');
const validTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
    const result = parseTLE(validTLE);
    assert(result !== null, 'Parse valid TLE');
    assertEquals(result.satelliteNumber1, '25544', 'Correct satellite number extracted');
    assertEquals(result.inclination, '51.6453', 'Correct inclination extracted');
} catch (e) {
    assert(false, 'Parse valid TLE - threw error: ' + e.message);
}

// Test 2: Valid TLE with satellite name
console.log('\nTest 2: Valid TLE with satellite name');
const validTLEWithName = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

try {
    const result = parseTLE(validTLEWithName);
    assert(result !== null, 'Parse valid TLE with satellite name');
    assertEquals(result.satelliteName, 'ISS (ZARYA)', 'Correct satellite name extracted');
} catch (e) {
    assert(false, 'Parse valid TLE with satellite name - threw error: ' + e.message);
}

// Test 3: Checksum calculation
console.log('\nTest 3: Checksum calculation');
const line1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const checksum1 = calculateChecksum(line1);
assertEquals(checksum1, 6, 'Correct checksum calculated for line 1');

// Test 4: Checksum validation
console.log('\nTest 4: Checksum validation');
const checksumResult = validateChecksum(line1);
assert(checksumResult.isValid, 'Valid checksum passes validation');

// Test 5: Invalid checksum
console.log('\nTest 5: Invalid checksum');
const invalidChecksumLine = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995';
const invalidChecksumResult = validateChecksum(invalidChecksumLine);
assert(!invalidChecksumResult.isValid, 'Invalid checksum fails validation');

// Test 6: Line too short
console.log('\nTest 6: Line too short');
try {
    const shortTLE = `1 25544U 98067A
2 25544  51.6453`;
    parseTLE(shortTLE);
    assert(false, 'Line too short should throw error');
} catch (e) {
    assert(true, 'Line too short throws error');
}

// Test 7: Line too long
console.log('\nTest 7: Line validation with incorrect length');
const tooLongLine = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  99961234';
const lengthResult = validateLineStructure(tooLongLine, 1);
assert(!lengthResult.isValid, 'Line too long fails validation');

// Test 8: Incorrect line number
console.log('\nTest 8: Incorrect line number');
const wrongLineNumber = '3 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const lineNumResult = validateLineStructure(wrongLineNumber, 1);
assert(!lineNumResult.isValid, 'Incorrect line number fails validation');

// Test 9: Satellite number mismatch
console.log('\nTest 9: Satellite number mismatch');
const mismatchTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25545  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    parseTLE(mismatchTLE);
    assert(false, 'Satellite number mismatch should throw error');
} catch (e) {
    assert(true, 'Satellite number mismatch throws error');
}

// Test 10: Invalid classification
console.log('\nTest 10: Invalid classification');
const invalidClassTLE = `1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    parseTLE(invalidClassTLE);
    assert(false, 'Invalid classification should throw error');
} catch (e) {
    assert(true, 'Invalid classification throws error');
}

// Test 11: Validate TLE function with options
console.log('\nTest 11: Validate TLE function with strict checksums disabled');
const validation = validateTLE(validTLE, { strictChecksums: false, validateRanges: true });
assert(validation.isValid, 'Valid TLE passes validation');
assert(validation.errors.length === 0, 'Valid TLE has no errors');

// Test 12: Out of range inclination
console.log('\nTest 12: Out of range inclination');
const badInclinationTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544 251.6453  57.0843 0001671  64.9808  73.0513 15.49338189252426`;
try {
    parseTLE(badInclinationTLE);
    assert(false, 'Out of range inclination should throw error');
} catch (e) {
    assert(true, 'Out of range inclination throws error');
}

// Test 13: Invalid epoch day
console.log('\nTest 13: Invalid epoch day (out of range)');
const badEpochTLE = `1 25544U 98067A   20400.83097691  .00001534  00000-0  35580-4 0  9997
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252429`;
try {
    parseTLE(badEpochTLE);
    assert(false, 'Invalid epoch day should throw error');
} catch (e) {
    assert(true, 'Invalid epoch day throws error');
}

// Test 14: Parse without validation
console.log('\nTest 14: Parse without validation');
const invalidChecksumTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(invalidChecksumTLE, { validate: false });
    assert(result !== null, 'Parse without validation succeeds even with invalid checksum');
} catch (e) {
    assert(false, 'Parse without validation should not throw error');
}

// Test 15: validateNumericRange function
console.log('\nTest 15: validateNumericRange function');
const rangeResult1 = validateNumericRange('50.5', 'Test Field', 0, 100);
assert(rangeResult1.isValid, 'Value in range passes validation');

const rangeResult2 = validateNumericRange('150.5', 'Test Field', 0, 100);
assert(!rangeResult2.isValid, 'Value out of range fails validation');

const rangeResult3 = validateNumericRange('abc', 'Test Field', 0, 100);
assert(!rangeResult3.isValid, 'Non-numeric value fails validation');

// Test 16: Only 1 line provided
console.log('\nTest 16: Only 1 line provided');
const oneLine = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996`;
try {
    parseTLE(oneLine);
    assert(false, 'Only 1 line should throw error');
} catch (e) {
    assert(true, 'Only 1 line throws error');
}

// Test 17: More than 3 lines provided
console.log('\nTest 17: More than 3 lines provided');
const tooManyLines = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
Extra line`;
try {
    parseTLE(tooManyLines);
    assert(false, 'More than 3 lines should throw error');
} catch (e) {
    assert(true, 'More than 3 lines throws error');
}

// Test 18: validateClassification with valid values
console.log('\nTest 18: validateClassification with valid values');
const validClassLine = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const classResult = validateClassification(validClassLine);
assert(classResult.isValid, 'Valid classification (U) passes');

// Test 19: Another valid TLE (Hubble Space Telescope)
console.log('\nTest 19: Another valid TLE (Hubble Space Telescope)');
const hubbleTLE = `1 20580U 90037B   20300.40752066  .00000935  00000-0  51815-4 0  9990
2 20580  28.4694 291.5056 0002821  87.1571 289.7311 15.09612758476361`;
try {
    const result = parseTLE(hubbleTLE);
    assert(result !== null, 'Parse Hubble TLE');
    assertEquals(result.satelliteNumber1, '20580', 'Correct Hubble satellite number');
} catch (e) {
    assert(false, 'Parse Hubble TLE - threw error: ' + e.message);
}

// Test 20: Validate eccentricity range
console.log('\nTest 20: Validate eccentricity range');
const eccResult = validateNumericRange('0.0001671', 'Eccentricity', 0, 1);
assert(eccResult.isValid, 'Valid eccentricity passes');

// Test 21: Line 1 checksum verification
console.log('\nTest 21: Line 1 invalid checksum detected');
const line1InvalidChecksum = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9997
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    parseTLE(line1InvalidChecksum);
    assert(false, 'Line 1 invalid checksum should throw error');
} catch (e) {
    assert(e.message.includes('Line 1') && e.message.includes('Checksum'), 'Line 1 checksum error detected');
}

// Test 22: Line 2 checksum verification
console.log('\nTest 22: Line 2 invalid checksum detected');
const line2InvalidChecksum = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252429`;
try {
    parseTLE(line2InvalidChecksum);
    assert(false, 'Line 2 invalid checksum should throw error');
} catch (e) {
    assert(e.message.includes('Line 2') && e.message.includes('Checksum'), 'Line 2 checksum error detected');
}

// Test 23: Both lines invalid checksums
console.log('\nTest 23: Both lines with invalid checksums');
const bothInvalidChecksums = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9990
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252420`;
try {
    parseTLE(bothInvalidChecksums);
    assert(false, 'Both invalid checksums should throw error');
} catch (e) {
    assert(e.message.includes('Line 1') || e.message.includes('Line 2'), 'At least one checksum error detected');
}

// Test 24: Verify calculateChecksum for line 2
console.log('\nTest 24: Calculate checksum for line 2');
const line2 = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const checksum2 = calculateChecksum(line2);
assertEquals(checksum2, 8, 'Correct checksum calculated for line 2');

// Test 25: Validate both lines checksums explicitly
console.log('\nTest 25: Validate both lines checksums explicitly');
const validLine1 = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
const validLine2 = '2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const line1Check = validateChecksum(validLine1);
const line2Check = validateChecksum(validLine2);
assert(line1Check.isValid && line2Check.isValid, 'Both line checksums validate correctly');

// Test 26: Input type validation - non-string input
console.log('\nTest 26: Input type validation - non-string input');
try {
    parseTLE(12345);
    assert(false, 'Non-string input should throw TypeError');
} catch (e) {
    assert(e instanceof TypeError, 'Non-string input throws TypeError');
    assert(e.message.includes('must be a string'), 'TypeError has correct message');
}

// Test 27: Empty string input
console.log('\nTest 27: Empty string input');
try {
    parseTLE('');
    assert(false, 'Empty string should throw error');
} catch (e) {
    assert(e instanceof TLEFormatError, 'Empty string throws TLEFormatError');
    assertEquals(e.code, ERROR_CODES.EMPTY_INPUT, 'Empty string error has correct error code');
}

// Test 28: TLEValidationError with structured errors
console.log('\nTest 28: TLEValidationError with structured errors');
try {
    const invalidTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
    parseTLE(invalidTLE);
    assert(false, 'Invalid TLE should throw TLEValidationError');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Invalid TLE throws TLEValidationError');
    assert(e.name === 'TLEValidationError', 'Error has correct name');
    assert(Array.isArray(e.errors), 'Error has errors array');
    assert(e.errors.length > 0, 'Error has at least one error');
}

// Test 29: Structured error objects have error codes
console.log('\nTest 29: Structured error objects have error codes');
const invalidLineTLE = `1 25544U 98067A
2 25544  51.6453`;
try {
    parseTLE(invalidLineTLE);
    assert(false, 'Invalid line length should throw error');
} catch (e) {
    assert(e.errors && e.errors.length > 0, 'Error has errors array');
    const firstError = e.errors[0];
    assert(firstError.code !== undefined, 'Error object has code property');
    assert(firstError.message !== undefined, 'Error object has message property');
    assert(firstError.severity !== undefined, 'Error object has severity property');
}

// Test 30: Warnings returned in parsed result
console.log('\nTest 30: Warnings returned in parsed result');
const tleWithLongName = `This is a very long satellite name that exceeds 24 characters
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(tleWithLongName);
    assert(result.warnings !== undefined, 'Result includes warnings');
    assert(Array.isArray(result.warnings), 'Warnings is an array');
    assert(result.warnings.length > 0, 'Warnings array has items');
    assert(result.warnings[0].code !== undefined, 'Warning has error code');
    assert(result.warnings[0].severity === 'warning', 'Warning has severity "warning"');
} catch (e) {
    assert(false, 'Valid TLE with warnings should not throw: ' + e.message);
}

// Test 31: includeWarnings option can disable warnings in result
console.log('\nTest 31: includeWarnings option can disable warnings in result');
try {
    const result = parseTLE(tleWithLongName, { includeWarnings: false });
    assert(result.warnings === undefined, 'Result does not include warnings when disabled');
} catch (e) {
    assert(false, 'Valid TLE should parse: ' + e.message);
}

// Test 32: Invalid options type
console.log('\nTest 32: Invalid options type');
try {
    parseTLE(validTLE, 'invalid');
    assert(false, 'Invalid options type should throw TypeError');
} catch (e) {
    assert(e instanceof TypeError, 'Invalid options throws TypeError');
    assert(e.message.includes('Options must be an object'), 'TypeError has correct message');
}

// Test 33: validateTLE with invalid input type
console.log('\nTest 33: validateTLE with invalid input type');
try {
    validateTLE(null);
    assert(false, 'Null input should throw TypeError');
} catch (e) {
    assert(e instanceof TypeError, 'Null input throws TypeError');
}

// Test 34: Error codes are exported and accessible
console.log('\nTest 34: Error codes are exported and accessible');
assert(ERROR_CODES !== undefined, 'ERROR_CODES is exported');
assert(ERROR_CODES.INVALID_LINE_LENGTH !== undefined, 'ERROR_CODES contains INVALID_LINE_LENGTH');
assert(ERROR_CODES.CHECKSUM_MISMATCH !== undefined, 'ERROR_CODES contains CHECKSUM_MISMATCH');
assert(ERROR_CODES.SATELLITE_NUMBER_MISMATCH !== undefined, 'ERROR_CODES contains SATELLITE_NUMBER_MISMATCH');

// Test 35: Structured error has expected/actual values
console.log('\nTest 35: Structured error has expected/actual values');
const lineStructureResult = validateLineStructure('1 25544U', 1);
assert(!lineStructureResult.isValid, 'Short line fails validation');
assert(lineStructureResult.errors.length > 0, 'Has errors');
const error = lineStructureResult.errors[0];
assert(error.expected === 69, 'Error has expected value');
assert(error.actual === 8, 'Error has actual value');
assert(error.code === ERROR_CODES.INVALID_LINE_LENGTH, 'Error has correct code');

// Test 36: 3-line TLE with satellite name starting with '1' (should produce warning)
console.log('\nTest 36: 3-line TLE with satellite name starting with "1" produces warning');
const nameStartsWith1 = `1KUNS-PF
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(nameStartsWith1);
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Satellite name starting with "1" produces warning');
    const hasWarning = result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING);
    assert(hasWarning, 'Warning code is SATELLITE_NAME_FORMAT_WARNING');
} catch (e) {
    assert(false, 'Valid TLE with name starting with "1" should not throw: ' + e.message);
}

// Test 37: 3-line TLE with satellite name starting with '2' (should produce warning)
console.log('\nTest 37: 3-line TLE with satellite name starting with "2" produces warning');
const nameStartsWith2 = `2020-001A
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(nameStartsWith2);
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Satellite name starting with "2" produces warning');
    const hasWarning = result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING);
    assert(hasWarning, 'Warning code is SATELLITE_NAME_FORMAT_WARNING');
} catch (e) {
    assert(false, 'Valid TLE with name starting with "2" should not throw: ' + e.message);
}

// Test 38: 3-line TLE with satellite name exactly 24 characters
console.log('\nTest 38: 3-line TLE with satellite name exactly 24 characters (no warning)');
const name24Chars = `EXACTLY24CHARACTERSLONG!
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(name24Chars);
    assertEquals(result.satelliteName, 'EXACTLY24CHARACTERSLONG!', 'Satellite name with exactly 24 chars is extracted');
    const hasLengthWarning = result.warnings && result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NAME_TOO_LONG);
    assert(!hasLengthWarning, 'No length warning for 24 character name');
} catch (e) {
    assert(false, 'Valid TLE with 24 character name should not throw: ' + e.message);
}

// Test 39: 3-line TLE with satellite name containing special characters
console.log('\nTest 39: 3-line TLE with satellite name containing special characters');
const nameWithSpecialChars = `STARLINK-1234 (V1.5)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(nameWithSpecialChars);
    assert(result !== null, 'Parse TLE with special characters in name');
    assertEquals(result.satelliteName, 'STARLINK-1234 (V1.5)', 'Special characters in satellite name preserved');
} catch (e) {
    assert(false, 'Valid TLE with special characters in name should not throw: ' + e.message);
}

// Test 40: 3-line TLE with short satellite name
console.log('\nTest 40: 3-line TLE with very short satellite name');
const shortName = `SAT
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(shortName);
    assert(result !== null, 'Parse TLE with short name');
    assertEquals(result.satelliteName, 'SAT', 'Short satellite name extracted correctly');
} catch (e) {
    assert(false, 'Valid TLE with short name should not throw: ' + e.message);
}

// Test 41: 3-line TLE format with multiple real satellites (Hubble)
console.log('\nTest 41: 3-line TLE format with real satellite (Hubble Space Telescope)');
const hubble3Line = `HST
1 20580U 90037B   20300.40752066  .00000935  00000-0  51815-4 0  9990
2 20580  28.4694 291.5056 0002821  87.1571 289.7311 15.09612758476361`;
try {
    const result = parseTLE(hubble3Line);
    assert(result !== null, 'Parse 3-line Hubble TLE');
    assertEquals(result.satelliteName, 'HST', 'Hubble satellite name extracted');
    assertEquals(result.satelliteNumber1, '20580', 'Hubble satellite number correct');
} catch (e) {
    assert(false, 'Valid 3-line Hubble TLE should not throw: ' + e.message);
}

// Test 42: normalizeLineEndings function - CRLF to LF
console.log('\nTest 42: normalizeLineEndings function - CRLF to LF');
const textWithCRLF = 'line1\r\nline2\r\nline3';
const normalizedCRLF = normalizeLineEndings(textWithCRLF);
assertEquals(normalizedCRLF, 'line1\nline2\nline3', 'CRLF normalized to LF');

// Test 43: normalizeLineEndings function - CR to LF
console.log('\nTest 43: normalizeLineEndings function - CR to LF');
const textWithCR = 'line1\rline2\rline3';
const normalizedCR = normalizeLineEndings(textWithCR);
assertEquals(normalizedCR, 'line1\nline2\nline3', 'CR normalized to LF');

// Test 44: normalizeLineEndings function - LF remains unchanged
console.log('\nTest 44: normalizeLineEndings function - LF remains unchanged');
const textWithLF = 'line1\nline2\nline3';
const normalizedLF = normalizeLineEndings(textWithLF);
assertEquals(normalizedLF, 'line1\nline2\nline3', 'LF remains unchanged');

// Test 45: normalizeLineEndings function - mixed line endings
console.log('\nTest 45: normalizeLineEndings function - mixed line endings');
const textWithMixed = 'line1\r\nline2\rline3\nline4';
const normalizedMixed = normalizeLineEndings(textWithMixed);
assertEquals(normalizedMixed, 'line1\nline2\nline3\nline4', 'Mixed line endings normalized to LF');

// Test 46: Parse TLE with CRLF line endings
console.log('\nTest 46: Parse TLE with CRLF line endings');
// Test 42: Strict mode with invalid checksum (should throw)
console.log('\nTest 42: Strict mode with invalid checksum throws error');
const invalidChecksumStrictTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    parseTLE(invalidChecksumStrictTLE, { mode: 'strict' });
    assert(false, 'Strict mode with invalid checksum should throw');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Strict mode throws TLEValidationError for checksum errors');
}

// Test 43: Permissive mode with invalid checksum (should parse with warnings)
console.log('\nTest 43: Permissive mode with invalid checksum parses successfully');
try {
    const result = parseTLE(invalidChecksumStrictTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with invalid checksum');
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Permissive mode includes warnings for checksum errors');
    const hasChecksumWarning = result.warnings.some(w => w.code === ERROR_CODES.CHECKSUM_MISMATCH);
    assert(hasChecksumWarning, 'Warning includes checksum mismatch error');
} catch (e) {
    assert(false, 'Permissive mode should not throw for checksum errors: ' + e.message);
}

// Test 44: Permissive mode with satellite number mismatch
console.log('\nTest 44: Permissive mode with satellite number mismatch');
const satMismatchTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25545  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(satMismatchTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with satellite number mismatch');
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Permissive mode includes warnings');
    const hasSatNumWarning = result.warnings.some(w => w.code === ERROR_CODES.SATELLITE_NUMBER_MISMATCH);
    assert(hasSatNumWarning, 'Warning includes satellite number mismatch');
    assertEquals(result.satelliteNumber1, '25544', 'Satellite number from line 1 is extracted');
} catch (e) {
    assert(false, 'Permissive mode should not throw for satellite number mismatch: ' + e.message);
}

// Test 45: Strict mode with satellite number mismatch (should throw)
console.log('\nTest 45: Strict mode with satellite number mismatch throws error');
try {
    parseTLE(satMismatchTLE, { mode: 'strict' });
    assert(false, 'Strict mode should throw for satellite number mismatch');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Strict mode throws TLEValidationError for satellite number mismatch');
}

// Test 46: Permissive mode with invalid classification
console.log('\nTest 46: Permissive mode with invalid classification');
const invalidClassPermissiveTLE = `1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(invalidClassPermissiveTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with invalid classification');
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Permissive mode includes warnings');
    const hasClassWarning = result.warnings.some(w => w.code === ERROR_CODES.INVALID_CLASSIFICATION);
    assert(hasClassWarning, 'Warning includes invalid classification');
} catch (e) {
    assert(false, 'Permissive mode should not throw for invalid classification: ' + e.message);
}

// Test 47: Permissive mode with out-of-range inclination
console.log('\nTest 47: Permissive mode with out-of-range inclination');
const badInclinationPermissiveTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544 251.6453  57.0843 0001671  64.9808  73.0513 15.49338189252426`;
try {
    const result = parseTLE(badInclinationPermissiveTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with out-of-range inclination');
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Permissive mode includes warnings');
    const hasRangeWarning = result.warnings.some(w => w.code === ERROR_CODES.VALUE_OUT_OF_RANGE && w.field === 'Inclination');
    assert(hasRangeWarning, 'Warning includes inclination out of range');
} catch (e) {
    assert(false, 'Permissive mode should not throw for out-of-range inclination: ' + e.message);
}

// Test 48: Permissive mode still throws for critical errors (invalid line length)
console.log('\nTest 48: Permissive mode still throws for critical errors (invalid line length)');
const shortLineTLE = `1 25544U 98067A
2 25544  51.6453`;
try {
    parseTLE(shortLineTLE, { mode: 'permissive' });
    assert(false, 'Permissive mode should throw for critical line length errors');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Permissive mode throws TLEValidationError for critical errors');
}

// Test 49: Permissive mode still throws for critical errors (invalid line count)
console.log('\nTest 49: Permissive mode still throws for critical errors (invalid line count)');
const oneLineTLE = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996`;
try {
    parseTLE(oneLineTLE, { mode: 'permissive' });
    assert(false, 'Permissive mode should throw for invalid line count');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Permissive mode throws TLEValidationError for invalid line count');
}

// Test 50: Invalid mode parameter
console.log('\nTest 50: Invalid mode parameter throws TypeError');
try {
    parseTLE(validTLE, { mode: 'invalid' });
    assert(false, 'Invalid mode parameter should throw TypeError');
} catch (e) {
    assert(e instanceof TypeError, 'Invalid mode throws TypeError');
    assert(e.message.includes('strict') && e.message.includes('permissive'), 'Error message mentions valid modes');
}

// Test 51: validateTLE with permissive mode returns warnings
console.log('\nTest 51: validateTLE with permissive mode returns warnings');
const permissiveValidation = validateTLE(invalidChecksumStrictTLE, { mode: 'permissive' });
assert(permissiveValidation.isValid, 'Permissive mode validation reports valid for non-critical errors');
assert(permissiveValidation.warnings.length > 0, 'Validation includes warnings');
assert(permissiveValidation.errors.length === 0, 'Validation has no errors in permissive mode for non-critical issues');

// Test 52: validateTLE with strict mode returns errors
console.log('\nTest 52: validateTLE with strict mode returns errors');
const strictModeValidation = validateTLE(invalidChecksumStrictTLE, { mode: 'strict' });
assert(!strictModeValidation.isValid, 'Strict mode validation reports invalid for checksum errors');
assert(strictModeValidation.errors.length > 0, 'Validation includes errors');

// Test 53: Permissive mode with multiple errors
console.log('\nTest 53: Permissive mode with multiple non-critical errors');
const multipleErrorsTLE = `1 25544X 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9995
2 25545 251.6453  57.0843 0001671  64.9808  73.0513 15.49338189252429`;
try {
    const result = parseTLE(multipleErrorsTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with multiple errors');
    assert(result.warnings !== undefined && result.warnings.length >= 4, 'Multiple warnings collected (checksums, sat num, classification, range)');
} catch (e) {
    assert(false, 'Permissive mode should not throw for multiple non-critical errors: ' + e.message);
}

// Test 54: Strict mode is default
console.log('\nTest 54: Strict mode is default when mode not specified');
try {
    parseTLE(invalidChecksumStrictTLE);
    assert(false, 'Default mode should be strict and throw for checksum errors');
} catch (e) {
    assert(e instanceof TLEValidationError, 'Default mode (strict) throws for validation errors');
}

// Test 55: Permissive mode with out-of-range epoch day
console.log('\nTest 55: Permissive mode with out-of-range epoch day');
const badEpochPermissiveTLE = `1 25544U 98067A   20400.83097691  .00001534  00000-0  35580-4 0  9997
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252429`;
try {
    const result = parseTLE(badEpochPermissiveTLE, { mode: 'permissive' });
    assert(result !== null, 'Permissive mode parses TLE with out-of-range epoch day');
    assert(result.warnings !== undefined && result.warnings.length > 0, 'Permissive mode includes warnings');
    const hasEpochWarning = result.warnings.some(w => w.code === ERROR_CODES.VALUE_OUT_OF_RANGE && w.field === 'Epoch Day');
    assert(hasEpochWarning, 'Warning includes epoch day out of range');
} catch (e) {
    assert(false, 'Permissive mode should not throw for out-of-range epoch day: ' + e.message);
// ============================================================================
// EDGE CASE TESTS: Whitespace variations and malformed data handling
// ============================================================================

console.log('\n=== Edge Case Tests: Whitespace & Malformed Data ===');

// Test 42: CRLF line endings (Windows-style)
console.log('\nTest 42: TLE with CRLF line endings (Windows-style)');
const tleCRLF = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleCRLF);
    assert(result !== null, 'Parse TLE with CRLF line endings');
    assertEquals(result.satelliteNumber1, '25544', 'Correct satellite number with CRLF');
} catch (e) {
    assert(false, 'TLE with CRLF line endings should parse: ' + e.message);
}

// Test 47: Parse TLE with CR line endings
console.log('\nTest 47: Parse TLE with CR line endings');
    assertEquals(result.satelliteNumber1, '25544', 'CRLF: Correct satellite number extracted');
} catch (e) {
    assert(false, 'CRLF line endings should parse correctly: ' + e.message);
}

// Test 43: CR line endings (old Mac-style)
console.log('\nTest 43: TLE with CR line endings (old Mac-style)');
const tleCR = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleCR);
    assert(result !== null, 'Parse TLE with CR line endings');
    assertEquals(result.satelliteNumber1, '25544', 'Correct satellite number with CR');
} catch (e) {
    assert(false, 'TLE with CR line endings should parse: ' + e.message);
}

// Test 48: Parse TLE with LF line endings (standard)
console.log('\nTest 48: Parse TLE with LF line endings (standard)');
const tleLF = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleLF);
    assert(result !== null, 'Parse TLE with LF line endings');
    assertEquals(result.satelliteNumber1, '25544', 'Correct satellite number with LF');
} catch (e) {
    assert(false, 'TLE with LF line endings should parse: ' + e.message);
}

// Test 49: Parse 3-line TLE with CRLF line endings
console.log('\nTest 49: Parse 3-line TLE with CRLF line endings');
const tle3LineCRLF = 'ISS (ZARYA)\r\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tle3LineCRLF);
    assert(result !== null, 'Parse 3-line TLE with CRLF');
    assertEquals(result.satelliteName, 'ISS (ZARYA)', 'Satellite name extracted with CRLF');
    assertEquals(result.satelliteNumber1, '25544', 'Satellite number correct with CRLF');
} catch (e) {
    assert(false, '3-line TLE with CRLF should parse: ' + e.message);
}

// Test 50: Parse 3-line TLE with CR line endings
console.log('\nTest 50: Parse 3-line TLE with CR line endings');
const tle3LineCR = 'ISS (ZARYA)\r1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tle3LineCR);
    assert(result !== null, 'Parse 3-line TLE with CR');
    assertEquals(result.satelliteName, 'ISS (ZARYA)', 'Satellite name extracted with CR');
    assertEquals(result.satelliteNumber1, '25544', 'Satellite number correct with CR');
} catch (e) {
    assert(false, '3-line TLE with CR should parse: ' + e.message);
}

// Test 51: Validate TLE with CRLF line endings
console.log('\nTest 51: Validate TLE with CRLF line endings');
const validateTLECRLF = validateTLE(tleCRLF);
assert(validateTLECRLF.isValid, 'TLE with CRLF passes validation');

// Test 52: Validate TLE with CR line endings
console.log('\nTest 52: Validate TLE with CR line endings');
const validateTLECR = validateTLE(tleCR);
assert(validateTLECR.isValid, 'TLE with CR passes validation');

// Test 53: Parse TLE with mixed line endings
console.log('\nTest 53: Parse TLE with mixed line endings');
const tleMixed = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleMixed);
    assert(result !== null, 'Parse TLE with mixed line endings');
    assertEquals(result.satelliteNumber1, '25544', 'Correct satellite number with mixed line endings');
} catch (e) {
    assert(false, 'TLE with mixed line endings should parse: ' + e.message);
    assertEquals(result.satelliteNumber1, '25544', 'CR: Correct satellite number extracted');
} catch (e) {
    assert(false, 'CR line endings should parse correctly: ' + e.message);
}

// Test 44: Mixed line endings
console.log('\nTest 44: TLE with mixed line endings (CRLF and LF)');
const tleMixed = 'ISS (ZARYA)\r\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleMixed);
    assert(result !== null, 'Parse TLE with mixed line endings');
    assertEquals(result.satelliteName, 'ISS (ZARYA)', 'Mixed endings: Satellite name extracted');
    assertEquals(result.satelliteNumber1, '25544', 'Mixed endings: Satellite number extracted');
} catch (e) {
    assert(false, 'Mixed line endings should parse correctly: ' + e.message);
}

// Test 45: Leading and trailing whitespace
console.log('\nTest 45: TLE with excessive leading and trailing whitespace');
const tleWhitespace = '   \n  1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996  \n  2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428   \n   ';
try {
    const result = parseTLE(tleWhitespace);
    assert(result !== null, 'Parse TLE with excessive whitespace');
    assertEquals(result.satelliteNumber1, '25544', 'Whitespace: Correct satellite number extracted');
} catch (e) {
    assert(false, 'Excessive whitespace should be handled: ' + e.message);
}

// Test 46: Tabs in input (leading/trailing)
console.log('\nTest 46: TLE with tabs instead of spaces (edge case)');
const tleTabs = '\t1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\t\n\t2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428\t';
try {
    const result = parseTLE(tleTabs);
    assert(result !== null, 'Parse TLE with tabs');
    assertEquals(result.satelliteNumber1, '25544', 'Tabs: Correct satellite number extracted');
} catch (e) {
    assert(false, 'Tabs in leading/trailing position should be handled: ' + e.message);
}

// Test 47: Multiple consecutive empty lines
console.log('\nTest 47: TLE with multiple consecutive empty lines');
const tleEmptyLines = '\n\n\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n\n\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428\n\n\n';
try {
    const result = parseTLE(tleEmptyLines);
    assert(result !== null, 'Parse TLE with multiple empty lines');
    assertEquals(result.satelliteNumber1, '25544', 'Empty lines: Correct satellite number extracted');
} catch (e) {
    assert(false, 'Multiple empty lines should be filtered out: ' + e.message);
}

// Test 48: normalizeLineEndings function - CRLF
console.log('\nTest 48: normalizeLineEndings function with CRLF');
const inputCRLF = 'line1\r\nline2\r\nline3';
const normalizedCRLF = normalizeLineEndings(inputCRLF);
assertEquals(normalizedCRLF, 'line1\nline2\nline3', 'CRLF normalized to LF');

// Test 49: normalizeLineEndings function - CR
console.log('\nTest 49: normalizeLineEndings function with CR');
const inputCR = 'line1\rline2\rline3';
const normalizedCR = normalizeLineEndings(inputCR);
assertEquals(normalizedCR, 'line1\nline2\nline3', 'CR normalized to LF');

// Test 50: normalizeLineEndings function - mixed
console.log('\nTest 50: normalizeLineEndings function with mixed endings');
const inputMixed = 'line1\r\nline2\nline3\rline4';
const normalizedMixed = normalizeLineEndings(inputMixed);
assertEquals(normalizedMixed, 'line1\nline2\nline3\nline4', 'Mixed endings normalized to LF');

// Test 51: parseTLELines function - basic
console.log('\nTest 51: parseTLELines function with normal input');
const basicInput = 'ISS\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const parsedLines = parseTLELines(basicInput);
assert(parsedLines.length === 3, 'parseTLELines returns 3 lines');
assertEquals(parsedLines[0], 'ISS', 'First line is satellite name');

// Test 52: parseTLELines function - with empty lines and whitespace
console.log('\nTest 52: parseTLELines function filters empty lines');
const messyInput = '\n\n  ISS  \n\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n\n\n  2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428  \n\n';
const cleanedLines = parseTLELines(messyInput);
assert(cleanedLines.length === 3, 'parseTLELines filters empty lines correctly');
assertEquals(cleanedLines[0], 'ISS', 'Satellite name trimmed correctly');

// Test 53: parseTLELines function - tabs converted to spaces
console.log('\nTest 53: parseTLELines function converts tabs to spaces');
const tabInput = '\tISS\t\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const tabParsed = parseTLELines(tabInput);
assert(tabParsed[0].indexOf('\t') === -1, 'Tabs converted to spaces and trimmed');

// Test 54: Unicode in satellite name (should work)
console.log('\nTest 54: TLE with Unicode characters in satellite name');
const tleUnicode = `СПУТНИК-1 🛰️
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(tleUnicode);
    assert(result !== null, 'Parse TLE with Unicode in satellite name');
    assertEquals(result.satelliteName, 'СПУТНИК-1 🛰️', 'Unicode satellite name preserved');
} catch (e) {
    assert(false, 'Unicode in satellite name should be allowed: ' + e.message);
}

// Test 55: Empty string after whitespace normalization
console.log('\nTest 55: Empty string after normalization (only whitespace)');
try {
    parseTLE('   \n\n\t\t\n   ');
    assert(false, 'Empty string should throw error');
} catch (e) {
    assert(e.code === ERROR_CODES.EMPTY_INPUT || e.name === 'TLEValidationError', 'Empty string throws appropriate error');
}

// Test 56: Very long satellite name with whitespace
console.log('\nTest 56: Very long satellite name with surrounding whitespace');
const longNameWhitespace = `   ${'A'.repeat(30)}
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(longNameWhitespace);
    assert(result !== null, 'Parse TLE with long name and whitespace');
    assertEquals(result.satelliteName, 'A'.repeat(30), 'Long name trimmed correctly');
    assert(result.warnings && result.warnings.length > 0, 'Warning issued for long satellite name');
} catch (e) {
    assert(false, 'Long name with whitespace should parse with warning: ' + e.message);
}

// Test 57: Lines with only whitespace between valid lines
console.log('\nTest 57: TLE with whitespace-only lines between valid lines');
const whitespaceOnlyLines = `ISS

1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
\t\t
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;
try {
    const result = parseTLE(whitespaceOnlyLines);
    assert(result !== null, 'Parse TLE with whitespace-only lines');
    assertEquals(result.satelliteName, 'ISS', 'Whitespace-only lines filtered correctly');
} catch (e) {
    assert(false, 'Whitespace-only lines should be filtered: ' + e.message);
}

// Test 58: CRLF with 3-line format
console.log('\nTest 58: 3-line TLE with CRLF line endings');
const tleCRLF3Line = 'ISS (ZARYA)\r\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
try {
    const result = parseTLE(tleCRLF3Line);
    assert(result !== null, 'Parse 3-line TLE with CRLF');
    assertEquals(result.satelliteName, 'ISS (ZARYA)', 'CRLF 3-line: Satellite name extracted');
    assertEquals(result.satelliteNumber1, '25544', 'CRLF 3-line: Satellite number extracted');
} catch (e) {
    assert(false, '3-line TLE with CRLF should parse correctly: ' + e.message);
}

// Test 59: Validation with CRLF line endings
console.log('\nTest 59: Validate TLE with CRLF line endings');
const validateCRLF = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\r\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428';
const validationResult = validateTLE(validateCRLF);
assert(validationResult.isValid, 'CRLF TLE passes validation');

// Test 60: Complex whitespace scenario
console.log('\nTest 60: Complex whitespace scenario (tabs, spaces, multiple types of line endings)');
const complexWhitespace = '\t  \r\n\r\n  ISS  \t\r\n\r1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996  \t\r\n\n\r2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428\t  \n\r\n';
try {
    const result = parseTLE(complexWhitespace);
    assert(result !== null, 'Parse TLE with complex whitespace');
    assertEquals(result.satelliteName, 'ISS', 'Complex whitespace: Satellite name extracted');
    assertEquals(result.satelliteNumber1, '25544', 'Complex whitespace: Satellite number extracted');
} catch (e) {
    assert(false, 'Complex whitespace scenario should be handled: ' + e.message);
}

console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
}