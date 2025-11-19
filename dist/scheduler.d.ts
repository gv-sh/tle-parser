/**
 * Automatic Update Scheduler
 * Provides cron-like scheduling for automatic TLE data updates
 */
import type { FetchOptions, FetchResult, DataSourceManager } from './dataSources';
/**
 * Schedule configuration
 */
export interface ScheduleConfig {
    /** Schedule interval in milliseconds */
    intervalMs: number;
    /** Data source name */
    source?: string;
    /** Fetch options */
    fetchOptions?: FetchOptions;
    /** Callback on successful update */
    onUpdate?: (result: FetchResult) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Auto-start the scheduler */
    autoStart?: boolean;
    /** Maximum number of retries on failure */
    maxRetries?: number;
    /** Retry delay in milliseconds */
    retryDelayMs?: number;
}
/**
 * Schedule status
 */
export interface ScheduleStatus {
    isRunning: boolean;
    lastUpdate: Date | null;
    nextUpdate: Date | null;
    updateCount: number;
    errorCount: number;
    lastError: Error | null;
}
/**
 * TLE Update Scheduler
 */
export declare class TLEScheduler {
    private manager;
    private config;
    private timer;
    private isRunning;
    private lastUpdate;
    private updateCount;
    private errorCount;
    private lastError;
    private retryCount;
    constructor(manager: DataSourceManager, config: ScheduleConfig);
    /**
     * Start the scheduler
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Schedule the next update
     */
    private scheduleNext;
    /**
     * Execute an update
     */
    private executeUpdate;
    /**
     * Trigger immediate update
     */
    updateNow(): Promise<FetchResult>;
    /**
     * Get scheduler status
     */
    getStatus(): ScheduleStatus;
    /**
     * Update schedule configuration
     */
    updateConfig(config: Partial<ScheduleConfig>): void;
    /**
     * Reset statistics
     */
    resetStats(): void;
}
/**
 * Scheduler manager for multiple schedules
 */
export declare class SchedulerManager {
    private schedulers;
    /**
     * Create and register a scheduler
     */
    create(name: string, manager: DataSourceManager, config: ScheduleConfig): TLEScheduler;
    /**
     * Get a scheduler by name
     */
    get(name: string): TLEScheduler | undefined;
    /**
     * Remove a scheduler
     */
    remove(name: string): boolean;
    /**
     * Start all schedulers
     */
    startAll(): void;
    /**
     * Stop all schedulers
     */
    stopAll(): void;
    /**
     * Get status for all schedulers
     */
    getAllStatus(): Map<string, ScheduleStatus>;
    /**
     * List all scheduler names
     */
    list(): string[];
}
/**
 * Common schedule intervals
 */
export declare const SCHEDULE_INTERVALS: {
    /** Every 15 minutes */
    readonly EVERY_15_MINUTES: number;
    /** Every 30 minutes */
    readonly EVERY_30_MINUTES: number;
    /** Every hour */
    readonly HOURLY: number;
    /** Every 2 hours */
    readonly EVERY_2_HOURS: number;
    /** Every 6 hours */
    readonly EVERY_6_HOURS: number;
    /** Every 12 hours */
    readonly EVERY_12_HOURS: number;
    /** Daily */
    readonly DAILY: number;
    /** Weekly */
    readonly WEEKLY: number;
};
/**
 * Parse human-readable interval string
 */
export declare function parseInterval(interval: string): number;
//# sourceMappingURL=scheduler.d.ts.map