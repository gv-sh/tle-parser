/**
 * ORM Adapters for TLE Parser
 * Provides Prisma and TypeORM schema definitions
 */

import type { IORMAdapter, DatabaseOperationResult, ORMType } from './types';

/**
 * Prisma schema for TLE data
 */
export const PRISMA_SCHEMA = `
// Prisma schema for TLE Parser
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model TLEData {
  id                   BigInt   @id @default(autoincrement())

  // Satellite identification
  satelliteNumber      Int      @map("satellite_number")
  satelliteName        String?  @map("satellite_name")

  // Classification
  classification       String   @db.VarChar(1)

  // International Designator
  intlDesignatorYear   Int      @map("intl_designator_year") @db.SmallInt
  intlDesignatorLaunch Int      @map("intl_designator_launch") @db.SmallInt
  intlDesignatorPiece  String   @map("intl_designator_piece") @db.VarChar(3)

  // Epoch
  epochYear            Int      @map("epoch_year") @db.SmallInt
  epochDay             Float    @map("epoch_day")
  epochTimestamp       DateTime @map("epoch_timestamp")

  // Derivatives and drag
  meanMotionDerivative       Float @map("mean_motion_derivative")
  meanMotionSecondDerivative Float @map("mean_motion_second_derivative")
  bstar                      Float

  // Element set
  ephemerisType    Int @map("ephemeris_type") @db.SmallInt
  elementSetNumber Int @map("element_set_number")

  // Orbital elements
  inclination       Float @db.DoublePrecision
  rightAscension    Float @map("right_ascension") @db.DoublePrecision
  eccentricity      Float @db.DoublePrecision
  argumentOfPerigee Float @map("argument_of_perigee") @db.DoublePrecision
  meanAnomaly       Float @map("mean_anomaly") @db.DoublePrecision
  meanMotion        Float @map("mean_motion") @db.DoublePrecision
  revolutionNumber  Int   @map("revolution_number")

  // Calculated fields
  semiMajorAxis    Float? @map("semi_major_axis") @db.DoublePrecision
  orbitalPeriod    Float? @map("orbital_period") @db.DoublePrecision
  apogeeAltitude   Float? @map("apogee_altitude") @db.DoublePrecision
  perigeeAltitude  Float? @map("perigee_altitude") @db.DoublePrecision

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  version   Int      @default(1)

  // Relations
  constellations SatelliteConstellation[]

  @@unique([satelliteNumber, epochTimestamp], name: "unique_satellite_epoch")
  @@index([satelliteNumber], name: "idx_satellite_number")
  @@index([classification], name: "idx_classification")
  @@index([epochTimestamp], name: "idx_epoch_timestamp")
  @@index([inclination, eccentricity, meanMotion], name: "idx_orbital_elements")
  @@map("tle_data")
}

model Constellation {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(255)
  description String?
  operator    String?  @db.VarChar(255)
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  satellites SatelliteConstellation[]

  @@map("constellations")
}

model SatelliteConstellation {
  satelliteNumber Int @map("satellite_number")
  constellationId Int @map("constellation_id")

  // Relations
  satellite     TLEData       @relation(fields: [satelliteNumber], references: [satelliteNumber])
  constellation Constellation @relation(fields: [constellationId], references: [id], onDelete: Cascade)

  @@id([satelliteNumber, constellationId])
  @@index([satelliteNumber], name: "idx_sc_satellite")
  @@index([constellationId], name: "idx_sc_constellation")
  @@map("satellite_constellations")
}
`;

/**
 * TypeORM entities for TLE data
 */
export const TYPEORM_ENTITIES = `
/**
 * TypeORM entities for TLE Parser
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('tle_data')
@Index('idx_satellite_number', ['satelliteNumber'])
@Index('idx_classification', ['classification'])
@Index('idx_epoch_timestamp', ['epochTimestamp'])
@Index('idx_orbital_elements', ['inclination', 'eccentricity', 'meanMotion'])
export class TLEData {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  // Satellite identification
  @Column({ name: 'satellite_number', type: 'integer' })
  satelliteNumber: number;

  @Column({ name: 'satellite_name', type: 'varchar', nullable: true })
  satelliteName: string | null;

  // Classification
  @Column({ type: 'varchar', length: 1 })
  classification: string;

  // International Designator
  @Column({ name: 'intl_designator_year', type: 'smallint' })
  intlDesignatorYear: number;

  @Column({ name: 'intl_designator_launch', type: 'smallint' })
  intlDesignatorLaunch: number;

  @Column({ name: 'intl_designator_piece', type: 'varchar', length: 3 })
  intlDesignatorPiece: string;

  // Epoch
  @Column({ name: 'epoch_year', type: 'smallint' })
  epochYear: number;

  @Column({ name: 'epoch_day', type: 'double precision' })
  epochDay: number;

  @Column({ name: 'epoch_timestamp', type: 'timestamp without time zone' })
  epochTimestamp: Date;

  // Derivatives and drag
  @Column({ name: 'mean_motion_derivative', type: 'double precision' })
  meanMotionDerivative: number;

  @Column({ name: 'mean_motion_second_derivative', type: 'double precision' })
  meanMotionSecondDerivative: number;

  @Column({ type: 'double precision' })
  bstar: number;

  // Element set
  @Column({ name: 'ephemeris_type', type: 'smallint' })
  ephemerisType: number;

  @Column({ name: 'element_set_number', type: 'integer' })
  elementSetNumber: number;

  // Orbital elements
  @Column({ type: 'double precision' })
  inclination: number;

  @Column({ name: 'right_ascension', type: 'double precision' })
  rightAscension: number;

  @Column({ type: 'double precision' })
  eccentricity: number;

  @Column({ name: 'argument_of_perigee', type: 'double precision' })
  argumentOfPerigee: number;

  @Column({ name: 'mean_anomaly', type: 'double precision' })
  meanAnomaly: number;

  @Column({ name: 'mean_motion', type: 'double precision' })
  meanMotion: number;

  @Column({ name: 'revolution_number', type: 'integer' })
  revolutionNumber: number;

  // Calculated fields
  @Column({ name: 'semi_major_axis', type: 'double precision', nullable: true })
  semiMajorAxis: number | null;

  @Column({ name: 'orbital_period', type: 'double precision', nullable: true })
  orbitalPeriod: number | null;

  @Column({ name: 'apogee_altitude', type: 'double precision', nullable: true })
  apogeeAltitude: number | null;

  @Column({ name: 'perigee_altitude', type: 'double precision', nullable: true })
  perigeeAltitude: number | null;

  // Metadata
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'integer', default: 1 })
  version: number;

  // Relations
  @ManyToMany(() => Constellation, (constellation) => constellation.satellites)
  @JoinTable({
    name: 'satellite_constellations',
    joinColumn: { name: 'satellite_number', referencedColumnName: 'satelliteNumber' },
    inverseJoinColumn: { name: 'constellation_id', referencedColumnName: 'id' },
  })
  constellations: Constellation[];
}

@Entity('constellations')
export class Constellation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  operator: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToMany(() => TLEData, (tleData) => tleData.constellations)
  satellites: TLEData[];
}
`;

/**
 * Mongoose schema for MongoDB
 */
export const MONGOOSE_SCHEMA = `
/**
 * Mongoose schemas for TLE Parser
 */

import mongoose, { Schema, Document } from 'mongoose';

// TLE Data schema
interface ITLEData extends Document {
  satelliteNumber: number;
  satelliteName?: string;
  classification: string;
  epochTimestamp: Date;
  numeric: {
    satelliteNumber: number;
    inclination: number;
    eccentricity: number;
    meanMotion: number;
    rightAscension: number;
    argumentOfPerigee: number;
    meanAnomaly: number;
    epochYear: number;
    epochDay: number;
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const TLEDataSchema = new Schema<ITLEData>(
  {
    satelliteNumber: { type: Number, required: true, index: true },
    satelliteName: { type: String, index: true },
    classification: {
      type: String,
      required: true,
      enum: ['U', 'C', 'S'],
      index: true,
    },
    epochTimestamp: { type: Date, required: true, index: true },
    numeric: {
      satelliteNumber: { type: Number, required: true, min: 1, max: 99999 },
      inclination: { type: Number, required: true, min: 0, max: 180 },
      eccentricity: { type: Number, required: true, min: 0, max: 1 },
      meanMotion: { type: Number, required: true, min: 0 },
      rightAscension: { type: Number, required: true, min: 0, max: 360 },
      argumentOfPerigee: { type: Number, required: true, min: 0, max: 360 },
      meanAnomaly: { type: Number, required: true, min: 0, max: 360 },
      epochYear: { type: Number, required: true, min: 0, max: 99 },
      epochDay: { type: Number, required: true, min: 1, max: 366.99999999 },
    },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'tle_data',
  }
);

// Compound indexes
TLEDataSchema.index({ 'numeric.satelliteNumber': 1 });
TLEDataSchema.index({ 'numeric.epochYear': 1, 'numeric.epochDay': 1 });
TLEDataSchema.index({
  'numeric.inclination': 1,
  'numeric.eccentricity': 1,
  'numeric.meanMotion': 1,
});

export const TLEDataModel = mongoose.model<ITLEData>('TLEData', TLEDataSchema);
`;

/**
 * Prisma ORM adapter
 */
export class PrismaORMAdapter implements IORMAdapter {
  readonly type: ORMType = 'prisma';
  readonly schema: string = PRISMA_SCHEMA;

  async generateSchema(): Promise<string> {
    return this.schema;
  }

  async generateMigration(name: string): Promise<string> {
    // Would execute: npx prisma migrate dev --name ${name}
    return `Migration '${name}' generated for Prisma`;
  }

  async sync(): Promise<DatabaseOperationResult<void>> {
    const startTime = Date.now();

    try {
      // Would execute: npx prisma db push
      console.log('Syncing Prisma schema...');

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
 * TypeORM adapter
 */
export class TypeORMAdapter implements IORMAdapter {
  readonly type: ORMType = 'typeorm';
  readonly schema: string = TYPEORM_ENTITIES;

  async generateSchema(): Promise<string> {
    return this.schema;
  }

  async generateMigration(name: string): Promise<string> {
    // Would execute: npx typeorm migration:generate -n ${name}
    return `Migration '${name}' generated for TypeORM`;
  }

  async sync(): Promise<DatabaseOperationResult<void>> {
    const startTime = Date.now();

    try {
      // Would execute: synchronize: true in TypeORM config
      console.log('Syncing TypeORM schema...');

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
 * Create ORM adapter by type
 */
export function createORMAdapter(type: ORMType): IORMAdapter {
  switch (type) {
    case 'prisma':
      return new PrismaORMAdapter();
    case 'typeorm':
      return new TypeORMAdapter();
    default:
      throw new Error(\`Unsupported ORM type: \${type}\`);
  }
}

/**
 * Export ORM utilities
 */
export const ORMSchemas = {
  prisma: PRISMA_SCHEMA,
  typeorm: TYPEORM_ENTITIES,
  mongoose: MONGOOSE_SCHEMA,
} as const;
