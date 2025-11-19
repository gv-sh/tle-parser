# Express.js Middleware for TLE Parser

Express middleware and route handlers for TLE parsing and satellite tracking APIs.

## Installation

```bash
npm install express tle-parser
```

## Quick Start

```typescript
import express from 'express';
import { createTLERouter } from './middleware';

const app = express();
app.use(express.json());

// Mount TLE router
app.use('/api/tle', createTLERouter());

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Endpoints

### Parse TLE

```http
POST /api/tle/parse
Content-Type: application/json

{
  "line1": "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990",
  "line2": "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018",
  "line0": "ISS (ZARYA)"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "satelliteName": "ISS (ZARYA)",
    "satelliteNumber": 25544,
    "inclination": 51.6461,
    ...
  }
}
```

### Calculate Position

```http
POST /api/tle/position
Content-Type: application/json

{
  "line1": "...",
  "line2": "...",
  "date": "2024-01-01T00:00:00Z"
}
```

### Track Satellite

```http
POST /api/tle/track
Content-Type: application/json

{
  "line1": "...",
  "line2": "...",
  "groundLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 0
  }
}
```

### Visibility Windows

```http
POST /api/tle/visibility
Content-Type: application/json

{
  "line1": "...",
  "line2": "...",
  "groundLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 0
  },
  "days": 7
}
```

### Fetch TLE Data

```http
GET /api/tle/fetch/celestrak?group=stations&satellites=ISS
```

## Complete Example

```typescript
import express from 'express';
import cors from 'cors';
import {
  tleParser,
  satelliteTracker,
  visibilityWindows,
  tleFetcher,
  tleCache,
  errorHandler
} from './middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// TLE Routes with caching
app.post('/api/tle/parse', tleCache(), tleParser());
app.post('/api/tle/track', satelliteTracker());
app.post('/api/tle/visibility', visibilityWindows());
app.get('/api/tle/fetch/:source', tleFetcher());

// Error handling
app.use(errorHandler());

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TLE API server running on port ${PORT}`);
});
```

## License

MIT
