# Week 8 Quick Reference Guide

## File Locations for Common Patterns

### Type Definitions
- **Main types**: `/home/user/tle-parser/src/types.ts` (708 lines)
  - ParsedTLE interface
  - Branded types (SatelliteNumber, Checksum, etc.)
  - Error interfaces (TLEError, TLEWarning)
  - Discriminated unions for results

### Error Handling
- **Error codes**: `/home/user/tle-parser/src/errorCodes.ts`
  - Add database error codes here
  - Export as part of main API

### Configuration Patterns
- **Data sources**: `/home/user/tle-parser/src/dataSources.ts` (start ~100 lines)
  - DataSourceConfig interface (lines 25-50)
  - FetchOptions interface (lines 55-72)
  - FetchResult interface (lines 75-90)
  - Use this as template for DatabaseConfig

### Caching Patterns
- **TTL Cache**: `/home/user/tle-parser/src/cache.ts`
  - CacheConfig interface (lines 23-34)
  - TTLCache class implementation (lines 39-80+)
  - Persistence logic
  - **Follow this pattern for database cache integration**

### Async Patterns
- **Advanced Parser**: `/home/user/tle-parser/src/advancedParser.ts` (1,191 lines)
  - BatchParseOptions (lines 49-62)
  - StreamParserOptions (lines 66-72)
  - parseFromFile, parseFromStream, parseBatch examples
  - **Reference for streaming database queries**

### Validation Patterns
- **Validation module**: `/home/user/tle-parser/src/validation.ts`
  - ValidationRuleManager pattern
  - Custom validation rule creation
  - **Apply similar patterns to schema validation**

### Testing Patterns
- **Validation tests**: `/home/user/tle-parser/__tests__/validation.test.ts`
  - describe/test structure
  - beforeEach/afterEach setup
  - **Reference for database integration tests**

### Example Implementations
- **Express middleware**: `/home/user/tle-parser/examples/frameworks/express/middleware.ts`
  - Request handling pattern
  - Error handling in middleware
  - **Reference for API middleware**

---

## Quick Copy-Paste Templates

### New Database Error Codes
```typescript
// In src/errorCodes.ts, add to ERROR_CODES object:

// Database connection errors
DB_CONNECTION_FAILED = 'ERR_DB_CONNECTION_FAILED',
DB_CONNECTION_TIMEOUT = 'ERR_DB_CONNECTION_TIMEOUT',
DB_POOL_EXHAUSTED = 'ERR_DB_POOL_EXHAUSTED',

// Database query errors
QUERY_TIMEOUT = 'ERR_QUERY_TIMEOUT',
QUERY_SYNTAX_ERROR = 'ERR_QUERY_SYNTAX_ERROR',

// Data errors
DUPLICATE_KEY = 'ERR_DUPLICATE_KEY',
NOT_FOUND = 'ERR_NOT_FOUND',
CONSTRAINT_VIOLATION = 'ERR_CONSTRAINT_VIOLATION',

// Transaction errors
TRANSACTION_FAILED = 'ERR_TRANSACTION_FAILED',
TRANSACTION_CONFLICT = 'ERR_TRANSACTION_CONFLICT',

// Migration errors
MIGRATION_FAILED = 'ERR_MIGRATION_FAILED',
ROLLBACK_FAILED = 'ERR_ROLLBACK_FAILED'
```

### New Type Interfaces
```typescript
// In src/database/types.ts:

export interface DatabaseConfig {
  type: 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'dynamodb';
  connection: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    [key: string]: any;
  };
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMs?: number;
    connectionTimeoutMs?: number;
  };
  cache?: {
    enabled?: boolean;
    ttl?: number;
    backend?: 'memory' | 'redis';
  };
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  storeTLE(tle: ParsedTLE): Promise<string>;
  getTLE(id: string): Promise<ParsedTLE | null>;
  queryTLEs(filter: TLEFilter): Promise<ParsedTLE[]>;
  deleteTLE(id: string): Promise<boolean>;
  storeBatch(tles: ParsedTLE[]): Promise<string[]>;
  deleteBatch(ids: string[]): Promise<number>;
  healthCheck(): Promise<boolean>;
}
```

### Module Export Pattern
```typescript
// In src/index.ts, add these lines in appropriate section:

export * from './database';
export { DatabaseAdapter, DatabaseConfig } from './database';

// And in src/database/index.ts:
export { PostgreSQLAdapter } from './adapters/postgresql';
export { MongoDBAdapter } from './adapters/mongodb';
export { SQLiteAdapter } from './adapters/sqlite';
export type { DatabaseConfig, DatabaseAdapter } from './types';
```

### Testing Setup
```typescript
// In __tests__/database/setup.ts:

export const TEST_DB_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  connection: {
    database: ':memory:'
  }
};

// In __tests__/database/database-adapter.test.ts:
import { PostgreSQLAdapter } from '../../src/database/adapters/postgresql';

describe('PostgreSQL Adapter', () => {
  let adapter: PostgreSQLAdapter;
  
  beforeAll(async () => {
    adapter = new PostgreSQLAdapter(TEST_DB_CONFIG);
    await adapter.connect();
  });
  
  afterAll(async () => {
    await adapter.disconnect();
  });
  
  afterEach(async () => {
    await adapter.deleteAll();
  });
  
  describe('storeTLE', () => {
    test('should store and retrieve TLE', async () => {
      const id = await adapter.storeTLE(testTLE);
      const retrieved = await adapter.getTLE(id);
      expect(retrieved).toEqual(testTLE);
    });
  });
});
```

---

## Development Workflow

### 1. Create Database Module
```bash
mkdir -p src/database/adapters
mkdir -p src/database/connection
mkdir -p src/database/repositories
mkdir -p src/database/schemas
mkdir -p src/database/migrations
```

### 2. Add to tsconfig.json if needed
(Should already be included in `src/**/*`)

### 3. Update package.json if adding database drivers
```bash
# Only if you're adding Prisma/TypeORM as optional deps
npm install --save-optional prisma
npm install --save-optional pg
npm install --save-optional mongodb
```

### 4. Run tests
```bash
npm test
# or with coverage:
npm run test:coverage
```

### 5. Build and verify
```bash
npm run build
npm run size  # Check bundle size impact
```

---

## Key Architectural Decisions

### 1. Adapter Pattern
- **Why**: Multiple database support without tight coupling
- **Reference**: See `src/dataSources.ts` for config pattern
- **Implementation**: Create `DatabaseAdapter` interface with implementations

### 2. Discriminated Unions for Results
```typescript
export type QueryResult<T> = 
  | { success: true; data: T; }
  | { success: false; error: DatabaseError; };

// Usage:
const result = await db.getTLE(id);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### 3. Repository Pattern
- **Why**: Encapsulate data access logic
- **File**: `src/database/repositories/tleRepository.ts`
- **Benefits**: Easy testing, data abstraction

### 4. Connection Pooling
- **Why**: Reuse connections, improve performance
- **Reference**: See how `scheduler.ts` manages intervals
- **Pattern**: Class-based with lifecycle methods

### 5. Configuration-First
- **Why**: Flexible, testable, environment-aware
- **Pattern**: Options object with sensible defaults
- **Reference**: `src/dataSources.ts` DataSourceConfig

---

## Common Issues & Solutions

### Issue: TypeScript strict mode errors
**Solution**: All new code must satisfy strict mode
- No implicit any
- All parameters typed
- No optional chaining without null checks
- See `tsconfig.json` for all strict settings

### Issue: Circular imports
**Solution**: Structure exports carefully
- Core types in `types.ts`
- Index files re-export only public API
- Reference existing structure in `src/index.ts`

### Issue: Large module size
**Solution**: Tree-shake by keeping modules small
- One class per file if possible
- Clear exports/imports
- Rollup will handle bundling
- Check with `npm run size`

### Issue: Test database setup
**Solution**: Use in-memory SQLite for tests
- Fast, no external dependencies
- Perfect for unit tests
- Use real DB only for integration tests with Docker

---

## Documentation To Update

1. **docs/guides/DATABASE.md** - New guide for database usage
2. **docs/api/DATABASE_API.md** - API reference for adapters
3. **README.md** - Add database integration section
4. **ROADMAP.md** - Mark Week 8 tasks as completed

---

## Build & Publish Checklist

- [ ] All TypeScript compiles without errors
- [ ] All tests pass (95%+ coverage)
- [ ] Bundle size hasn't increased significantly
- [ ] No console errors in browser bundle
- [ ] Documentation is updated
- [ ] Examples are working
- [ ] Version bumped in package.json
- [ ] Commit message follows pattern: `feat: [Week 8 feature description]`

---

## Useful Commands

```bash
# TypeScript compilation
npm run build:tsc

# Watch mode development
npm run build:watch

# Run specific test
npm test -- database-adapter

# Watch tests
npm run test:watch

# Check coverage
npm run test:coverage

# Lint (if configured)
npm run lint

# Size analysis
npm run size:why
```

---

## Week 8 Checklist

Database Integration:
- [ ] PostgreSQL adapter
- [ ] MongoDB adapter  
- [ ] SQLite adapter
- [ ] Redis integration
- [ ] Connection pooling
- [ ] Schema definitions
- [ ] Migration system
- [ ] Repository pattern

API & Microservices:
- [ ] REST API specification (OpenAPI)
- [ ] GraphQL schema (optional)
- [ ] WebSocket support
- [ ] Express.js example
- [ ] Next.js API route example

Observability & Monitoring:
- [ ] Structured logging
- [ ] Prometheus metrics
- [ ] OpenTelemetry tracing
- [ ] Health check endpoints
- [ ] Error tracking integration

Testing & Documentation:
- [ ] Database integration tests
- [ ] Connection pool tests
- [ ] Migration tests
- [ ] API documentation
- [ ] Database guides
- [ ] Docker examples
