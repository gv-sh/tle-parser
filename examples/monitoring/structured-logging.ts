/**
 * Structured Logging for TLE Parser API
 */

import * as winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Create format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format,
  }),
];

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

/**
 * HTTP request logger middleware
 */
export function httpLogger(req: any, res: any, next: any) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      apiKey: req.apiKey ? '***' : undefined,
    });
  });

  next();
}

/**
 * Log TLE parse operation
 */
export function logTLEParse(
  status: 'success' | 'error',
  duration: number,
  catalogNumber?: number,
  error?: string
) {
  logger.info('TLE Parse', {
    operation: 'parse',
    status,
    duration,
    catalogNumber,
    error,
  });
}

/**
 * Log orbital calculation
 */
export function logOrbitalCalc(
  type: 'position' | 'visibility' | 'passes',
  catalogNumber: number,
  duration: number
) {
  logger.info('Orbital Calculation', {
    operation: 'calculation',
    type,
    catalogNumber,
    duration,
  });
}

/**
 * Log cache operation
 */
export function logCacheOp(
  operation: 'hit' | 'miss' | 'set',
  key: string,
  ttl?: number
) {
  logger.debug('Cache Operation', {
    operation: 'cache',
    type: operation,
    key,
    ttl,
  });
}

/**
 * Log database operation
 */
export function logDbOp(
  operation: 'read' | 'write' | 'delete',
  collection: string,
  duration: number,
  status: 'success' | 'error',
  error?: string
) {
  logger.info('Database Operation', {
    operation: 'database',
    type: operation,
    collection,
    duration,
    status,
    error,
  });
}

/**
 * Log API error
 */
export function logApiError(
  errorCode: string,
  message: string,
  endpoint: string,
  details?: any
) {
  logger.error('API Error', {
    errorCode,
    message,
    endpoint,
    details,
  });
}

/**
 * Log WebSocket event
 */
export function logWsEvent(
  event: 'connection' | 'disconnection' | 'message' | 'error',
  clientId: string,
  details?: any
) {
  logger.info('WebSocket Event', {
    event,
    clientId,
    details,
  });
}
