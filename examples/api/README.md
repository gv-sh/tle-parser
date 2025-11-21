# TLE Parser API & Microservices - Week 8

Complete implementation of API & Microservices for the TLE Parser library.

## 📋 Overview

This directory contains all the API implementations, authentication, deployment configurations, and monitoring tools for the TLE Parser project.

## 🎯 Completed Features

### ✅ REST API
- Complete OpenAPI 3.0 specification
- Reference implementation with Express.js
- API key authentication
- Rate limiting
- Comprehensive error handling
- Health check endpoints
- Multiple output formats

### ✅ GraphQL API
- Complete schema with queries, mutations, and subscriptions
- Apollo Server implementation
- Real-time subscriptions
- Type-safe resolvers
- Custom scalars (DateTime, JSON)

### ✅ gRPC API
- Protocol Buffers definition
- Unary and streaming RPC
- High-performance binary protocol
- Multi-language support

### ✅ WebSocket API
- Real-time satellite position updates
- TLE update notifications
- Visibility calculations
- HTML client example
- Subscription management

### ✅ Authentication & Rate Limiting
- API key authentication
- JWT authentication
- Role-based authorization
- Memory and Redis-based rate limiting

### ✅ Docker & Kubernetes
- Multi-stage Docker builds
- Docker Compose setup
- Kubernetes deployments
- Horizontal pod autoscaling
- Ingress configuration
- Health checks

### ✅ Serverless Functions
- AWS Lambda handlers
- Vercel Edge Functions
- Cloudflare Workers

### ✅ Monitoring & Observability
- Prometheus metrics
- Structured logging
- Custom metrics
- Health checks

### ✅ Load Testing
- K6 load testing scripts
- Artillery configuration
- Performance benchmarks

### ✅ API Versioning
- URL path versioning
- Header versioning
- Deprecation strategy

## 📁 Directory Structure

```
examples/api/
├── rest/                    # REST API implementation
│   ├── openapi.yaml        # OpenAPI 3.0 specification
│   ├── api-server.ts       # Express server
│   ├── package.json
│   └── README.md
├── graphql/                 # GraphQL API implementation
│   ├── schema.graphql      # GraphQL schema
│   ├── resolvers.ts        # Resolvers
│   ├── server.ts           # Apollo Server
│   ├── package.json
│   └── README.md
├── grpc/                    # gRPC API implementation
│   ├── tle-parser.proto    # Protocol Buffers definition
│   ├── server.ts           # gRPC server
│   ├── package.json
│   └── README.md
├── websocket/               # WebSocket API implementation
│   ├── server.ts           # WebSocket server
│   ├── client-example.html # HTML client
│   ├── package.json
│   └── README.md
└── versioning/              # API versioning strategy
    └── README.md

examples/auth/               # Authentication examples
├── api-key.ts              # API key auth
├── jwt.ts                  # JWT auth
└── rate-limiter.ts         # Rate limiting

examples/docker/             # Docker configuration
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Full stack setup
└── .dockerignore

examples/kubernetes/         # Kubernetes manifests
├── deployment.yaml         # Deployment & Service
└── ingress.yaml            # Ingress configuration

examples/serverless/         # Serverless functions
├── lambda/                 # AWS Lambda
│   └── handler.ts
├── vercel/                 # Vercel Functions
│   └── api/parse.ts
└── cloudflare/             # Cloudflare Workers
    └── worker.ts

examples/monitoring/         # Monitoring & observability
├── prometheus-metrics.ts   # Prometheus metrics
└── structured-logging.ts   # Winston logging

examples/load-testing/       # Load testing
├── k6-script.js            # K6 tests
└── artillery-config.yml    # Artillery tests
```

## 🚀 Quick Start

### REST API

```bash
cd examples/api/rest
npm install
npm run dev
# API available at http://localhost:3000/v1
```

### GraphQL API

```bash
cd examples/api/graphql
npm install
npm run dev
# GraphQL Playground at http://localhost:4000
```

### gRPC API

```bash
cd examples/api/grpc
npm install
npm run dev
# gRPC server running on port 50051
```

### WebSocket API

```bash
cd examples/api/websocket
npm install
npm run dev
# WebSocket server at ws://localhost:8080
# Open client-example.html in browser
```

### Docker Compose (Full Stack)

```bash
cd examples/docker
docker-compose up -d
# REST API: http://localhost:3000
# GraphQL: http://localhost:4000
# WebSocket: ws://localhost:8080
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

### Kubernetes

```bash
cd examples/kubernetes
kubectl apply -f deployment.yaml
kubectl apply -f ingress.yaml
```

## 📊 API Comparison

| Feature | REST | GraphQL | gRPC | WebSocket |
|---------|------|---------|------|-----------|
| Protocol | HTTP | HTTP | HTTP/2 | TCP |
| Format | JSON | JSON | Binary | Text/Binary |
| Real-time | ❌ | ✅ | ✅ | ✅ |
| Streaming | ⚠️ | ✅ | ✅ | ✅ |
| Browser | ✅ | ✅ | ⚠️ | ✅ |
| Caching | ✅ | ⚠️ | ❌ | ❌ |
| Type Safety | ⚠️ | ✅ | ✅ | ❌ |

## 📝 API Examples

### REST API

```bash
curl -X POST http://localhost:3000/v1/parse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"tle":"ISS (ZARYA)\n1 25544U...\n2 25544..."}'
```

### GraphQL API

```graphql
query {
  parseTLE(input: {
    tle: "ISS (ZARYA)\n1 25544U...\n2 25544..."
    strict: true
  }) {
    name
    catalogNumber
    inclination
  }
}
```

### gRPC API

```bash
grpcurl -plaintext -d '{"tle":"ISS (ZARYA)\n1 25544U...\n2 25544..."}' \
  localhost:50051 tleparser.TLEParserService/ParseTLE
```

### WebSocket API

```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.send(JSON.stringify({
  type: 'subscribe:position',
  data: { catalogNumber: 25544, interval: 5000 }
}));
```

## 🔒 Authentication

### API Key

```typescript
import { apiKeyAuth } from './examples/auth/api-key';

app.use('/api', apiKeyAuth({
  keys: ['key1', 'key2']
}));
```

### JWT

```typescript
import { jwtAuth } from './examples/auth/jwt';

app.use('/api', jwtAuth({
  secret: process.env.JWT_SECRET
}));
```

### Rate Limiting

```typescript
import { RateLimiter } from './examples/auth/rate-limiter';

const limiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 100
});

app.use(limiter.middleware());
```

## 📈 Monitoring

### Prometheus Metrics

```typescript
import { register, metricsHandler } from './examples/monitoring/prometheus-metrics';

app.get('/metrics', metricsHandler);
```

### Structured Logging

```typescript
import { logger } from './examples/monitoring/structured-logging';

logger.info('TLE parsed', {
  catalogNumber: 25544,
  duration: 10
});
```

## 🧪 Load Testing

### K6

```bash
k6 run examples/load-testing/k6-script.js
```

### Artillery

```bash
artillery run examples/load-testing/artillery-config.yml
```

## 🌐 Deployment

### Docker

```bash
docker build -t tle-parser -f examples/docker/Dockerfile .
docker run -p 3000:3000 tle-parser
```

### Kubernetes

```bash
kubectl apply -f examples/kubernetes/
kubectl get pods
kubectl get services
```

### Serverless

#### AWS Lambda

```bash
cd examples/serverless/lambda
zip -r function.zip .
aws lambda create-function --function-name tle-parser ...
```

#### Vercel

```bash
cd examples/serverless/vercel
vercel deploy
```

#### Cloudflare Workers

```bash
cd examples/serverless/cloudflare
wrangler publish
```

## 📚 Documentation

- [REST API README](./rest/README.md)
- [GraphQL API README](./graphql/README.md)
- [gRPC API README](./grpc/README.md)
- [WebSocket API README](./websocket/README.md)
- [API Versioning Strategy](./versioning/README.md)

## 🔧 Configuration

### Environment Variables

```bash
# API
PORT=3000
NODE_ENV=production
API_KEY=your-api-key

# Database
POSTGRES_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=your-secret

# Monitoring
LOG_LEVEL=info
```

## 🎯 Performance Targets

- Parse TLE: < 10ms
- Position calculation: < 50ms
- API response (p95): < 100ms
- Concurrent connections: 10,000+
- Throughput: 1,000+ req/s

## ✅ Testing

All APIs include:
- Unit tests
- Integration tests
- Load tests
- Health checks

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! See main README for guidelines.

## 🔗 Links

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
- [GraphQL Documentation](https://graphql.org/)
- [gRPC Documentation](https://grpc.io/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Prometheus](https://prometheus.io/)
- [K6 Load Testing](https://k6.io/)
