# TLE Data Acquisition Guide (Week 5)

This guide covers the Week 5 data acquisition features for fetching TLE data from online sources.

## Table of Contents

- [Overview](#overview)
- [Data Sources](#data-sources)
- [CLI Usage](#cli-usage)
- [Programmatic Usage](#programmatic-usage)
- [Constellation Filtering](#constellation-filtering)
- [Caching](#caching)
- [Rate Limiting](#rate-limiting)
- [Automatic Scheduling](#automatic-scheduling)
- [Freshness Validation](#freshness-validation)
- [Failover Support](#failover-support)

## Overview

The TLE Parser now includes comprehensive data acquisition features that allow you to fetch TLE data from multiple online sources, filter by constellation, cache results, and more.

### Features

- ✅ CelesTrak API integration (public, no authentication)
- ✅ Space-Track.org API integration (requires authentication)
- ✅ AMSAT amateur radio satellite database support
- ✅ Custom URL source support
- ✅ Constellation filtering (Starlink, OneWeb, GPS, etc.)
- ✅ Intelligent caching with TTL
- ✅ Rate limiting for API compliance
- ✅ Automatic update scheduling
- ✅ TLE freshness validation
- ✅ Failover between multiple sources
- ✅ Offline mode with cached data

## Data Sources

### CelesTrak

**Public API, no authentication required**

CelesTrak provides TLE data for active satellites, including:
- International Space Station
- Active satellites
- Visual satellites
- Weather satellites
- Communication satellites
- And many more...

**CLI Example:**
```bash
tle-parser --fetch --source celestrak --group active
```

### Space-Track.org

**Requires authentication (free registration)**

Space-Track.org is the official source for USSPACECOM satellite tracking data.

**CLI Example:**
```bash
tle-parser --fetch --source spacetrack \
  --catalog 25544 \
  --spacetrack-user your_username \
  --spacetrack-pass your_password
```

**Note:** Store credentials in environment variables:
```bash
export SPACETRACK_USER=your_username
export SPACETRACK_PASS=your_password
tle-parser --fetch --source spacetrack --catalog 25544 \
  --spacetrack-user $SPACETRACK_USER \
  --spacetrack-pass $SPACETRACK_PASS
```

### AMSAT

**Public API, no authentication required**

AMSAT provides TLE data for amateur radio satellites.

**CLI Example:**
```bash
tle-parser --fetch --source amsat
```

### Custom Sources

Support for custom TLE data URLs.

**Programmatic Example:**
```typescript
import { CustomSource } from 'tle-parser';

const source = new CustomSource({
  baseUrl: 'https://your-tle-server.com/data.tle'
});

const result = await source.fetch();
```

## CLI Usage

### Listing Available Options

**List all constellations:**
```bash
tle-parser --list-constellations
```

Output:
```
Available constellations:
  - starlink
  - oneweb
  - gps
  - galileo
  - glonass
  - beidou
  - iss
  - amateur
  - weather
  - iridium
  - planet
  - spire
```

**List all data sources:**
```bash
tle-parser --list-sources
```

Output:
```
Available data sources:
  - celestrak    : CelesTrak (public, no auth)
  - spacetrack   : Space-Track.org (requires auth)
  - amsat        : AMSAT amateur radio satellites
  - custom       : Custom URL source
```

### Fetching TLE Data

**Fetch all active satellites:**
```bash
tle-parser --fetch --group active
```

**Fetch specific satellite by catalog number:**
```bash
tle-parser --fetch --catalog 25544
```

**Fetch multiple satellites:**
```bash
tle-parser --fetch --catalog 25544,39084,43227
```

**Fetch by constellation:**
```bash
tle-parser --fetch --constellation starlink
```

**Fetch with output format:**
```bash
tle-parser --fetch --constellation gps --format json --pretty
```

**Save to file:**
```bash
tle-parser --fetch --constellation oneweb -o oneweb.json
```

### Cache Management

**Fetch with cache (default):**
```bash
tle-parser --fetch --constellation starlink
```

**Bypass cache:**
```bash
tle-parser --fetch --constellation starlink --no-cache
```

**Clear cache before fetching:**
```bash
tle-parser --fetch --constellation starlink --clear-cache
```

### Freshness Filtering

**Get TLEs from last 3 days:**
```bash
tle-parser --fetch --constellation starlink --fresh 3
```

**Get TLEs from last week:**
```bash
tle-parser --fetch --group active --fresh 7
```

## Programmatic Usage

### Basic Fetching

```typescript
import { CelesTrakSource } from 'tle-parser';

// Create a source
const celestrak = new CelesTrakSource();

// Fetch all active satellites
const result = await celestrak.fetch({
  group: 'active'
});

console.log(`Fetched ${result.count} TLEs`);
console.log(result.data);
```

### Fetching by Catalog Number

```typescript
import { CelesTrakSource } from 'tle-parser';

const celestrak = new CelesTrakSource();

// Fetch ISS
const result = await celestrak.fetch({
  catalogNumber: 25544
});

// Fetch multiple satellites
const result2 = await celestrak.fetch({
  catalogNumber: [25544, 39084, 43227]
});
```

### Using Space-Track.org

```typescript
import { SpaceTrackSource } from 'tle-parser';

const spacetrack = new SpaceTrackSource({
  credentials: {
    username: process.env.SPACETRACK_USER!,
    password: process.env.SPACETRACK_PASS!
  }
});

const result = await spacetrack.fetch({
  catalogNumber: 25544
});
```

### Data Source Manager with Failover

```typescript
import {
  DataSourceManager,
  CelesTrakSource,
  SpaceTrackSource,
  AMSATSource
} from 'tle-parser';

// Create manager
const manager = new DataSourceManager();

// Register sources with failover
manager.register('celestrak', new CelesTrakSource(), {
  primary: true,
  failover: true
});

manager.register('amsat', new AMSATSource(), {
  failover: true
});

// Fetch with automatic failover
try {
  const result = await manager.fetch('celestrak', {
    catalogNumber: 25544
  });
} catch (error) {
  // If celestrak fails, automatically tries amsat
  console.error('All sources failed:', error);
}
```

## Constellation Filtering

### Available Constellations

- **starlink**: SpaceX Starlink constellation
- **oneweb**: OneWeb constellation
- **gps**: GPS (NAVSTAR) satellites
- **galileo**: European Galileo GNSS
- **glonass**: Russian GLONASS GNSS
- **beidou**: Chinese BeiDou GNSS
- **iss**: International Space Station
- **amateur**: Amateur radio satellites
- **weather**: Weather satellites (NOAA, GOES, etc.)
- **iridium**: Iridium constellation
- **planet**: Planet Labs Earth imaging
- **spire**: Spire Global constellation

### CLI Examples

```bash
# Fetch Starlink satellites
tle-parser --fetch --constellation starlink

# Fetch GPS satellites
tle-parser --fetch --constellation gps

# Fetch amateur radio satellites
tle-parser --fetch --constellation amateur
```

### Programmatic Usage

```typescript
import {
  filterByConstellation,
  matchesConstellation,
  groupByConstellation
} from 'tle-parser';

// Filter TLEs by constellation
const starlinkTLEs = filterByConstellation(allTLEs, 'starlink');

// Check if a TLE matches a constellation
const isStarlink = matchesConstellation(tle, 'starlink');

// Group TLEs by constellation
const groups = groupByConstellation(allTLEs);
for (const [constellation, tles] of groups) {
  console.log(`${constellation}: ${tles.length} satellites`);
}
```

## Caching

### Cache Configuration

```typescript
import { TTLCache } from 'tle-parser';

const cache = new TTLCache({
  maxSize: 100,           // Maximum number of entries
  defaultTTL: 3600000,    // 1 hour in milliseconds
  persistent: true,       // Save to disk
  cacheDir: '~/.tle-parser/cache',
  cacheFile: 'tle-cache.json'
});
```

### Cache Operations

```typescript
// Set value with default TTL
cache.set('key', data);

// Set value with custom TTL
cache.set('key', data, 7200000); // 2 hours

// Get value
const data = cache.get('key');

// Check if key exists
if (cache.has('key')) {
  // ...
}

// Clear expired entries
cache.cleanExpired();

// Clear all entries
cache.clear();

// Get cache statistics
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
```

## Rate Limiting

### Rate Limiter Configuration

```typescript
import { RateLimiter } from 'tle-parser';

const limiter = new RateLimiter({
  maxRequests: 20,        // Maximum requests
  intervalMs: 60000,      // Per minute
  maxQueueSize: 100       // Maximum queue size
});
```

### Using Rate Limiter

```typescript
// Acquire a token
await limiter.acquire();

// Execute function with rate limiting
const result = await limiter.execute(async () => {
  return await fetchData();
});

// Get rate limiter status
const status = limiter.getStatus();
console.log(`Tokens available: ${status.tokens}`);
console.log(`Queue length: ${status.queueLength}`);
```

### Multi-Source Rate Limiting

```typescript
import { RateLimiterManager } from 'tle-parser';

const manager = new RateLimiterManager();

// Register rate limiters for different sources
manager.register('celestrak', {
  maxRequests: 20,
  intervalMs: 60000
});

manager.register('spacetrack', {
  maxRequests: 30,
  intervalMs: 60000
});

// Execute with rate limiting
await manager.execute('celestrak', async () => {
  return await fetchFromCelesTrak();
});
```

## Automatic Scheduling

### Scheduler Configuration

```typescript
import {
  TLEScheduler,
  DataSourceManager,
  SCHEDULE_INTERVALS
} from 'tle-parser';

const manager = new DataSourceManager();
// ... register sources

const scheduler = new TLEScheduler(manager, {
  intervalMs: SCHEDULE_INTERVALS.HOURLY,
  source: 'celestrak',
  fetchOptions: {
    constellation: 'starlink'
  },
  onUpdate: (result) => {
    console.log(`Updated: ${result.count} TLEs`);
  },
  onError: (error) => {
    console.error('Update failed:', error);
  },
  autoStart: true
});

// Manual control
scheduler.start();
scheduler.stop();

// Trigger immediate update
const result = await scheduler.updateNow();

// Get scheduler status
const status = scheduler.getStatus();
console.log(`Last update: ${status.lastUpdate}`);
console.log(`Next update: ${status.nextUpdate}`);
```

### Schedule Intervals

```typescript
import { SCHEDULE_INTERVALS, parseInterval } from 'tle-parser';

// Predefined intervals
SCHEDULE_INTERVALS.EVERY_15_MINUTES  // 15 minutes
SCHEDULE_INTERVALS.EVERY_30_MINUTES  // 30 minutes
SCHEDULE_INTERVALS.HOURLY            // 1 hour
SCHEDULE_INTERVALS.EVERY_2_HOURS     // 2 hours
SCHEDULE_INTERVALS.EVERY_6_HOURS     // 6 hours
SCHEDULE_INTERVALS.EVERY_12_HOURS    // 12 hours
SCHEDULE_INTERVALS.DAILY             // 24 hours
SCHEDULE_INTERVALS.WEEKLY            // 7 days

// Parse custom intervals
parseInterval('30m')   // 30 minutes
parseInterval('2h')    // 2 hours
parseInterval('1d')    // 1 day
parseInterval('1w')    // 1 week
```

## Freshness Validation

### Validating TLE Freshness

```typescript
import { validateFreshness, filterByFreshness } from 'tle-parser';

// Validate single TLE
const validation = validateFreshness(tle, 259200000); // 3 days
console.log(`Fresh: ${validation.isFresh}`);
console.log(`Age: ${validation.age}ms`);
console.log(`Epoch: ${validation.epochDate}`);
console.log(validation.message);

// Filter array of TLEs
const freshTLEs = filterByFreshness(allTLEs, 259200000); // Last 3 days
```

### CLI Usage

```bash
# Get TLEs from last 3 days
tle-parser --fetch --constellation starlink --fresh 3

# Get TLEs from last week
tle-parser --fetch --group active --fresh 7

# Get TLEs from last 24 hours
tle-parser --fetch --catalog 25544 --fresh 1
```

## Failover Support

### Automatic Failover

```typescript
import {
  DataSourceManager,
  CelesTrakSource,
  AMSATSource
} from 'tle-parser';

const manager = new DataSourceManager();

// Register primary source
manager.register('celestrak', new CelesTrakSource(), {
  primary: true
});

// Register failover sources
manager.register('amsat', new AMSATSource(), {
  failover: true
});

// Fetch with automatic failover
// If celestrak fails, automatically tries amsat
const result = await manager.fetch(null, {
  catalogNumber: 25544
});
```

### Manual Failover Control

```typescript
// Try specific source with fallback
try {
  const result = await manager.fetch('celestrak', options);
} catch (error) {
  // Manually try fallback
  const result = await manager.fetch('amsat', options);
}
```

## Best Practices

1. **Use Caching**: Enable caching to reduce API calls and improve performance
2. **Respect Rate Limits**: Always use rate limiting when making API calls
3. **Validate Freshness**: Check TLE age before using for calculations
4. **Implement Failover**: Register multiple sources for reliability
5. **Store Credentials Securely**: Use environment variables for sensitive data
6. **Monitor Updates**: Use callbacks to track update status and errors
7. **Handle Errors**: Implement proper error handling for network failures
8. **Cache Management**: Periodically clean expired cache entries

## Examples

### Complete Fetch Example

```typescript
import {
  DataSourceManager,
  CelesTrakSource,
  AMSATSource,
  filterByConstellation,
  validateFreshness
} from 'tle-parser';

async function fetchStarlinkTLEs() {
  // Create manager with failover
  const manager = new DataSourceManager();
  manager.register('celestrak', new CelesTrakSource(), { primary: true });
  manager.register('amsat', new AMSATSource(), { failover: true });

  try {
    // Fetch with constellation filter
    const result = await manager.fetch('celestrak', {
      parseOptions: {
        filter: {
          satelliteName: (name: string) => name.includes('STARLINK')
        }
      }
    });

    // Validate freshness
    const freshTLEs = result.data.filter(tle => {
      const validation = validateFreshness(tle, 259200000); // 3 days
      return validation.isFresh;
    });

    console.log(`Fetched ${result.count} TLEs`);
    console.log(`Fresh: ${freshTLEs.length} TLEs`);

    return freshTLEs;
  } catch (error) {
    console.error('Failed to fetch TLEs:', error);
    throw error;
  }
}
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Solution: Increase rate limit interval or reduce request frequency

2. **Authentication Failed (Space-Track)**
   - Solution: Verify credentials and ensure account is active

3. **Cache Issues**
   - Solution: Clear cache with `--clear-cache` or manually delete cache files

4. **Stale Data**
   - Solution: Use `--no-cache` or `--fresh` options to get recent data

5. **Network Errors**
   - Solution: Check internet connection and API availability

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.TLE_DEBUG = 'true';

// Or use verbose CLI output
tle-parser --fetch --constellation starlink --verbosity verbose
```

## API Reference

For complete API documentation, see:
- [API Reference](../api/API_REFERENCE.md)
- [Advanced Features](../advanced-features.md)

## Support

For issues and questions:
- GitHub Issues: https://github.com/gv-sh/tle-parser/issues
- Documentation: https://github.com/gv-sh/tle-parser#readme
