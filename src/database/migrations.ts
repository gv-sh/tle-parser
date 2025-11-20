/**
 * Database Migration Management System
 * Provides migration tracking and execution for all database adapters
 */

import type {
  Migration,
  MigrationStatus,
  IMigrationManager,
  IDatabaseAdapter,
  DatabaseOperationResult,
} from './types';

/**
 * Migration registry for different databases
 */
export class MigrationRegistry {
  private migrations: Map<string, Migration[]> = new Map();

  /**
   * Register a migration
   */
  register(databaseType: string, migration: Migration): void {
    const migrations = this.migrations.get(databaseType) || [];
    migrations.push(migration);
    // Sort by timestamp
    migrations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.migrations.set(databaseType, migrations);
  }

  /**
   * Get migrations for a database type
   */
  get(databaseType: string): Migration[] {
    return this.migrations.get(databaseType) || [];
  }

  /**
   * Get all database types
   */
  getDatabaseTypes(): string[] {
    return Array.from(this.migrations.keys());
  }
}

/**
 * Global migration registry
 */
export const migrationRegistry = new MigrationRegistry();

/**
 * Migration manager implementation
 */
export class MigrationManager implements IMigrationManager {
  private appliedMigrations: Set<string> = new Set();

  constructor(
    private adapter: IDatabaseAdapter,
    private databaseType: string
  ) {}

  /**
   * Initialize migration tracking table
   */
  private async initMigrationTable(): Promise<void> {
    // Implementation would create migration tracking table
    // For SQL databases:
    // CREATE TABLE IF NOT EXISTS migrations (
    //   id VARCHAR(255) PRIMARY KEY,
    //   name VARCHAR(255) NOT NULL,
    //   applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //   status VARCHAR(50) NOT NULL
    // );
  }

  /**
   * Load applied migrations from database
   */
  private async loadAppliedMigrations(): Promise<void> {
    // Implementation would load from migrations table
    // const result = await this.adapter.query({ /* migrations table query */ });
    // result.data?.forEach(row => this.appliedMigrations.add(row.id));
  }

  /**
   * Mark migration as applied
   */
  private async markMigrationApplied(migration: Migration): Promise<void> {
    // Implementation would insert into migrations table
    // await this.adapter.insertTLE({ id: migration.id, name: migration.name, status: 'applied' });
    this.appliedMigrations.add(migration.id);
  }

  /**
   * Mark migration as reverted
   */
  private async markMigrationReverted(migration: Migration): Promise<void> {
    // Implementation would update migrations table
    // await this.adapter.deleteTLE(migration.id);
    this.appliedMigrations.delete(migration.id);
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<DatabaseOperationResult<MigrationStatus[]>> {
    const startTime = Date.now();
    const statuses: MigrationStatus[] = [];

    try {
      await this.initMigrationTable();
      await this.loadAppliedMigrations();

      const migrations = migrationRegistry.get(this.databaseType);
      const pending = migrations.filter(m => !this.appliedMigrations.has(m.id));

      for (const migration of pending) {
        try {
          console.log(`Running migration: ${migration.name}`);
          await migration.up(this.adapter);
          await this.markMigrationApplied(migration);

          statuses.push({
            id: migration.id,
            name: migration.name,
            appliedAt: new Date(),
            status: 'applied',
          });
        } catch (error) {
          console.error(`Migration failed: ${migration.name}`, error);
          statuses.push({
            id: migration.id,
            name: migration.name,
            appliedAt: null,
            status: 'failed',
          });
          throw error;
        }
      }

      return {
        success: true,
        data: statuses,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<DatabaseOperationResult<MigrationStatus>> {
    const startTime = Date.now();

    try {
      await this.loadAppliedMigrations();

      const migrations = migrationRegistry.get(this.databaseType);
      const applied = migrations.filter(m => this.appliedMigrations.has(m.id));

      if (applied.length === 0) {
        throw new Error('No migrations to rollback');
      }

      const lastMigration = applied[applied.length - 1];

      console.log(`Rolling back migration: ${lastMigration.name}`);
      await lastMigration.down(this.adapter);
      await this.markMigrationReverted(lastMigration);

      const status: MigrationStatus = {
        id: lastMigration.id,
        name: lastMigration.name,
        appliedAt: null,
        status: 'pending',
      };

      return {
        success: true,
        data: status,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<DatabaseOperationResult<MigrationStatus[]>> {
    const startTime = Date.now();

    try {
      await this.loadAppliedMigrations();

      const migrations = migrationRegistry.get(this.databaseType);
      const statuses: MigrationStatus[] = migrations.map(m => ({
        id: m.id,
        name: m.name,
        appliedAt: this.appliedMigrations.has(m.id) ? m.timestamp : null,
        status: this.appliedMigrations.has(m.id) ? 'applied' : 'pending',
      }));

      return {
        success: true,
        data: statuses,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Reset database (rollback all migrations)
   */
  async reset(): Promise<DatabaseOperationResult<void>> {
    const startTime = Date.now();

    try {
      await this.loadAppliedMigrations();

      const migrations = migrationRegistry.get(this.databaseType);
      const applied = migrations
        .filter(m => this.appliedMigrations.has(m.id))
        .reverse(); // Rollback in reverse order

      for (const migration of applied) {
        console.log(`Rolling back migration: ${migration.name}`);
        await migration.down(this.adapter);
        await this.markMigrationReverted(migration);
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
      };
    }
  }
}

/**
 * Example PostgreSQL migrations
 */
export const postgresqlMigrations = {
  /**
   * Initial schema migration
   */
  initial: {
    id: '001_initial_schema',
    name: 'Create initial TLE tables',
    timestamp: new Date('2024-01-01'),
    async up(adapter: IDatabaseAdapter) {
      // Would execute POSTGRESQL_SCHEMA from postgresql.ts
      console.log('Creating initial PostgreSQL schema...');
    },
    async down(adapter: IDatabaseAdapter) {
      // Would drop all tables
      console.log('Dropping PostgreSQL schema...');
    },
  } as Migration,

  /**
   * Add PostGIS support
   */
  postgis: {
    id: '002_add_postgis',
    name: 'Enable PostGIS extension',
    timestamp: new Date('2024-01-02'),
    async up(adapter: IDatabaseAdapter) {
      // Would execute: CREATE EXTENSION IF NOT EXISTS postgis;
      console.log('Enabling PostGIS extension...');
    },
    async down(adapter: IDatabaseAdapter) {
      // Would execute: DROP EXTENSION IF EXISTS postgis;
      console.log('Disabling PostGIS extension...');
    },
  } as Migration,
};

/**
 * Example MongoDB migrations
 */
export const mongodbMigrations = {
  /**
   * Create indexes migration
   */
  indexes: {
    id: '001_create_indexes',
    name: 'Create MongoDB indexes',
    timestamp: new Date('2024-01-01'),
    async up(adapter: IDatabaseAdapter) {
      await adapter.createIndexes();
      console.log('Created MongoDB indexes');
    },
    async down(adapter: IDatabaseAdapter) {
      // Would drop indexes
      console.log('Dropped MongoDB indexes');
    },
  } as Migration,

  /**
   * Add schema validation
   */
  validation: {
    id: '002_add_validation',
    name: 'Add schema validation',
    timestamp: new Date('2024-01-02'),
    async up(adapter: IDatabaseAdapter) {
      // Would add MONGODB_SCHEMA_VALIDATION from mongodb.ts
      console.log('Added schema validation');
    },
    async down(adapter: IDatabaseAdapter) {
      // Would remove validation
      console.log('Removed schema validation');
    },
  } as Migration,
};

/**
 * Register all migrations
 */
export function registerAllMigrations(): void {
  // PostgreSQL migrations
  migrationRegistry.register('postgresql', postgresqlMigrations.initial);
  migrationRegistry.register('postgresql', postgresqlMigrations.postgis);

  // MongoDB migrations
  migrationRegistry.register('mongodb', mongodbMigrations.indexes);
  migrationRegistry.register('mongodb', mongodbMigrations.validation);

  // Additional migrations can be registered here
}

/**
 * Create migration manager for a database adapter
 */
export function createMigrationManager(
  adapter: IDatabaseAdapter,
  databaseType: string
): MigrationManager {
  return new MigrationManager(adapter, databaseType);
}

/**
 * Generate migration template
 */
export function generateMigrationTemplate(
  name: string,
  databaseType: string
): string {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const id = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;

  return `
/**
 * Migration: ${name}
 * Database: ${databaseType}
 * Created: ${new Date().toISOString()}
 */

import type { Migration, IDatabaseAdapter } from './types';

export const migration: Migration = {
  id: '${id}',
  name: '${name}',
  timestamp: new Date('${new Date().toISOString()}'),

  async up(adapter: IDatabaseAdapter): Promise<void> {
    // TODO: Implement migration up
    console.log('Running migration: ${name}');
  },

  async down(adapter: IDatabaseAdapter): Promise<void> {
    // TODO: Implement migration down
    console.log('Rolling back migration: ${name}');
  },
};
  `.trim();
}
