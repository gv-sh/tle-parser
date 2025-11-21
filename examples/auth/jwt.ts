/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtConfig {
  secret: string;
  algorithms?: jwt.Algorithm[];
  headerName?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  roles?: string[];
  [key: string]: any;
}

/**
 * JWT Authentication Middleware
 */
export function jwtAuth(config: JwtConfig) {
  const {
    secret,
    algorithms = ['HS256'],
    headerName = 'Authorization',
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header(headerName);

    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, secret, { algorithms }) as JwtPayload;

      // Store user info in request
      (req as any).user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
            timestamp: new Date().toISOString(),
          },
        });
      }

      return res.status(403).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JwtPayload, secret: string, expiresIn: string = '1h'): string {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!user.roles || !roles.some((role) => user.roles.includes(role))) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
}
