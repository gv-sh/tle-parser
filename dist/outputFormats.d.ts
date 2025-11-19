/**
 * TLE Output Formats & Serialization
 * Supports JSON, CSV, XML, YAML, and human-readable formats
 * Includes TLE reconstruction capabilities
 */
import type { ParsedTLE } from './types';
export interface OutputOptions {
    /** Output format type */
    format?: 'json' | 'csv' | 'xml' | 'yaml' | 'human' | 'tle';
    /** Pretty print (for JSON, XML, YAML) */
    pretty?: boolean;
    /** Include warnings in output */
    includeWarnings?: boolean;
    /** Include comments in output */
    includeComments?: boolean;
    /** Verbosity level (compact, normal, verbose) */
    verbosity?: 'compact' | 'normal' | 'verbose';
    /** Use colors for human-readable output */
    colors?: boolean;
}
export interface CSVOptions extends OutputOptions {
    /** Include header row */
    includeHeader?: boolean;
    /** CSV delimiter */
    delimiter?: string;
    /** Quote fields */
    quote?: boolean;
}
export interface TLEReconstructionOptions {
    /** Include satellite name line (3-line format) */
    includeName?: boolean;
    /** Preserve original formatting (spaces/padding) */
    preserveFormatting?: boolean;
}
export declare const Colors: {
    readonly reset: "\u001B[0m";
    readonly bright: "\u001B[1m";
    readonly dim: "\u001B[2m";
    readonly black: "\u001B[30m";
    readonly red: "\u001B[31m";
    readonly green: "\u001B[32m";
    readonly yellow: "\u001B[33m";
    readonly blue: "\u001B[34m";
    readonly magenta: "\u001B[35m";
    readonly cyan: "\u001B[36m";
    readonly white: "\u001B[37m";
    readonly bgBlack: "\u001B[40m";
    readonly bgRed: "\u001B[41m";
    readonly bgGreen: "\u001B[42m";
    readonly bgYellow: "\u001B[43m";
    readonly bgBlue: "\u001B[44m";
    readonly bgMagenta: "\u001B[45m";
    readonly bgCyan: "\u001B[46m";
    readonly bgWhite: "\u001B[47m";
};
/**
 * Format TLE as JSON
 *
 * @param tle - Parsed TLE object
 * @param options - Output options
 * @returns JSON string
 *
 * @example
 * ```typescript
 * const json = formatAsJSON(parsedTLE, { pretty: true });
 * console.log(json);
 * ```
 */
export declare function formatAsJSON(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE as CSV
 *
 * @param tle - Parsed TLE object or array
 * @param options - CSV output options
 * @returns CSV string
 *
 * @example
 * ```typescript
 * const csv = formatAsCSV([tle1, tle2], { includeHeader: true });
 * console.log(csv);
 * ```
 */
export declare function formatAsCSV(tle: ParsedTLE | ParsedTLE[], options?: CSVOptions): string;
/**
 * Format TLE as XML
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns XML string
 *
 * @example
 * ```typescript
 * const xml = formatAsXML(parsedTLE, { pretty: true });
 * console.log(xml);
 * ```
 */
export declare function formatAsXML(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE as YAML
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns YAML string
 *
 * @example
 * ```typescript
 * const yaml = formatAsYAML(parsedTLE);
 * console.log(yaml);
 * ```
 */
export declare function formatAsYAML(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
/**
 * Format TLE in human-readable format
 *
 * @param tle - Parsed TLE object
 * @param options - Output options
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const human = formatAsHuman(parsedTLE, { colors: true });
 * console.log(human);
 * ```
 */
export declare function formatAsHuman(tle: ParsedTLE, options?: OutputOptions): string;
/**
 * Reconstruct TLE string from parsed object
 *
 * @param tle - Parsed TLE object
 * @param options - Reconstruction options
 * @returns Reconstructed TLE string (2-line or 3-line format)
 *
 * @example
 * ```typescript
 * const tleString = reconstructTLE(parsedTLE, { includeName: true });
 * console.log(tleString);
 * ```
 */
export declare function reconstructTLE(tle: ParsedTLE, options?: TLEReconstructionOptions): string;
/**
 * Format TLE in specified output format
 *
 * @param tle - Parsed TLE object or array
 * @param options - Output options
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const output = formatTLE(parsedTLE, { format: 'json', pretty: true });
 * console.log(output);
 * ```
 */
export declare function formatTLE(tle: ParsedTLE | ParsedTLE[], options?: OutputOptions): string;
//# sourceMappingURL=outputFormats.d.ts.map