/**
 * TLE Output Formats & Serialization
 * Supports JSON, CSV, XML, YAML, and human-readable formats
 * Includes TLE reconstruction capabilities
 */

import type { ParsedTLE } from './types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to get satellite number from ParsedTLE
 */
function getSatelliteNumber(tle: ParsedTLE): string {
  return tle.satelliteNumber1 || tle.satelliteNumber2 || '';
}

/**
 * Helper to get international designator
 */
function getInternationalDesignator(tle: ParsedTLE): string {
  const year = tle.internationalDesignatorYear || '';
  const launch = tle.internationalDesignatorLaunchNumber || '';
  const piece = tle.internationalDesignatorPiece || '';
  return `${year}${launch}${piece}`.trim();
}

// ============================================================================
// OUTPUT FORMAT INTERFACES
// ============================================================================

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

// ============================================================================
// COLOR CODES FOR TERMINAL OUTPUT
// ============================================================================

export const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
} as const;

/**
 * Apply color to text if colors are enabled
 */
function colorize(text: string, color: string, enabled: boolean = true): string {
  return enabled ? `${color}${text}${Colors.reset}` : text;
}

// ============================================================================
// JSON OUTPUT
// ============================================================================

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
export function formatAsJSON(tle: ParsedTLE | ParsedTLE[], options: OutputOptions = {}): string {
  const { pretty = false, includeWarnings = true, includeComments = true, verbosity = 'normal' } = options;

  const processObject = (obj: ParsedTLE) => {
    const result: any = { ...obj };

    // Remove warnings if not requested
    if (!includeWarnings && 'warnings' in result) {
      delete result.warnings;
    }

    // Remove comments if not requested
    if (!includeComments && 'comments' in result) {
      delete result.comments;
    }

    // Compact mode: only essential fields
    if (verbosity === 'compact') {
      return {
        satelliteName: result.satelliteName,
        satelliteNumber: getSatelliteNumber(result),
        epoch: result.epochYear + ':' + result.epoch,
        inclination: result.inclination,
        eccentricity: result.eccentricity,
        meanMotion: result.meanMotion
      };
    }

    return result;
  };

  const data = Array.isArray(tle) ? tle.map(processObject) : processObject(tle);
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

// ============================================================================
// CSV OUTPUT
// ============================================================================

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
export function formatAsCSV(tle: ParsedTLE | ParsedTLE[], options: CSVOptions = {}): string {
  const {
    includeHeader = true,
    delimiter = ',',
    quote = true,
    verbosity = 'normal'
  } = options;

  const tles = Array.isArray(tle) ? tle : [tle];
  const lines: string[] = [];

  // Define fields based on verbosity
  const compactFields = [
    'satelliteName', 'satelliteNumber1', 'epochYear', 'epoch',
    'inclination', 'eccentricity', 'meanMotion'
  ];

  const normalFields = [
    'satelliteName', 'satelliteNumber1', 'classification',
    'epochYear', 'epoch', 'firstDerivative', 'secondDerivative',
    'bStar', 'inclination', 'rightAscension', 'eccentricity',
    'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'revolutionNumber'
  ];

  const verboseFields = Object.keys(tles[0] || {}).filter(
    key => !['warnings', 'comments', 'checksum1', 'checksum2', 'lineNumber1', 'lineNumber2'].includes(key)
  );

  const fields = verbosity === 'compact' ? compactFields :
                 verbosity === 'verbose' ? verboseFields :
                 normalFields;

  // Add header
  if (includeHeader) {
    lines.push(fields.map(f => quote ? `"${f}"` : f).join(delimiter));
  }

  // Add data rows
  for (const tleObj of tles) {
    const values = fields.map(field => {
      const value = (tleObj as any)[field] ?? '';
      const strValue = String(value);
      return quote ? `"${strValue.replace(/"/g, '""')}"` : strValue;
    });
    lines.push(values.join(delimiter));
  }

  return lines.join('\n');
}

// ============================================================================
// XML OUTPUT
// ============================================================================

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
export function formatAsXML(tle: ParsedTLE | ParsedTLE[], options: OutputOptions = {}): string {
  const { pretty = false, includeWarnings = true, includeComments = true } = options;
  const indent = pretty ? '  ' : '';
  const newline = pretty ? '\n' : '';

  const tles = Array.isArray(tle) ? tle : [tle];
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];

  lines.push(`<tles>${newline}`);

  for (const tleObj of tles) {
    lines.push(`${indent}<tle>${newline}`);

    for (const [key, value] of Object.entries(tleObj)) {
      // Skip warnings and comments based on options
      if (key === 'warnings' && !includeWarnings) continue;
      if (key === 'comments' && !includeComments) continue;

      // Handle arrays (warnings, comments)
      if (Array.isArray(value)) {
        lines.push(`${indent}${indent}<${key}>${newline}`);
        for (const item of value) {
          const itemStr = typeof item === 'object' ? JSON.stringify(item) : String(item);
          lines.push(`${indent}${indent}${indent}<item>${escapeXML(itemStr)}</item>${newline}`);
        }
        lines.push(`${indent}${indent}</${key}>${newline}`);
      } else {
        const escapedValue = escapeXML(String(value ?? ''));
        lines.push(`${indent}${indent}<${key}>${escapedValue}</${key}>${newline}`);
      }
    }

    lines.push(`${indent}</tle>${newline}`);
  }

  lines.push('</tles>');

  return lines.join('');
}

// ============================================================================
// YAML OUTPUT
// ============================================================================

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
export function formatAsYAML(tle: ParsedTLE | ParsedTLE[], options: OutputOptions = {}): string {
  const { includeWarnings = true, includeComments = true } = options;
  const tles = Array.isArray(tle) ? tle : [tle];
  const lines: string[] = [];

  const formatValue = (value: any, indent: number = 0): string => {
    const prefix = '  '.repeat(indent);

    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      // Quote strings that contain special characters or start with special chars
      if (/[:#\[\]{},&*!|>'"%@`]/.test(value) || /^\s|\s$/.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          const objLines = formatObject(item, indent + 1);
          return `${prefix}  -${objLines.substring(prefix.length + 3)}`;
        }
        return `${prefix}  - ${formatValue(item, 0)}`;
      });
      return '\n' + items.join('\n');
    }

    if (typeof value === 'object') {
      return '\n' + formatObject(value, indent + 1);
    }

    return String(value);
  };

  const formatObject = (obj: any, indent: number = 0): string => {
    const prefix = '  '.repeat(indent);
    const entries: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'warnings' && !includeWarnings) continue;
      if (key === 'comments' && !includeComments) continue;

      const formattedValue = formatValue(value, indent);
      if (formattedValue.startsWith('\n')) {
        entries.push(`${prefix}${key}:${formattedValue}`);
      } else {
        entries.push(`${prefix}${key}: ${formattedValue}`);
      }
    }

    return entries.join('\n');
  };

  if (tles.length === 1) {
    return formatObject(tles[0], 0);
  } else {
    lines.push('tles:');
    for (const tleObj of tles) {
      lines.push('  -');
      const objStr = formatObject(tleObj, 2);
      lines.push(objStr);
    }
    return lines.join('\n');
  }
}

// ============================================================================
// HUMAN-READABLE OUTPUT
// ============================================================================

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
export function formatAsHuman(tle: ParsedTLE, options: OutputOptions = {}): string {
  const { colors = false, verbosity = 'normal', includeWarnings = true } = options;
  const lines: string[] = [];

  // Header
  lines.push(colorize('═'.repeat(70), Colors.cyan, colors));
  lines.push(colorize(`  ${tle.satelliteName || 'Unknown Satellite'}`, Colors.bright + Colors.cyan, colors));
  lines.push(colorize('═'.repeat(70), Colors.cyan, colors));
  lines.push('');

  // Basic Information
  lines.push(colorize('Basic Information:', Colors.bright + Colors.yellow, colors));
  lines.push(`  ${colorize('Satellite Number:', Colors.green, colors)} ${getSatelliteNumber(tle)}`);
  lines.push(`  ${colorize('Classification:', Colors.green, colors)} ${tle.classification || 'N/A'}`);
  lines.push(`  ${colorize('International Designator:', Colors.green, colors)} ${getInternationalDesignator(tle) || 'N/A'}`);
  lines.push('');

  // Epoch Information
  lines.push(colorize('Epoch Information:', Colors.bright + Colors.yellow, colors));
  lines.push(`  ${colorize('Epoch Year:', Colors.green, colors)} ${tle.epochYear}`);
  lines.push(`  ${colorize('Epoch Day:', Colors.green, colors)} ${tle.epoch}`);
  lines.push('');

  // Orbital Parameters
  lines.push(colorize('Orbital Parameters:', Colors.bright + Colors.yellow, colors));
  lines.push(`  ${colorize('Inclination:', Colors.green, colors)} ${tle.inclination}°`);
  lines.push(`  ${colorize('Right Ascension:', Colors.green, colors)} ${tle.rightAscension}°`);
  lines.push(`  ${colorize('Eccentricity:', Colors.green, colors)} ${tle.eccentricity}`);
  lines.push(`  ${colorize('Argument of Perigee:', Colors.green, colors)} ${tle.argumentOfPerigee}°`);
  lines.push(`  ${colorize('Mean Anomaly:', Colors.green, colors)} ${tle.meanAnomaly}°`);
  lines.push(`  ${colorize('Mean Motion:', Colors.green, colors)} ${tle.meanMotion} rev/day`);
  lines.push('');

  // Verbose mode: additional parameters
  if (verbosity === 'verbose') {
    lines.push(colorize('Additional Parameters:', Colors.bright + Colors.yellow, colors));
    lines.push(`  ${colorize('First Derivative (Mean Motion):', Colors.green, colors)} ${tle.firstDerivative}`);
    lines.push(`  ${colorize('Second Derivative (Mean Motion):', Colors.green, colors)} ${tle.secondDerivative}`);
    lines.push(`  ${colorize('B* Drag Term:', Colors.green, colors)} ${tle.bStar}`);
    lines.push(`  ${colorize('Ephemeris Type:', Colors.green, colors)} ${tle.ephemerisType}`);
    lines.push(`  ${colorize('Element Set Number:', Colors.green, colors)} ${tle.elementSetNumber}`);
    lines.push(`  ${colorize('Revolution Number:', Colors.green, colors)} ${tle.revolutionNumber}`);
    lines.push('');
  }

  // Warnings
  if (includeWarnings && 'warnings' in tle && Array.isArray(tle.warnings) && tle.warnings.length > 0) {
    lines.push(colorize('Warnings:', Colors.bright + Colors.yellow, colors));
    for (const warning of tle.warnings) {
      const msg = typeof warning === 'object' && 'message' in warning ? warning.message : String(warning);
      lines.push(`  ${colorize('⚠', Colors.yellow, colors)} ${msg}`);
    }
    lines.push('');
  }

  lines.push(colorize('═'.repeat(70), Colors.cyan, colors));

  return lines.join('\n');
}

// ============================================================================
// TLE RECONSTRUCTION
// ============================================================================

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
export function reconstructTLE(tle: ParsedTLE, options: TLEReconstructionOptions = {}): string {
  const { includeName = true } = options;

  // Helper to pad a string to the right with spaces
  const padRight = (str: string, length: number): string => {
    return str.padEnd(length, ' ');
  };

  // Helper to pad a string to the left with spaces or zeros
  const padLeft = (str: string, length: number, char: string = ' '): string => {
    return str.padStart(length, char);
  };

  // Line 1: Build character by character according to TLE spec
  let line1 = '1 '; // Line number + space

  // Satellite number (positions 3-7): 5 characters, right-aligned
  line1 += padLeft(getSatelliteNumber(tle), 5, ' ');

  // Classification (position 8): 1 character
  line1 += (tle.classification || 'U');

  // International designator (positions 10-17): 8 characters
  const intlDesig = getInternationalDesignator(tle);
  line1 += ' ' + padRight(intlDesig, 8);

  // Epoch year (positions 19-20): 2 digits
  line1 += ' ' + padLeft(tle.epochYear || '', 2, '0');

  // Epoch day (positions 21-32): 12 characters, including decimal point
  line1 += padLeft(tle.epoch || '', 12, ' ');

  // First derivative of mean motion (positions 34-43): 10 characters
  line1 += ' ' + padLeft(tle.firstDerivative || '', 10, ' ');

  // Second derivative of mean motion (positions 45-52): 8 characters
  line1 += ' ' + padRight(tle.secondDerivative || '', 8);

  // B* drag term (positions 54-61): 8 characters
  line1 += ' ' + padRight(tle.bStar || '', 8);

  // Ephemeris type (position 63): 1 character
  line1 += ' ' + (tle.ephemerisType || '0');

  // Element set number (positions 65-68): 4 characters, right-aligned
  line1 += ' ' + padLeft(tle.elementSetNumber || '', 4, ' ');

  // Calculate checksum for line 1
  let checksum1 = 0;
  for (let i = 0; i < line1.length; i++) {
    const char = line1[i];
    if (char && char >= '0' && char <= '9') {
      checksum1 += parseInt(char, 10);
    } else if (char === '-') {
      checksum1 += 1;
    }
  }
  line1 += (checksum1 % 10).toString();

  // Line 2: Build character by character
  let line2 = '2 '; // Line number + space

  // Satellite number (positions 3-7): 5 characters, right-aligned
  line2 += padLeft(getSatelliteNumber(tle), 5, ' ');

  // Inclination (positions 9-16): 8 characters, with decimal point
  line2 += ' ' + padLeft(tle.inclination || '', 8, ' ');

  // Right ascension (positions 18-25): 8 characters, with decimal point
  line2 += ' ' + padLeft(tle.rightAscension || '', 8, ' ');

  // Eccentricity (positions 27-33): 7 characters, decimal point assumed
  // Remove leading "0." if present
  let ecc = (tle.eccentricity || '').replace(/^0\./, '');
  line2 += ' ' + padLeft(ecc, 7, '0');

  // Argument of perigee (positions 35-42): 8 characters
  line2 += ' ' + padLeft(tle.argumentOfPerigee || '', 8, ' ');

  // Mean anomaly (positions 44-51): 8 characters
  line2 += ' ' + padLeft(tle.meanAnomaly || '', 8, ' ');

  // Mean motion (positions 53-63): 11 characters, with decimal point
  line2 += ' ' + padLeft(tle.meanMotion || '', 11, ' ');

  // Revolution number (positions 64-68): 5 characters, right-aligned
  line2 += padLeft(tle.revolutionNumber || '', 5, ' ');

  // Calculate checksum for line 2
  let checksum2 = 0;
  for (let i = 0; i < line2.length; i++) {
    const char = line2[i];
    if (char && char >= '0' && char <= '9') {
      checksum2 += parseInt(char, 10);
    } else if (char === '-') {
      checksum2 += 1;
    }
  }
  line2 += (checksum2 % 10).toString();

  // Combine lines
  const lines: string[] = [];
  if (includeName && tle.satelliteName) {
    lines.push(tle.satelliteName);
  }
  lines.push(line1);
  lines.push(line2);

  return lines.join('\n');
}

// ============================================================================
// UNIVERSAL FORMAT FUNCTION
// ============================================================================

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
export function formatTLE(tle: ParsedTLE | ParsedTLE[], options: OutputOptions = {}): string {
  const { format = 'json' } = options;

  switch (format) {
    case 'json':
      return formatAsJSON(tle, options);
    case 'csv':
      return formatAsCSV(tle, options as CSVOptions);
    case 'xml':
      return formatAsXML(tle, options);
    case 'yaml':
      return formatAsYAML(tle, options);
    case 'human':
      if (Array.isArray(tle)) {
        return tle.map(t => formatAsHuman(t, options)).join('\n\n');
      }
      return formatAsHuman(tle, options);
    case 'tle':
      if (Array.isArray(tle)) {
        return tle.map(t => reconstructTLE(t, { includeName: true })).join('\n\n');
      }
      return reconstructTLE(tle, { includeName: true });
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}
