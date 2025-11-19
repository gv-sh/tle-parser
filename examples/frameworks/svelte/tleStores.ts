/**
 * Svelte Stores for TLE Parser
 *
 * This module provides Svelte stores for reactive TLE data management.
 * Compatible with Svelte 3+ and SvelteKit.
 *
 * @example
 * ```svelte
 * <script>
 * import { tleParser, satelliteTracker } from './tleStores';
 *
 * $: data = $tleParser.data;
 * </script>
 * ```
 */

import { writable, derived, readable, get, type Readable, type Writable } from 'svelte/store';
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

export interface TLEParserState {
  data: ParsedTLE | null;
  loading: boolean;
  error: Error | null;
}

export interface SatelliteTrackerState {
  position: SatellitePosition | null;
  lookAngles: LookAngles | null;
  isVisible: boolean;
  isTracking: boolean;
  error: Error | null;
}

// ============================================================================
// TLE Parser Store
// ============================================================================

export function createTLEParser() {
  const { subscribe, set, update } = writable<TLEParserState>({
    data: null,
    loading: false,
    error: null
  });

  return {
    subscribe,
    parse: (line1: string, line2: string, line0?: string, options?: TLEParseOptions) => {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const parsed = parseTLE(line1, line2, line0, options);
        set({ data: parsed, loading: false, error: null });
      } catch (error) {
        set({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    },
    reset: () => {
      set({ data: null, loading: false, error: null });
    }
  };
}

// ============================================================================
// Satellite Tracker Store
// ============================================================================

export function createSatelliteTracker(
  tle: ParsedTLE | null,
  groundLocation?: GroundLocation,
  updateInterval: number = 1000
) {
  const { subscribe, set, update } = writable<SatelliteTrackerState>({
    position: null,
    lookAngles: null,
    isVisible: false,
    isTracking: false,
    error: null
  });

  let intervalId: NodeJS.Timeout | null = null;

  const updatePosition = () => {
    if (!tle) return;

    try {
      const now = new Date();
      const position = calculatePosition(tle, now);

      let lookAngles: LookAngles | null = null;
      let isVisible = false;

      if (groundLocation) {
        lookAngles = calculateLookAngles(tle, groundLocation, now);
        isVisible = lookAngles.elevation > 0;
      }

      update(state => ({
        ...state,
        position,
        lookAngles,
        isVisible,
        error: null
      }));
    } catch (error) {
      update(state => ({
        ...state,
        error: error instanceof Error ? error : new Error(String(error))
      }));
    }
  };

  return {
    subscribe,
    start: () => {
      update(state => ({ ...state, isTracking: true }));
      updatePosition();
      intervalId = setInterval(updatePosition, updateInterval);
    },
    stop: () => {
      update(state => ({ ...state, isTracking: false }));
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    destroy: () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  };
}

// ============================================================================
// TLE Fetch Store
// ============================================================================

export function createTLEFetcher(source: string, query: Record<string, any>) {
  const { subscribe, set } = writable<{
    data: ParsedTLE[] | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null
  });

  const fetch = async () => {
    set({ data: null, loading: true, error: null });

    try {
      const result = await fetchTLEData(source, query);
      set({ data: result, loading: false, error: null });
    } catch (error) {
      set({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  };

  fetch();

  return {
    subscribe,
    refetch: fetch
  };
}

// ============================================================================
// TLE Cache Store
// ============================================================================

export function createTLECache(options?: { ttl?: number }) {
  const cache = new TLECache(options);

  return {
    get: (key: string) => cache.get(key),
    set: (key: string, value: ParsedTLE) => cache.set(key, value),
    clear: () => cache.clear(),
    has: (key: string) => cache.has(key)
  };
}

// ============================================================================
// Visibility Window Store
// ============================================================================

export function createVisibilityWindow(
  tle: ParsedTLE | null,
  groundLocation: GroundLocation,
  startDate: Date = new Date(),
  days: number = 7
) {
  const { subscribe, set } = writable<{
    windows: VisibilityWindow[];
    loading: boolean;
    error: Error | null;
  }>({
    windows: [],
    loading: false,
    error: null
  });

  const calculate = () => {
    if (!tle) {
      set({
        windows: [],
        loading: false,
        error: new Error('No TLE data provided')
      });
      return;
    }

    set({ windows: [], loading: true, error: null });

    try {
      const windows = calculateVisibilityWindow(tle, groundLocation, startDate, days);
      set({ windows, loading: false, error: null });
    } catch (error) {
      set({
        windows: [],
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  };

  calculate();

  return {
    subscribe,
    recalculate: calculate
  };
}

// ============================================================================
// Export singleton instances (optional)
// ============================================================================

export const tleParser = createTLEParser();
export const tleCache = createTLECache({ ttl: 3600000 });
