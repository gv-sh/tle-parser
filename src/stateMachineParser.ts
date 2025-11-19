/**
 * State machine parser for TLE data with advanced error recovery
 * Provides robust parsing of malformed TLE data with detailed error reporting
 */

import { ERROR_CODES } from './errorCodes';
import type {
  ParsedTLE,
  TLEError,
  TLEWarning,
  ErrorSeverity,
  StateMachineParseResult
} from './types';

/**
 * Parser states for the state machine
 */
export enum ParserState {
  INITIAL = 'INITIAL',
  DETECTING_FORMAT = 'DETECTING_FORMAT',
  PARSING_NAME = 'PARSING_NAME',
  PARSING_LINE1 = 'PARSING_LINE1',
  PARSING_LINE2 = 'PARSING_LINE2',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

/**
 * Error severity levels for issue reporting
 */
export enum ErrorSeverityEnum {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Recovery action types for error handling
 */
export enum RecoveryAction {
  /** Continue parsing despite the error */
  CONTINUE = 'CONTINUE',
  /** Skip the current field */
  SKIP_FIELD = 'SKIP_FIELD',
  /** Use a default value for the field */
  USE_DEFAULT = 'USE_DEFAULT',
  /** Attempt to fix the issue automatically */
  ATTEMPT_FIX = 'ATTEMPT_FIX',
  /** Cannot recover, abort parsing */
  ABORT = 'ABORT'
}

/**
 * Options for the state machine parser
 */
export interface StateMachineParserOptions {
  /** Attempt to recover from errors (default: true) */
  readonly attemptRecovery?: boolean;
  /** Maximum number of recovery attempts (default: 10) */
  readonly maxRecoveryAttempts?: number;
  /** Include partial results even with errors (default: true) */
  readonly includePartialResults?: boolean;
  /** Strict mode - fail fast on errors (default: false) */
  readonly strictMode?: boolean;
}

/**
 * Parser context for tracking state
 */
interface ParserContext {
  lineCount: number;
  hasName: boolean;
  nameLineIndex: number;
  line1Index: number;
  line2Index: number;
  lines: string[];
  recoveryAttempts: number;
}

/**
 * Issue (error or warning) in the parser
 */
interface ParserIssue {
  readonly severity: ErrorSeverityEnum;
  readonly code: string;
  readonly message: string;
  readonly state: ParserState;
  readonly [key: string]: unknown;
}

/**
 * Recovery action record
 */
interface RecoveryRecord {
  readonly action: RecoveryAction;
  readonly description: string;
  readonly state: ParserState;
  readonly timestamp: number;
  readonly [key: string]: unknown;
}

/**
 * State transition record
 */
interface StateTransition {
  readonly from: ParserState;
  readonly to: ParserState;
  readonly reason: string;
}

/**
 * Complete parser result with context
 */
interface CompleteParseResult extends StateMachineParseResult {
  readonly state: ParserState;
  readonly context: {
    readonly lineCount: number;
    readonly hasName: boolean;
    readonly recoveryAttempts: number;
  };
}

/**
 * State machine parser for TLE data with error recovery
 * Provides robust parsing with detailed error reporting and recovery capabilities
 */
export class TLEStateMachineParser {
  private options: Required<StateMachineParserOptions>;
  private state: ParserState;
  private errors: ParserIssue[];
  private warnings: ParserIssue[];
  private recoveryActions: RecoveryRecord[];
  private parsedData: Partial<ParsedTLE>;
  private context: ParserContext;

  /**
   * Create a new state machine parser
   * @param options - Parser configuration options
   */
  constructor(options: StateMachineParserOptions = {}) {
    this.options = {
      attemptRecovery: true,
      maxRecoveryAttempts: 10,
      includePartialResults: true,
      strictMode: false,
      ...options
    };

    this.state = ParserState.INITIAL;
    this.errors = [];
    this.warnings = [];
    this.recoveryActions = [];
    this.parsedData = {};
    this.context = {
      lineCount: 0,
      hasName: false,
      nameLineIndex: -1,
      line1Index: -1,
      line2Index: -1,
      lines: [],
      recoveryAttempts: 0
    };

    this.reset();
  }

  /**
   * Reset the parser state to initial conditions
   */
  private reset(): void {
    this.state = ParserState.INITIAL;
    this.errors = [];
    this.warnings = [];
    this.recoveryActions = [];
    this.parsedData = {};
    this.context = {
      lineCount: 0,
      hasName: false,
      nameLineIndex: -1,
      line1Index: -1,
      line2Index: -1,
      lines: [],
      recoveryAttempts: 0
    };
  }

  /**
   * Add an error or warning to the collection
   * @param severity - Issue severity level
   * @param code - Error code
   * @param message - Human-readable message
   * @param details - Additional details about the issue
   * @returns The created issue
   */
  private addIssue(
    severity: ErrorSeverityEnum,
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ): ParserIssue {
    const issue: ParserIssue = {
      severity,
      code,
      message,
      state: this.state,
      ...details
    };

    if (severity === ErrorSeverityEnum.WARNING) {
      this.warnings.push(issue);
    } else {
      this.errors.push(issue);
    }

    return issue;
  }

  /**
   * Record a recovery action taken during parsing
   * @param action - Type of recovery action
   * @param description - Description of what was done
   * @param context - Additional context information
   */
  private recordRecovery(
    action: RecoveryAction,
    description: string,
    context: Record<string, unknown> = {}
  ): void {
    this.recoveryActions.push({
      action,
      description,
      state: this.state,
      timestamp: Date.now(),
      ...context
    });
    this.context.recoveryAttempts++;
  }

  /**
   * Transition to a new parser state
   * @param newState - The state to transition to
   * @param reason - Reason for the transition
   * @returns State transition record
   */
  private transition(newState: ParserState, reason = ''): StateTransition {
    const oldState = this.state;
    this.state = newState;

    return {
      from: oldState,
      to: newState,
      reason
    };
  }

  /**
   * Parse TLE string with state machine and error recovery
   * @param tleString - The TLE data to parse
   * @returns Complete parse result with data, errors, warnings, and recovery information
   */
  public parse(tleString: string): CompleteParseResult {
    this.reset();

    // Input validation
    if (typeof tleString !== 'string') {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        ERROR_CODES.INVALID_INPUT_TYPE,
        'TLE data must be a string',
        { inputType: typeof tleString }
      );
      this.transition(ParserState.ERROR);
      return this.getResult();
    }

    if (tleString.length === 0) {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        ERROR_CODES.EMPTY_INPUT,
        'TLE string cannot be empty',
        { inputLength: 0 }
      );
      this.transition(ParserState.ERROR);
      return this.getResult();
    }

    // Start parsing
    this.transition(ParserState.DETECTING_FORMAT, 'Starting parse');
    this.detectFormat(tleString);

    // Continue through state machine
    if (this.state === ParserState.DETECTING_FORMAT) {
      this.executeStateMachine();
    }

    return this.getResult();
  }

  /**
   * Detect the format of the TLE data (2 or 3 lines)
   * @param tleString - The raw TLE string
   */
  private detectFormat(tleString: string): void {
    // Parse lines
    const lines = tleString
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter((line): line is string => line.length > 0);

    this.context.lines = lines;
    this.context.lineCount = lines.length;

    // Validate line count
    if (lines.length < 2) {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        ERROR_CODES.INVALID_LINE_COUNT,
        `TLE must contain at least 2 lines (found ${lines.length})`,
        { expected: '2 or 3', actual: lines.length }
      );

      if (this.options.attemptRecovery) {
        this.recordRecovery(
          RecoveryAction.ABORT,
          'Insufficient lines to parse TLE',
          { lineCount: lines.length }
        );
      }

      this.transition(ParserState.ERROR);
      return;
    }

    if (lines.length > 3) {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_LINE_COUNT,
        `TLE should contain 2 or 3 lines (found ${lines.length})`,
        { expected: '2 or 3', actual: lines.length }
      );

      if (this.options.attemptRecovery) {
        this.recordRecovery(
          RecoveryAction.ATTEMPT_FIX,
          'Attempting to identify valid TLE lines from excess lines',
          { lineCount: lines.length }
        );

        // Try to find the two lines starting with '1' and '2'
        const line1Candidates = lines.filter(l => l[0] === '1');
        const line2Candidates = lines.filter(l => l[0] === '2');

        if (line1Candidates.length === 1 && line2Candidates.length === 1) {
          const line1Candidate = line1Candidates[0];
          const line2Candidate = line2Candidates[0];

          if (!line1Candidate || !line2Candidate) return;

          const line1Idx = lines.indexOf(line1Candidate);
          const line2Idx = lines.indexOf(line2Candidate);

          // If line1 comes before line2, check if there's a name line before line1
          if (line1Idx < line2Idx) {
            if (line1Idx > 0) {
              this.context.hasName = true;
              this.context.nameLineIndex = line1Idx - 1;
            }
            this.context.line1Index = line1Idx;
            this.context.line2Index = line2Idx;

            const nameLine = lines[this.context.nameLineIndex];
            const line1 = lines[line1Idx];
            const line2 = lines[line2Idx];

            this.context.lines = this.context.hasName && nameLine && line1 && line2
              ? [nameLine, line1, line2]
              : line1 && line2
              ? [line1, line2]
              : [];
            this.context.lineCount = this.context.lines.length;

            this.recordRecovery(
              RecoveryAction.CONTINUE,
              'Successfully identified TLE lines from excess input',
              { extractedLines: this.context.lineCount }
            );
          }
        }
      }
    } else {
      // Determine if we have 2 or 3 lines
      if (lines.length === 3) {
        // Check if first line looks like a satellite name or a TLE line
        const firstChar = lines[0]?.[0];
        if (firstChar === '1' || firstChar === '2') {
          this.addIssue(
            ErrorSeverityEnum.WARNING,
            ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
            'First line starts with "1" or "2", might be missing satellite name',
            { firstLine: lines[0] }
          );
        }
        this.context.hasName = true;
        this.context.nameLineIndex = 0;
        this.context.line1Index = 1;
        this.context.line2Index = 2;
      } else {
        this.context.hasName = false;
        this.context.line1Index = 0;
        this.context.line2Index = 1;
      }
    }
  }

  /**
   * Execute the state machine until completion or error
   */
  private executeStateMachine(): void {
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (
      this.state !== ParserState.COMPLETED &&
      this.state !== ParserState.ERROR &&
      iterations < maxIterations
    ) {
      switch (this.state) {
        case ParserState.DETECTING_FORMAT:
          if (this.context.hasName) {
            this.transition(ParserState.PARSING_NAME);
          } else {
            this.transition(ParserState.PARSING_LINE1);
          }
          break;

        case ParserState.PARSING_NAME:
          this.parseSatelliteName();
          this.transition(ParserState.PARSING_LINE1);
          break;

        case ParserState.PARSING_LINE1:
          this.parseLine1();
          this.transition(ParserState.PARSING_LINE2);
          break;

        case ParserState.PARSING_LINE2:
          this.parseLine2();
          this.transition(ParserState.VALIDATING);
          break;

        case ParserState.VALIDATING:
          this.validateCrossFields();
          // Check if we have critical errors
          const hasCriticalErrors = this.errors.some(
            e => e.severity === ErrorSeverityEnum.CRITICAL
          );
          if (hasCriticalErrors && !this.options.includePartialResults) {
            this.transition(ParserState.ERROR);
          } else {
            this.transition(ParserState.COMPLETED);
          }
          break;

        default:
          // Unexpected state, exit
          this.transition(ParserState.ERROR, 'Unexpected state');
          break;
      }

      iterations++;
    }

    if (iterations >= maxIterations) {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        'STATE_MACHINE_LOOP',
        'State machine exceeded maximum iterations',
        { iterations }
      );
      this.transition(ParserState.ERROR);
    }
  }

  /**
   * Parse satellite name line
   */
  private parseSatelliteName(): void {
    const nameLineIdx = this.context.nameLineIndex;
    if (nameLineIdx < 0 || nameLineIdx >= this.context.lines.length) {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        'INVALID_NAME_LINE_INDEX',
        'Invalid satellite name line index',
        { index: nameLineIdx }
      );
      return;
    }

    const nameLine = this.context.lines[nameLineIdx];
    if (!nameLine) return;

    (this.parsedData as any).satelliteName = nameLine;

    // Validate satellite name
    if (nameLine.length > 24) {
      this.addIssue(
        ErrorSeverityEnum.WARNING,
        ERROR_CODES.SATELLITE_NAME_TOO_LONG,
        'Satellite name exceeds recommended 24 characters',
        { length: nameLine.length, name: nameLine }
      );
    }

    if (nameLine[0] === '1' || nameLine[0] === '2') {
      this.addIssue(
        ErrorSeverityEnum.WARNING,
        ERROR_CODES.SATELLITE_NAME_FORMAT_WARNING,
        'Satellite name starts with "1" or "2", might be incorrectly formatted',
        { name: nameLine }
      );
    }
  }

  /**
   * Parse TLE Line 1
   */
  private parseLine1(): void {
    const line1Idx = this.context.line1Index;
    if (line1Idx < 0 || line1Idx >= this.context.lines.length) {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        'INVALID_LINE1_INDEX',
        'Invalid Line 1 index',
        { index: line1Idx }
      );
      return;
    }

    const line1 = this.context.lines[line1Idx];
    if (!line1) return;

    // Store raw line (not in standard ParsedTLE but useful for debugging)
    (this.parsedData as any).line1Raw = line1;

    // Check line length
    if (line1.length !== 69) {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_LINE_LENGTH,
        `Line 1 must be exactly 69 characters (got ${line1.length})`,
        { line: 1, expected: 69, actual: line1.length }
      );

      if (this.options.attemptRecovery) {
        this.recordRecovery(
          RecoveryAction.CONTINUE,
          'Attempting to parse Line 1 despite incorrect length',
          { length: line1.length }
        );
      } else if (this.options.strictMode) {
        return;
      }
    }

    // Parse fields from Line 1 with error recovery
    this.parseFieldSafe('lineNumber1', line1, 0, 1, 'Line 1 number');
    this.parseFieldSafe('satelliteNumber1', line1, 2, 7, 'Satellite number');
    this.parseFieldSafe('classification', line1, 7, 8, 'Classification');
    this.parseFieldSafe('internationalDesignatorYear', line1, 9, 11, 'Int. designator year');
    this.parseFieldSafe('internationalDesignatorLaunchNumber', line1, 11, 14, 'Int. designator launch');
    this.parseFieldSafe('internationalDesignatorPiece', line1, 14, 17, 'Int. designator piece');
    this.parseFieldSafe('epochYear', line1, 18, 20, 'Epoch year');
    this.parseFieldSafe('epoch', line1, 20, 32, 'Epoch');
    this.parseFieldSafe('firstDerivative', line1, 33, 43, 'First derivative');
    this.parseFieldSafe('secondDerivative', line1, 44, 52, 'Second derivative');
    this.parseFieldSafe('bStar', line1, 53, 61, 'B* drag term');
    this.parseFieldSafe('ephemerisType', line1, 62, 63, 'Ephemeris type');
    this.parseFieldSafe('elementSetNumber', line1, 64, 68, 'Element set number');
    this.parseFieldSafe('checksum1', line1, 68, 69, 'Checksum');

    // Validate line number
    if (this.parsedData.lineNumber1 !== '1') {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_LINE_NUMBER,
        `Line 1 must start with '1' (got '${this.parsedData.lineNumber1}')`,
        { line: 1, expected: '1', actual: this.parsedData.lineNumber1 }
      );
    }

    // Validate classification
    const validClassifications = ['U', 'C', 'S'];
    if (
      this.parsedData.classification &&
      !validClassifications.includes(this.parsedData.classification)
    ) {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_CLASSIFICATION,
        `Classification must be U, C, or S (got '${this.parsedData.classification}')`,
        { expected: validClassifications, actual: this.parsedData.classification }
      );
    }

    // Validate checksum
    if (line1.length === 69) {
      const checksum = this.calculateChecksum(line1);
      const actualChecksum = parseInt(this.parsedData.checksum1 || '', 10);
      if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
        this.addIssue(
          ErrorSeverityEnum.ERROR,
          ERROR_CODES.CHECKSUM_MISMATCH,
          `Line 1 checksum mismatch (expected ${checksum}, got ${actualChecksum})`,
          { line: 1, expected: checksum, actual: actualChecksum }
        );

        if (this.options.attemptRecovery) {
          this.recordRecovery(
            RecoveryAction.CONTINUE,
            'Continuing despite checksum mismatch',
            { line: 1 }
          );
        }
      }
    }
  }

  /**
   * Parse TLE Line 2
   */
  private parseLine2(): void {
    const line2Idx = this.context.line2Index;
    if (line2Idx < 0 || line2Idx >= this.context.lines.length) {
      this.addIssue(
        ErrorSeverityEnum.CRITICAL,
        'INVALID_LINE2_INDEX',
        'Invalid Line 2 index',
        { index: line2Idx }
      );
      return;
    }

    const line2 = this.context.lines[line2Idx];
    if (!line2) return;

    // Store raw line
    (this.parsedData as any).line2Raw = line2;

    // Check line length
    if (line2.length !== 69) {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_LINE_LENGTH,
        `Line 2 must be exactly 69 characters (got ${line2.length})`,
        { line: 2, expected: 69, actual: line2.length }
      );

      if (this.options.attemptRecovery) {
        this.recordRecovery(
          RecoveryAction.CONTINUE,
          'Attempting to parse Line 2 despite incorrect length',
          { length: line2.length }
        );
      } else if (this.options.strictMode) {
        return;
      }
    }

    // Parse fields from Line 2 with error recovery
    this.parseFieldSafe('lineNumber2', line2, 0, 1, 'Line 2 number');
    this.parseFieldSafe('satelliteNumber2', line2, 2, 7, 'Satellite number');
    this.parseFieldSafe('inclination', line2, 8, 16, 'Inclination');
    this.parseFieldSafe('rightAscension', line2, 17, 25, 'Right ascension');
    this.parseFieldSafe('eccentricity', line2, 26, 33, 'Eccentricity');
    this.parseFieldSafe('argumentOfPerigee', line2, 34, 42, 'Argument of perigee');
    this.parseFieldSafe('meanAnomaly', line2, 43, 51, 'Mean anomaly');
    this.parseFieldSafe('meanMotion', line2, 52, 63, 'Mean motion');
    this.parseFieldSafe('revolutionNumber', line2, 63, 68, 'Revolution number');
    this.parseFieldSafe('checksum2', line2, 68, 69, 'Checksum');

    // Validate line number
    if (this.parsedData.lineNumber2 !== '2') {
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_LINE_NUMBER,
        `Line 2 must start with '2' (got '${this.parsedData.lineNumber2}')`,
        { line: 2, expected: '2', actual: this.parsedData.lineNumber2 }
      );
    }

    // Validate checksum
    if (line2.length === 69) {
      const checksum = this.calculateChecksum(line2);
      const actualChecksum = parseInt(this.parsedData.checksum2 || '', 10);
      if (!isNaN(actualChecksum) && checksum !== actualChecksum) {
        this.addIssue(
          ErrorSeverityEnum.ERROR,
          ERROR_CODES.CHECKSUM_MISMATCH,
          `Line 2 checksum mismatch (expected ${checksum}, got ${actualChecksum})`,
          { line: 2, expected: checksum, actual: actualChecksum }
        );

        if (this.options.attemptRecovery) {
          this.recordRecovery(
            RecoveryAction.CONTINUE,
            'Continuing despite checksum mismatch',
            { line: 2 }
          );
        }
      }
    }
  }

  /**
   * Validate cross-field relationships
   */
  private validateCrossFields(): void {
    // Validate satellite number consistency
    if (this.parsedData.satelliteNumber1 && this.parsedData.satelliteNumber2) {
      const sat1 = this.parsedData.satelliteNumber1.trim();
      const sat2 = this.parsedData.satelliteNumber2.trim();

      if (sat1 !== sat2) {
        this.addIssue(
          ErrorSeverityEnum.ERROR,
          ERROR_CODES.SATELLITE_NUMBER_MISMATCH,
          `Satellite numbers must match (Line 1: ${sat1}, Line 2: ${sat2})`,
          { line1Value: sat1, line2Value: sat2 }
        );
      }
    }

    // Validate numeric ranges
    this.validateNumericField('inclination', 0, 180, 'Inclination');
    this.validateNumericField('rightAscension', 0, 360, 'Right Ascension');
    this.validateNumericField('argumentOfPerigee', 0, 360, 'Argument of Perigee');
    this.validateNumericField('meanAnomaly', 0, 360, 'Mean Anomaly');

    // Eccentricity is stored without leading "0."
    if (this.parsedData.eccentricity) {
      const ecc = parseFloat('0.' + this.parsedData.eccentricity.trim());
      if (!isNaN(ecc) && (ecc < 0 || ecc > 1)) {
        this.addIssue(
          ErrorSeverityEnum.ERROR,
          ERROR_CODES.VALUE_OUT_OF_RANGE,
          `Eccentricity must be between 0 and 1 (got ${ecc})`,
          { field: 'eccentricity', value: ecc, min: 0, max: 1 }
        );
      }
    }

    // Mean motion warning (not strict error)
    this.validateNumericField('meanMotion', 0, 20, 'Mean Motion', true);

    // Epoch year (00-99)
    this.validateNumericField('epochYear', 0, 99, 'Epoch Year');
  }

  /**
   * Validate a numeric field is within range
   * @param fieldName - Name of the field to validate
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @param displayName - Human-readable field name
   * @param warningOnly - If true, generate warning instead of error
   */
  private validateNumericField(
    fieldName: keyof ParsedTLE,
    min: number,
    max: number,
    displayName: string,
    warningOnly = false
  ): void {
    const fieldValue = this.parsedData[fieldName];
    if (!fieldValue || typeof fieldValue !== 'string') {
      return;
    }

    const value = parseFloat(fieldValue.trim());
    if (isNaN(value)) {
      this.addIssue(
        warningOnly ? ErrorSeverityEnum.WARNING : ErrorSeverityEnum.ERROR,
        ERROR_CODES.INVALID_NUMBER_FORMAT,
        `${displayName} must be numeric (got '${fieldValue}')`,
        { field: fieldName, value: fieldValue }
      );
      return;
    }

    if (value < min || value > max) {
      this.addIssue(
        warningOnly ? ErrorSeverityEnum.WARNING : ErrorSeverityEnum.ERROR,
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        `${displayName} must be between ${min} and ${max} (got ${value})`,
        { field: fieldName, value, min, max }
      );
    }
  }

  /**
   * Safely parse a field from a line
   * @param fieldName - Name of the field to parse
   * @param line - The line containing the field
   * @param start - Start position of the field
   * @param end - End position of the field
   * @param displayName - Human-readable field name
   */
  private parseFieldSafe(
    fieldName: keyof ParsedTLE,
    line: string,
    start: number,
    end: number,
    displayName: string
  ): void {
    try {
      if (line.length >= end) {
        (this.parsedData as any)[fieldName] = line.substring(start, end).trim();
      } else if (line.length > start) {
        // Partial field available
        (this.parsedData as any)[fieldName] = line.substring(start).trim();
        this.addIssue(
          ErrorSeverityEnum.WARNING,
          'PARTIAL_FIELD',
          `${displayName} is incomplete due to short line`,
          { field: fieldName, expected: [start, end], actual: line.length }
        );

        if (this.options.attemptRecovery) {
          this.recordRecovery(
            RecoveryAction.USE_DEFAULT,
            `Using partial value for ${displayName}`,
            { field: fieldName }
          );
        }
      } else {
        // Field completely missing
        (this.parsedData as any)[fieldName] = null;
        this.addIssue(
          ErrorSeverityEnum.WARNING,
          'MISSING_FIELD',
          `${displayName} is missing due to short line`,
          { field: fieldName, expected: [start, end], actual: line.length }
        );

        if (this.options.attemptRecovery) {
          this.recordRecovery(
            RecoveryAction.USE_DEFAULT,
            `Using null for missing ${displayName}`,
            { field: fieldName }
          );
        }
      }
    } catch (error) {
      (this.parsedData as any)[fieldName] = null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addIssue(
        ErrorSeverityEnum.ERROR,
        'FIELD_PARSE_ERROR',
        `Error parsing ${displayName}: ${errorMessage}`,
        { field: fieldName, error: errorMessage }
      );
    }
  }

  /**
   * Calculate checksum for a TLE line
   * @param line - The TLE line to calculate checksum for
   * @returns The calculated checksum (0-9)
   */
  private calculateChecksum(line: string): number {
    let checksum = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const char = line[i];
      if (char && char >= '0' && char <= '9') {
        checksum += parseInt(char, 10);
      } else if (char === '-') {
        checksum += 1;
      }
    }
    return checksum % 10;
  }

  /**
   * Get the final parse result
   * @returns Complete parse result with all information
   */
  private getResult(): CompleteParseResult {
    // Convert parser issues to TLE errors/warnings
    const errors: TLEError[] = this.errors.map(e => ({
      code: e.code,
      message: e.message,
      severity: (e.severity === ErrorSeverityEnum.CRITICAL ? 'error' : e.severity) as ErrorSeverity,
      ...Object.fromEntries(
        Object.entries(e).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key))
      )
    }));

    const warnings: TLEWarning[] = this.warnings.map(w => ({
      code: w.code,
      message: w.message,
      severity: 'warning' as const,
      ...Object.fromEntries(
        Object.entries(w).filter(([key]) => !['severity', 'code', 'message', 'state'].includes(key))
      )
    }));

    return {
      success: this.state === ParserState.COMPLETED,
      state: this.state,
      data: this.parsedData as ParsedTLE | null,
      errors,
      warnings,
      recoveryActions: this.recoveryActions.map(r => r.action),
      partialData: this.options.includePartialResults ? this.parsedData : undefined,
      context: {
        lineCount: this.context.lineCount,
        hasName: this.context.hasName,
        recoveryAttempts: this.context.recoveryAttempts
      }
    };
  }
}

/**
 * Parse TLE using state machine with error recovery
 * Convenience function that creates a parser and parses in one call
 *
 * @param tleString - The TLE data string to parse
 * @param options - Parser configuration options
 * @returns Complete parse result with data, errors, warnings, and recovery actions
 *
 * @example
 * ```typescript
 * const result = parseWithStateMachine(tleData, { attemptRecovery: true });
 * if (result.success) {
 *   console.log('Parsed TLE:', result.data);
 * } else {
 *   console.error('Parse errors:', result.errors);
 * }
 * ```
 */
export function parseWithStateMachine(
  tleString: string,
  options: StateMachineParserOptions = {}
): StateMachineParseResult {
  const parser = new TLEStateMachineParser(options);
  return parser.parse(tleString);
}
