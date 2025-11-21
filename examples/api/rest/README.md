# TLE Parser REST API

A complete REST API implementation for the TLE Parser library, following the OpenAPI 3.0 specification.

## Features

- ✅ Full OpenAPI 3.0 specification
- ✅ API key authentication
- ✅ Rate limiting (100 requests/minute)
- ✅ Comprehensive error handling
- ✅ Request logging
- ✅ CORS support
- ✅ Multiple output formats (JSON, XML, CSV)
- ✅ Batch processing
- ✅ Health check endpoint
- ✅ API versioning (v1)

## Quick Start

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Environment Variables

```bash
PORT=3000              # Server port (default: 3000)
API_KEY=your-api-key   # Optional API key for authentication
```

## API Documentation

### Base URL

```
http://localhost:3000/v1
```

### Authentication

All endpoints (except `/health`) require an API key:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/v1/parse
```

### Endpoints

#### Health Check

```bash
GET /v1/health
```

Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-21T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "metrics": {
    "requestsProcessed": 10000,
    "averageResponseTime": 45.5,
    "errorRate": 0.01
  }
}
```

#### Parse TLE

```bash
POST /v1/parse
Content-Type: application/json
X-API-Key: your-api-key

{
  "tle": "ISS (ZARYA)\n1 25544U 98067A   24325.50000000  .00016717  00000-0  10270-3 0  9005\n2 25544  51.6400 220.1003 0008380  87.5100  53.2300 15.50030060123456",
  "strict": true,
  "includeMetadata": false
}
```

**Response:**
```json
{
  "name": "ISS (ZARYA)",
  "catalogNumber": 25544,
  "classification": "U",
  "epoch": "2024-11-21T12:00:00Z",
  "inclination": 51.64,
  "meanMotion": 15.50030060,
  ...
}
```

#### Parse Batch TLEs

```bash
POST /v1/parse/batch
Content-Type: application/json
X-API-Key: your-api-key

{
  "tles": ["tle1", "tle2", "tle3"],
  "strict": true,
  "continueOnError": false
}
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "parsed": 3,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "data": { ... }
    }
  ]
}
```

#### Validate TLE

```bash
POST /v1/validate
Content-Type: application/json
X-API-Key: your-api-key

{
  "tle": "...",
  "rules": ["checksum", "format"]
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "quality": {
    "score": 95,
    "level": "excellent"
  }
}
```

#### Fetch TLE from External Source

```bash
GET /v1/fetch/celestrak/25544?format=json
X-API-Key: your-api-key
```

**Parameters:**
- `source`: `celestrak` or `spacetrack`
- `catalogNumber`: NORAD catalog number
- `format`: `json`, `xml`, `csv`, or `tle` (optional, default: `json`)

**Response:**
```json
{
  "name": "ISS (ZARYA)",
  "catalogNumber": 25544,
  ...
}
```

#### Calculate Satellite Position

```bash
POST /v1/calculate/position
Content-Type: application/json
X-API-Key: your-api-key

{
  "tle": "...",
  "timestamp": "2024-11-21T10:30:00Z",
  "coordinateSystem": "TEME"
}
```

**Response:**
```json
{
  "timestamp": "2024-11-21T10:30:00Z",
  "position": {
    "x": 1234.56,
    "y": 2345.67,
    "z": 3456.78
  },
  "velocity": {
    "x": 7.5,
    "y": 0.5,
    "z": -1.2
  },
  "altitude": 408.5,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Calculate Satellite Visibility

```bash
POST /v1/calculate/visibility
Content-Type: application/json
X-API-Key: your-api-key

{
  "tle": "...",
  "observer": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 10
  },
  "startTime": "2024-11-21T00:00:00Z",
  "endTime": "2024-11-22T00:00:00Z",
  "minElevation": 10
}
```

**Response:**
```json
{
  "passes": [
    {
      "startTime": "2024-11-21T10:30:00Z",
      "endTime": "2024-11-21T10:40:00Z",
      "maxElevation": 45.5,
      "duration": 600,
      "direction": "NW to SE"
    }
  ]
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... },
    "field": "fieldName",
    "timestamp": "2024-11-21T10:30:00Z"
  }
}
```

### Common Error Codes

- `MISSING_API_KEY` - API key not provided
- `INVALID_API_KEY` - Invalid API key
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `MISSING_TLE` - TLE data not provided
- `INVALID_TLE_FORMAT` - Invalid TLE format
- `PARSE_ERROR` - Failed to parse TLE
- `SATELLITE_NOT_FOUND` - Satellite not found
- `SERVICE_UNAVAILABLE` - External service unavailable
- `INTERNAL_ERROR` - Internal server error

## Rate Limiting

The API implements rate limiting:

- **Limit:** 100 requests per minute per API key
- **Response:** 429 Too Many Requests when exceeded
- **Headers:** Rate limit info in response headers

## API Versioning

The API uses URL-based versioning:

- Current version: `v1`
- Base URL: `http://localhost:3000/v1`
- Future versions will be: `v2`, `v3`, etc.

## Testing

```bash
# Run tests
npm test

# Test with curl
curl -H "X-API-Key: test" http://localhost:3000/v1/health

# Test parse endpoint
curl -X POST http://localhost:3000/v1/parse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test" \
  -d '{"tle":"ISS (ZARYA)\n1 25544U 98067A   24325.50000000  .00016717  00000-0  10270-3 0  9005\n2 25544  51.6400 220.1003 0008380  87.5100  53.2300 15.50030060123456"}'
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available in `openapi.yaml`.

You can view it using:
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)

## Architecture

```
api-server.ts
├── Middleware
│   ├── CORS
│   ├── Request logging
│   ├── API key authentication
│   └── Rate limiting
├── Routes
│   ├── /health
│   ├── /parse
│   ├── /parse/batch
│   ├── /validate
│   ├── /fetch/:source/:catalogNumber
│   ├── /calculate/position
│   └── /calculate/visibility
└── Error Handlers
    ├── Error handler
    └── 404 handler
```

## Best Practices

1. **Authentication:** Always use API keys in production
2. **Rate Limiting:** Implement appropriate rate limits for your use case
3. **Error Handling:** Return consistent error responses
4. **Logging:** Log all requests and errors
5. **Monitoring:** Monitor API health and performance
6. **Caching:** Cache frequently accessed TLE data
7. **Validation:** Validate all input data
8. **Documentation:** Keep OpenAPI spec up to date

## Production Considerations

- Use environment variables for configuration
- Implement proper logging and monitoring
- Use HTTPS in production
- Store API keys securely (e.g., database, vault)
- Implement proper rate limiting per user/API key
- Add request validation and sanitization
- Use a reverse proxy (nginx, Apache)
- Implement database connection pooling
- Add distributed caching (Redis)
- Use load balancing for high availability

## License

MIT
