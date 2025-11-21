# API Versioning Strategy

This document describes the API versioning strategy for the TLE Parser API.

## Versioning Approaches

We support multiple versioning strategies:

### 1. URL Path Versioning (Recommended)

**Example:**
```
GET /v1/parse
GET /v2/parse
```

**Pros:**
- Clear and visible
- Easy to test
- Cache-friendly
- RESTful

**Cons:**
- Requires multiple endpoints
- URL changes between versions

### 2. Header Versioning

**Example:**
```
GET /parse
Accept-Version: v1
```

**Pros:**
- Clean URLs
- Flexible
- Good for microservices

**Cons:**
- Less visible
- Harder to test manually

### 3. Query Parameter Versioning

**Example:**
```
GET /parse?version=v1
```

**Pros:**
- Simple to implement
- Backward compatible

**Cons:**
- Pollutes query string
- Less RESTful

## Implementation

### URL Path Versioning (Express)

```typescript
import express from 'express';
import * as v1 from './v1';
import * as v2 from './v2';

const app = express();

// Version 1
app.use('/v1', v1.router);

// Version 2
app.use('/v2', v2.router);

// Default to latest
app.use('/api', v2.router);
```

### Header Versioning (Express)

```typescript
app.use((req, res, next) => {
  const version = req.header('Accept-Version') || 'v1';

  switch (version) {
    case 'v1':
      req.apiVersion = 'v1';
      break;
    case 'v2':
      req.apiVersion = 'v2';
      break;
    default:
      return res.status(400).json({
        error: 'Unsupported API version'
      });
  }

  next();
});
```

## Version Migration Strategy

### 1. Maintain Multiple Versions

- Keep at least 2 versions active
- Deprecate old versions gradually
- Provide migration guides

### 2. Deprecation Process

1. **Announce deprecation** (6 months notice)
2. **Add deprecation headers**
3. **Update documentation**
4. **Monitor usage**
5. **Remove after grace period**

### 3. Deprecation Headers

```typescript
res.setHeader('X-API-Deprecation', 'true');
res.setHeader('X-API-Deprecation-Date', '2025-06-01');
res.setHeader('X-API-Sunset-Date', '2025-12-01');
res.setHeader('X-API-Deprecation-Info', 'https://docs.api.com/migration');
```

## Versioning Best Practices

1. **Semantic Versioning:** Use vX.Y.Z format
2. **Backward Compatibility:** Maintain within major versions
3. **Documentation:** Document changes clearly
4. **Testing:** Test all versions
5. **Monitoring:** Track version usage
6. **Communication:** Announce changes early

## GraphQL Versioning

GraphQL uses schema evolution instead of versioning:

```graphql
type Query {
  # Old field (deprecated)
  getSatellite(id: Int!): Satellite @deprecated(reason: "Use satellite(catalogNumber:) instead")

  # New field
  satellite(catalogNumber: Int!): Satellite
}
```

## gRPC Versioning

Use package names for versioning:

```protobuf
syntax = "proto3";

package tleparser.v1;

service TLEParserService {
  rpc ParseTLE(ParseRequest) returns (ParseResponse);
}
```

```protobuf
syntax = "proto3";

package tleparser.v2;

service TLEParserService {
  rpc ParseTLE(ParseRequest) returns (ParseResponse);
}
```

## Version Support Policy

- **Current Version (v2):** Full support
- **Previous Version (v1):** Maintenance only
- **Deprecated Versions:** No support

## Migration Checklist

- [ ] Review API changes
- [ ] Update client code
- [ ] Test with new version
- [ ] Monitor for errors
- [ ] Remove old version dependency

## Resources

- [REST API Versioning Best Practices](https://restfulapi.net/versioning/)
- [GraphQL Schema Evolution](https://graphql.org/learn/best-practices/#versioning)
- [gRPC Versioning](https://grpc.io/docs/guides/versioning/)
