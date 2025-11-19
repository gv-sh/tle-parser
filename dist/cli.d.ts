/**
 * TLE Parser CLI
 * Command-line interface for parsing, validating, and converting TLE data
 */
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
    repl?: boolean;
    progress?: boolean;
    help?: boolean;
    version?: boolean;
}
/**
 * Print help message
 */
declare function printHelp(): void;
/**
 * Print version
 */
declare function printVersion(): void;
/**
 * Parse command-line arguments
 */
declare function parseArgs(args: string[]): {
    options: CLIOptions;
    files: string[];
};
/**
 * Main CLI entry point
 */
declare function main(): Promise<void>;
export { main, parseArgs, printHelp, printVersion };
//# sourceMappingURL=cli.d.ts.map