/**
 * Connection Pooling Best Practices
 * Provides pool management and configuration guidelines
 */

import type { PoolConfig, BaseDatabaseConfig } from './types';

/**
 * Default pool configurations for different database types
 */
export const DEFAULT_POOL_CONFIGS: Record<string, PoolConfig> = {
  postgresql: {
    min: 2,
    max: 10,
    idleTimeoutMs: 30000,
    acquireTimeoutMs: 30000,
    connectionTimeoutMs: 2000,
    maxLifetimeMs: 1800000, // 30 minutes
  },
  mongodb: {
    min: 5,
    max: 50,
    idleTimeoutMs: 60000,
    acquireTimeoutMs: 30000,
    connectionTimeoutMs: 5000,
    maxLifetimeMs: 3600000, // 1 hour
  },
  redis: {
    min: 2,
    max: 20,
    idleTimeoutMs: 30000,
    acquireTimeoutMs: 10000,
    connectionTimeoutMs: 2000,
  },
  timescaledb: {
    min: 2,
    max: 15,
    idleTimeoutMs: 30000,
    acquireTimeoutMs: 30000,
    connectionTimeoutMs: 2000,
    maxLifetimeMs: 1800000,
  },
} as const;

/**
 * Connection pool manager interface
 */
export interface IConnectionPool<T = unknown> {
  acquire(): Promise<T>;
  release(connection: T): Promise<void>;
  destroy(connection: T): Promise<void>;
  drain(): Promise<void>;
  clear(): Promise<void>;
  getPoolSize(): number;
  getAvailableConnections(): number;
  getActiveConnections(): number;
}

/**
 * Generic connection pool implementation
 */
export class ConnectionPool<T> implements IConnectionPool<T> {
  private pool: T[] = [];
  private activeConnections: Set<T> = new Set();
  private creating = false;

  constructor(
    private factory: () => Promise<T>,
    private destroyer: (connection: T) => Promise<void>,
    private validator: (connection: T) => Promise<boolean>,
    private config: PoolConfig
  ) {}

  /**
   * Initialize pool with minimum connections
   */
  async initialize(): Promise<void> {
    const minConnections = this.config.min || 2;
    const connections = await Promise.all(
      Array(minConnections)
        .fill(null)
        .map(() => this.createConnection())
    );
    this.pool.push(...connections);
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<T> {
    return await this.factory();
  }

  /**
   * Validate connection health
   */
  private async validateConnection(connection: T): Promise<boolean> {
    try {
      return await this.validator(connection);
    } catch {
      return false;
    }
  }

  /**
   * Acquire connection from pool
   */
  async acquire(): Promise<T> {
    const startTime = Date.now();
    const timeout = this.config.acquireTimeoutMs || 30000;

    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Connection acquire timeout');
      }

      // Try to get available connection
      if (this.pool.length > 0) {
        const connection = this.pool.shift()!;

        // Validate connection
        if (await this.validateConnection(connection)) {
          this.activeConnections.add(connection);
          return connection;
        } else {
          // Connection is invalid, destroy it
          await this.destroyer(connection).catch(() => {});
          continue;
        }
      }

      // Check if we can create more connections
      const totalConnections =
        this.pool.length + this.activeConnections.size;
      const maxConnections = this.config.max || 10;

      if (totalConnections < maxConnections && !this.creating) {
        this.creating = true;
        try {
          const connection = await this.createConnection();
          this.activeConnections.add(connection);
          return connection;
        } finally {
          this.creating = false;
        }
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Release connection back to pool
   */
  async release(connection: T): Promise<void> {
    if (!this.activeConnections.has(connection)) {
      throw new Error('Connection not in active set');
    }

    this.activeConnections.delete(connection);

    // Validate before returning to pool
    if (await this.validateConnection(connection)) {
      this.pool.push(connection);

      // Trim pool if too many idle connections
      const minConnections = this.config.min || 2;
      while (this.pool.length > minConnections) {
        const excess = this.pool.pop();
        if (excess) {
          await this.destroyer(excess).catch(() => {});
        }
      }
    } else {
      // Connection is invalid, destroy it
      await this.destroyer(connection).catch(() => {});
    }
  }

  /**
   * Destroy a connection
   */
  async destroy(connection: T): Promise<void> {
    this.activeConnections.delete(connection);
    const index = this.pool.indexOf(connection);
    if (index !== -1) {
      this.pool.splice(index, 1);
    }
    await this.destroyer(connection);
  }

  /**
   * Drain pool (wait for all connections to be released)
   */
  async drain(): Promise<void> {
    const timeout = 30000;
    const startTime = Date.now();

    while (this.activeConnections.size > 0) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Pool drain timeout');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear all connections
   */
  async clear(): Promise<void> {
    await this.drain();

    const connections = [...this.pool];
    this.pool = [];

    await Promise.all(
      connections.map((conn) => this.destroyer(conn).catch(() => {}))
    );
  }

  /**
   * Get pool size
   */
  getPoolSize(): number {
    return this.pool.length + this.activeConnections.size;
  }

  /**
   * Get available connections
   */
  getAvailableConnections(): number {
    return this.pool.length;
  }

  /**
   * Get active connections
   */
  getActiveConnections(): number {
    return this.activeConnections.size;
  }
}

/**
 * Pool configuration validator
 */
export class PoolConfigValidator {
  /**
   * Validate pool configuration
   */
  static validate(config: PoolConfig): string[] {
    const errors: string[] = [];

    if (config.min !== undefined && config.min < 0) {
      errors.push('min must be >= 0');
    }

    if (config.max !== undefined && config.max < 1) {
      errors.push('max must be >= 1');
    }

    if (
      config.min !== undefined &&
      config.max !== undefined &&
      config.min > config.max
    ) {
      errors.push('min must be <= max');
    }

    if (config.idleTimeoutMs !== undefined && config.idleTimeoutMs < 0) {
      errors.push('idleTimeoutMs must be >= 0');
    }

    if (config.acquireTimeoutMs !== undefined && config.acquireTimeoutMs < 0) {
      errors.push('acquireTimeoutMs must be >= 0');
    }

    if (
      config.connectionTimeoutMs !== undefined &&
      config.connectionTimeoutMs < 0
    ) {
      errors.push('connectionTimeoutMs must be >= 0');
    }

    return errors;
  }

  /**
   * Validate and throw on errors
   */
  static validateOrThrow(config: PoolConfig): void {
    const errors = this.validate(config);
    if (errors.length > 0) {
      throw new Error(`Invalid pool configuration: ${errors.join(', ')}`);
    }
  }
}

/**
 * Pool metrics for monitoring
 */
export interface PoolMetrics {
  totalConnections: number;
  availableConnections: number;
  activeConnections: number;
  utilizationPercent: number;
  createdTotal: number;
  destroyedTotal: number;
  acquireErrors: number;
  releaseErrors: number;
}

/**
 * Pool metrics collector
 */
export class PoolMetricsCollector {
  private createdTotal = 0;
  private destroyedTotal = 0;
  private acquireErrors = 0;
  private releaseErrors = 0;

  recordCreated(): void {
    this.createdTotal++;
  }

  recordDestroyed(): void {
    this.destroyedTotal++;
  }

  recordAcquireError(): void {
    this.acquireErrors++;
  }

  recordReleaseError(): void {
    this.releaseErrors++;
  }

  getMetrics(pool: IConnectionPool): PoolMetrics {
    const totalConnections = pool.getPoolSize();
    const availableConnections = pool.getAvailableConnections();
    const activeConnections = pool.getActiveConnections();

    return {
      totalConnections,
      availableConnections,
      activeConnections,
      utilizationPercent:
        totalConnections > 0
          ? (activeConnections / totalConnections) * 100
          : 0,
      createdTotal: this.createdTotal,
      destroyedTotal: this.destroyedTotal,
      acquireErrors: this.acquireErrors,
      releaseErrors: this.releaseErrors,
    };
  }

  reset(): void {
    this.createdTotal = 0;
    this.destroyedTotal = 0;
    this.acquireErrors = 0;
    this.releaseErrors = 0;
  }
}

/**
 * Best practices documentation
 */
export const POOLING_BEST_PRACTICES = {
  sizing: {
    description: 'Pool sizing guidelines',
    recommendations: [
      'Start with min=2, max=10 for low-traffic applications',
      'Use min=5, max=50 for medium-traffic applications',
      'Scale horizontally with multiple application instances rather than very large pools',
      'Monitor connection utilization and adjust based on actual usage',
      'Consider database connection limits when setting max',
    ],
  },
  timeouts: {
    description: 'Timeout configuration',
    recommendations: [
      'Set acquireTimeout to 2-3x your slowest query time',
      'Set connectionTimeout to network latency + database handshake time',
      'Set idleTimeout to balance connection reuse vs. resource usage',
      'Monitor timeout errors and adjust as needed',
    ],
  },
  lifecycle: {
    description: 'Connection lifecycle management',
    recommendations: [
      'Always release connections back to the pool in finally blocks',
      'Validate connections before reusing from pool',
      'Set maxLifetime to force periodic connection refresh',
      'Handle connection errors gracefully',
      'Implement health checks for idle connections',
    ],
  },
  monitoring: {
    description: 'Pool monitoring',
    recommendations: [
      'Track pool utilization percentage',
      'Monitor acquire wait times',
      'Alert on acquire timeout errors',
      'Log connection creation/destruction rates',
      'Track active vs. idle connection ratios',
    ],
  },
} as const;

/**
 * Get recommended pool config for database type and load
 */
export function getRecommendedPoolConfig(
  databaseType: string,
  expectedLoad: 'low' | 'medium' | 'high' = 'medium'
): PoolConfig {
  const baseConfig =
    DEFAULT_POOL_CONFIGS[databaseType] || DEFAULT_POOL_CONFIGS.postgresql;

  const multipliers = {
    low: 0.5,
    medium: 1.0,
    high: 2.0,
  };

  const multiplier = multipliers[expectedLoad];

  return {
    ...baseConfig,
    min: Math.max(1, Math.floor((baseConfig.min || 2) * multiplier)),
    max: Math.floor((baseConfig.max || 10) * multiplier),
  };
}
