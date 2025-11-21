/**
 * K6 Load Testing Script for TLE Parser API
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const parseTime = new Trend('parse_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate should be below 1%
    'errors': ['rate<0.05'],            // Custom error rate below 5%
  },
};

// Sample TLE data
const sampleTLE = `ISS (ZARYA)
1 25544U 98067A   24325.50000000  .00016717  00000-0  10270-3 0  9005
2 25544  51.6400 220.1003 0008380  87.5100  53.2300 15.50030060123456`;

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-key';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  // Test 1: Parse single TLE
  const parseSingleRes = http.post(
    `${BASE_URL}/v1/parse`,
    JSON.stringify({
      tle: sampleTLE,
      strict: true,
    }),
    { headers }
  );

  check(parseSingleRes, {
    'parse single status is 200': (r) => r.status === 200,
    'parse single has name': (r) => JSON.parse(r.body).name !== undefined,
  }) || errorRate.add(1);

  parseTime.add(parseSingleRes.timings.duration);

  sleep(1);

  // Test 2: Parse batch TLEs
  const parseBatchRes = http.post(
    `${BASE_URL}/v1/parse/batch`,
    JSON.stringify({
      tles: [sampleTLE, sampleTLE, sampleTLE],
      strict: true,
      continueOnError: false,
    }),
    { headers }
  );

  check(parseBatchRes, {
    'parse batch status is 200': (r) => r.status === 200,
    'parse batch success': (r) => JSON.parse(r.body).success === true,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Validate TLE
  const validateRes = http.post(
    `${BASE_URL}/v1/validate`,
    JSON.stringify({
      tle: sampleTLE,
    }),
    { headers }
  );

  check(validateRes, {
    'validate status is 200': (r) => r.status === 200,
    'validate is valid': (r) => JSON.parse(r.body).valid === true,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Calculate position
  const calcPosRes = http.post(
    `${BASE_URL}/v1/calculate/position`,
    JSON.stringify({
      tle: sampleTLE,
      timestamp: new Date().toISOString(),
      coordinateSystem: 'TEME',
    }),
    { headers }
  );

  check(calcPosRes, {
    'calc position status is 200': (r) => r.status === 200,
    'calc position has altitude': (r) => JSON.parse(r.body).altitude !== undefined,
  }) || errorRate.add(1);

  sleep(2);

  // Test 5: Health check
  const healthRes = http.get(`${BASE_URL}/v1/health`);

  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check is healthy': (r) => JSON.parse(r.body).status === 'healthy',
  }) || errorRate.add(1);

  sleep(1);
}

// Lifecycle hooks
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
}

export function teardown(data) {
  console.log('Load test completed!');
}

// Thresholds summary
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Load Test Summary:\n`;
  summary += `${indent}  Iterations: ${data.metrics.iterations.count}\n`;
  summary += `${indent}  VUs: ${data.metrics.vus.max}\n`;
  summary += `${indent}  Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}  HTTP Requests: ${data.metrics.http_reqs.count}\n`;
  summary += `${indent}  Failed Requests: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Avg Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms\n`;
  summary += `${indent}  p95 Response Time: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms\n`;

  return summary;
}
