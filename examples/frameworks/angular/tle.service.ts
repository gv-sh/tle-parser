/**
 * Angular Service for TLE Parser
 *
 * This service provides Angular integration for TLE parsing and satellite tracking.
 * Can be used with dependency injection throughout your Angular application.
 *
 * @example
 * ```typescript
 * import { TLEService } from './tle.service';
 *
 * @Component({...})
 * export class MyComponent {
 *   constructor(private tleService: TLEService) {}
 *
 *   parseTLE() {
 *     this.tleService.parse(line1, line2).subscribe(data => {
 *       console.log(data);
 *     });
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, interval, of, from, Subject } from 'rxjs';
import {
  map,
  catchError,
  switchMap,
  tap,
  takeUntil,
  shareReplay,
  distinctUntilChanged
} from 'rxjs/operators';
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

export interface TLEState {
  data: ParsedTLE | null;
  loading: boolean;
  error: Error | null;
}

export interface SatelliteTrackingState {
  position: SatellitePosition | null;
  lookAngles: LookAngles | null;
  isVisible: boolean;
  isTracking: boolean;
  error: Error | null;
}

@Injectable({
  providedIn: 'root'
})
export class TLEService {
  private cache: TLECache;
  private tleState$ = new BehaviorSubject<TLEState>({
    data: null,
    loading: false,
    error: null
  });

  constructor() {
    this.cache = new TLECache({ ttl: 3600000 }); // 1 hour TTL
  }

  /**
   * Get the current TLE state as an observable
   */
  getTLEState(): Observable<TLEState> {
    return this.tleState$.asObservable();
  }

  /**
   * Parse TLE data
   *
   * @param line1 - TLE line 1
   * @param line2 - TLE line 2
   * @param line0 - Satellite name (optional)
   * @param options - Parse options (optional)
   * @returns Observable of parsed TLE data
   */
  parse(
    line1: string,
    line2: string,
    line0?: string,
    options?: TLEParseOptions
  ): Observable<ParsedTLE> {
    this.tleState$.next({ data: null, loading: true, error: null });

    try {
      const parsed = parseTLE(line1, line2, line0, options);
      this.tleState$.next({ data: parsed, loading: false, error: null });
      return of(parsed);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.tleState$.next({ data: null, loading: false, error: err });
      return new Observable(observer => {
        observer.error(err);
      });
    }
  }

  /**
   * Parse multiple TLEs in batch
   *
   * @param tles - Array of TLE line sets
   * @returns Observable of parsed TLE array
   */
  parseBatch(
    tles: Array<{ line1: string; line2: string; line0?: string }>
  ): Observable<{ data: ParsedTLE[]; errors: Error[] }> {
    const results: ParsedTLE[] = [];
    const errors: Error[] = [];

    tles.forEach(tle => {
      try {
        const parsed = parseTLE(tle.line1, tle.line2, tle.line0);
        results.push(parsed);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return of({ data: results, errors });
  }

  /**
   * Fetch TLE data from external sources
   *
   * @param source - Data source (e.g., 'celestrak', 'spacetrack')
   * @param query - Query parameters
   * @returns Observable of fetched TLE data
   */
  fetch(source: string, query: Record<string, any>): Observable<ParsedTLE[]> {
    return from(fetchTLEData(source, query)).pipe(
      catchError(error => {
        console.error('TLE fetch error:', error);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Calculate satellite position at a specific time
   *
   * @param tle - Parsed TLE data
   * @param date - Date for calculation (default: now)
   * @returns Observable of satellite position
   */
  calculatePosition(
    tle: ParsedTLE,
    date: Date = new Date()
  ): Observable<SatellitePosition> {
    try {
      const position = calculatePosition(tle, date);
      return of(position);
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
      });
    }
  }

  /**
   * Track satellite position in real-time
   *
   * @param tle - Parsed TLE data
   * @param updateInterval - Update interval in milliseconds (default: 1000)
   * @param groundLocation - Observer's location (optional)
   * @returns Observable of tracking state
   */
  trackSatellite(
    tle: ParsedTLE,
    updateInterval: number = 1000,
    groundLocation?: GroundLocation
  ): Observable<SatelliteTrackingState> {
    const stop$ = new Subject<void>();

    return interval(updateInterval).pipe(
      map(() => {
        try {
          const now = new Date();
          const position = calculatePosition(tle, now);

          let lookAngles: LookAngles | null = null;
          let isVisible = false;

          if (groundLocation) {
            lookAngles = calculateLookAngles(tle, groundLocation, now);
            isVisible = lookAngles.elevation > 0;
          }

          return {
            position,
            lookAngles,
            isVisible,
            isTracking: true,
            error: null
          };
        } catch (error) {
          return {
            position: null,
            lookAngles: null,
            isVisible: false,
            isTracking: true,
            error: error instanceof Error ? error : new Error(String(error))
          };
        }
      }),
      takeUntil(stop$),
      shareReplay(1)
    );
  }

  /**
   * Calculate visibility windows for a satellite
   *
   * @param tle - Parsed TLE data
   * @param groundLocation - Observer's location
   * @param startDate - Start date for calculation (default: now)
   * @param days - Number of days to calculate (default: 7)
   * @returns Observable of visibility windows
   */
  calculateVisibilityWindows(
    tle: ParsedTLE,
    groundLocation: GroundLocation,
    startDate: Date = new Date(),
    days: number = 7
  ): Observable<VisibilityWindow[]> {
    try {
      const windows = calculateVisibilityWindow(tle, groundLocation, startDate, days);
      return of(windows);
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
      });
    }
  }

  /**
   * Calculate look angles for a satellite
   *
   * @param tle - Parsed TLE data
   * @param groundLocation - Observer's location
   * @param date - Date for calculation (default: now)
   * @returns Observable of look angles
   */
  calculateLookAngles(
    tle: ParsedTLE,
    groundLocation: GroundLocation,
    date: Date = new Date()
  ): Observable<LookAngles> {
    try {
      const angles = calculateLookAngles(tle, groundLocation, date);
      return of(angles);
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
      });
    }
  }

  /**
   * Get cached TLE data
   *
   * @param key - Cache key
   * @returns Cached TLE data or null
   */
  getCached(key: string): ParsedTLE | null {
    return this.cache.get(key);
  }

  /**
   * Set cached TLE data
   *
   * @param key - Cache key
   * @param data - TLE data to cache
   */
  setCached(key: string, data: ParsedTLE): void {
    this.cache.set(key, data);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if satellite is visible from a location at a specific time
   *
   * @param tle - Parsed TLE data
   * @param groundLocation - Observer's location
   * @param date - Date for calculation (default: now)
   * @returns Observable of visibility status
   */
  isVisible(
    tle: ParsedTLE,
    groundLocation: GroundLocation,
    date: Date = new Date()
  ): Observable<boolean> {
    return this.calculateLookAngles(tle, groundLocation, date).pipe(
      map(angles => angles.elevation > 0),
      catchError(() => of(false))
    );
  }
}

/**
 * Satellite Tracker Component Helper
 * Use this class to manage satellite tracking state in components
 */
export class SatelliteTracker {
  private destroy$ = new Subject<void>();
  private trackingState$ = new BehaviorSubject<SatelliteTrackingState>({
    position: null,
    lookAngles: null,
    isVisible: false,
    isTracking: false,
    error: null
  });

  constructor(
    private tleService: TLEService,
    private tle: ParsedTLE,
    private groundLocation?: GroundLocation
  ) {}

  /**
   * Start tracking
   *
   * @param updateInterval - Update interval in milliseconds (default: 1000)
   */
  start(updateInterval: number = 1000): Observable<SatelliteTrackingState> {
    this.trackingState$.next({
      ...this.trackingState$.value,
      isTracking: true
    });

    return this.tleService
      .trackSatellite(this.tle, updateInterval, this.groundLocation)
      .pipe(
        tap(state => this.trackingState$.next(state)),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Stop tracking
   */
  stop(): void {
    this.destroy$.next();
    this.trackingState$.next({
      ...this.trackingState$.value,
      isTracking: false
    });
  }

  /**
   * Get tracking state as observable
   */
  getState(): Observable<SatelliteTrackingState> {
    return this.trackingState$.asObservable();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
