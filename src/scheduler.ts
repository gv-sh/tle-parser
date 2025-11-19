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
export class TLEScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastUpdate: Date | null = null;
  private updateCount = 0;
  private errorCount = 0;
  private lastError: Error | null = null;
  private retryCount = 0;

  constructor(
    private manager: DataSourceManager,
    private config: ScheduleConfig
  ) {
    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNext();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Schedule the next update
   */
  private scheduleNext(): void {
    if (!this.isRunning) return;

    this.timer = setTimeout(() => {
      this.executeUpdate();
    }, this.config.intervalMs);
  }

  /**
   * Execute an update
   */
  private async executeUpdate(): Promise<void> {
    try {
      const result = await this.manager.fetch(
        this.config.source || null,
        this.config.fetchOptions || {}
      );

      this.lastUpdate = new Date();
      this.updateCount++;
      this.retryCount = 0;
      this.lastError = null;

      if (this.config.onUpdate) {
        this.config.onUpdate(result);
      }

      // Schedule next update
      this.scheduleNext();
    } catch (error) {
      this.errorCount++;
      this.lastError = error as Error;

      if (this.config.onError) {
        this.config.onError(this.lastError);
      }

      // Retry logic
      const maxRetries = this.config.maxRetries || 3;
      if (this.retryCount < maxRetries) {
        this.retryCount++;
        const retryDelay = this.config.retryDelayMs || 60000;

        this.timer = setTimeout(() => {
          this.executeUpdate();
        }, retryDelay);
      } else {
        // Max retries reached, schedule next regular update
        this.retryCount = 0;
        this.scheduleNext();
      }
    }
  }

  /**
   * Trigger immediate update
   */
  async updateNow(): Promise<FetchResult> {
    return this.manager.fetch(
      this.config.source || null,
      this.config.fetchOptions || {}
    );
  }

  /**
   * Get scheduler status
   */
  getStatus(): ScheduleStatus {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.timer
        ? new Date(Date.now() + this.config.intervalMs)
        : null,
      updateCount: this.updateCount,
      errorCount: this.errorCount,
      lastError: this.lastError
    };
  }

  /**
   * Update schedule configuration
   */
  updateConfig(config: Partial<ScheduleConfig>): void {
    Object.assign(this.config, config);

    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.updateCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    this.retryCount = 0;
  }
}

/**
 * Scheduler manager for multiple schedules
 */
export class SchedulerManager {
  private schedulers = new Map<string, TLEScheduler>();

  /**
   * Create and register a scheduler
   */
  create(
    name: string,
    manager: DataSourceManager,
    config: ScheduleConfig
  ): TLEScheduler {
    const scheduler = new TLEScheduler(manager, config);
    this.schedulers.set(name, scheduler);
    return scheduler;
  }

  /**
   * Get a scheduler by name
   */
  get(name: string): TLEScheduler | undefined {
    return this.schedulers.get(name);
  }

  /**
   * Remove a scheduler
   */
  remove(name: string): boolean {
    const scheduler = this.schedulers.get(name);
    if (scheduler) {
      scheduler.stop();
      return this.schedulers.delete(name);
    }
    return false;
  }

  /**
   * Start all schedulers
   */
  startAll(): void {
    for (const scheduler of this.schedulers.values()) {
      scheduler.start();
    }
  }

  /**
   * Stop all schedulers
   */
  stopAll(): void {
    for (const scheduler of this.schedulers.values()) {
      scheduler.stop();
    }
  }

  /**
   * Get status for all schedulers
   */
  getAllStatus(): Map<string, ScheduleStatus> {
    const status = new Map<string, ScheduleStatus>();
    for (const [name, scheduler] of this.schedulers) {
      status.set(name, scheduler.getStatus());
    }
    return status;
  }

  /**
   * List all scheduler names
   */
  list(): string[] {
    return Array.from(this.schedulers.keys());
  }
}

/**
 * Common schedule intervals
 */
export const SCHEDULE_INTERVALS = {
  /** Every 15 minutes */
  EVERY_15_MINUTES: 15 * 60 * 1000,
  /** Every 30 minutes */
  EVERY_30_MINUTES: 30 * 60 * 1000,
  /** Every hour */
  HOURLY: 60 * 60 * 1000,
  /** Every 2 hours */
  EVERY_2_HOURS: 2 * 60 * 60 * 1000,
  /** Every 6 hours */
  EVERY_6_HOURS: 6 * 60 * 60 * 1000,
  /** Every 12 hours */
  EVERY_12_HOURS: 12 * 60 * 60 * 1000,
  /** Daily */
  DAILY: 24 * 60 * 60 * 1000,
  /** Weekly */
  WEEKLY: 7 * 24 * 60 * 60 * 1000
} as const;

/**
 * Parse human-readable interval string
 */
export function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)\s*(ms|s|m|h|d|w)$/i);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid interval format: ${interval}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown interval unit: ${unit}`);
  }
}
