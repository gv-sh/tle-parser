/**
 * TLE Parser REST API Server
 * Reference implementation of the OpenAPI specification
 */

import express, { Request, Response, NextFunction } from 'express';
import * as TLEParser from '../../../src/index';

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = 'v1';

// Middleware
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-API-Key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API key authentication middleware
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');

  // In production, validate against a database or secure store
  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Simple validation for demo purposes
  if (apiKey !== process.env.API_KEY && process.env.API_KEY) {
    return res.status(403).json({
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.header('X-API-Key') || req.ip;
  const now = Date.now();

  if (!clientId) {
    return next();
  }

  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (clientData.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        details: {
          limit: RATE_LIMIT,
          windowMs: RATE_LIMIT_WINDOW,
          resetAt: new Date(clientData.resetTime).toISOString()
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  clientData.count++;
  next();
};

// Apply rate limiting to all API routes
app.use(`/${API_VERSION}`, rateLimiter);

// Health check endpoint
app.get(`/${API_VERSION}/health`, (req: Request, res: Response) => {
  const uptime = process.uptime();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor(uptime),
    metrics: {
      requestsProcessed: rateLimitMap.size,
      averageResponseTime: 45.5,
      errorRate: 0.01
    }
  });
});

// Parse single TLE
app.post(`/${API_VERSION}/parse`, apiKeyAuth, (req: Request, res: Response) => {
  try {
    const { tle, strict = true, includeMetadata = false } = req.body;

    if (!tle) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TLE',
          message: 'TLE data is required',
          field: 'tle',
          timestamp: new Date().toISOString()
        }
      });
    }

    const parser = new TLEParser.TLEParser({ strict });
    const result = parser.parse(tle);

    if (result.error) {
      return res.status(400).json({
        error: {
          code: result.error.code || 'PARSE_ERROR',
          message: result.error.message,
          details: result.error.details,
          timestamp: new Date().toISOString()
        }
      });
    }

    const response: any = result.data;

    if (includeMetadata) {
      response.metadata = {
        parsedAt: new Date().toISOString(),
        strict,
        version: '1.0.0'
      };
    }

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Parse batch TLEs
app.post(`/${API_VERSION}/parse/batch`, apiKeyAuth, (req: Request, res: Response) => {
  try {
    const contentType = req.header('Content-Type');
    let tles: string[];
    let strict = true;
    let continueOnError = false;

    if (contentType?.includes('application/json')) {
      const body = req.body;
      tles = body.tles;
      strict = body.strict !== undefined ? body.strict : true;
      continueOnError = body.continueOnError || false;
    } else if (contentType?.includes('text/plain')) {
      // Parse raw TLE text
      const rawText = req.body as string;
      tles = rawText.split('\n\n').filter(t => t.trim());
    } else {
      return res.status(400).json({
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json or text/plain',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!Array.isArray(tles) || tles.length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TLES',
          message: 'TLEs array is required',
          field: 'tles',
          timestamp: new Date().toISOString()
        }
      });
    }

    const parser = new TLEParser.TLEParser({ strict });
    const results: any[] = [];
    let parsed = 0;
    let failed = 0;

    tles.forEach((tle, index) => {
      try {
        const result = parser.parse(tle);
        if (result.error) {
          failed++;
          results.push({
            index,
            success: false,
            error: {
              code: result.error.code,
              message: result.error.message
            }
          });

          if (!continueOnError) {
            throw new Error(`Failed to parse TLE at index ${index}`);
          }
        } else {
          parsed++;
          results.push({
            index,
            success: true,
            data: result.data
          });
        }
      } catch (error: any) {
        failed++;
        results.push({
          index,
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: error.message
          }
        });

        if (!continueOnError) {
          throw error;
        }
      }
    });

    res.json({
      success: failed === 0,
      total: tles.length,
      parsed,
      failed,
      results
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Validate TLE
app.post(`/${API_VERSION}/validate`, apiKeyAuth, (req: Request, res: Response) => {
  try {
    const { tle, rules } = req.body;

    if (!tle) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TLE',
          message: 'TLE data is required',
          field: 'tle',
          timestamp: new Date().toISOString()
        }
      });
    }

    const validator = new TLEParser.TLEValidator();
    const result = validator.validate(tle);

    res.json({
      valid: result.isValid,
      errors: result.errors || [],
      warnings: result.warnings || [],
      quality: {
        score: result.qualityScore || 0,
        level: result.qualityLevel || 'unknown'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Fetch TLE from external source
app.get(`/${API_VERSION}/fetch/:source/:catalogNumber`, apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { source, catalogNumber } = req.params;
    const { format = 'json' } = req.query;

    if (!['celestrak', 'spacetrack'].includes(source)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SOURCE',
          message: 'Source must be either celestrak or spacetrack',
          field: 'source',
          timestamp: new Date().toISOString()
        }
      });
    }

    const catNum = parseInt(catalogNumber, 10);
    if (isNaN(catNum) || catNum < 1) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CATALOG_NUMBER',
          message: 'Catalog number must be a positive integer',
          field: 'catalogNumber',
          timestamp: new Date().toISOString()
        }
      });
    }

    const fetcher = new TLEParser.TLEFetcher({
      source: source as 'celestrak' | 'spacetrack',
      cache: true
    });

    const result = await fetcher.fetchByCatalogNumber(catNum);

    if (result.error) {
      return res.status(404).json({
        error: {
          code: 'SATELLITE_NOT_FOUND',
          message: `Satellite ${catalogNumber} not found in ${source}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Format conversion if requested
    if (format !== 'json') {
      const formatter = new TLEParser.OutputFormatter();
      const formatted = formatter.format(result.data!, format as any);
      return res.type(format === 'xml' ? 'application/xml' : 'text/plain').send(formatted);
    }

    res.json(result.data);
  } catch (error: any) {
    res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'External service unavailable',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Calculate satellite position
app.post(`/${API_VERSION}/calculate/position`, apiKeyAuth, (req: Request, res: Response) => {
  try {
    const { tle, timestamp, coordinateSystem = 'TEME' } = req.body;

    if (!tle || !timestamp) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'TLE and timestamp are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const calculator = new TLEParser.OrbitalCalculator();
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TIMESTAMP',
          message: 'Invalid timestamp format',
          field: 'timestamp',
          timestamp: new Date().toISOString()
        }
      });
    }

    const position = calculator.calculatePosition(tle, date);

    res.json({
      timestamp: date.toISOString(),
      position: {
        x: position.position.x,
        y: position.position.y,
        z: position.position.z
      },
      velocity: {
        x: position.velocity.x,
        y: position.velocity.y,
        z: position.velocity.z
      },
      altitude: position.altitude,
      latitude: position.latitude,
      longitude: position.longitude
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Calculate satellite visibility
app.post(`/${API_VERSION}/calculate/visibility`, apiKeyAuth, (req: Request, res: Response) => {
  try {
    const { tle, observer, startTime, endTime, minElevation = 10 } = req.body;

    if (!tle || !observer || !startTime || !endTime) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'TLE, observer, startTime, and endTime are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const calculator = new TLEParser.OrbitalCalculator();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TIMESTAMP',
          message: 'Invalid timestamp format',
          timestamp: new Date().toISOString()
        }
      });
    }

    const passes = calculator.calculatePasses(tle, observer, start, end, minElevation);

    res.json({
      passes: passes.map(pass => ({
        startTime: pass.startTime.toISOString(),
        endTime: pass.endTime.toISOString(),
        maxElevation: pass.maxElevation,
        duration: Math.floor((pass.endTime.getTime() - pass.startTime.getTime()) / 1000),
        direction: pass.direction
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TLE Parser API Server running on port ${PORT}`);
    console.log(`API Version: ${API_VERSION}`);
    console.log(`Health check: http://localhost:${PORT}/${API_VERSION}/health`);
    console.log(`OpenAPI spec: See openapi.yaml`);
  });
}

export default app;
