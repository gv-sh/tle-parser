# TLE Parser GraphQL API

A complete GraphQL API implementation for the TLE Parser library with support for queries, mutations, and subscriptions.

## Features

- ✅ Complete GraphQL schema with types, queries, mutations, and subscriptions
- ✅ Real-time updates via GraphQL subscriptions
- ✅ Apollo Server implementation
- ✅ API key authentication
- ✅ GraphQL Playground for testing
- ✅ Type-safe resolvers
- ✅ Custom scalars (DateTime, JSON)
- ✅ Comprehensive error handling
- ✅ Health check queries

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
PORT=4000                      # Server port (default: 4000)
REQUIRE_API_KEY=false          # Require API key (default: false)
```

## API Documentation

### Base URL

```
http://localhost:4000/graphql
```

### GraphQL Playground

Access the interactive GraphQL Playground at:
```
http://localhost:4000/
```

### Authentication

For protected operations, include API key in headers:

```json
{
  "x-api-key": "your-api-key"
}
```

## Schema Overview

### Queries

#### Parse TLE

```graphql
query ParseTLE {
  parseTLE(input: {
    tle: """
      ISS (ZARYA)
      1 25544U 98067A   24325.50000000  .00016717  00000-0  10270-3 0  9005
      2 25544  51.6400 220.1003 0008380  87.5100  53.2300 15.50030060123456
    """
    strict: true
    includeMetadata: true
  }) {
    name
    catalogNumber
    inclination
    meanMotion
    epoch
    metadata {
      parsedAt
      quality
    }
  }
}
```

#### Parse Batch TLEs

```graphql
query ParseBatch {
  parseBatch(input: {
    tles: ["tle1", "tle2", "tle3"]
    strict: true
    continueOnError: true
  }) {
    success
    total
    parsed
    failed
    results {
      index
      success
      data {
        name
        catalogNumber
      }
      error {
        code
        message
      }
    }
  }
}
```

#### Validate TLE

```graphql
query ValidateTLE {
  validateTLE(input: {
    tle: "..."
    rules: ["checksum", "format"]
  }) {
    valid
    errors {
      code
      message
      field
    }
    warnings
    quality {
      score
      level
    }
  }
}
```

#### Fetch TLE from External Source

```graphql
query FetchTLE {
  fetchTLE(source: CELESTRAK, catalogNumber: 25544) {
    name
    catalogNumber
    epoch
    inclination
    meanMotion
  }
}
```

#### Search Satellites

```graphql
query SearchSatellites {
  searchSatellites(query: "ISS", limit: 10) {
    catalogNumber
    name
    objectType
    country
  }
}
```

#### Get Satellite

```graphql
query GetSatellite {
  getSatellite(catalogNumber: 25544) {
    catalogNumber
    name
    tle {
      epoch
      inclination
      meanMotion
    }
    objectType
    country
  }
}
```

#### Calculate Position

```graphql
query CalculatePosition {
  calculatePosition(input: {
    tle: "..."
    timestamp: "2024-11-21T10:30:00Z"
    coordinateSystem: TEME
  }) {
    timestamp
    position {
      x
      y
      z
    }
    velocity {
      x
      y
      z
    }
    altitude
    latitude
    longitude
    eclipsed
  }
}
```

#### Calculate Visibility

```graphql
query CalculateVisibility {
  calculateVisibility(input: {
    tle: "..."
    observer: {
      latitude: 40.7128
      longitude: -74.0060
      altitude: 10
    }
    startTime: "2024-11-21T00:00:00Z"
    endTime: "2024-11-22T00:00:00Z"
    minElevation: 10
  }) {
    passes {
      startTime
      endTime
      duration
      maxElevation
      maxElevationTime
      direction
      azimuthStart
      azimuthEnd
    }
    nextPass {
      startTime
      maxElevation
    }
  }
}
```

#### Health Check

```graphql
query Health {
  health {
    status
    timestamp
    version
    uptime
    metrics {
      requestsProcessed
      averageResponseTime
      errorRate
    }
  }
}
```

### Mutations

#### Store TLE

```graphql
mutation StoreTLE {
  storeTLE(input: {
    tle: "..."
    metadata: {
      source: "celestrak"
      tags: ["active", "iss"]
      notes: "ISS TLE"
    }
  }) {
    success
    catalogNumber
    message
    error {
      code
      message
    }
  }
}
```

#### Update TLE

```graphql
mutation UpdateTLE {
  updateTLE(catalogNumber: 25544, input: {
    tle: "..."
    metadata: {
      source: "spacetrack"
      tags: ["updated"]
    }
  }) {
    success
    catalogNumber
    updated
    message
  }
}
```

#### Delete TLE

```graphql
mutation DeleteTLE {
  deleteTLE(catalogNumber: 25544) {
    success
    catalogNumber
    deleted
    message
  }
}
```

### Subscriptions

#### Subscribe to TLE Updates

```graphql
subscription TLEUpdated {
  tleUpdated(catalogNumber: 25544) {
    name
    catalogNumber
    epoch
    meanMotion
  }
}
```

#### Subscribe to Position Updates

```graphql
subscription PositionUpdated {
  positionUpdated(catalogNumber: 25544, interval: 5000) {
    timestamp
    position {
      x
      y
      z
    }
    altitude
    latitude
    longitude
  }
}
```

#### Subscribe to All TLE Updates

```graphql
subscription AllTLEUpdates {
  allTLEUpdates {
    catalogNumber
    updateType
    timestamp
    tle {
      name
      epoch
    }
  }
}
```

## Custom Scalars

### DateTime

ISO 8601 date-time string:
```
"2024-11-21T10:30:00Z"
```

### JSON

Arbitrary JSON data:
```json
{
  "key": "value",
  "nested": {
    "data": true
  }
}
```

## Enums

### DataSource
- `CELESTRAK`
- `SPACETRACK`

### CoordinateSystem
- `TEME`
- `J2000`
- `ECEF`

### QualityLevel
- `EXCELLENT`
- `GOOD`
- `FAIR`
- `POOR`
- `UNKNOWN`

### UpdateType
- `NEW`
- `UPDATED`
- `DELETED`

### HealthStatusEnum
- `HEALTHY`
- `UNHEALTHY`
- `DEGRADED`

## Error Handling

All errors return a consistent structure:

```graphql
{
  error {
    code: String!
    message: String!
    field: String
    details: String
  }
}
```

## Testing

### Using GraphQL Playground

1. Start the server: `npm run dev`
2. Open browser: `http://localhost:4000`
3. Use the interactive playground to test queries

### Using curl

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "query": "query { health { status } }"
  }'
```

### Using Apollo Client (React)

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
  headers: {
    'x-api-key': 'your-api-key',
  },
});

const GET_HEALTH = gql`
  query GetHealth {
    health {
      status
      version
    }
  }
`;

const { data } = await client.query({ query: GET_HEALTH });
```

## Real-time Subscriptions

### Using WebSocket (JavaScript)

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
});

const subscription = client.subscribe(
  {
    query: `
      subscription {
        positionUpdated(catalogNumber: 25544, interval: 5000) {
          timestamp
          latitude
          longitude
          altitude
        }
      }
    `,
  },
  {
    next: (data) => console.log('Position update:', data),
    error: (error) => console.error('Subscription error:', error),
    complete: () => console.log('Subscription complete'),
  }
);
```

## Architecture

```
server.ts
├── Apollo Server setup
├── Context (authentication)
├── PubSub for subscriptions
└── Error handling

schema.graphql
├── Type definitions
├── Query operations
├── Mutation operations
├── Subscription operations
└── Custom scalars

resolvers.ts
├── Query resolvers
├── Mutation resolvers
├── Subscription resolvers
└── Custom scalar resolvers
```

## Best Practices

1. **Type Safety:** Use TypeScript for type-safe resolvers
2. **Error Handling:** Return structured errors
3. **Authentication:** Validate API keys in context
4. **Caching:** Enable Apollo cache for performance
5. **Subscriptions:** Use PubSub for real-time updates
6. **Validation:** Validate input data
7. **Documentation:** Keep schema documented
8. **Testing:** Test all resolvers

## Production Considerations

- Use GraphQL depth limiting
- Implement query complexity analysis
- Add rate limiting per user
- Use DataLoader for batching
- Enable persisted queries
- Add monitoring and logging
- Use Redis for PubSub in distributed systems
- Implement field-level permissions
- Add schema stitching for microservices
- Use Apollo Federation for distributed graphs

## License

MIT
