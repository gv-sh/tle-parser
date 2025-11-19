# Advanced Parsing Features

This document describes the advanced parsing features available in the TLE parser library.

## Table of Contents

- [Batch Parsing](#batch-parsing)
- [Async Parsing](#async-parsing)
- [Streaming Parser](#streaming-parser)
- [Multi-Source Parsing](#multi-source-parsing)
- [Filtering](#filtering)
- [Middleware & Plugins](#middleware--plugins)
- [Caching](#caching)
- [Parser Profiles](#parser-profiles)
- [Incremental Parsing](#incremental-parsing)
- [Parallel Parsing](#parallel-parsing)
- [Provider Support](#provider-support)
- [Compressed Archives](#compressed-archives)

## Batch Parsing

Parse multiple TLEs from a single input string.

### Basic Usage

```typescript
import { parseBatch } from 'tle-parser';

const multiTLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537

HST
1 20580U 90037B   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 20580  28.4699  17.5172 0002638 321.8014 173.1085 15.09719417427069`;

const tles = parseBatch(multiTLE);
console.log(`Parsed ${tles.length} TLEs`);
```

### Options

```typescript
const tles = parseBatch(multiTLE, {
  // Continue parsing even if some TLEs are invalid
  continueOnError: true,

  // Limit number of TLEs to parse
  limit: 100,

  // Skip first N TLEs
  skip: 10,

  // Callback for each parsed TLE
  onTLE: (tle, index) => {
    console.log(`Parsed: ${tle.satelliteName}`);
  },

  // Callback for errors
  onError: (error, index, rawTLE) => {
    console.error(`Error at index ${index}:`, error.message);
  },

  // Filter options (see Filtering section)
  filter: {
    satelliteName: 'STARLINK'
  }
});
```

## Async Parsing

All parsing operations have async equivalents for non-blocking operations.

```typescript
import { parseTLEAsync, parseBatchAsync, validateTLEAsync } from 'tle-parser';

// Parse single TLE asynchronously
const tle = await parseTLEAsync(tleString);

// Parse multiple TLEs asynchronously
const tles = await parseBatchAsync(multiTLE);

// Validate asynchronously
const validation = await validateTLEAsync(tleString);
```

## Streaming Parser

For large TLE files, use the streaming parser to process data incrementally.

```typescript
import { createTLEParserStream } from 'tle-parser';
import { createReadStream } from 'fs';

const parser = createTLEParserStream({
  continueOnError: true,
  filter: { satelliteName: 'STARLINK' },
  onTLE: (tle, index) => {
    console.log(`Parsed: ${tle.satelliteName}`);
  }
});

createReadStream('large-tle-file.txt')
  .pipe(parser)
  .on('data', (tle) => {
    // Process each TLE
  })
  .on('end', () => {
    console.log('Parsing complete');
  })
  .on('error', (error) => {
    console.error('Parsing error:', error);
  });
```

## Multi-Source Parsing

Parse TLEs from various sources: files, URLs, streams, and compressed archives.

### From File

```typescript
import { parseFromFile } from 'tle-parser';

const tles = await parseFromFile('./tles.txt', {
  encoding: 'utf8',
  continueOnError: true
});
```

### From URL

```typescript
import { parseFromURL } from 'tle-parser';

const tles = await parseFromURL('https://celestrak.org/NORAD/elements/stations.txt', {
  timeout: 30000, // 30 seconds
  headers: {
    'User-Agent': 'My TLE Parser'
  }
});
```

### From Stream

```typescript
import { parseFromStream } from 'tle-parser';
import { createReadStream } from 'fs';

const stream = createReadStream('./tles.txt');
const tles = await parseFromStream(stream);
```

### From Compressed File

```typescript
import { parseFromCompressed } from 'tle-parser';

// Parse .gz compressed TLE file
const tles = await parseFromCompressed('./tles.txt.gz');
```

## Filtering

Filter TLEs during parsing to extract only the data you need.

### Filter by Satellite Number

```typescript
// Single satellite number
const filter = { satelliteNumber: '25544' };

// Multiple satellite numbers
const filter = { satelliteNumber: ['25544', '20580'] };

// Custom function
const filter = {
  satelliteNumber: (satNum) => parseInt(satNum) < 30000
};
```

### Filter by Satellite Name

```typescript
// Partial match
const filter = { satelliteName: 'STARLINK' };

// Multiple names
const filter = { satelliteName: ['ISS', 'HUBBLE'] };

// Custom function
const filter = {
  satelliteName: (name) => name.startsWith('STARLINK')
};
```

### Filter by Classification

```typescript
// Single classification
const filter = { classification: 'U' };

// Multiple classifications
const filter = { classification: ['U', 'C'] };
```

### Filter by Epoch Range

```typescript
const filter = {
  epochRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  }
};
```

### Filter by Inclination

```typescript
const filter = {
  inclinationRange: {
    min: 50,  // degrees
    max: 60   // degrees
  }
};
```

### Custom Filter

```typescript
const filter = {
  custom: (tle) => {
    const meanMotion = parseFloat(tle.meanMotion || '0');
    return meanMotion > 15; // High orbit satellites
  }
};
```

### Combining Filters

All filters are combined with AND logic:

```typescript
const filter = {
  satelliteName: 'STARLINK',
  inclinationRange: { min: 50, max: 55 },
  custom: (tle) => {
    const eccentricity = parseFloat(tle.eccentricity || '0');
    return eccentricity < 0.01; // Nearly circular orbits
  }
};

const tles = parseBatch(multiTLE, { filter });
```

## Middleware & Plugins

Extend parser functionality with middleware and plugins.

### Middleware

```typescript
import { createMiddlewareParser } from 'tle-parser';

const parser = createMiddlewareParser();

// Add logging middleware
parser.use(async (context, next) => {
  console.log('Parsing TLE...');
  const result = await next();
  console.log(`Parsed: ${result.satelliteName}`);
  return result;
});

// Add validation middleware
parser.use(async (context, next) => {
  const result = await next();

  // Add custom metadata
  context.metadata.parsedAt = new Date();

  return result;
});

const tle = await parser.parse(tleString);
```

### Plugins

```typescript
import { createMiddlewareParser, ParserPlugin } from 'tle-parser';

const statsPlugin: ParserPlugin = {
  name: 'stats-plugin',
  version: '1.0.0',

  onBatchStart: async (options) => {
    console.log('Batch parsing started');
  },

  onTLEParsed: async (tle, index) => {
    console.log(`Parsed TLE ${index}: ${tle.satelliteName}`);
  },

  onBatchEnd: async (results) => {
    console.log(`Batch parsing complete: ${results.length} TLEs`);
  },

  onError: async (error, index) => {
    console.error(`Error at index ${index}:`, error.message);
  }
};

const parser = createMiddlewareParser();
parser.plugin(statsPlugin);

const tles = await parser.parseBatch(multiTLE);
```

## Caching

Cache parsed TLEs to improve performance for frequently accessed data.

### Basic Usage

```typescript
import { createCachedParser } from 'tle-parser';

const cachedParser = createCachedParser({
  maxSize: 1000,      // Maximum cache entries
  ttl: 3600000        // Time to live (1 hour)
});

// First call parses and caches
const tle1 = cachedParser.parse(tleString);

// Second call returns cached result
const tle2 = cachedParser.parse(tleString);

// Same object reference
console.log(tle1 === tle2); // true
```

### Async Caching

```typescript
const tle = await cachedParser.parseAsync(tleString);
```

### Cache Management

```typescript
// Get cache size
console.log(`Cache size: ${cachedParser.cache.size()}`);

// Clear cache
cachedParser.cache.clear();
```

### Custom Cache Key Generator

```typescript
const cachedParser = createCachedParser({
  keyGenerator: (rawTLE, options) => {
    // Generate custom cache key
    const hash = require('crypto')
      .createHash('md5')
      .update(rawTLE)
      .digest('hex');
    return hash;
  }
});
```

## Parser Profiles

Use predefined profiles optimized for different use cases.

### Available Profiles

- **strict**: Strict validation, all checks enabled
- **permissive**: Permissive mode, warnings instead of errors
- **fast**: Skip validation for maximum speed
- **realtime**: Optimized for real-time feeds
- **batch**: Optimized for batch processing
- **recovery**: Maximum error recovery
- **legacy**: Support legacy/non-standard formats

### Usage

```typescript
import { parseWithProfile, getProfileOptions } from 'tle-parser';

// Parse with strict profile
const tle = parseWithProfile(tleString, 'strict');

// Parse with fast profile (no validation)
const tle = parseWithProfile(tleString, 'fast');

// Get profile options for custom use
const options = getProfileOptions('realtime');
const tle = parseTLE(tleString, options);
```

### Profile Comparison

| Profile | Validate | Checksums | Ranges | Mode | Use Case |
|---------|----------|-----------|--------|------|----------|
| strict | ✓ | Strict | ✓ | strict | Critical applications |
| permissive | ✓ | Relaxed | ✗ | permissive | Legacy data |
| fast | ✗ | ✗ | ✗ | - | Performance critical |
| realtime | ✓ | Relaxed | ✗ | permissive | Live feeds |
| batch | ✓ | Strict | ✓ | strict | Bulk processing |
| recovery | ✗ | ✗ | ✗ | - | Corrupted data |
| legacy | ✓ | Relaxed | ✗ | permissive | Old formats |

## Incremental Parsing

Parse TLEs incrementally for real-time data feeds.

```typescript
import { createIncrementalParser } from 'tle-parser';

const parser = createIncrementalParser(
  (tle) => {
    console.log(`Received: ${tle.satelliteName}`);
  },
  { validate: true }
);

// Receive data in chunks
websocket.on('message', (chunk) => {
  parser.push(chunk);
});

// Flush remaining data when done
websocket.on('close', () => {
  parser.flush();
});
```

## Parallel Parsing

Parse large TLE datasets using multiple CPU cores.

```typescript
import { parseParallel } from 'tle-parser';

// Parse with default worker count (CPU cores)
const tles = await parseParallel(largeTLEString);

// Parse with custom worker count
const tles = await parseParallel(largeTLEString, {
  continueOnError: true
}, 4); // Use 4 workers
```

## Provider Support

Use provider-specific parsing options for different TLE sources.

### Supported Providers

- **celestrak**: CelesTrak (strict validation)
- **spacetrack**: Space-Track.org (strict validation)
- **amsat**: AMSAT (permissive, legacy support)
- **custom**: Custom provider (no validation)

### Usage

```typescript
import { parseWithProvider, getProviderOptions } from 'tle-parser';

// Parse with CelesTrak settings
const tle = parseWithProvider(tleString, 'celestrak');

// Parse with AMSAT settings (permissive)
const tle = parseWithProvider(tleString, 'amsat');

// Get provider options for custom use
const options = getProviderOptions('spacetrack');
const tle = parseTLE(tleString, options);
```

## Compressed Archives

Parse TLEs from compressed files without manual decompression.

### Gzip (.gz)

```typescript
import { parseFromCompressed } from 'tle-parser';

const tles = await parseFromCompressed('./tles.txt.gz', {
  continueOnError: true,
  filter: { satelliteName: 'STARLINK' }
});
```

### With Streaming

```typescript
import { createTLEParserStream } from 'tle-parser';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';

const fileStream = createReadStream('./tles.txt.gz');
const gunzip = createGunzip();
const parser = createTLEParserStream();

fileStream
  .pipe(gunzip)
  .pipe(parser)
  .on('data', (tle) => {
    console.log(tle.satelliteName);
  });
```

## Performance Tips

1. **Use streaming** for large files (>1MB)
2. **Enable caching** for frequently accessed TLEs
3. **Use fast profile** when validation is not needed
4. **Apply filters** to reduce processing overhead
5. **Use parallel parsing** for very large datasets
6. **Disable warnings** in batch processing for better performance

## Example: Complete Pipeline

Here's a complete example combining multiple features:

```typescript
import {
  createMiddlewareParser,
  createCachedParser,
  createTLEParserStream,
  parseFromURL
} from 'tle-parser';

// Setup cached parser
const cachedParser = createCachedParser({
  maxSize: 5000,
  ttl: 3600000 // 1 hour
});

// Setup middleware parser
const parser = createMiddlewareParser();

// Add logging middleware
parser.use(async (context, next) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`Parsed in ${duration}ms`);
  return result;
});

// Parse from URL with filtering
const tles = await parseFromURL(
  'https://celestrak.org/NORAD/elements/stations.txt',
  {
    filter: {
      satelliteName: ['ISS', 'TIANGONG'],
      inclinationRange: { min: 40, max: 60 }
    },
    continueOnError: true,
    onTLE: (tle, index) => {
      // Cache each TLE
      cachedParser.cache.set(`tle-${index}`, tle);
    }
  }
);

console.log(`Parsed ${tles.length} TLEs`);
```

## TypeScript Support

All features have full TypeScript support with comprehensive type definitions:

```typescript
import {
  ParsedTLE,
  TLEFilter,
  BatchParseOptions,
  StreamParserOptions,
  ParserMiddleware,
  ParserPlugin,
  ParserProfile,
  TLEProvider
} from 'tle-parser';

const filter: TLEFilter = {
  satelliteName: 'ISS',
  inclinationRange: { min: 50, max: 60 }
};

const options: BatchParseOptions = {
  filter,
  continueOnError: true,
  limit: 100
};
```

## Error Handling

All parsing functions support comprehensive error handling:

```typescript
try {
  const tles = parseBatch(multiTLE, { continueOnError: false });
} catch (error) {
  if (error instanceof TLEValidationError) {
    console.error('Validation errors:', error.errors);
    console.error('Warnings:', error.warnings);
  } else if (error instanceof TLEFormatError) {
    console.error('Format error:', error.code, error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Next Steps

- See [API Documentation](./api.md) for detailed API reference
- See [Examples](../examples/) for more usage examples
- See [Migration Guide](./migration.md) for upgrading from older versions
