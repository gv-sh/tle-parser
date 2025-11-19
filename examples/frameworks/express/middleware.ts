/**
 * Express.js Middleware for TLE Parser
 *
 * This module provides Express middleware for TLE parsing and satellite tracking APIs.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { tleParser, satelliteTracker, tleCache } from './middleware';
 *
 * const app = express();
 * app.use(express.json());
 * app.use('/api/tle', tleParser());
 * app.use('/api/track', satelliteTracker());
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import {
  parseTLE,
  ParsedTLE,
  calculatePosition,
  calculateVisibilityWindow,
  calculateLookAngles,
  fetchTLEData,
  TLECache,
  GroundLocation
} from 'tle-parser';

// Initialize cache
const cache = new TLECache({ ttl: 3600000 }); // 1 hour TTL

/**
 * TLE Parser Middleware
 * Parses TLE data from request body
 *
 * POST /api/tle/parse
 * Body: { line1: string, line2: string, line0?: string }
 */
export function tleParser() {
  return (req: Request, res: Response) => {
    try {
      const { line1, line2, line0 } = req.body;

      if (!line1 || !line2) {
        return res.status(400).json({
          error: 'Missing required fields: line1 and line2'
        });
      }

      const parsed = parseTLE(line1, line2, line0);

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * Satellite Position Middleware
 * Calculates satellite position at a specific time
 *
 * POST /api/tle/position
 * Body: { line1: string, line2: string, date?: string }
 */
export function satellitePosition() {
  return (req: Request, res: Response) => {
    try {
      const { line1, line2, line0, date } = req.body;

      if (!line1 || !line2) {
        return res.status(400).json({
          error: 'Missing required fields: line1 and line2'
        });
      }

      const tle = parseTLE(line1, line2, line0);
      const targetDate = date ? new Date(date) : new Date();
      const position = calculatePosition(tle, targetDate);

      res.json({
        success: true,
        data: {
          tle: tle.satelliteName,
          date: targetDate,
          position
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * Satellite Tracker Middleware
 * Real-time tracking endpoint
 *
 * POST /api/tle/track
 * Body: { line1: string, line2: string, groundLocation?: GroundLocation }
 */
export function satelliteTracker() {
  return (req: Request, res: Response) => {
    try {
      const { line1, line2, line0, groundLocation } = req.body;

      if (!line1 || !line2) {
        return res.status(400).json({
          error: 'Missing required fields: line1 and line2'
        });
      }

      const tle = parseTLE(line1, line2, line0);
      const now = new Date();
      const position = calculatePosition(tle, now);

      let lookAngles = null;
      let isVisible = false;

      if (groundLocation) {
        lookAngles = calculateLookAngles(tle, groundLocation as GroundLocation, now);
        isVisible = lookAngles.elevation > 0;
      }

      res.json({
        success: true,
        data: {
          tle: tle.satelliteName,
          timestamp: now,
          position,
          lookAngles,
          isVisible
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * Visibility Windows Middleware
 * Calculates visibility windows for a satellite
 *
 * POST /api/tle/visibility
 * Body: { line1: string, line2: string, groundLocation: GroundLocation, days?: number }
 */
export function visibilityWindows() {
  return (req: Request, res: Response) => {
    try {
      const { line1, line2, line0, groundLocation, days = 7 } = req.body;

      if (!line1 || !line2 || !groundLocation) {
        return res.status(400).json({
          error: 'Missing required fields: line1, line2, and groundLocation'
        });
      }

      const tle = parseTLE(line1, line2, line0);
      const windows = calculateVisibilityWindow(
        tle,
        groundLocation as GroundLocation,
        new Date(),
        days
      );

      res.json({
        success: true,
        data: {
          tle: tle.satelliteName,
          location: groundLocation,
          days,
          windows
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * TLE Fetch Middleware
 * Fetches TLE data from external sources
 *
 * GET /api/tle/fetch/:source
 * Query: { group?: string, satellites?: string[] }
 */
export function tleFetcher() {
  return async (req: Request, res: Response) => {
    try {
      const { source } = req.params;
      const query = req.query;

      const data = await fetchTLEData(source, query);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * TLE Cache Middleware
 * Adds caching layer to TLE requests
 */
export function tleCache() {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.body)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Store original send method
    const originalSend = res.json.bind(res);

    // Override send to cache response
    res.json = function (body: any) {
      if (body.success && body.data) {
        cache.set(cacheKey, body.data);
      }
      return originalSend(body);
    };

    next();
  };
}

/**
 * Error Handler Middleware
 * Handles errors in TLE operations
 */
export function errorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('TLE Error:', err);

    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  };
}

/**
 * Complete Express Router Example
 */
import { Router } from 'express';

export function createTLERouter() {
  const router = Router();

  // Parse TLE
  router.post('/parse', tleParser());

  // Calculate position
  router.post('/position', satellitePosition());

  // Track satellite
  router.post('/track', satelliteTracker());

  // Visibility windows
  router.post('/visibility', visibilityWindows());

  // Fetch TLE data
  router.get('/fetch/:source', tleFetcher());

  // Error handler
  router.use(errorHandler());

  return router;
}
