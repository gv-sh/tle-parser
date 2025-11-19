/**
 * Vue 3 Composition API Composables for TLE Parser
 *
 * This module provides Vue 3 composables for working with TLE data.
 * Compatible with Vue 3's Composition API and <script setup> syntax.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTLEParser } from './useTLE';
 *
 * const { parse, data, error, loading } = useTLEParser();
 *
 * const handleParse = () => {
 *   parse(line1.value, line2.value);
 * };
 * </script>
 * ```
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue';
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

export interface UseTLEParserReturn {
  /** The parsed TLE data */
  data: Ref<ParsedTLE | null>;
  /** Any error that occurred during parsing */
  error: Ref<Error | null>;
  /** Whether parsing is in progress */
  loading: Ref<boolean>;
  /** Function to parse TLE data */
  parse: (line1: string, line2: string, line0?: string, options?: TLEParseOptions) => void;
  /** Reset the parser state */
  reset: () => void;
}

export interface UseSatellitePositionReturn {
  /** Current satellite position */
  position: Ref<SatellitePosition | null>;
  /** Whether calculation is in progress */
  loading: Ref<boolean>;
  /** Any error that occurred */
  error: Ref<Error | null>;
  /** Update the position for a specific date */
  updatePosition: (date?: Date) => void;
}

export interface UseSatelliteTrackerOptions {
  /** Update interval in milliseconds (default: 1000) */
  updateInterval?: number;
  /** Whether to auto-start tracking (default: true) */
  autoStart?: boolean;
  /** Ground location for visibility calculations */
  groundLocation?: Ref<GroundLocation | null> | GroundLocation;
}

export interface UseSatelliteTrackerReturn {
  /** Current satellite position */
  position: Ref<SatellitePosition | null>;
  /** Look angles from ground location (if provided) */
  lookAngles: Ref<LookAngles | null>;
  /** Whether the satellite is visible */
  isVisible: ComputedRef<boolean>;
  /** Whether tracking is active */
  isTracking: Ref<boolean>;
  /** Start tracking */
  start: () => void;
  /** Stop tracking */
  stop: () => void;
  /** Any error that occurred */
  error: Ref<Error | null>;
}

export interface UseVisibilityWindowReturn {
  /** Visibility windows */
  windows: Ref<VisibilityWindow[]>;
  /** Whether calculation is in progress */
  loading: Ref<boolean>;
  /** Any error that occurred */
  error: Ref<Error | null>;
  /** Recalculate visibility windows */
  recalculate: () => void;
}

export interface UseTLEFetchReturn {
  /** Fetched TLE data */
  data: Ref<ParsedTLE[] | null>;
  /** Whether fetching is in progress */
  loading: Ref<boolean>;
  /** Any error that occurred */
  error: Ref<Error | null>;
  /** Refetch the data */
  refetch: () => Promise<void>;
}

// ============================================================================
// Composables
// ============================================================================

/**
 * Composable for parsing TLE data
 *
 * @example
 * ```vue
 * <script setup>
 * const { parse, data, error, loading } = useTLEParser();
 *
 * const handleParse = () => {
 *   parse(line1.value, line2.value, satelliteName.value);
 * };
 * </script>
 * ```
 */
export function useTLEParser(): UseTLEParserReturn {
  const data = ref<ParsedTLE | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  const parse = (
    line1: string,
    line2: string,
    line0?: string,
    options?: TLEParseOptions
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const parsed = parseTLE(line1, line2, line0, options);
      data.value = parsed;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      data.value = null;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = null;
    error.value = null;
    loading.value = false;
  };

  return { data, error, loading, parse, reset };
}

/**
 * Composable for calculating satellite position at a specific time
 *
 * @param tle - Parsed TLE data (reactive)
 * @param date - Date for position calculation (reactive, default: now)
 *
 * @example
 * ```vue
 * <script setup>
 * const tleData = ref(null);
 * const { position, loading, error } = useSatellitePosition(tleData);
 * </script>
 * ```
 */
export function useSatellitePosition(
  tle: Ref<ParsedTLE | null>,
  date?: Ref<Date | undefined>
): UseSatellitePositionReturn {
  const position = ref<SatellitePosition | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const updatePosition = (newDate?: Date) => {
    if (!tle.value) {
      error.value = new Error('No TLE data provided');
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const pos = calculatePosition(tle.value, newDate || new Date());
      position.value = pos;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      position.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Watch for changes in TLE or date
  watch([tle, date || ref(undefined)], () => {
    updatePosition(date?.value);
  }, { immediate: true });

  return { position, loading, error, updatePosition };
}

/**
 * Composable for real-time satellite tracking with automatic updates
 *
 * @param tle - Parsed TLE data (reactive)
 * @param options - Tracker options
 *
 * @example
 * ```vue
 * <script setup>
 * const tleData = ref(null);
 * const groundLocation = ref({ latitude: 40.7128, longitude: -74.0060, altitude: 0 });
 *
 * const { position, isVisible, isTracking, start, stop } = useSatelliteTracker(
 *   tleData,
 *   { updateInterval: 1000, groundLocation }
 * );
 * </script>
 * ```
 */
export function useSatelliteTracker(
  tle: Ref<ParsedTLE | null>,
  options: UseSatelliteTrackerOptions = {}
): UseSatelliteTrackerReturn {
  const {
    updateInterval = 1000,
    autoStart = true,
    groundLocation
  } = options;

  const position = ref<SatellitePosition | null>(null);
  const lookAngles = ref<LookAngles | null>(null);
  const isTracking = ref(autoStart);
  const error = ref<Error | null>(null);

  const isVisible = computed(() => {
    return lookAngles.value !== null && lookAngles.value.elevation > 0;
  });

  let intervalId: NodeJS.Timeout | null = null;

  const updateTracking = () => {
    if (!tle.value) return;

    try {
      const now = new Date();
      const pos = calculatePosition(tle.value, now);
      position.value = pos;

      const location = 'value' in (groundLocation || {})
        ? (groundLocation as Ref<GroundLocation | null>).value
        : (groundLocation as GroundLocation | undefined);

      if (location) {
        const angles = calculateLookAngles(tle.value, location, now);
        lookAngles.value = angles;
      }

      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    }
  };

  const start = () => {
    isTracking.value = true;
  };

  const stop = () => {
    isTracking.value = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Watch for tracking state changes
  watch(isTracking, (tracking) => {
    if (tracking && tle.value) {
      updateTracking(); // Initial update
      intervalId = setInterval(updateTracking, updateInterval);
    } else if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }, { immediate: true });

  // Watch for TLE changes
  watch(tle, () => {
    if (isTracking.value) {
      updateTracking();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

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
 * Composable for calculating satellite visibility windows
 *
 * @param tle - Parsed TLE data (reactive)
 * @param groundLocation - Observer's location (reactive)
 * @param options - Calculation options (reactive)
 *
 * @example
 * ```vue
 * <script setup>
 * const tleData = ref(null);
 * const location = ref({ latitude: 40.7128, longitude: -74.0060, altitude: 0 });
 * const { windows, loading, error } = useVisibilityWindow(tleData, location);
 * </script>
 * ```
 */
export function useVisibilityWindow(
  tle: Ref<ParsedTLE | null>,
  groundLocation: Ref<GroundLocation>,
  options: Ref<{ startDate?: Date; days?: number }> = ref({})
): UseVisibilityWindowReturn {
  const windows = ref<VisibilityWindow[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const recalculate = () => {
    if (!tle.value) {
      error.value = new Error('No TLE data provided');
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const visibilityWindows = calculateVisibilityWindow(
        tle.value,
        groundLocation.value,
        options.value.startDate || new Date(),
        options.value.days || 7
      );
      windows.value = visibilityWindows;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      windows.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Watch for changes
  watch([tle, groundLocation, options], recalculate, { immediate: true, deep: true });

  return { windows, loading, error, recalculate };
}

/**
 * Composable for fetching TLE data from various sources
 *
 * @param source - Data source (reactive)
 * @param query - Query parameters (reactive)
 *
 * @example
 * ```vue
 * <script setup>
 * const source = ref('celestrak');
 * const query = ref({ group: 'stations', satellites: ['ISS'] });
 * const { data, loading, error, refetch } = useTLEFetch(source, query);
 * </script>
 * ```
 */
export function useTLEFetch(
  source: Ref<string>,
  query: Ref<Record<string, any>>
): UseTLEFetchReturn {
  const data = ref<ParsedTLE[] | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchData = async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchTLEData(source.value, query.value);
      data.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      data.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Watch for changes
  watch([source, query], fetchData, { immediate: true, deep: true });

  return { data, loading, error, refetch: fetchData };
}

/**
 * Composable for managing TLE cache
 *
 * @param cacheOptions - Cache configuration options
 *
 * @example
 * ```vue
 * <script setup>
 * const cache = useTLECache({ ttl: 3600000 }); // 1 hour TTL
 * const cachedData = cache.value.get('ISS');
 * </script>
 * ```
 */
export function useTLECache(cacheOptions?: { ttl?: number }): Ref<TLECache> {
  const cache = ref(new TLECache(cacheOptions));
  return cache;
}

/**
 * Composable for batch parsing multiple TLEs
 *
 * @example
 * ```vue
 * <script setup>
 * const { parse, data, errors, loading } = useBatchTLEParser();
 *
 * const handleBatchParse = () => {
 *   parse(tleArray.value);
 * };
 * </script>
 * ```
 */
export function useBatchTLEParser() {
  const data = ref<ParsedTLE[]>([]);
  const errors = ref<Error[]>([]);
  const loading = ref(false);

  const parse = (tles: Array<{ line1: string; line2: string; line0?: string }>) => {
    loading.value = true;
    errors.value = [];
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

      data.value = results;
      errors.value = parseErrors;
    } finally {
      loading.value = false;
    }
  };

  return { data, errors, loading, parse };
}

/**
 * Composable for debounced TLE parsing
 * Useful for parsing user input without triggering on every keystroke
 *
 * @param delay - Debounce delay in milliseconds (default: 500)
 *
 * @example
 * ```vue
 * <script setup>
 * const { parse, data, error, loading } = useDebouncedTLEParser(500);
 *
 * const handleInput = (value) => {
 *   parse(line1.value, value);
 * };
 * </script>
 * ```
 */
export function useDebouncedTLEParser(delay: number = 500): UseTLEParserReturn {
  const data = ref<ParsedTLE | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);
  let timeoutId: NodeJS.Timeout | null = null;

  const parse = (
    line1: string,
    line2: string,
    line0?: string,
    options?: TLEParseOptions
  ) => {
    loading.value = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      try {
        const parsed = parseTLE(line1, line2, line0, options);
        data.value = parsed;
        error.value = null;
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err));
        data.value = null;
      } finally {
        loading.value = false;
      }
    }, delay);
  };

  const reset = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    data.value = null;
    error.value = null;
    loading.value = false;
  };

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return { data, error, loading, parse, reset };
}

/**
 * Composable for reactive TLE parsing from refs
 * Automatically re-parses when inputs change
 *
 * @param line1 - TLE line 1 (reactive)
 * @param line2 - TLE line 2 (reactive)
 * @param line0 - Satellite name (reactive, optional)
 * @param options - Parse options (reactive, optional)
 *
 * @example
 * ```vue
 * <script setup>
 * const line1 = ref('...');
 * const line2 = ref('...');
 * const { data, error, loading } = useReactiveTLEParser(line1, line2);
 * </script>
 * ```
 */
export function useReactiveTLEParser(
  line1: Ref<string>,
  line2: Ref<string>,
  line0?: Ref<string | undefined>,
  options?: Ref<TLEParseOptions | undefined>
) {
  const data = ref<ParsedTLE | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  watch([line1, line2, line0 || ref(undefined), options || ref(undefined)], () => {
    if (!line1.value || !line2.value) {
      data.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const parsed = parseTLE(
        line1.value,
        line2.value,
        line0?.value,
        options?.value
      );
      data.value = parsed;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      data.value = null;
    } finally {
      loading.value = false;
    }
  }, { immediate: true });

  return { data, error, loading };
}
