/**
 * Prometheus Metrics for TLE Parser API
 */

import * as prometheus from 'prom-client';

// Create a Registry
export const register = new prometheus.Registry();

// Add default metrics (CPU, memory, etc.)
prometheus.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request duration
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections
export const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
  registers: [register],
});

// TLE parse operations
export const tleParseTotal = new prometheus.Counter({
  name: 'tle_parse_total',
  help: 'Total number of TLE parse operations',
  labelNames: ['status'],
  registers: [register],
});

// TLE parse duration
export const tleParseDuration = new prometheus.Histogram({
  name: 'tle_parse_duration_seconds',
  help: 'Duration of TLE parse operations',
  labelNames: ['status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

// Orbital calculation operations
export const orbitalCalcTotal = new prometheus.Counter({
  name: 'orbital_calculation_total',
  help: 'Total number of orbital calculations',
  labelNames: ['type'],
  registers: [register],
});

// Cache operations
export const cacheOperations = new prometheus.Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// Database operations
export const dbOperations = new prometheus.Counter({
  name: 'database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// WebSocket connections
export const wsConnections = new prometheus.Gauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// WebSocket messages
export const wsMessages = new prometheus.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'],
  registers: [register],
});

// API errors
export const apiErrors = new prometheus.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_code', 'endpoint'],
  registers: [register],
});

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(req: any, res: any) {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
}

/**
 * Track TLE parse operation
 */
export function trackTLEParse(status: 'success' | 'error', duration: number) {
  tleParseTotal.inc({ status });
  tleParseDuration.observe({ status }, duration);
}

/**
 * Track orbital calculation
 */
export function trackOrbitalCalc(type: 'position' | 'visibility' | 'passes') {
  orbitalCalcTotal.inc({ type });
}

/**
 * Track cache operation
 */
export function trackCacheOp(operation: 'hit' | 'miss' | 'set', status: 'success' | 'error' = 'success') {
  cacheOperations.inc({ operation, status });
}

/**
 * Track database operation
 */
export function trackDbOp(operation: 'read' | 'write' | 'delete', status: 'success' | 'error') {
  dbOperations.inc({ operation, status });
}

/**
 * Track WebSocket connection
 */
export function trackWsConnection(delta: number) {
  wsConnections.inc(delta);
}

/**
 * Track WebSocket message
 */
export function trackWsMessage(type: string, direction: 'in' | 'out') {
  wsMessages.inc({ type, direction });
}

/**
 * Track API error
 */
export function trackApiError(errorCode: string, endpoint: string) {
  apiErrors.inc({ error_code: errorCode, endpoint });
}
