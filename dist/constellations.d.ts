/**
 * Constellation Definitions and Filters
 * Provides pre-defined satellite constellation groups and filtering
 */
import type { ParsedTLE } from './types';
import type { TLEFilter } from './advancedParser';
/**
 * Constellation definition
 */
export interface Constellation {
    /** Constellation name */
    name: string;
    /** Description */
    description: string;
    /** Catalog number ranges or specific numbers */
    catalogNumbers?: Array<number | [number, number]>;
    /** Name patterns (regex or substring) */
    namePatterns?: RegExp[];
    /** International designator patterns */
    intlDesignatorPatterns?: RegExp[];
    /** Custom filter function */
    customFilter?: (tle: ParsedTLE) => boolean;
}
/**
 * Pre-defined constellations
 */
export declare const CONSTELLATIONS: Record<string, Constellation>;
/**
 * Get constellation by name
 */
export declare function getConstellation(name: string): Constellation | undefined;
/**
 * List all available constellations
 */
export declare function listConstellations(): string[];
/**
 * Create a TLE filter for a constellation
 */
export declare function createConstellationFilter(constellationName: string): TLEFilter | undefined;
/**
 * Check if a TLE matches a constellation
 */
export declare function matchesConstellation(tle: ParsedTLE, constellationName: string): boolean;
/**
 * Filter TLEs by constellation
 */
export declare function filterByConstellation(tles: ParsedTLE[], constellationName: string): ParsedTLE[];
/**
 * Group TLEs by constellation
 */
export declare function groupByConstellation(tles: ParsedTLE[]): Map<string, ParsedTLE[]>;
//# sourceMappingURL=constellations.d.ts.map