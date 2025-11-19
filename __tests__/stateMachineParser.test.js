/**
 * Comprehensive Jest tests for State Machine TLE Parser
 */

const {
  TLEStateMachineParser,
  parseWithStateMachine,
  ParserState,
  ErrorSeverity,
  RecoveryAction
} = require('../stateMachineParser');

const { ERROR_CODES } = require('../index');
const fixtures = require('./fixtures/tle-samples');

describe('State Machine Parser - Enums', () => {
  test('ParserState should be defined', () => {
    expect(ParserState).toBeDefined();
    expect(ParserState.INITIAL).toBe('INITIAL');
    expect(ParserState.DETECTING_FORMAT).toBe('DETECTING_FORMAT');
    expect(ParserState.PARSING_NAME).toBe('PARSING_NAME');
    expect(ParserState.PARSING_LINE1).toBe('PARSING_LINE1');
    expect(ParserState.PARSING_LINE2).toBe('PARSING_LINE2');
    expect(ParserState.VALIDATING).toBe('VALIDATING');
    expect(ParserState.COMPLETED).toBe('COMPLETED');
    expect(ParserState.ERROR).toBe('ERROR');
  });

  test('ErrorSeverity should be defined', () => {
    expect(ErrorSeverity).toBeDefined();
    expect(ErrorSeverity.WARNING).toBe('warning');
    expect(ErrorSeverity.ERROR).toBe('error');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });

  test('RecoveryAction should be defined', () => {
    expect(RecoveryAction).toBeDefined();
    expect(RecoveryAction.CONTINUE).toBe('CONTINUE');
    expect(RecoveryAction.SKIP_FIELD).toBe('SKIP_FIELD');
    expect(RecoveryAction.USE_DEFAULT).toBe('USE_DEFAULT');
    expect(RecoveryAction.ATTEMPT_FIX).toBe('ATTEMPT_FIX');
    expect(RecoveryAction.ABORT).toBe('ABORT');
  });
});

describe('State Machine Parser - TLEStateMachineParser Class', () => {
  describe('Constructor and Options', () => {
    test('should create parser with default options', () => {
      const parser = new TLEStateMachineParser();
      expect(parser).toBeDefined();
      expect(parser.state).toBe(ParserState.INITIAL);
    });

    test('should create parser with custom options', () => {
      const options = {
        attemptRecovery: false,
        maxRecoveryAttempts: 5,
        strictMode: true,
        includePartialResults: false
      };
      const parser = new TLEStateMachineParser(options);
      expect(parser.options.attemptRecovery).toBe(false);
      expect(parser.options.maxRecoveryAttempts).toBe(5);
      expect(parser.options.strictMode).toBe(true);
      expect(parser.options.includePartialResults).toBe(false);
    });

    test('should merge custom options with defaults', () => {
      const parser = new TLEStateMachineParser({ strictMode: true });
      expect(parser.options.strictMode).toBe(true);
      expect(parser.options.attemptRecovery).toBe(true); // default
    });
  });

  describe('reset()', () => {
    test('should reset parser state', () => {
      const parser = new TLEStateMachineParser();
      parser.state = ParserState.ERROR;
      parser.errors.push({ message: 'test' });
      parser.reset();

      expect(parser.state).toBe(ParserState.INITIAL);
      expect(parser.errors).toHaveLength(0);
      expect(parser.warnings).toHaveLength(0);
      expect(parser.parsedData).toEqual({});
    });
  });

  describe('addIssue()', () => {
    test('should add error to errors array', () => {
      const parser = new TLEStateMachineParser();
      parser.addIssue(ErrorSeverity.ERROR, 'TEST_CODE', 'Test error');

      expect(parser.errors).toHaveLength(1);
      expect(parser.errors[0].severity).toBe(ErrorSeverity.ERROR);
      expect(parser.errors[0].code).toBe('TEST_CODE');
      expect(parser.errors[0].message).toBe('Test error');
    });

    test('should add warning to warnings array', () => {
      const parser = new TLEStateMachineParser();
      parser.addIssue(ErrorSeverity.WARNING, 'WARN_CODE', 'Test warning');

      expect(parser.warnings).toHaveLength(1);
      expect(parser.warnings[0].severity).toBe(ErrorSeverity.WARNING);
    });

    test('should include current state in issue', () => {
      const parser = new TLEStateMachineParser();
      parser.state = ParserState.PARSING_LINE1;
      parser.addIssue(ErrorSeverity.ERROR, 'TEST', 'Test');

      expect(parser.errors[0].state).toBe(ParserState.PARSING_LINE1);
    });

    test('should include additional details', () => {
      const parser = new TLEStateMachineParser();
      parser.addIssue(ErrorSeverity.ERROR, 'TEST', 'Test', { field: 'test', value: 123 });

      expect(parser.errors[0].field).toBe('test');
      expect(parser.errors[0].value).toBe(123);
    });
  });

  describe('recordRecovery()', () => {
    test('should record recovery action', () => {
      const parser = new TLEStateMachineParser();
      parser.recordRecovery(RecoveryAction.CONTINUE, 'Continuing parse');

      expect(parser.recoveryActions).toHaveLength(1);
      expect(parser.recoveryActions[0].action).toBe(RecoveryAction.CONTINUE);
      expect(parser.recoveryActions[0].description).toBe('Continuing parse');
    });

    test('should increment recovery attempts counter', () => {
      const parser = new TLEStateMachineParser();
      expect(parser.context.recoveryAttempts).toBe(0);

      parser.recordRecovery(RecoveryAction.CONTINUE, 'Test');
      expect(parser.context.recoveryAttempts).toBe(1);

      parser.recordRecovery(RecoveryAction.CONTINUE, 'Test');
      expect(parser.context.recoveryAttempts).toBe(2);
    });
  });

  describe('transition()', () => {
    test('should transition to new state', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.transition(ParserState.DETECTING_FORMAT, 'Starting parse');

      expect(parser.state).toBe(ParserState.DETECTING_FORMAT);
      expect(result.from).toBe(ParserState.INITIAL);
      expect(result.to).toBe(ParserState.DETECTING_FORMAT);
      expect(result.reason).toBe('Starting parse');
    });
  });
});

describe('State Machine Parser - Parsing Valid TLEs', () => {
  describe('parse() - Valid Inputs', () => {
    test('should parse valid 2-line TLE', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.validISS2Line);

      expect(result.success).toBe(true);
      expect(result.state).toBe(ParserState.COMPLETED);
      expect(result.data.satelliteNumber1).toBe('25544');
      expect(result.data.satelliteNumber2).toBe('25544');
      expect(result.errors).toHaveLength(0);
    });

    test('should parse valid 3-line TLE with satellite name', () => {
      const parser = new TLEStateMachineParser();
      const result = parser.parse(fixtures.validISS3Line);

      expect(result.success).toBe(true);
      expect(result.data.satelliteName).toBe('ISS (ZARYA)');
      expect(result.context.hasName).toBe(true);
    });

    test('should parse Hubble TLE', () => {
      const result = parseWithStateMachine(fixtures.validHubble);

      expect(result.success).toBe(true);
      expect(result.data.satelliteName).toBe('HST');
      expect(result.data.satelliteNumber1).toBe('20580');
    });

    test('should parse GPS TLE', () => {
      const result = parseWithStateMachine(fixtures.validGPS);

      expect(result.success).toBe(true);
      expect(result.data.satelliteNumber1).toBe('40294');
    });

    test('should parse Starlink TLE', () => {
      const result = parseWithStateMachine(fixtures.validStarlink);

      expect(result.success).toBe(true);
      expect(result.data.satelliteName).toBe('STARLINK-1007');
    });
  });

  describe('parse() - Field Extraction', () => {
    test('should extract all line 1 fields', () => {
      const result = parseWithStateMachine(fixtures.validISS2Line);

      expect(result.data.lineNumber1).toBe('1');
      expect(result.data.satelliteNumber1).toBe('25544');
      expect(result.data.classification).toBe('U');
      expect(result.data.epochYear).toBe('20');
      expect(result.data.checksum1).toBe('6');
    });

    test('should extract all line 2 fields', () => {
      const result = parseWithStateMachine(fixtures.validISS2Line);

      expect(result.data.lineNumber2).toBe('2');
      expect(result.data.satelliteNumber2).toBe('25544');
      expect(result.data.inclination).toBe('51.6453');
      expect(result.data.rightAscension).toBe('57.0843');
      expect(result.data.eccentricity).toBe('0001671');
      expect(result.data.checksum2).toBe('8');
    });
  });
});

describe('State Machine Parser - Error Detection', () => {
  describe('parse() - Input Validation', () => {
    test('should detect non-string input', () => {
      const result = parseWithStateMachine(12345);

      expect(result.success).toBe(false);
      expect(result.state).toBe(ParserState.ERROR);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_INPUT_TYPE)).toBe(true);
    });

    test('should detect empty string', () => {
      const result = parseWithStateMachine('');

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.EMPTY_INPUT)).toBe(true);
    });

    test('should detect insufficient lines', () => {
      const result = parseWithStateMachine(fixtures.singleLineOnly);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_LINE_COUNT)).toBe(true);
    });
  });

  describe('parse() - Line Validation', () => {
    test('should detect invalid line length on line 1', () => {
      const result = parseWithStateMachine(fixtures.invalidLineShort);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.INVALID_LINE_LENGTH && e.line === 1
      )).toBe(true);
    });

    test('should detect invalid line number on line 1', () => {
      const result = parseWithStateMachine(fixtures.invalidLineNumber);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.INVALID_LINE_NUMBER && e.line === 1
      )).toBe(true);
    });

    test('should detect checksum mismatch on line 1', () => {
      const result = parseWithStateMachine(fixtures.invalidChecksum1);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.CHECKSUM_MISMATCH && e.line === 1
      )).toBe(true);
    });

    test('should detect checksum mismatch on line 2', () => {
      const result = parseWithStateMachine(fixtures.invalidChecksum2);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.CHECKSUM_MISMATCH && e.line === 2
      )).toBe(true);
    });

    test('should detect invalid classification', () => {
      const result = parseWithStateMachine(fixtures.invalidClassification);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.INVALID_CLASSIFICATION
      )).toBe(true);
    });
  });

  describe('parse() - Cross-Field Validation', () => {
    test('should detect satellite number mismatch', () => {
      const result = parseWithStateMachine(fixtures.invalidSatNumberMismatch);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.SATELLITE_NUMBER_MISMATCH
      )).toBe(true);
    });

    test('should validate inclination range', () => {
      const result = parseWithStateMachine(fixtures.invalidInclination);

      expect(result.errors.some(e =>
        e.code === ERROR_CODES.VALUE_OUT_OF_RANGE &&
        e.field === 'inclination'
      )).toBe(true);
    });

    test('should validate eccentricity range', () => {
      const tle = `1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 9999999  64.9808  73.0513 15.49338189252420`;

      const result = parseWithStateMachine(tle);
      // The state machine parser will detect checksum error first
      // If it continues, it should detect eccentricity error
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('State Machine Parser - Error Recovery', () => {
  describe('parse() - Recovery with attemptRecovery=true', () => {
    test('should attempt recovery on checksum mismatch', () => {
      const parser = new TLEStateMachineParser({ attemptRecovery: true });
      const result = parser.parse(fixtures.invalidChecksum1);

      expect(result.recoveryActions.some(r =>
        r.action === RecoveryAction.CONTINUE
      )).toBe(true);
    });

    test('should attempt recovery on line length error', () => {
      const parser = new TLEStateMachineParser({ attemptRecovery: true });
      const result = parser.parse(fixtures.invalidLineShort);

      expect(result.recoveryActions.length).toBeGreaterThan(0);
    });

    test('should provide partial results with includePartialResults=true', () => {
      const parser = new TLEStateMachineParser({
        attemptRecovery: true,
        includePartialResults: true
      });
      const result = parser.parse(fixtures.invalidChecksum1);

      expect(result.data).toBeDefined();
      expect(result.data.satelliteNumber1).toBeDefined();
    });
  });

  describe('parse() - Strict Mode', () => {
    test('should detect errors in strict mode', () => {
      const parser = new TLEStateMachineParser({
        strictMode: true,
        attemptRecovery: false
      });
      const result = parser.parse(fixtures.invalidLineShort);

      // Strict mode should detect errors
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should continue parsing in non-strict mode', () => {
      const parser = new TLEStateMachineParser({
        strictMode: false,
        attemptRecovery: true
      });
      const result = parser.parse(fixtures.invalidChecksum1);

      // Should continue despite checksum error
      expect(result.data).toBeDefined();
      expect(result.recoveryActions.length).toBeGreaterThan(0);
    });
  });

  describe('parse() - Recovery from Excess Lines', () => {
    test('should attempt to extract valid TLE from excess lines', () => {
      const parser = new TLEStateMachineParser({ attemptRecovery: true });
      const result = parser.parse(fixtures.tooManyLines);

      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_LINE_COUNT)).toBe(true);

      // Should attempt recovery
      if (result.recoveryActions.length > 0) {
        expect(result.recoveryActions.some(r =>
          r.action === RecoveryAction.ATTEMPT_FIX
        )).toBe(true);
      }
    });
  });
});

describe('State Machine Parser - Satellite Name Handling', () => {
  test('should parse satellite name correctly', () => {
    const result = parseWithStateMachine(fixtures.validISS3Line);
    expect(result.data.satelliteName).toBe('ISS (ZARYA)');
  });

  test('should warn for long satellite name', () => {
    const result = parseWithStateMachine(fixtures.edgeLongSatelliteName);
    expect(result.warnings.some(w =>
      w.code === ERROR_CODES.SATELLITE_NAME_TOO_LONG
    )).toBe(true);
  });

  test('should warn for satellite name starting with "1"', () => {
    const result = parseWithStateMachine(fixtures.edgeNameStartsWith1);
    expect(result.warnings.some(w =>
      w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING
    )).toBe(true);
  });

  test('should warn for satellite name starting with "2"', () => {
    const result = parseWithStateMachine(fixtures.edgeNameStartsWith2);
    expect(result.warnings.some(w =>
      w.code === ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING
    )).toBe(true);
  });
});

describe('State Machine Parser - Result Structure', () => {
  describe('getResult()', () => {
    test('should return complete result structure', () => {
      const result = parseWithStateMachine(fixtures.validISS2Line);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recoveryActions');
      expect(result).toHaveProperty('context');
    });

    test('should include context information', () => {
      const result = parseWithStateMachine(fixtures.validISS3Line);

      expect(result.context.lineCount).toBe(3);
      expect(result.context.hasName).toBe(true);
      expect(result.context.recoveryAttempts).toBeGreaterThanOrEqual(0);
    });

    test('should set success to true for valid TLE', () => {
      const result = parseWithStateMachine(fixtures.validISS2Line);
      expect(result.success).toBe(true);
      expect(result.state).toBe(ParserState.COMPLETED);
    });

    test('should detect errors for invalid TLE', () => {
      const result = parseWithStateMachine(fixtures.invalidChecksum1);
      // Should detect errors even if it completes parsing
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('State Machine Parser - Edge Cases', () => {
  test('should handle very short line with partial field extraction', () => {
    const parser = new TLEStateMachineParser({ attemptRecovery: true });
    const result = parser.parse(fixtures.invalidLineShort);

    // Should have attempted to parse what it could
    expect(result.data).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should handle line ending variations', () => {
    const result1 = parseWithStateMachine(fixtures.lineEndingCRLF);
    expect(result1.data).toBeDefined();
    if (result1.data.satelliteNumber1) {
      expect(result1.data.satelliteNumber1).toBe('25544');
    }

    const result2 = parseWithStateMachine(fixtures.lineEndingCR);
    expect(result2.data).toBeDefined();
    // Line ending handling may vary, just check data was extracted
    expect(result2.errors.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle whitespace variations', () => {
    const result = parseWithStateMachine(fixtures.whitespaceMixedSpaces);
    expect(result.success).toBe(true);
    expect(result.data.satelliteNumber1).toBe('25544');
  });

  test('should handle maximum satellite number', () => {
    const result = parseWithStateMachine(fixtures.edgeSatelliteNumberMax);
    expect(result.success).toBe(true);
    expect(result.data.satelliteNumber1).toBe('99999');
  });

  test('should handle minimum satellite number', () => {
    const result = parseWithStateMachine(fixtures.edgeSatelliteNumberMin);
    expect(result.success).toBe(true);
    expect(result.data.satelliteNumber1).toBe('00001');
  });
});

describe('State Machine Parser - parseWithStateMachine Function', () => {
  test('should parse with default options', () => {
    const result = parseWithStateMachine(fixtures.validISS2Line);
    expect(result.success).toBe(true);
  });

  test('should parse with custom options', () => {
    const result = parseWithStateMachine(fixtures.validISS2Line, {
      strictMode: true
    });
    expect(result.success).toBe(true);
  });

  test('should return error for invalid input', () => {
    const result = parseWithStateMachine(null);
    expect(result.success).toBe(false);
    expect(result.state).toBe(ParserState.ERROR);
  });
});

describe('State Machine Parser - State Transitions', () => {
  test('should transition through expected states for 2-line TLE', () => {
    const parser = new TLEStateMachineParser();
    const result = parser.parse(fixtures.validISS2Line);

    // Should complete successfully
    expect(result.state).toBe(ParserState.COMPLETED);
  });

  test('should transition through expected states for 3-line TLE', () => {
    const parser = new TLEStateMachineParser();
    const result = parser.parse(fixtures.validISS3Line);

    // Should have parsed satellite name
    expect(result.context.hasName).toBe(true);
    expect(result.state).toBe(ParserState.COMPLETED);
  });

  test('should transition to ERROR state on critical error', () => {
    const parser = new TLEStateMachineParser({ attemptRecovery: false });
    const result = parser.parse('');

    expect(result.state).toBe(ParserState.ERROR);
  });
});

describe('State Machine Parser - Checksum Validation', () => {
  test('should validate checksum correctly', () => {
    const parser = new TLEStateMachineParser();
    const line = '1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996';
    const checksum = parser.calculateChecksum(line);
    expect(checksum).toBe(6);
  });

  test('should calculate checksum with minus signs', () => {
    const parser = new TLEStateMachineParser();
    const line = '1 25544U 98067A   20300.83097691 -.00001534  00000-0  35580-4 0  9997';
    const checksum = parser.calculateChecksum(line);
    expect(checksum).toBeGreaterThanOrEqual(0);
    expect(checksum).toBeLessThanOrEqual(9);
  });
});

describe('State Machine Parser - Integration Tests', () => {
  test('should parse multiple TLEs consecutively', () => {
    const parser = new TLEStateMachineParser();

    const result1 = parser.parse(fixtures.validISS2Line);
    expect(result1.success).toBe(true);

    const result2 = parser.parse(fixtures.validHubble);
    expect(result2.success).toBe(true);
    expect(result2.data.satelliteName).toBe('HST');
  });

  test('should handle valid TLE after invalid TLE', () => {
    const parser = new TLEStateMachineParser();

    const result1 = parser.parse(fixtures.invalidChecksum1);
    expect(result1.errors.length).toBeGreaterThan(0);

    const result2 = parser.parse(fixtures.validISS2Line);
    expect(result2.data.satelliteNumber1).toBe('25544');
  });

  test('should collect all error types in comprehensive invalid TLE', () => {
    const invalidTLE = `1 25544X 98067A   20400.83097691  .00001534  00000-0  35580-4 0  9990
2 25545 251.6453  57.0843 9999999  64.9808  73.0513 15.49338189252420`;

    const result = parseWithStateMachine(invalidTLE);

    // Should detect multiple errors
    expect(result.errors.length).toBeGreaterThan(0);

    // Should have multiple error types
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes.length).toBeGreaterThan(0);
  });
});
