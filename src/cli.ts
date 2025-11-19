#!/usr/bin/env node

/**
 * TLE Parser CLI
 * Command-line interface for parsing, validating, and converting TLE data
 */

import { readFileSync, existsSync, watch } from 'fs';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { stdin } from 'process';
import { parseTLE, validateTLE, parseBatch } from './index';
import { formatTLE } from './outputFormats';
import type { OutputOptions } from './outputFormats';
import type { ParsedTLE } from './types';

/**
 * Helper to get satellite number from ParsedTLE
 */
function getSatelliteNumber(tle: ParsedTLE): string {
  return tle.satelliteNumber1 || tle.satelliteNumber2 || '';
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CLIOptions {
  format?: 'json' | 'csv' | 'xml' | 'yaml' | 'human' | 'tle';
  pretty?: boolean;
  colors?: boolean;
  verbosity?: 'compact' | 'normal' | 'verbose';
  output?: string;
  validateOnly?: boolean;
  watch?: boolean;
  filter?: string;
  diff?: string;
  url?: boolean;
  recursive?: boolean;
  includeWarnings?: boolean;
  includeComments?: boolean;
  help?: boolean;
  version?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Print help message
 */
function printHelp(): void {
  const helpText = `
TLE Parser CLI - Parse and convert Two-Line Element satellite data

USAGE:
  tle-parser [options] <file|url>
  tle-parser [options] < input.txt
  cat input.txt | tle-parser [options]

OPTIONS:
  -f, --format <type>       Output format: json, csv, xml, yaml, human, tle (default: json)
  -p, --pretty              Pretty-print output (for json, xml, yaml)
  -c, --colors              Enable colored output (for human format)
  -v, --verbosity <level>   Verbosity level: compact, normal, verbose (default: normal)
  -o, --output <file>       Write output to file instead of stdout
  --validate-only           Only validate TLE, don't parse
  --watch                   Watch file for changes and reprocess
  --filter <pattern>        Filter satellites by name or number (regex)
  --diff <file>             Compare with another TLE file and show differences
  --url                     Fetch TLE from URL instead of file
  --recursive               Process all TLE files in directory recursively
  --no-warnings             Exclude warnings from output
  --no-comments             Exclude comments from output
  -h, --help                Show this help message
  --version                 Show version number

EXAMPLES:
  # Parse TLE file to JSON
  tle-parser data/iss.tle

  # Parse with pretty-printed JSON
  tle-parser --format json --pretty data/iss.tle

  # Parse to human-readable format with colors
  tle-parser --format human --colors data/iss.tle

  # Parse to CSV
  tle-parser --format csv --output satellites.csv data/satellites.tle

  # Validate TLE without parsing
  tle-parser --validate-only data/iss.tle

  # Watch file for changes
  tle-parser --watch data/iss.tle

  # Filter satellites by name
  tle-parser --filter "STARLINK" data/satellites.tle

  # Compare two TLE files
  tle-parser --diff data/old.tle data/new.tle

  # Fetch TLE from URL
  tle-parser --url https://celestrak.org/NORAD/elements/gp.php?GROUP=stations

  # Read from stdin
  cat data/iss.tle | tle-parser --format json

  # Process all TLE files in directory
  tle-parser --recursive data/

  # Reconstruct TLE from parsed data
  tle-parser --format tle data/iss.tle
`;

  console.log(helpText);
}

/**
 * Print version
 */
function printVersion(): void {
  try {
    const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    console.log(`tle-parser v${packageJson.version}`);
  } catch {
    console.log('tle-parser (version unknown)');
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): { options: CLIOptions; files: string[] } {
  const options: CLIOptions = {
    format: 'json',
    pretty: false,
    colors: false,
    verbosity: 'normal',
    validateOnly: false,
    watch: false,
    url: false,
    recursive: false,
    includeWarnings: true,
    includeComments: true
  };

  const files: string[] = [];
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    if (!arg) continue;

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '--version':
        options.version = true;
        break;
      case '-f':
      case '--format':
        options.format = (args[++i] || 'json') as any;
        break;
      case '-p':
      case '--pretty':
        options.pretty = true;
        break;
      case '-c':
      case '--colors':
        options.colors = true;
        break;
      case '-v':
      case '--verbosity':
        options.verbosity = (args[++i] || 'normal') as any;
        break;
      case '-o':
      case '--output':
        options.output = args[++i] || '';
        break;
      case '--validate-only':
        options.validateOnly = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--filter':
        options.filter = args[++i] || '';
        break;
      case '--diff':
        options.diff = args[++i] || '';
        break;
      case '--url':
        options.url = true;
        break;
      case '--recursive':
        options.recursive = true;
        break;
      case '--no-warnings':
        options.includeWarnings = false;
        break;
      case '--no-comments':
        options.includeComments = false;
        break;
      default:
        if (!arg.startsWith('-')) {
          files.push(arg);
        }
        break;
    }

    i++;
  }

  return { options, files };
}

/**
 * Read TLE data from file, URL, or stdin
 */
async function readInput(source?: string, isUrl: boolean = false): Promise<string> {
  // Read from URL
  if (isUrl && source) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    return await response.text();
  }

  // Read from file
  if (source) {
    if (!existsSync(source)) {
      throw new Error(`File not found: ${source}`);
    }
    return readFileSync(source, 'utf-8');
  }

  // Read from stdin
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding('utf-8');
    stdin.on('data', chunk => (data += chunk));
    stdin.on('end', () => resolve(data));
    stdin.on('error', reject);
  });
}

/**
 * Filter TLEs by pattern
 */
function filterTLEs(tles: ParsedTLE[], pattern: string): ParsedTLE[] {
  const regex = new RegExp(pattern, 'i');
  return tles.filter(tle => {
    return regex.test(tle.satelliteName || '') || regex.test(getSatelliteNumber(tle));
  });
}

/**
 * Compare two TLE datasets and show differences
 */
function diffTLEs(oldTles: ParsedTLE[], newTles: ParsedTLE[]): void {
  const oldMap = new Map(oldTles.map(t => [getSatelliteNumber(t), t]));
  const newMap = new Map(newTles.map(t => [getSatelliteNumber(t), t]));

  console.log('\n=== TLE Comparison ===\n');

  // Find removed satellites
  const removed = oldTles.filter(t => !newMap.has(getSatelliteNumber(t)));
  if (removed.length > 0) {
    console.log(`Removed (${removed.length}):`);
    removed.forEach(t => console.log(`  - ${t.satelliteName} (${getSatelliteNumber(t)})`));
    console.log('');
  }

  // Find added satellites
  const added = newTles.filter(t => !oldMap.has(getSatelliteNumber(t)));
  if (added.length > 0) {
    console.log(`Added (${added.length}):`);
    added.forEach(t => console.log(`  + ${t.satelliteName} (${getSatelliteNumber(t)})`));
    console.log('');
  }

  // Find modified satellites
  const modified: Array<{ old: ParsedTLE; new: ParsedTLE }> = [];
  for (const [satNum, newTle] of newMap.entries()) {
    const oldTle = oldMap.get(satNum);
    if (oldTle) {
      // Check if any orbital parameters changed
      const changed =
        oldTle.inclination !== newTle.inclination ||
        oldTle.eccentricity !== newTle.eccentricity ||
        oldTle.meanMotion !== newTle.meanMotion ||
        oldTle.epochYear !== newTle.epochYear ||
        oldTle.epoch !== newTle.epoch;

      if (changed) {
        modified.push({ old: oldTle, new: newTle });
      }
    }
  }

  if (modified.length > 0) {
    console.log(`Modified (${modified.length}):`);
    modified.forEach(({ old, new: newTle }) => {
      console.log(`  ~ ${newTle.satelliteName} (${getSatelliteNumber(newTle)})`);
      if (old.inclination !== newTle.inclination) {
        console.log(`    Inclination: ${old.inclination} → ${newTle.inclination}`);
      }
      if (old.eccentricity !== newTle.eccentricity) {
        console.log(`    Eccentricity: ${old.eccentricity} → ${newTle.eccentricity}`);
      }
      if (old.meanMotion !== newTle.meanMotion) {
        console.log(`    Mean Motion: ${old.meanMotion} → ${newTle.meanMotion}`);
      }
      if (old.epochYear !== newTle.epochYear || old.epoch !== newTle.epoch) {
        console.log(`    Epoch: ${old.epochYear}:${old.epoch} → ${newTle.epochYear}:${newTle.epoch}`);
      }
    });
    console.log('');
  }

  console.log(`Summary: ${removed.length} removed, ${added.length} added, ${modified.length} modified`);
}

/**
 * Process TLE file
 */
async function processFile(
  filePath: string | undefined,
  options: CLIOptions,
  isUrl: boolean = false
): Promise<void> {
  try {
    // Read input
    const data = await readInput(filePath, isUrl);

    // Validate only mode
    if (options.validateOnly) {
      const result = validateTLE(data);
      if (result.isValid) {
        console.log('✓ TLE validation passed');
        if (result.warnings.length > 0) {
          console.log(`\nWarnings (${result.warnings.length}):`);
          result.warnings.forEach(w => {
            const msg = typeof w === 'object' && 'message' in w ? w.message : String(w);
            console.log(`  ⚠ ${msg}`);
          });
        }
      } else {
        console.error('✗ TLE validation failed');
        console.error(`\nErrors (${result.errors.length}):`);
        result.errors.forEach(e => {
          const msg = typeof e === 'object' && 'message' in e ? e.message : String(e);
          console.error(`  ✗ ${msg}`);
        });
        process.exit(1);
      }
      return;
    }

    // Parse TLE(s)
    let tles: ParsedTLE[];
    try {
      tles = parseBatch(data, { validate: true });
    } catch (error) {
      // If batch parsing fails, try single TLE
      tles = [parseTLE(data, { validate: true })];
    }

    // Apply filter if specified
    if (options.filter) {
      tles = filterTLEs(tles, options.filter);
    }

    // Format output
    const outputOptions: OutputOptions = {
      format: options.format,
      pretty: options.pretty,
      colors: options.colors,
      verbosity: options.verbosity,
      includeWarnings: options.includeWarnings,
      includeComments: options.includeComments
    };

    const result = tles.length === 1 ? tles[0] : tles;
    if (!result) {
      console.error('No TLE data parsed');
      process.exit(1);
    }

    const output = formatTLE(result, outputOptions);

    // Write output
    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, output, 'utf-8');
      console.log(`Output written to: ${options.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

/**
 * Process directory recursively
 */
async function processDirectory(dirPath: string, options: CLIOptions): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const tleExtensions = ['.tle', '.txt', '.text'];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory() && options.recursive) {
      await processDirectory(fullPath, options);
    } else if (entry.isFile() && tleExtensions.includes(extname(entry.name).toLowerCase())) {
      console.log(`\nProcessing: ${fullPath}`);
      await processFile(fullPath, options);
    }
  }
}

/**
 * Watch file for changes
 */
async function watchFile(filePath: string, options: CLIOptions): Promise<void> {
  console.log(`Watching ${filePath} for changes... (Press Ctrl+C to stop)`);

  watch(filePath, async (eventType) => {
    if (eventType === 'change') {
      console.log(`\n[${new Date().toISOString()}] File changed, reprocessing...`);
      await processFile(filePath, options);
    }
  });

  // Keep process running
  await new Promise(() => {});
}

/**
 * Compare two TLE files
 */
async function compareFiles(file1?: string, file2?: string): Promise<void> {
  if (!file1 || !file2) {
    console.error('Error: Both file paths are required for comparison');
    process.exit(1);
  }

  try {
    const data1 = await readInput(file1);
    const data2 = await readInput(file2);

    let tles1: ParsedTLE[];
    let tles2: ParsedTLE[];

    try {
      tles1 = parseBatch(data1, { validate: false });
    } catch {
      tles1 = [parseTLE(data1, { validate: false })];
    }

    try {
      tles2 = parseBatch(data2, { validate: false });
    } catch {
      tles2 = [parseTLE(data2, { validate: false })];
    }

    diffTLEs(tles1, tles2);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const { options, files } = parseArgs(process.argv.slice(2));

  // Handle help and version
  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    printVersion();
    return;
  }

  // Handle diff mode
  if (options.diff) {
    if (files.length !== 1) {
      console.error('Error: --diff requires exactly one file argument');
      process.exit(1);
    }
    await compareFiles(options.diff, files[0]);
    return;
  }

  // Determine input source
  const inputFile = files[0];

  // Check if stdin has data
  const isStdin = !inputFile && !stdin.isTTY;

  if (!inputFile && !isStdin) {
    console.error('Error: No input file specified and stdin is empty');
    console.error('Run "tle-parser --help" for usage information');
    process.exit(1);
  }

  // Handle recursive directory processing
  if (options.recursive && inputFile) {
    const fs = await import('fs/promises');
    const stats = await fs.stat(inputFile);
    if (stats.isDirectory()) {
      await processDirectory(inputFile, options);
      return;
    }
  }

  // Handle watch mode
  if (options.watch) {
    if (!inputFile) {
      console.error('Error: --watch requires a file argument');
      process.exit(1);
    }
    await watchFile(inputFile!, options);
    return;
  }

  // Process single file or stdin
  await processFile(inputFile, options, options.url);
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, parseArgs, printHelp, printVersion };
