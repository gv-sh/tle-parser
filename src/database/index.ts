/**
 * TLE Parser Database Integration
 * Week 8: Comprehensive database support for TLE data storage and querying
 *
 * @module database
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Base types
  ConnectionStatus,
  DatabaseOperationResult,
  QueryOptions,
  PoolConfig,
  BaseDatabaseConfig,
  // TLE schema types
  TLEDocument,
  TLERecord,
  TLETimeSeriesPoint,
  TLESearchDocument,
  TLESatelliteNode,
  ConstellationRelationship,
  // Adapter interfaces
  IDatabaseAdapter,
  ICacheAdapter,
  // Migration types
  Migration,
  MigrationStatus,
  IMigrationManager,
  // ORM types
  ORMType,
  IORMAdapter,
  // Config types
  MongoDBConfig,
  PostgreSQLConfig,
  SQLiteConfig,
  RedisConfig,
  InfluxDBConfig,
  ElasticsearchConfig,
  TimescaleDBConfig,
  DynamoDBConfig,
  Neo4jConfig,
  DatabaseType,
  AdapterFactoryResult,
} from './types';

// ============================================================================
// MONGODB EXPORTS
// ============================================================================

export {
  MONGODB_INDEXES,
  MONGODB_SCHEMA_VALIDATION,
  MongoDBPipelines,
  MongoDBAdapter,
  createMongoDBAdapter,
} from './mongodb';

// ============================================================================
// POSTGRESQL EXPORTS
// ============================================================================

export {
  POSTGRESQL_SCHEMA,
  POSTGIS_QUERIES,
  PostgreSQLAdapter,
  createPostgreSQLAdapter,
} from './postgresql';

// ============================================================================
// SQLITE EXPORTS
// ============================================================================

export {
  SQLITE_SCHEMA,
  SQLITE_QUERIES,
  SQLiteAdapter,
  createSQLiteAdapter,
} from './sqlite';

// ============================================================================
// REDIS EXPORTS
// ============================================================================

export {
  REDIS_KEY_PREFIXES,
  REDIS_TTL,
  RedisCachingPatterns,
  RedisAdapter,
  createRedisAdapter,
  TLERedisCache,
} from './redis';

// ============================================================================
// INFLUXDB EXPORTS
// ============================================================================

export {
  INFLUX_MEASUREMENTS,
  INFLUX_SCHEMAS,
  InfluxDBAdapter,
  createInfluxDBAdapter,
} from './influxdb';

// ============================================================================
// ELASTICSEARCH EXPORTS
// ============================================================================

export {
  ELASTICSEARCH_MAPPING,
  ElasticsearchQueries,
  ElasticsearchAdapter,
  createElasticsearchAdapter,
} from './elasticsearch';

// ============================================================================
// TIMESCALEDB EXPORTS
// ============================================================================

export {
  TIMESCALEDB_SCHEMA,
  TimescaleDBQueries,
  TimescaleDBAdapter,
  createTimescaleDBAdapter,
} from './timescaledb';

// ============================================================================
// DYNAMODB EXPORTS
// ============================================================================

export {
  DYNAMODB_TABLE_SCHEMA,
  DynamoDBAccessPatterns,
  DynamoDBAdapter,
  createDynamoDBAdapter,
} from './dynamodb';

// ============================================================================
// NEO4J EXPORTS
// ============================================================================

export {
  Neo4jCypherQueries,
  Neo4jAdapter,
  createNeo4jAdapter,
} from './neo4j';

// ============================================================================
// MIGRATION EXPORTS
// ============================================================================

export {
  MigrationRegistry,
  migrationRegistry,
  MigrationManager,
  postgresqlMigrations,
  mongodbMigrations,
  registerAllMigrations,
  createMigrationManager,
  generateMigrationTemplate,
} from './migrations';

// ============================================================================
// ORM EXPORTS
// ============================================================================

export {
  PRISMA_SCHEMA,
  TYPEORM_ENTITIES,
  MONGOOSE_SCHEMA,
  PrismaORMAdapter,
  TypeORMAdapter,
  createORMAdapter,
  ORMSchemas,
} from './orm';

// ============================================================================
// POOLING EXPORTS
// ============================================================================

export {
  DEFAULT_POOL_CONFIGS,
  type IConnectionPool,
  ConnectionPool,
  PoolConfigValidator,
  type PoolMetrics,
  PoolMetricsCollector,
  POOLING_BEST_PRACTICES,
  getRecommendedPoolConfig,
} from './pooling';

// ============================================================================
// DATABASE ADAPTER FACTORY
// ============================================================================

import { MongoDBAdapter } from './mongodb';
import { PostgreSQLAdapter } from './postgresql';
import { SQLiteAdapter } from './sqlite';
import { RedisAdapter } from './redis';
import { InfluxDBAdapter } from './influxdb';
import { ElasticsearchAdapter } from './elasticsearch';
import { TimescaleDBAdapter } from './timescaledb';
import { DynamoDBAdapter } from './dynamodb';
import { Neo4jAdapter } from './neo4j';
import type {
  DatabaseType,
  IDatabaseAdapter,
  ICacheAdapter,
  AdapterFactoryResult,
} from './types';

/**
 * Create database adapter by type
 */
export function createDatabaseAdapter(
  type: DatabaseType
): IDatabaseAdapter | ICacheAdapter | InfluxDBAdapter | ElasticsearchAdapter | TimescaleDBAdapter | DynamoDBAdapter | Neo4jAdapter {
  switch (type) {
    case 'mongodb':
      return new MongoDBAdapter();
    case 'postgresql':
      return new PostgreSQLAdapter();
    case 'sqlite':
      return new SQLiteAdapter();
    case 'redis':
      return new RedisAdapter();
    case 'influxdb':
      return new InfluxDBAdapter();
    case 'elasticsearch':
      return new ElasticsearchAdapter();
    case 'timescaledb':
      return new TimescaleDBAdapter();
    case 'dynamodb':
      return new DynamoDBAdapter();
    case 'neo4j':
      return new Neo4jAdapter();
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

/**
 * Get all supported database types
 */
export function getSupportedDatabaseTypes(): DatabaseType[] {
  return [
    'mongodb',
    'postgresql',
    'sqlite',
    'redis',
    'influxdb',
    'elasticsearch',
    'timescaledb',
    'dynamodb',
    'neo4j',
  ];
}

/**
 * Check if database type is supported
 */
export function isDatabaseTypeSupported(type: string): type is DatabaseType {
  return getSupportedDatabaseTypes().includes(type as DatabaseType);
}

// ============================================================================
// VERSION INFO
// ============================================================================

/**
 * Database integration version
 */
export const DATABASE_VERSION = '1.0.0';

/**
 * Database integration metadata
 */
export const DATABASE_METADATA = {
  version: DATABASE_VERSION,
  name: 'TLE Parser Database Integration',
  description: 'Comprehensive database support for TLE data',
  week: 8,
  databases: [
    { name: 'MongoDB', type: 'NoSQL Document Store', features: ['Schema validation', 'Indexing', 'Aggregation pipelines'] },
    { name: 'PostgreSQL', type: 'Relational + PostGIS', features: ['Spatial queries', 'JSONB', 'Full-text search'] },
    { name: 'SQLite', type: 'Embedded SQL', features: ['Zero-config', 'File-based', 'ACID compliance'] },
    { name: 'Redis', type: 'In-Memory Cache', features: ['Key-value store', 'Pub/sub', 'TTL support'] },
    { name: 'InfluxDB', type: 'Time-Series', features: ['High-performance writes', 'Downsampling', 'Retention policies'] },
    { name: 'Elasticsearch', type: 'Search Engine', features: ['Full-text search', 'Aggregations', 'Autocomplete'] },
    { name: 'TimescaleDB', type: 'Time-Series SQL', features: ['Hypertables', 'Continuous aggregates', 'Compression'] },
    { name: 'DynamoDB', type: 'NoSQL Key-Value', features: ['Serverless', 'Auto-scaling', 'Global tables'] },
    { name: 'Neo4j', type: 'Graph Database', features: ['Cypher queries', 'Path finding', 'Graph algorithms'] },
  ],
} as const;
