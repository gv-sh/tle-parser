# Week 8: Database Integration

Comprehensive database integration for TLE Parser, supporting multiple database systems for different use cases.

## 📚 Table of Contents

- [Overview](#overview)
- [Supported Databases](#supported-databases)
- [Quick Start](#quick-start)
- [Database Adapters](#database-adapters)
- [Migration Management](#migration-management)
- [ORM Support](#orm-support)
- [Connection Pooling](#connection-pooling)
- [Docker Setup](#docker-setup)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

The TLE Parser database integration provides adapters for 9 different database systems, each optimized for specific use cases:

- **MongoDB**: Document storage with rich querying
- **PostgreSQL + PostGIS**: Relational data with spatial queries
- **SQLite**: Embedded, zero-configuration storage
- **Redis**: High-performance caching
- **InfluxDB**: Time-series orbital data tracking
- **Elasticsearch**: Full-text search and analytics
- **TimescaleDB**: Time-series with SQL
- **DynamoDB**: Serverless, auto-scaling NoSQL
- **Neo4j**: Graph analysis of constellation networks

## Supported Databases

### MongoDB
- **Use Case**: Primary data storage, flexible schema
- **Features**: Schema validation, compound indexes, aggregation pipelines
- **Best For**: General-purpose TLE storage, constellation grouping

### PostgreSQL + PostGIS
- **Use Case**: Relational data with spatial queries
- **Features**: ACID compliance, spatial indexing, generated columns
- **Best For**: Production deployments, complex queries, GIS analysis

### SQLite
- **Use Case**: Embedded applications, offline support
- **Features**: Zero configuration, single file, ACID compliant
- **Best For**: Desktop apps, mobile apps, testing

### Redis
- **Use Case**: High-speed caching and session storage
- **Features**: In-memory storage, TTL support, pub/sub
- **Best For**: API response caching, rate limiting, real-time data

### InfluxDB
- **Use Case**: Time-series orbital element tracking
- **Features**: High write throughput, downsampling, retention policies
- **Best For**: Historical TLE data, trend analysis, orbital predictions

### Elasticsearch
- **Use Case**: Full-text search and analytics
- **Features**: Fuzzy search, autocomplete, aggregations
- **Best For**: Satellite name search, constellation discovery

### TimescaleDB
- **Use Case**: Time-series with full SQL support
- **Features**: Hypertables, continuous aggregates, compression
- **Best For**: Historical analysis, PostgreSQL familiarity

### DynamoDB
- **Use Case**: Serverless, auto-scaling cloud deployments
- **Features**: Pay-per-request, global tables, streams
- **Best For**: AWS deployments, variable workloads

### Neo4j
- **Use Case**: Graph analysis of satellite networks
- **Features**: Cypher queries, path finding, network topology
- **Best For**: Constellation analysis, satellite relationships

## Quick Start

### Installation

```bash
# Install database drivers (optional, based on your needs)
npm install mongodb       # MongoDB
npm install pg            # PostgreSQL
npm install better-sqlite3  # SQLite
npm install ioredis       # Redis
npm install @influxdata/influxdb-client  # InfluxDB
npm install @elastic/elasticsearch  # Elasticsearch
npm install @aws-sdk/client-dynamodb  # DynamoDB
npm install neo4j-driver  # Neo4j
```

### Start Databases with Docker

```bash
# Start all databases
docker-compose -f docker-compose.database.yml up -d

# Start specific databases
docker-compose -f docker-compose.database.yml up -d mongodb postgresql redis

# View logs
docker-compose -f docker-compose.database.yml logs -f

# Stop all databases
docker-compose -f docker-compose.database.yml down
```

### Basic Usage

```typescript
import {
  createMongoDBAdapter,
  createPostgreSQLAdapter,
  createRedisAdapter,
  parseTLE
} from 'tle-parser';

// MongoDB example
const mongoAdapter = createMongoDBAdapter();
await mongoAdapter.connect({
  host: 'localhost',
  port: 27017,
  database: 'tle_parser',
  username: 'admin',
  password: 'password'
});

// Parse and store TLE
const tleText = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9005
2 25544  51.6400 247.4627 0001320  95.8736 264.2578 15.54225995123456`;

const result = parseTLE(tleText);
if (result.success) {
  await mongoAdapter.insertTLE(result.data);
  console.log('TLE stored successfully');
}

// Query TLE
const tleResult = await mongoAdapter.findBySatelliteNumber(25544);
if (tleResult.success && tleResult.data) {
  console.log('Found ISS TLE:', tleResult.data.satelliteName);
}

await mongoAdapter.disconnect();
```

## Database Adapters

### MongoDB Adapter

```typescript
import { createMongoDBAdapter, MONGODB_INDEXES } from 'tle-parser';

const adapter = createMongoDBAdapter();
await adapter.connect({
  uri: 'mongodb://localhost:27017/tle_parser',
  replicaSet: 'rs0', // optional
  readPreference: 'secondary' // optional
});

// Create indexes
await adapter.createIndexes();

// Insert TLE
await adapter.insertTLE(parsedTLE);

// Batch insert
await adapter.insertTLEBatch(tleArray);

// Query by satellite number
const result = await adapter.findBySatelliteNumber(25544);

// Query with filters
const filtered = await adapter.query({
  'numeric.inclination': { $gte: 50, $lte: 60 },
  classification: 'U'
}, {
  limit: 100,
  sortBy: 'numeric.epochDay',
  sortOrder: 'desc'
});
```

### PostgreSQL + PostGIS Adapter

```typescript
import { createPostgreSQLAdapter, POSTGRESQL_SCHEMA } from 'tle-parser';

const adapter = createPostgreSQLAdapter();
await adapter.connect({
  host: 'localhost',
  port: 5432,
  database: 'tle_parser',
  username: 'postgres',
  password: 'password',
  ssl: false,
  pool: { min: 2, max: 10 }
});

// Spatial queries with PostGIS
const nearbyQuery = `
  SELECT * FROM tle_data
  WHERE ST_DWithin(
    ground_track_position::geography,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    1000000
  )
`;

// Find by orbital shell
const leoSatellites = await adapter.query({
  perigee_altitude: { min: 200, max: 2000 }
});
```

### Redis Caching Adapter

```typescript
import { createRedisAdapter, RedisCachingPatterns, TLERedisCache } from 'tle-parser';

const adapter = createRedisAdapter();
await adapter.connect({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
  keyPrefix: 'tle:'
});

// Create TLE-specific cache helper
const cache = new TLERedisCache(adapter);

// Cache TLE data
await cache.cacheTLE(parsedTLE);

// Get cached TLE
const cached = await cache.getTLE(25544);

// Implement cache-aside pattern
const tle = await RedisCachingPatterns.cacheAside(
  RedisCachingPatterns.tleKey(25544),
  async () => {
    // Fetch from database if not in cache
    return await dbAdapter.findBySatelliteNumber(25544);
  },
  adapter,
  3600 // TTL in seconds
);
```

### InfluxDB Time-Series Adapter

```typescript
import { createInfluxDBAdapter, INFLUX_MEASUREMENTS } from 'tle-parser';

const adapter = createInfluxDBAdapter();
await adapter.connect({
  url: 'http://localhost:8086',
  token: 'my-super-secret-auth-token',
  org: 'tle-parser',
  bucket: 'tle_data'
});

// Write TLE as time-series point
await adapter.writeTLEPoint(parsedTLE);

// Query orbital history
const history = await adapter.queryOrbitalHistory(
  25544,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Query orbital element changes
const deltaInclination = await adapter.queryOrbitalDelta(
  25544,
  'inclination',
  '1d'
);
```

### Elasticsearch Search Adapter

```typescript
import { createElasticsearchAdapter, ElasticsearchQueries } from 'tle-parser';

const adapter = createElasticsearchAdapter();
await adapter.connect({
  node: 'http://localhost:9200',
  index: 'tle_data'
});

// Create index with mapping
await adapter.createIndex();

// Index TLE for search
await adapter.indexTLE(parsedTLE);

// Full-text search
const searchResults = await adapter.search(
  ElasticsearchQueries.fullTextSearch('starlink', 20)
);

// Autocomplete
const suggestions = await adapter.search(
  ElasticsearchQueries.autocomplete('iss')
);
```

### Neo4j Graph Adapter

```typescript
import { createNeo4jAdapter, Neo4jCypherQueries } from 'tle-parser';

const adapter = createNeo4jAdapter();
await adapter.connect({
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password123',
  database: 'neo4j'
});

// Create satellite node
await adapter.createSatellite(parsedTLE);

// Link to constellation
await adapter.linkToConstellation(
  25544,
  'ISS',
  'NASA/Roscosmos',
  'International Space Station'
);

// Find similar orbits
const similar = await adapter.findSimilarOrbits(25544, {
  inclination: 5.0,
  eccentricity: 0.05,
  meanMotion: 0.5
});

// Get constellation topology
const topology = await adapter.getConstellationTopology('Starlink');
```

## Migration Management

```typescript
import {
  createMigrationManager,
  migrationRegistry,
  registerAllMigrations
} from 'tle-parser';

// Register migrations
registerAllMigrations();

// Create migration manager
const migrationManager = createMigrationManager(adapter, 'postgresql');

// Run pending migrations
const result = await migrationManager.runMigrations();
console.log(`Applied ${result.data?.length} migrations`);

// Get migration status
const status = await migrationManager.getStatus();
status.data?.forEach(migration => {
  console.log(`${migration.name}: ${migration.status}`);
});

// Rollback last migration
await migrationManager.rollback();

// Reset database (rollback all)
await migrationManager.reset();
```

## ORM Support

### Prisma

```typescript
import { ORMSchemas, createORMAdapter } from 'tle-parser';

// Get Prisma schema
const prismaSchema = ORMSchemas.prisma;

// Create Prisma adapter
const ormAdapter = createORMAdapter('prisma');

// Generate migration
const migration = await ormAdapter.generateMigration('add_tle_table');

// Sync schema
await ormAdapter.sync();
```

### TypeORM

```typescript
import { ORMSchemas, createORMAdapter } from 'tle-parser';

// Get TypeORM entities
const entities = ORMSchemas.typeorm;

// Create TypeORM adapter
const ormAdapter = createORMAdapter('typeorm');

// Generate migration
const migration = await ormAdapter.generateMigration('add_tle_table');

// Sync schema
await ormAdapter.sync();
```

## Connection Pooling

```typescript
import {
  ConnectionPool,
  getRecommendedPoolConfig,
  PoolMetricsCollector
} from 'tle-parser';

// Get recommended pool config
const poolConfig = getRecommendedPoolConfig('postgresql', 'medium');

// Create connection pool
const pool = new ConnectionPool(
  async () => {
    // Create connection
    return await createConnection();
  },
  async (conn) => {
    // Destroy connection
    await conn.close();
  },
  async (conn) => {
    // Validate connection
    return conn.isAlive();
  },
  poolConfig
);

// Initialize pool
await pool.initialize();

// Acquire connection
const conn = await pool.acquire();

try {
  // Use connection
  await conn.query('SELECT * FROM tle_data');
} finally {
  // Always release connection
  await pool.release(conn);
}

// Monitor pool metrics
const metrics = metricsCollector.getMetrics(pool);
console.log(`Pool utilization: ${metrics.utilizationPercent}%`);
```

## Docker Setup

### Start All Databases

```bash
docker-compose -f docker-compose.database.yml up -d
```

### Access Database UIs

- **MongoDB**: Use MongoDB Compass or connect via `mongodb://admin:password@localhost:27017`
- **PostgreSQL**: Use Adminer at http://localhost:8080
- **Redis**: Use Redis Commander at http://localhost:8081
- **InfluxDB**: UI at http://localhost:8086 (admin/password123)
- **Elasticsearch**: Kibana at http://localhost:5601
- **Neo4j**: Browser at http://localhost:7474 (neo4j/password123)

### Environment Variables

Create `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/tle_parser

# PostgreSQL
POSTGRES_URL=postgresql://postgres:password@localhost:5432/tle_parser

# Redis
REDIS_URL=redis://:password@localhost:6379

# InfluxDB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=tle-parser
INFLUXDB_BUCKET=tle_data

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# TimescaleDB
TIMESCALEDB_URL=postgresql://postgres:password@localhost:5433/tle_parser

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=us-east-1

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
```

## Examples

See [examples/database/](../examples/database/) for complete examples:

- `mongodb-example.ts` - MongoDB CRUD operations
- `postgresql-postgis-example.ts` - Spatial queries with PostGIS
- `redis-caching-example.ts` - Caching patterns
- `influxdb-timeseries-example.ts` - Time-series analysis
- `elasticsearch-search-example.ts` - Full-text search
- `neo4j-graph-example.ts` - Constellation network analysis

## Best Practices

### 1. Choose the Right Database

- **MongoDB**: General-purpose TLE storage
- **PostgreSQL**: Production deployments, complex queries
- **SQLite**: Embedded apps, testing
- **Redis**: Caching, real-time data
- **InfluxDB/TimescaleDB**: Time-series analysis
- **Elasticsearch**: Search functionality
- **DynamoDB**: Serverless AWS deployments
- **Neo4j**: Network topology analysis

### 2. Connection Management

- Always use connection pooling in production
- Release connections in `finally` blocks
- Monitor pool utilization
- Set appropriate timeouts

### 3. Error Handling

```typescript
try {
  const result = await adapter.insertTLE(tle);
  if (!result.success) {
    console.error('Insert failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
} finally {
  await adapter.disconnect();
}
```

### 4. Performance Optimization

- Create appropriate indexes
- Use batch operations for bulk inserts
- Implement caching for frequently accessed data
- Use read replicas for high-traffic applications

### 5. Security

- Never commit credentials to version control
- Use environment variables for configuration
- Enable SSL/TLS in production
- Implement proper authentication and authorization
- Use connection string URIs with credentials

## License

MIT - See main project LICENSE file
