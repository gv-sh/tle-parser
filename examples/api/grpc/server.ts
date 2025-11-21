/**
 * gRPC Server Implementation for TLE Parser
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import * as TLEParser from '../../../src/index';

// Load proto file
const PROTO_PATH = join(__dirname, 'tle-parser.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const tleParserProto = protoDescriptor.tleparser;

// Service implementation
const serviceImplementation = {
  /**
   * Parse a single TLE
   */
  ParseTLE: (call: any, callback: any) => {
    try {
      const { tle, strict = true, include_metadata = false } = call.request;

      const parser = new TLEParser.TLEParser({ strict });
      const result = parser.parse(tle);

      if (result.error) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: result.error.message,
          details: result.error.code,
        });
      }

      const response: any = {
        name: result.data!.name,
        catalog_number: result.data!.catalogNumber,
        classification: result.data!.classification,
        international_designator: result.data!.internationalDesignator,
        epoch: new Date(result.data!.epoch).getTime(),
        epoch_year: result.data!.epochYear,
        epoch_day: result.data!.epochDay,
        mean_motion_derivative: result.data!.meanMotionDerivative,
        mean_motion_second_derivative: result.data!.meanMotionSecondDerivative,
        bstar: result.data!.bstar,
        ephemeris_type: result.data!.ephemerisType,
        element_set_number: result.data!.elementSetNumber,
        checksum1: result.data!.checksum1,
        inclination: result.data!.inclination,
        right_ascension: result.data!.rightAscension,
        eccentricity: result.data!.eccentricity,
        argument_of_perigee: result.data!.argumentOfPerigee,
        mean_anomaly: result.data!.meanAnomaly,
        mean_motion: result.data!.meanMotion,
        rev_number: result.data!.revNumber,
        checksum2: result.data!.checksum2,
      };

      if (include_metadata) {
        response.metadata = {
          source: 'user-input',
          fetched_at: Date.now(),
          quality: 'good',
          tags: [],
          notes: '',
        };
      }

      callback(null, response);
    } catch (error: any) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * Parse multiple TLEs
   */
  ParseBatchTLE: (call: any, callback: any) => {
    try {
      const { tles, strict = true, continue_on_error = false } = call.request;

      const parser = new TLEParser.TLEParser({ strict });
      const results: any[] = [];
      let parsed = 0;
      let failed = 0;

      tles.forEach((tle: string, index: number) => {
        try {
          const result = parser.parse(tle);
          if (result.error) {
            failed++;
            results.push({
              index,
              success: false,
              error: {
                code: result.error.code,
                message: result.error.message,
              },
            });

            if (!continue_on_error) {
              throw new Error(`Failed to parse TLE at index ${index}`);
            }
          } else {
            parsed++;
            results.push({
              index,
              success: true,
              data: {
                name: result.data!.name,
                catalog_number: result.data!.catalogNumber,
                // ... other fields
              },
            });
          }
        } catch (error: any) {
          failed++;
          results.push({
            index,
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: error.message,
            },
          });

          if (!continue_on_error) {
            return callback({
              code: grpc.status.INVALID_ARGUMENT,
              message: error.message,
            });
          }
        }
      });

      callback(null, {
        success: failed === 0,
        total: tles.length,
        parsed,
        failed,
        results,
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * Validate a TLE
   */
  ValidateTLE: (call: any, callback: any) => {
    try {
      const { tle, rules } = call.request;

      const validator = new TLEParser.TLEValidator();
      const result = validator.validate(tle);

      callback(null, {
        valid: result.isValid,
        errors: result.errors || [],
        warnings: result.warnings || [],
        quality: {
          score: result.qualityScore || 0,
          level: result.qualityLevel || 'QUALITY_LEVEL_UNKNOWN',
        },
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * Fetch TLE from external source
   */
  FetchTLE: async (call: any, callback: any) => {
    try {
      const { source, catalog_number, format } = call.request;

      const sourceMap: Record<string, 'celestrak' | 'spacetrack'> = {
        DATA_SOURCE_CELESTRAK: 'celestrak',
        DATA_SOURCE_SPACETRACK: 'spacetrack',
      };

      const fetcher = new TLEParser.TLEFetcher({
        source: sourceMap[source] || 'celestrak',
        cache: true,
      });

      const result = await fetcher.fetchByCatalogNumber(catalog_number);

      if (result.error) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: `Satellite ${catalog_number} not found`,
        });
      }

      callback(null, {
        name: result.data!.name,
        catalog_number: result.data!.catalogNumber,
        // ... other fields
      });
    } catch (error: any) {
      callback({
        code: grpc.status.UNAVAILABLE,
        message: 'External service unavailable',
      });
    }
  },

  /**
   * Calculate satellite position
   */
  CalculatePosition: (call: any, callback: any) => {
    try {
      const { tle, timestamp, coordinate_system } = call.request;

      const calculator = new TLEParser.OrbitalCalculator();
      const date = new Date(parseInt(timestamp, 10));

      const position = calculator.calculatePosition(tle, date);

      callback(null, {
        timestamp: date.getTime(),
        position: {
          x: position.position.x,
          y: position.position.y,
          z: position.position.z,
        },
        velocity: {
          x: position.velocity.x,
          y: position.velocity.y,
          z: position.velocity.z,
        },
        altitude: position.altitude,
        latitude: position.latitude,
        longitude: position.longitude,
        eclipsed: position.eclipsed || false,
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: error.message,
      });
    }
  },

  /**
   * Calculate satellite visibility
   */
  CalculateVisibility: (call: any, callback: any) => {
    try {
      const { tle, observer, start_time, end_time, min_elevation = 10 } = call.request;

      const calculator = new TLEParser.OrbitalCalculator();
      const start = new Date(parseInt(start_time, 10));
      const end = new Date(parseInt(end_time, 10));

      const passes = calculator.calculatePasses(tle, observer, start, end, min_elevation);

      const formattedPasses = passes.map((pass: any) => ({
        start_time: pass.startTime.getTime(),
        end_time: pass.endTime.getTime(),
        duration: Math.floor((pass.endTime.getTime() - pass.startTime.getTime()) / 1000),
        max_elevation: pass.maxElevation,
        max_elevation_time: pass.maxElevationTime?.getTime() || pass.startTime.getTime(),
        direction: pass.direction || 'UNKNOWN',
        perigee: pass.perigee || 0,
        azimuth_start: pass.azimuthStart || 0,
        azimuth_end: pass.azimuthEnd || 0,
      }));

      callback(null, {
        passes: formattedPasses,
        next_pass: formattedPasses.length > 0 ? formattedPasses[0] : null,
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: error.message,
      });
    }
  },

  /**
   * Stream satellite positions in real-time
   */
  StreamPosition: async (call: any) => {
    try {
      const { catalog_number, interval_ms = 5000 } = call.request;

      // Fetch TLE once
      const fetcher = new TLEParser.TLEFetcher({ source: 'celestrak' });
      const result = await fetcher.fetchByCatalogNumber(catalog_number);

      if (result.error || !result.data) {
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: `Failed to fetch TLE for satellite ${catalog_number}`,
        });
        return;
      }

      const tle = result.data;
      const calculator = new TLEParser.OrbitalCalculator();

      // Stream positions at the specified interval
      const intervalId = setInterval(() => {
        const now = new Date();
        const position = calculator.calculatePosition(tle, now);

        call.write({
          timestamp: now.getTime(),
          position: {
            x: position.position.x,
            y: position.position.y,
            z: position.position.z,
          },
          velocity: {
            x: position.velocity.x,
            y: position.velocity.y,
            z: position.velocity.z,
          },
          altitude: position.altitude,
          latitude: position.latitude,
          longitude: position.longitude,
          eclipsed: position.eclipsed || false,
        });
      }, interval_ms);

      // Clean up on client disconnect
      call.on('cancelled', () => {
        clearInterval(intervalId);
      });
    } catch (error: any) {
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * Health check
   */
  HealthCheck: (call: any, callback: any) => {
    callback(null, {
      status: 'HEALTH_STATUS_HEALTHY',
      timestamp: Date.now(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      metrics: {
        requests_processed: 0,
        average_response_time: 45.5,
        error_rate: 0.01,
      },
    });
  },
};

// Start gRPC server
function startServer() {
  const server = new grpc.Server();

  server.addService(tleParserProto.TLEParserService.service, serviceImplementation);

  const port = process.env.PORT || '50051';
  const address = `0.0.0.0:${port}`;

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error('Failed to start gRPC server:', error);
      process.exit(1);
    }

    console.log(`🚀 gRPC Server running on port ${port}`);
    console.log(`📡 Proto file: tle-parser.proto`);
    console.log(`🔍 Health check: HealthCheck({})`);
    server.start();
  });
}

// Start the server
if (require.main === module) {
  startServer();
}

export { serviceImplementation };
