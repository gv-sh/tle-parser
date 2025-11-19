/**
 * React Hooks for TLE Parser
 *
 * This module provides React hooks for working with TLE data in React applications.
 * Includes hooks for parsing, tracking satellites, calculating positions, and more.
 *
 * @example
 * ```tsx
 * import { useTLEParser, useSatellitePosition } from './useTLE';
 *
 * function MyComponent() {
 *   const { parse, data, error, loading } = useTLEParser();
 *
 *   useEffect(() => {
 *     parse(tleLine1, tleLine2);
 *   }, []);
 *
 *   return <div>{data?.satelliteName}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  parseTLE,
  ParsedTLE,
  TLEParseOptions,
  calculatePosition,
  calculateVisibilityWindow,
  calculateLookAngles,
  fetchTLEData,
  TLECache,
  SatellitePosition,
  VisibilityWindow,
  LookAngles,
  GroundLocation
} from 'tle-parser';

// ============================================================================
// Types
// ============================================================================

export interface UseTLEParserResult {
  /** The parsed TLE data */
  data: ParsedTLE | null;
  /** Any error that occurred during parsing */
  error: Error | null;
  /** Whether parsing is in progress */
  loading: boolean;
  /** Function to parse TLE data */
  parse: (line1: string, line2: string, line0?: string, options?: TLEParseOptions) => void;
  /** Reset the parser state */
  reset: () => void;
}

export interface UseSatellitePositionResult {
  /** Current satellite position */
  position: SatellitePosition | null;
  /** Whether calculation is in progress */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Update the position for a specific date */
  updatePosition: (date?: Date) => void;
}

export interface UseVisibilityWindowResult {
  /** Visibility windows */
  windows: VisibilityWindow[];
  /** Whether calculation is in progress */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Recalculate visibility windows */
  recalculate: () => void;
}

export interface UseTLEFetchResult {
  /** Fetched TLE data */
  data: ParsedTLE[] | null;
  /** Whether fetching is in progress */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch the data */
  refetch: () => void;
}

export interface UseSatelliteTrackerOptions {
  /** Update interval in milliseconds (default: 1000) */
  updateInterval?: number;
  /** Whether to auto-start tracking (default: true) */
  autoStart?: boolean;
  /** Ground location for visibility calculations */
  groundLocation?: GroundLocation;
}

export interface UseSatelliteTrackerResult {
  /** Current satellite position */
  position: SatellitePosition | null;
  /** Look angles from ground location (if provided) */
  lookAngles: LookAngles | null;
  /** Whether the satellite is visible */
  isVisible: boolean;
  /** Whether tracking is active */
  isTracking: boolean;
  /** Start tracking */
  start: () => void;
  /** Stop tracking */
  stop: () => void;
  /** Any error that occurred */
  error: Error | null;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for parsing TLE data
 *
 * @example
 * ```tsx
 * const { parse, data, error, loading } = useTLEParser();
 *
 * const handleParse = () => {
 *   parse(line1, line2, satelliteName);
 * };
 * ```
 */
export function useTLEParser(): UseTLEParserResult {
  const [data, setData] = useState<ParsedTLE | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const parse = useCallback((
    line1: string,
    line2: string,
    line0?: string,
    options?: TLEParseOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const parsed = parseTLE(line1, line2, line0, options);
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, parse, reset };
}

/**
 * Hook for calculating satellite position at a specific time
 *
 * @param tle - Parsed TLE data
 * @param date - Date for position calculation (default: now)
 *
 * @example
 * ```tsx
 * const { position, loading, error, updatePosition } = useSatellitePosition(tleData);
 *
 * // Update position for a specific date
 * updatePosition(new Date('2024-01-01'));
 * ```
 */
export function useSatellitePosition(
  tle: ParsedTLE | null,
  date?: Date
): UseSatellitePositionResult {
  const [position, setPosition] = useState<SatellitePosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePosition = useCallback((newDate?: Date) => {
    if (!tle) {
      setError(new Error('No TLE data provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pos = calculatePosition(tle, newDate || new Date());
      setPosition(pos);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setPosition(null);
    } finally {
      setLoading(false);
    }
  }, [tle]);

  useEffect(() => {
    updatePosition(date);
  }, [tle, date, updatePosition]);

  return { position, loading, error, updatePosition };
}

/**
 * Hook for real-time satellite tracking with automatic updates
 *
 * @param tle - Parsed TLE data
 * @param options - Tracker options
 *
 * @example
 * ```tsx
 * const { position, isVisible, isTracking, start, stop } = useSatelliteTracker(
 *   tleData,
 *   {
 *     updateInterval: 1000,
 *     groundLocation: { latitude: 40.7128, longitude: -74.0060, altitude: 0 }
 *   }
 * );
 * ```
 */
export function useSatelliteTracker(
  tle: ParsedTLE | null,
  options: UseSatelliteTrackerOptions = {}
): UseSatelliteTrackerResult {
  const {
    updateInterval = 1000,
    autoStart = true,
    groundLocation
  } = options;

  const [position, setPosition] = useState<SatellitePosition | null>(null);
  const [lookAngles, setLookAngles] = useState<LookAngles | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTracking, setIsTracking] = useState(autoStart);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTracking = useCallback(() => {
    if (!tle) return;

    try {
      const now = new Date();
      const pos = calculatePosition(tle, now);
      setPosition(pos);

      if (groundLocation) {
        const angles = calculateLookAngles(tle, groundLocation, now);
        setLookAngles(angles);
        setIsVisible(angles.elevation > 0);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [tle, groundLocation]);

  const start = useCallback(() => {
    setIsTracking(true);
  }, []);

  const stop = useCallback(() => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isTracking && tle) {
      updateTracking(); // Initial update
      intervalRef.current = setInterval(updateTracking, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, tle, updateInterval, updateTracking]);

  return {
    position,
    lookAngles,
    isVisible,
    isTracking,
    start,
    stop,
    error
  };
}

/**
 * Hook for calculating satellite visibility windows
 *
 * @param tle - Parsed TLE data
 * @param groundLocation - Observer's location
 * @param options - Calculation options
 *
 * @example
 * ```tsx
 * const { windows, loading, error } = useVisibilityWindow(
 *   tleData,
 *   { latitude: 40.7128, longitude: -74.0060, altitude: 0 },
 *   { startDate: new Date(), days: 7 }
 * );
 * ```
 */
export function useVisibilityWindow(
  tle: ParsedTLE | null,
  groundLocation: GroundLocation,
  options: { startDate?: Date; days?: number } = {}
): UseVisibilityWindowResult {
  const [windows, setWindows] = useState<VisibilityWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const recalculate = useCallback(() => {
    if (!tle) {
      setError(new Error('No TLE data provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const visibilityWindows = calculateVisibilityWindow(
        tle,
        groundLocation,
        options.startDate || new Date(),
        options.days || 7
      );
      setWindows(visibilityWindows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setWindows([]);
    } finally {
      setLoading(false);
    }
  }, [tle, groundLocation, options.startDate, options.days]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  return { windows, loading, error, recalculate };
}

/**
 * Hook for fetching TLE data from various sources
 *
 * @param source - Data source (e.g., 'celestrak', 'spacetrack')
 * @param query - Query parameters
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useTLEFetch('celestrak', {
 *   group: 'stations',
 *   satellites: ['ISS']
 * });
 * ```
 */
export function useTLEFetch(
  source: string,
  query: Record<string, any>
): UseTLEFetchResult {
  const [data, setData] = useState<ParsedTLE[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchTLEData(source, query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [source, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for managing TLE cache
 *
 * @param cacheOptions - Cache configuration options
 *
 * @example
 * ```tsx
 * const cache = useTLECache({ ttl: 3600000 }); // 1 hour TTL
 *
 * const cachedData = cache.get('ISS');
 * cache.set('ISS', tleData);
 * ```
 */
export function useTLECache(cacheOptions?: { ttl?: number }) {
  const cache = useMemo(() => new TLECache(cacheOptions), [cacheOptions?.ttl]);

  return cache;
}

/**
 * Hook for batch parsing multiple TLEs
 *
 * @example
 * ```tsx
 * const { parse, data, errors, loading } = useBatchTLEParser();
 *
 * const handleBatchParse = () => {
 *   parse(tleArray);
 * };
 * ```
 */
export function useBatchTLEParser() {
  const [data, setData] = useState<ParsedTLE[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const [loading, setLoading] = useState(false);

  const parse = useCallback((tles: Array<{ line1: string; line2: string; line0?: string }>) => {
    setLoading(true);
    setErrors([]);
    const results: ParsedTLE[] = [];
    const parseErrors: Error[] = [];

    try {
      tles.forEach((tle) => {
        try {
          const parsed = parseTLE(tle.line1, tle.line2, tle.line0);
          results.push(parsed);
        } catch (err) {
          parseErrors.push(err instanceof Error ? err : new Error(String(err)));
        }
      });

      setData(results);
      setErrors(parseErrors);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, errors, loading, parse };
}

/**
 * Hook for debounced TLE parsing
 * Useful for parsing user input without triggering on every keystroke
 *
 * @param delay - Debounce delay in milliseconds (default: 500)
 *
 * @example
 * ```tsx
 * const { parse, data, error, loading } = useDebouncedTLEParser(500);
 *
 * // Will only parse after 500ms of no changes
 * onChange={(e) => parse(line1, e.target.value)}
 * ```
 */
export function useDebouncedTLEParser(delay: number = 500): UseTLEParserResult {
  const [data, setData] = useState<ParsedTLE | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parse = useCallback((
    line1: string,
    line2: string,
    line0?: string,
    options?: TLEParseOptions
  ) => {
    setLoading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const parsed = parseTLE(line1, line2, line0, options);
        setData(parsed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        setLoading(false);
      }
    }, delay);
  }, [delay]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { data, error, loading, parse, reset };
}
