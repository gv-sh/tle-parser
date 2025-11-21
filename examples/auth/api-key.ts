/**
 * API Key Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';

interface ApiKeyConfig {
  headerName?: string;
  keys?: string[];
  validateKey?: (key: string) => Promise<boolean>;
}

/**
 * API Key Authentication Middleware
 */
export function apiKeyAuth(config: ApiKeyConfig = {}) {
  const {
    headerName = 'X-API-Key',
    keys = [],
    validateKey,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header(headerName);

    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: `API key is required in ${headerName} header`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      // Use custom validation function if provided
      if (validateKey) {
        const isValid = await validateKey(apiKey);
        if (!isValid) {
          return res.status(403).json({
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid API key',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
      // Otherwise check against provided keys array
      else if (keys.length > 0 && !keys.includes(apiKey)) {
        return res.status(403).json({
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid API key',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Store API key in request for later use
      (req as any).apiKey = apiKey;
      next();
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Example usage with database validation
 */
export async function validateApiKeyFromDatabase(apiKey: string): Promise<boolean> {
  // In production, query your database
  // Example:
  // const key = await db.apiKeys.findOne({ key: apiKey, active: true });
  // return !!key;

  // For demo purposes, accept any key
  return true;
}
