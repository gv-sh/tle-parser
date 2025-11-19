"use strict";
/**
 * TLE Parser CLI
 * Command-line interface for parsing, validating, and converting TLE data
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
exports.parseArgs = parseArgs;
exports.printHelp = printHelp;
exports.printVersion = printVersion;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const process_1 = require("process");
const readline = __importStar(require("readline"));
const index_1 = require("./index");
const outputFormats_1 = require("./outputFormats");
const dataSources_1 = require("./dataSources");
const constellations_1 = require("./constellations");
/**
 * Helper to get satellite number from ParsedTLE
 */
function getSatelliteNumber(tle) {
    return tle.satelliteNumber1 || tle.satelliteNumber2 || '';
}
/**
 * Simple progress bar for terminal
 */
class ProgressBar {
    constructor(total, barLength = 40) {
        this.total = total;
        this.current = 0;
        this.barLength = barLength;
        this.lastUpdate = 0;
    }
    update(current) {
        this.current = current;
        const now = Date.now();
        // Throttle updates to every 100ms
        if (now - this.lastUpdate < 100 && current < this.total) {
            return;
        }
        this.lastUpdate = now;
        this.render();
    }
    increment() {
        this.update(this.current + 1);
    }
    render() {
        const percentage = Math.min(100, Math.floor((this.current / this.total) * 100));
        const filled = Math.floor((this.current / this.total) * this.barLength);
        const empty = this.barLength - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const text = `Progress: [${bar}] ${percentage}% (${this.current}/${this.total})`;
        // Clear line and write progress
        process_1.stdout.write('\r' + text);
        // Add newline when complete
        if (this.current >= this.total) {
            process_1.stdout.write('\n');
        }
    }
    complete() {
        this.update(this.total);
    }
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Print help message
 */
function printHelp() {
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
  --repl                    Start interactive REPL mode
  --progress                Show progress indicators for large files
  --no-warnings             Exclude warnings from output
  --no-comments             Exclude comments from output
  -h, --help                Show this help message
  --version                 Show version number

DATA ACQUISITION OPTIONS (Week 5):
  --fetch                   Fetch TLE data from online sources
  --source <name>           Data source: celestrak, spacetrack, amsat, custom (default: celestrak)
  --constellation <name>    Filter by constellation (e.g., starlink, oneweb, gps)
  --catalog <numbers>       Fetch by satellite catalog number(s) (comma-separated)
  --group <name>            CelesTrak group (e.g., stations, visual, active)
  --list-constellations     List all available constellations
  --list-sources            List all available data sources
  --fresh <days>            Filter TLEs older than N days
  --no-cache                Bypass cache and fetch fresh data
  --clear-cache             Clear all cached TLE data
  --spacetrack-user <user>  Space-Track.org username
  --spacetrack-pass <pass>  Space-Track.org password

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

  # Start interactive REPL mode
  tle-parser --repl

  # Show progress for large files
  tle-parser --progress large-satellites.tle

DATA ACQUISITION EXAMPLES:
  # Fetch Starlink satellites from CelesTrak
  tle-parser --fetch --constellation starlink

  # Fetch ISS TLE from CelesTrak
  tle-parser --fetch --catalog 25544

  # Fetch active satellites from CelesTrak
  tle-parser --fetch --group active

  # Fetch from AMSAT amateur radio database
  tle-parser --fetch --source amsat

  # Fetch from Space-Track.org (requires credentials)
  tle-parser --fetch --source spacetrack --catalog 25544 --spacetrack-user user --spacetrack-pass pass

  # List all available constellations
  tle-parser --list-constellations

  # Fetch and filter by freshness (last 3 days)
  tle-parser --fetch --constellation starlink --fresh 3

  # Clear cache and fetch fresh data
  tle-parser --fetch --clear-cache --constellation gps
`;
    console.log(helpText);
}
/**
 * Print version
 */
function printVersion() {
    try {
        const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8'));
        console.log(`tle-parser v${packageJson.version}`);
    }
    catch {
        console.log('tle-parser (version unknown)');
    }
}
/**
 * Parse command-line arguments
 */
function parseArgs(args) {
    const options = {
        format: 'json',
        pretty: false,
        colors: false,
        verbosity: 'normal',
        validateOnly: false,
        watch: false,
        url: false,
        recursive: false,
        repl: false,
        progress: false,
        includeWarnings: true,
        includeComments: true
    };
    const files = [];
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (!arg)
            continue;
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
                options.format = (args[++i] || 'json');
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
                options.verbosity = (args[++i] || 'normal');
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
            case '--repl':
                options.repl = true;
                break;
            case '--progress':
                options.progress = true;
                break;
            // Week 5: Data Acquisition options
            case '--fetch':
                options.fetch = true;
                break;
            case '--source':
                options.source = (args[++i] || 'celestrak');
                break;
            case '--constellation':
                options.constellation = args[++i] || '';
                break;
            case '--catalog':
                options.catalog = args[++i] || '';
                break;
            case '--group':
                options.group = args[++i] || '';
                break;
            case '--list-constellations':
                options.listConstellations = true;
                break;
            case '--list-sources':
                options.listSources = true;
                break;
            case '--fresh':
                options.fresh = parseInt(args[++i] || '0', 10);
                break;
            case '--no-cache':
                options.noCache = true;
                break;
            case '--clear-cache':
                options.clearCache = true;
                break;
            case '--spacetrack-user':
                options.spacetrackUser = args[++i] || '';
                break;
            case '--spacetrack-pass':
                options.spacetrackPass = args[++i] || '';
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
async function readInput(source, isUrl = false) {
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
        if (!(0, fs_1.existsSync)(source)) {
            throw new Error(`File not found: ${source}`);
        }
        return (0, fs_1.readFileSync)(source, 'utf-8');
    }
    // Read from stdin
    return new Promise((resolve, reject) => {
        let data = '';
        process_1.stdin.setEncoding('utf-8');
        process_1.stdin.on('data', chunk => (data += chunk));
        process_1.stdin.on('end', () => resolve(data));
        process_1.stdin.on('error', reject);
    });
}
/**
 * Filter TLEs by pattern
 */
function filterTLEs(tles, pattern) {
    const regex = new RegExp(pattern, 'i');
    return tles.filter(tle => {
        return regex.test(tle.satelliteName || '') || regex.test(getSatelliteNumber(tle));
    });
}
/**
 * Compare two TLE datasets and show differences
 */
function diffTLEs(oldTles, newTles) {
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
    const modified = [];
    for (const [satNum, newTle] of newMap.entries()) {
        const oldTle = oldMap.get(satNum);
        if (oldTle) {
            // Check if any orbital parameters changed
            const changed = oldTle.inclination !== newTle.inclination ||
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
 * Start interactive REPL mode
 */
async function startREPL(options) {
    const rl = readline.createInterface({
        input: process_1.stdin,
        output: process_1.stdout,
        prompt: 'tle> '
    });
    console.log('TLE Parser REPL - Interactive Mode');
    console.log('Type "help" for available commands, "exit" to quit\n');
    let tleBuffer = [];
    let mode = 'command';
    rl.prompt();
    rl.on('line', async (line) => {
        const trimmed = line.trim();
        // Handle input mode (multi-line TLE entry)
        if (mode === 'input') {
            if (trimmed === '.end') {
                mode = 'command';
                const tleText = tleBuffer.join('\n');
                tleBuffer = [];
                try {
                    const tles = (0, index_1.parseBatch)(tleText, { validate: true });
                    if (tles.length === 0) {
                        console.log('No TLE data found');
                    }
                    else {
                        const outputOptions = {
                            format: options.format || 'json',
                            pretty: options.pretty !== undefined ? options.pretty : true,
                            colors: options.colors !== undefined ? options.colors : true,
                            verbosity: options.verbosity || 'normal',
                            includeWarnings: options.includeWarnings,
                            includeComments: options.includeComments
                        };
                        const result = tles.length === 1 ? tles[0] : tles;
                        console.log((0, outputFormats_1.formatTLE)(result, outputOptions));
                    }
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.error(`Error: ${error.message}`);
                    }
                }
            }
            else {
                tleBuffer.push(line);
            }
            rl.prompt();
            return;
        }
        // Handle command mode
        if (!trimmed) {
            rl.prompt();
            return;
        }
        const [cmd, ...args] = trimmed.split(/\s+/);
        switch (cmd?.toLowerCase()) {
            case 'help':
                console.log(`
Available commands:
  help                  Show this help message
  parse                 Enter TLE input mode (end with ".end" on new line)
  validate <tle>        Validate a single-line TLE command
  format <type>         Set output format: json, csv, xml, yaml, human, tle
  pretty [on|off]       Toggle pretty-printing
  colors [on|off]       Toggle colored output
  clear                 Clear the screen
  exit, quit            Exit REPL

Examples:
  > parse
  ISS (ZARYA)
  1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
  2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537
  .end

  > format human
  > pretty on
  > colors on
`);
                break;
            case 'parse':
                console.log('Enter TLE data (end with ".end" on a new line):');
                mode = 'input';
                break;
            case 'validate':
                if (args.length === 0) {
                    console.log('Usage: validate <tle-text>');
                }
                else {
                    const tleText = args.join(' ');
                    const result = (0, index_1.validateTLE)(tleText);
                    if (result.isValid) {
                        console.log('✓ Valid TLE');
                    }
                    else {
                        console.log('✗ Invalid TLE');
                        result.errors.forEach(e => {
                            const msg = typeof e === 'object' && 'message' in e ? e.message : String(e);
                            console.log(`  Error: ${msg}`);
                        });
                    }
                }
                break;
            case 'format':
                if (args.length === 0) {
                    console.log(`Current format: ${options.format}`);
                }
                else {
                    const newFormat = args[0]?.toLowerCase();
                    if (['json', 'csv', 'xml', 'yaml', 'human', 'tle'].includes(newFormat || '')) {
                        options.format = newFormat;
                        console.log(`Format set to: ${newFormat}`);
                    }
                    else {
                        console.log('Invalid format. Choose: json, csv, xml, yaml, human, tle');
                    }
                }
                break;
            case 'pretty':
                if (args.length === 0) {
                    options.pretty = !options.pretty;
                }
                else {
                    options.pretty = args[0]?.toLowerCase() === 'on';
                }
                console.log(`Pretty-printing: ${options.pretty ? 'on' : 'off'}`);
                break;
            case 'colors':
                if (args.length === 0) {
                    options.colors = !options.colors;
                }
                else {
                    options.colors = args[0]?.toLowerCase() === 'on';
                }
                console.log(`Colors: ${options.colors ? 'on' : 'off'}`);
                break;
            case 'clear':
                console.clear();
                break;
            case 'exit':
            case 'quit':
                console.log('Goodbye!');
                rl.close();
                return;
            default:
                console.log(`Unknown command: ${cmd}`);
                console.log('Type "help" for available commands');
                break;
        }
        rl.prompt();
    });
    rl.on('close', () => {
        console.log('\nGoodbye!');
        process.exit(0);
    });
}
/**
 * Process TLE file
 */
async function processFile(filePath, options, isUrl = false) {
    try {
        // Read input
        const data = await readInput(filePath, isUrl);
        // Validate only mode
        if (options.validateOnly) {
            const result = (0, index_1.validateTLE)(data);
            if (result.isValid) {
                console.log('✓ TLE validation passed');
                if (result.warnings.length > 0) {
                    console.log(`\nWarnings (${result.warnings.length}):`);
                    result.warnings.forEach(w => {
                        const msg = typeof w === 'object' && 'message' in w ? w.message : String(w);
                        console.log(`  ⚠ ${msg}`);
                    });
                }
            }
            else {
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
        let tles;
        let progressBar;
        try {
            // Count TLEs for progress indicator
            const lines = data.split('\n').filter(l => l.trim());
            const estimatedTLEs = Math.floor(lines.length / 3); // Rough estimate
            if (options.progress && estimatedTLEs > 10) {
                console.log(`Parsing ${estimatedTLEs} TLEs...`);
                progressBar = new ProgressBar(estimatedTLEs);
            }
            tles = (0, index_1.parseBatch)(data, { validate: true });
            if (progressBar) {
                progressBar.complete();
            }
        }
        catch (error) {
            // If batch parsing fails, try single TLE
            tles = [(0, index_1.parseTLE)(data, { validate: true })];
            if (progressBar) {
                progressBar.complete();
            }
        }
        // Apply filter if specified
        if (options.filter) {
            tles = filterTLEs(tles, options.filter);
        }
        // Format output
        const outputOptions = {
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
        const output = (0, outputFormats_1.formatTLE)(result, outputOptions);
        // Write output
        if (options.output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(options.output, output, 'utf-8');
            console.log(`Output written to: ${options.output}`);
        }
        else {
            console.log(output);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Unknown error occurred');
        }
        process.exit(1);
    }
}
/**
 * Process directory recursively
 */
async function processDirectory(dirPath, options) {
    const entries = await (0, promises_1.readdir)(dirPath, { withFileTypes: true });
    const tleExtensions = ['.tle', '.txt', '.text'];
    for (const entry of entries) {
        const fullPath = (0, path_1.join)(dirPath, entry.name);
        if (entry.isDirectory() && options.recursive) {
            await processDirectory(fullPath, options);
        }
        else if (entry.isFile() && tleExtensions.includes((0, path_1.extname)(entry.name).toLowerCase())) {
            console.log(`\nProcessing: ${fullPath}`);
            await processFile(fullPath, options);
        }
    }
}
/**
 * Watch file for changes
 */
async function watchFile(filePath, options) {
    console.log(`Watching ${filePath} for changes... (Press Ctrl+C to stop)`);
    (0, fs_1.watch)(filePath, async (eventType) => {
        if (eventType === 'change') {
            console.log(`\n[${new Date().toISOString()}] File changed, reprocessing...`);
            await processFile(filePath, options);
        }
    });
    // Keep process running
    await new Promise(() => { });
}
/**
 * Compare two TLE files
 */
async function compareFiles(file1, file2) {
    if (!file1 || !file2) {
        console.error('Error: Both file paths are required for comparison');
        process.exit(1);
    }
    try {
        const data1 = await readInput(file1);
        const data2 = await readInput(file2);
        let tles1;
        let tles2;
        try {
            tles1 = (0, index_1.parseBatch)(data1, { validate: false });
        }
        catch {
            tles1 = [(0, index_1.parseTLE)(data1, { validate: false })];
        }
        try {
            tles2 = (0, index_1.parseBatch)(data2, { validate: false });
        }
        catch {
            tles2 = [(0, index_1.parseTLE)(data2, { validate: false })];
        }
        diffTLEs(tles1, tles2);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}
/**
 * Fetch TLE data from online sources (Week 5)
 */
async function fetchTLEData(options) {
    // Determine source
    const sourceName = options.source || 'celestrak';
    // Create source manager
    const manager = new dataSources_1.DataSourceManager();
    // Register sources
    const celestrak = new dataSources_1.CelesTrakSource({
        enableCache: !options.noCache
    });
    manager.register('celestrak', celestrak, { primary: true, failover: true });
    const amsat = new dataSources_1.AMSATSource({
        enableCache: !options.noCache
    });
    manager.register('amsat', amsat, { failover: true });
    // Register Space-Track if credentials provided
    if (options.spacetrackUser && options.spacetrackPass) {
        const spacetrack = new dataSources_1.SpaceTrackSource({
            credentials: {
                username: options.spacetrackUser,
                password: options.spacetrackPass
            },
            enableCache: !options.noCache
        });
        manager.register('spacetrack', spacetrack, { failover: true });
    }
    // Clear cache if requested
    if (options.clearCache) {
        manager.clearAllCaches();
        console.log('Cache cleared');
    }
    // Build fetch options
    const fetchOptions = {
        forceRefresh: options.noCache
    };
    if (options.catalog) {
        const numbers = options.catalog.split(',').map(n => parseInt(n.trim(), 10));
        fetchOptions.catalogNumber = numbers.length === 1 ? numbers[0] : numbers;
    }
    if (options.group) {
        fetchOptions.group = options.group;
    }
    if (options.constellation) {
        // Create constellation filter
        const constellationFilter = (0, constellations_1.createConstellationFilter)(options.constellation);
        if (!constellationFilter) {
            console.error(`Error: Unknown constellation: ${options.constellation}`);
            console.error(`Use --list-constellations to see available constellations`);
            process.exit(1);
        }
        fetchOptions.parseOptions = {
            filter: constellationFilter
        };
    }
    // Fetch data
    console.log(`Fetching TLE data from ${sourceName}...`);
    const result = await manager.fetch(sourceName, fetchOptions);
    console.log(`Fetched ${result.count} TLEs from ${result.source} (${result.cached ? 'cached' : 'fresh'})`);
    let data = result.data;
    // Apply constellation filter if not already applied
    if (options.constellation && !fetchOptions.parseOptions) {
        data = (0, constellations_1.filterByConstellation)(data, options.constellation);
        console.log(`Filtered to ${data.length} TLEs for constellation: ${options.constellation}`);
    }
    // Apply freshness filter
    if (options.fresh && options.fresh > 0) {
        const maxAgeMs = options.fresh * 24 * 60 * 60 * 1000; // Convert days to ms
        const freshData = data.filter(tle => {
            const validation = (0, dataSources_1.validateFreshness)(tle, maxAgeMs);
            return validation.isFresh;
        });
        console.log(`Filtered to ${freshData.length} fresh TLEs (last ${options.fresh} days)`);
        data = freshData;
    }
    return data;
}
// ============================================================================
// MAIN
// ============================================================================
/**
 * Main CLI entry point
 */
async function main() {
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
    // Handle list constellations (Week 5)
    if (options.listConstellations) {
        const constellations = (0, constellations_1.listConstellations)();
        console.log('Available constellations:');
        for (const name of constellations) {
            console.log(`  - ${name}`);
        }
        return;
    }
    // Handle list sources (Week 5)
    if (options.listSources) {
        console.log('Available data sources:');
        console.log('  - celestrak    : CelesTrak (public, no auth)');
        console.log('  - spacetrack   : Space-Track.org (requires auth)');
        console.log('  - amsat        : AMSAT amateur radio satellites');
        console.log('  - custom       : Custom URL source');
        return;
    }
    // Handle fetch mode (Week 5)
    if (options.fetch) {
        const tles = await fetchTLEData(options);
        // Format and output
        const outputOptions = {
            format: options.format || 'json',
            pretty: options.pretty,
            colors: options.colors,
            verbosity: options.verbosity
        };
        const output = (0, outputFormats_1.formatTLE)(tles, outputOptions);
        if (options.output) {
            const { writeFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await writeFile(options.output, output, 'utf-8');
            console.log(`Output written to: ${options.output}`);
        }
        else {
            console.log(output);
        }
        return;
    }
    // Handle REPL mode
    if (options.repl) {
        await startREPL(options);
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
    const isStdin = !inputFile && !process_1.stdin.isTTY;
    if (!inputFile && !isStdin) {
        console.error('Error: No input file specified and stdin is empty');
        console.error('Run "tle-parser --help" for usage information');
        process.exit(1);
    }
    // Handle recursive directory processing
    if (options.recursive && inputFile) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
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
        await watchFile(inputFile, options);
        return;
    }
    // Process single file or stdin
    await processFile(inputFile, options, options.url);
}
// Run CLI when executed directly
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map