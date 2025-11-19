/**
 * State machine parser for TLE data with advanced error recovery
 * Provides robust parsing of malformed TLE data with detailed error reporting
 */
import type { StateMachineParseResult } from './types';
/**
 * Parser states for the state machine
 */
export declare enum ParserState {
    INITIAL = "INITIAL",
    DETECTING_FORMAT = "DETECTING_FORMAT",
    PARSING_NAME = "PARSING_NAME",
    PARSING_LINE1 = "PARSING_LINE1",
    PARSING_LINE2 = "PARSING_LINE2",
    VALIDATING = "VALIDATING",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR"
}
/**
 * Error severity levels for issue reporting
 */
export declare enum ErrorSeverityEnum {
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Recovery action types for error handling
 */
export declare enum RecoveryAction {
    /** Continue parsing despite the error */
    CONTINUE = "CONTINUE",
    /** Skip the current field */
    SKIP_FIELD = "SKIP_FIELD",
    /** Use a default value for the field */
    USE_DEFAULT = "USE_DEFAULT",
    /** Attempt to fix the issue automatically */
    ATTEMPT_FIX = "ATTEMPT_FIX",
    /** Cannot recover, abort parsing */
    ABORT = "ABORT"
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
export declare class TLEStateMachineParser {
    private options;
    private state;
    private errors;
    private warnings;
    private recoveryActions;
    private parsedData;
    private context;
    /**
     * Create a new state machine parser
     * @param options - Parser configuration options
     */
    constructor(options?: StateMachineParserOptions);
    /**
     * Reset the parser state to initial conditions
     */
    private reset;
    /**
     * Add an error or warning to the collection
     * @param severity - Issue severity level
     * @param code - Error code
     * @param message - Human-readable message
     * @param details - Additional details about the issue
     * @returns The created issue
     */
    private addIssue;
    /**
     * Record a recovery action taken during parsing
     * @param action - Type of recovery action
     * @param description - Description of what was done
     * @param context - Additional context information
     */
    private recordRecovery;
    /**
     * Transition to a new parser state
     * @param newState - The state to transition to
     * @param reason - Reason for the transition
     * @returns State transition record
     */
    private transition;
    /**
     * Parse TLE string with state machine and error recovery
     * @param tleString - The TLE data to parse
     * @returns Complete parse result with data, errors, warnings, and recovery information
     */
    parse(tleString: string): CompleteParseResult;
    /**
     * Detect the format of the TLE data (2 or 3 lines)
     * @param tleString - The raw TLE string
     */
    private detectFormat;
    /**
     * Execute the state machine until completion or error
     */
    private executeStateMachine;
    /**
     * Parse satellite name line
     */
    private parseSatelliteName;
    /**
     * Parse TLE Line 1
     */
    private parseLine1;
    /**
     * Parse TLE Line 2
     */
    private parseLine2;
    /**
     * Validate cross-field relationships
     */
    private validateCrossFields;
    /**
     * Validate a numeric field is within range
     * @param fieldName - Name of the field to validate
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @param displayName - Human-readable field name
     * @param warningOnly - If true, generate warning instead of error
     */
    private validateNumericField;
    /**
     * Safely parse a field from a line
     * @param fieldName - Name of the field to parse
     * @param line - The line containing the field
     * @param start - Start position of the field
     * @param end - End position of the field
     * @param displayName - Human-readable field name
     */
    private parseFieldSafe;
    /**
     * Calculate checksum for a TLE line
     * @param line - The TLE line to calculate checksum for
     * @returns The calculated checksum (0-9)
     */
    private calculateChecksum;
    /**
     * Get the final parse result
     * @returns Complete parse result with all information
     */
    private getResult;
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
export declare function parseWithStateMachine(tleString: string, options?: StateMachineParserOptions): StateMachineParseResult;
export {};
//# sourceMappingURL=stateMachineParser.d.ts.map