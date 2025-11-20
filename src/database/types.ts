/**
 * Database Integration Types for TLE Parser
 * Provides type-safe database adapters for storing and querying TLE data
 */

import type { ParsedTLE, ParsedTLEWithNumbers } from '../types';

// ============================================================================
// DATABASE ADAPTER BASE TYPES
// ============================================================================

/**
 * Database connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Database operation result
 */
export interface DatabaseOperationResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: Error;
  readonly affectedRows?: number;
  readonly executionTime?: number;
}

/**
 * Query options for database operations
 */
export interface QueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly timeout?: number;
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  readonly min?: number;
  readonly max?: number;
  readonly idleTimeoutMs?: number;
  readonly acquireTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
  readonly maxLifetimeMs?: number;
}

/**
 * Base database configuration
 */
export interface BaseDatabaseConfig {
  readonly host?: string;
  readonly port?: number;
  readonly database?: string;
  readonly username?: string;
  readonly password?: string;
  readonly ssl?: boolean;
  readonly pool?: PoolConfig;
  readonly timeout?: number;
  readonly retries?: number;
}

// ============================================================================
// TLE DATABASE SCHEMA TYPES
// ============================================================================

/**
 * TLE document for NoSQL databases (MongoDB, DynamoDB)
 */
export interface TLEDocument extends ParsedTLEWithNumbers {
  readonly _id?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly version?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * TLE record for SQL databases
 */
export interface TLERecord {
  readonly id?: number | string;
  readonly satellite_number: number;
  readonly satellite_name: string | null;
  readonly classification: string;
  readonly intl_designator_year: number;
  readonly intl_designator_launch: number;
  readonly intl_designator_piece: string;
  readonly epoch_year: number;
  readonly epoch_day: number;
  readonly mean_motion_derivative: number;
  readonly mean_motion_second_derivative: number;
  readonly bstar: number;
  readonly ephemeris_type: number;
  readonly element_set_number: number;
  readonly inclination: number;
  readonly right_ascension: number;
  readonly eccentricity: number;
  readonly argument_of_perigee: number;
  readonly mean_anomaly: number;
  readonly mean_motion: number;
  readonly revolution_number: number;
  readonly created_at?: Date;
  readonly updated_at?: Date;
}

/**
 * TLE time-series point for InfluxDB/TimescaleDB
 */
export interface TLETimeSeriesPoint {
  readonly timestamp: Date;
  readonly satellite_number: number;
  readonly measurement: string;
  readonly fields: Record<string, number>;
  readonly tags?: Record<string, string>;
}

/**
 * TLE search document for Elasticsearch
 */
export interface TLESearchDocument {
  readonly id: string;
  readonly satellite_number: number;
  readonly satellite_name: string | null;
  readonly classification: string;
  readonly epoch: Date;
  readonly orbital_elements: {
    readonly inclination: number;
    readonly eccentricity: number;
    readonly mean_motion: number;
    readonly [key: string]: number;
  };
  readonly indexed_at: Date;
}

/**
 * TLE graph node for Neo4j
 */
export interface TLESatelliteNode {
  readonly satellite_number: number;
  readonly satellite_name: string | null;
  readonly classification: string;
  readonly properties: Record<string, unknown>;
}

/**
 * Constellation relationship for Neo4j
 */
export interface ConstellationRelationship {
  readonly type: string;
  readonly constellation_name: string;
  readonly properties?: Record<string, unknown>;
}

// ============================================================================
// DATABASE ADAPTER INTERFACE
// ============================================================================

/**
 * Base database adapter interface
 */
export interface IDatabaseAdapter<TConfig = BaseDatabaseConfig> {
  /**
   * Connect to the database
   */
  connect(config: TConfig): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Check if the adapter is connected
   */
  isConnected(): boolean;

  /**
   * Insert a single TLE record
   */
  insertTLE(tle: ParsedTLE): Promise<DatabaseOperationResult<string | number>>;

  /**
   * Insert multiple TLE records
   */
  insertTLEBatch(tles: ParsedTLE[]): Promise<DatabaseOperationResult<Array<string | number>>>;

  /**
   * Find TLE by satellite number
   */
  findBySatelliteNumber(satelliteNumber: number): Promise<DatabaseOperationResult<ParsedTLE | null>>;

  /**
   * Find TLEs by satellite numbers
   */
  findBySatelliteNumbers(satelliteNumbers: number[]): Promise<DatabaseOperationResult<ParsedTLE[]>>;

  /**
   * Update TLE by satellite number
   */
  updateTLE(satelliteNumber: number, tle: Partial<ParsedTLE>): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Delete TLE by satellite number
   */
  deleteTLE(satelliteNumber: number): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Query TLEs with options
   */
  query(filter: Record<string, unknown>, options?: QueryOptions): Promise<DatabaseOperationResult<ParsedTLE[]>>;

  /**
   * Count TLEs matching filter
   */
  count(filter: Record<string, unknown>): Promise<DatabaseOperationResult<number>>;

  /**
   * Create indexes for optimization
   */
  createIndexes(): Promise<DatabaseOperationResult<void>>;

  /**
   * Health check
   */
  healthCheck(): Promise<DatabaseOperationResult<{ healthy: boolean; latency: number }>>;
}

// ============================================================================
// CACHE ADAPTER INTERFACE
// ============================================================================

/**
 * Cache adapter interface for Redis
 */
export interface ICacheAdapter<TConfig = BaseDatabaseConfig> {
  /**
   * Connect to the cache
   */
  connect(config: TConfig): Promise<void>;

  /**
   * Disconnect from the cache
   */
  disconnect(): Promise<void>;

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Set a value in cache
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Get a value from cache
   */
  get<T = unknown>(key: string): Promise<DatabaseOperationResult<T | null>>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Delete multiple values from cache
   */
  deleteMany(keys: string[]): Promise<DatabaseOperationResult<number>>;

  /**
   * Check if key exists
   */
  exists(key: string): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Set expiration on a key
   */
  expire(key: string, ttlSeconds: number): Promise<DatabaseOperationResult<boolean>>;

  /**
   * Get all keys matching pattern
   */
  keys(pattern: string): Promise<DatabaseOperationResult<string[]>>;

  /**
   * Flush all cached data
   */
  flush(): Promise<DatabaseOperationResult<boolean>>;
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

/**
 * Database migration
 */
export interface Migration {
  readonly id: string;
  readonly name: string;
  readonly timestamp: Date;
  readonly up: (adapter: IDatabaseAdapter) => Promise<void>;
  readonly down: (adapter: IDatabaseAdapter) => Promise<void>;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  readonly id: string;
  readonly name: string;
  readonly appliedAt: Date | null;
  readonly status: 'pending' | 'applied' | 'failed';
}

/**
 * Migration manager interface
 */
export interface IMigrationManager {
  /**
   * Run pending migrations
   */
  runMigrations(): Promise<DatabaseOperationResult<MigrationStatus[]>>;

  /**
   * Rollback last migration
   */
  rollback(): Promise<DatabaseOperationResult<MigrationStatus>>;

  /**
   * Get migration status
   */
  getStatus(): Promise<DatabaseOperationResult<MigrationStatus[]>>;

  /**
   * Reset database (rollback all migrations)
   */
  reset(): Promise<DatabaseOperationResult<void>>;
}

// ============================================================================
// ORM ADAPTER TYPES
// ============================================================================

/**
 * ORM adapter type
 */
export type ORMType = 'prisma' | 'typeorm' | 'sequelize' | 'mongoose';

/**
 * ORM adapter interface
 */
export interface IORMAdapter {
  readonly type: ORMType;
  readonly schema: string;
  generateSchema(): Promise<string>;
  generateMigration(name: string): Promise<string>;
  sync(): Promise<DatabaseOperationResult<void>>;
}

// ============================================================================
// SPECIFIC DATABASE CONFIGURATION TYPES
// ============================================================================

/**
 * MongoDB configuration
 */
export interface MongoDBConfig extends BaseDatabaseConfig {
  readonly uri?: string;
  readonly replicaSet?: string;
  readonly authSource?: string;
  readonly readPreference?: 'primary' | 'secondary' | 'nearest';
  readonly w?: number | 'majority';
}

/**
 * PostgreSQL configuration (with PostGIS)
 */
export interface PostgreSQLConfig extends BaseDatabaseConfig {
  readonly schema?: string;
  readonly enablePostGIS?: boolean;
  readonly statementTimeout?: number;
}

/**
 * SQLite configuration
 */
export interface SQLiteConfig {
  readonly filename: string;
  readonly mode?: 'readonly' | 'readwrite' | 'memory';
  readonly timeout?: number;
  readonly verbose?: boolean;
}

/**
 * Redis configuration
 */
export interface RedisConfig extends BaseDatabaseConfig {
  readonly db?: number;
  readonly keyPrefix?: string;
  readonly lazyConnect?: boolean;
  readonly enableReadyCheck?: boolean;
}

/**
 * InfluxDB configuration
 */
export interface InfluxDBConfig {
  readonly url: string;
  readonly token: string;
  readonly org: string;
  readonly bucket: string;
  readonly timeout?: number;
}

/**
 * Elasticsearch configuration
 */
export interface ElasticsearchConfig {
  readonly node: string | string[];
  readonly auth?: {
    readonly username: string;
    readonly password: string;
  };
  readonly cloud?: {
    readonly id: string;
  };
  readonly index: string;
  readonly apiKey?: string;
}

/**
 * TimescaleDB configuration (extends PostgreSQL)
 */
export interface TimescaleDBConfig extends PostgreSQLConfig {
  readonly compressionEnabled?: boolean;
  readonly retentionPolicy?: string;
  readonly chunkTimeInterval?: string;
}

/**
 * DynamoDB configuration
 */
export interface DynamoDBConfig {
  readonly region: string;
  readonly tableName: string;
  readonly accessKeyId?: string;
  readonly secretAccessKey?: string;
  readonly endpoint?: string;
  readonly billingMode?: 'PAY_PER_REQUEST' | 'PROVISIONED';
}

/**
 * Neo4j configuration
 */
export interface Neo4jConfig {
  readonly uri: string;
  readonly username: string;
  readonly password: string;
  readonly database?: string;
  readonly encrypted?: boolean;
  readonly maxConnectionPoolSize?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Database type enumeration
 */
export type DatabaseType =
  | 'mongodb'
  | 'postgresql'
  | 'sqlite'
  | 'redis'
  | 'influxdb'
  | 'elasticsearch'
  | 'timescaledb'
  | 'dynamodb'
  | 'neo4j';

/**
 * Database adapter factory result
 */
export interface AdapterFactoryResult<T extends IDatabaseAdapter = IDatabaseAdapter> {
  readonly adapter: T;
  readonly type: DatabaseType;
}
