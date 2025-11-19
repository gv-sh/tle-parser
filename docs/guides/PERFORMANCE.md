# Performance Optimization Guide

Guidelines for optimizing TLE parser performance in various scenarios.

## Table of Contents

- [Performance Characteristics](#performance-characteristics)
- [Benchmarks](#benchmarks)
- [Optimization Strategies](#optimization-strategies)
- [Large-Scale Processing](#large-scale-processing)
- [Memory Optimization](#memory-optimization)
- [Caching Strategies](#caching-strategies)
- [Best Practices](#best-practices)

---

## Performance Characteristics

### Single TLE Parsing

**Typical performance** (approximate, hardware-dependent):
- **Parse time**: 0.1-0.5 ms per TLE
- **Memory**: ~2-5 KB per parsed TLE object
- **Validation overhead**: ~10-20% additional time

**Factors affecting performance:**
- **Validation enabled**: +10-20%
- **Warning generation**: +5-10%
- **Comment parsing**: +5%
- **Permissive mode**: +15-25% (more error handling)

---

### Scaling Characteristics

| TLEs | Time (strict) | Time (permissive) | Memory |
|------|---------------|-------------------|--------|
| 1 | ~0.2 ms | ~0.25 ms | ~3 KB |
| 10 | ~2 ms | ~2.5 ms | ~30 KB |
| 100 | ~20 ms | ~25 ms | ~300 KB |
| 1,000 | ~200 ms | ~250 ms | ~3 MB |
| 10,000 | ~2 s | ~2.5 s | ~30 MB |
| 100,000 | ~20 s | ~25 s | ~300 MB |

**Note:** Times are approximate and vary by hardware.

---

## Benchmarks

### Running Benchmarks

The library includes benchmark tests:

```bash
npm run test -- benchmark.test.js
```

### Sample Benchmark Code

```javascript
const { parseTLE } = require('tle-parser');

const issTLE = `ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428`;

// Benchmark single parse
console.time('Single parse');
parseTLE(issTLE);
console.timeEnd('Single parse');

// Benchmark 1000 parses
console.time('1000 parses');
for (let i = 0; i < 1000; i++) {
  parseTLE(issTLE);
}
console.timeEnd('1000 parses');

// Calculate throughput
const iterations = 10000;
const start = Date.now();
for (let i = 0; i < iterations; i++) {
  parseTLE(issTLE);
}
const end = Date.now();
const totalTime = end - start;
const throughput = (iterations / totalTime) * 1000;

console.log(`Throughput: ${throughput.toFixed(0)} TLEs/second`);
console.log(`Average: ${(totalTime / iterations).toFixed(3)} ms/TLE`);
```

---

## Optimization Strategies

### 1. Disable Unnecessary Validation

If you **trust your data source**, disable validation:

```javascript
// Skip all validation (fastest)
const result = parseTLE(tleData, {
  validate: false
});

// ~30-40% faster, but NO error checking

// Use when:
// - Data source is highly reliable
// - Performance is critical
// - You've pre-validated the data
```

**Caution:** No error detection. Use only with trusted data.

---

### 2. Skip Checksum Validation

If checksums are not critical:

```javascript
const result = parseTLE(tleData, {
  strictChecksums: false
});

// ~10% faster, still validates structure
```

---

### 3. Skip Range Validation

If you don't need range checks:

```javascript
const result = parseTLE(tleData, {
  validateRanges: false
});

// ~5% faster, still validates format
```

---

### 4. Disable Warnings

If you don't need warnings:

```javascript
const result = parseTLE(tleData, {
  includeWarnings: false
});

// ~5-10% faster, reduces processing
```

---

### 5. Skip Comments

If you don't need comment lines:

```javascript
const result = parseTLE(tleData, {
  includeComments: false
});

// ~5% faster, reduces processing
```

---

### 6. Combined Optimization

For maximum speed with trusted data:

```javascript
const result = parseTLE(tleData, {
  validate: false,          // Skip all validation
  includeWarnings: false,   // No warnings
  includeComments: false    // No comments
});

// ~50% faster than default
// Use ONLY with highly trusted data sources
```

---

## Large-Scale Processing

### Batch Processing Pattern

Process large files efficiently:

```javascript
const fs = require('fs');
const { parseTLE } = require('tle-parser');

function batchParseTLEs(filePath, options = {}) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tleBlocks = content.split(/\n\s*\n/);

  const results = [];
  const batchSize = options.batchSize || 100;

  // Process in batches
  for (let i = 0; i < tleBlocks.length; i += batchSize) {
    const batch = tleBlocks.slice(i, i + batchSize);

    batch.forEach(block => {
      try {
        const result = parseTLE(block.trim(), {
          validate: options.validate !== false,
          includeWarnings: false,
          includeComments: false
        });
        results.push(result);
      } catch (error) {
        // Handle errors
      }
    });

    // Allow event loop to breathe
    if (i % 1000 === 0) {
      setImmediate(() => {});
    }
  }

  return results;
}

// Usage
const satellites = batchParseTLEs('all_satellites.txt', {
  batchSize: 100,
  validate: true
});
```

---

### Streaming Processing

For very large files, use streaming to avoid loading everything into memory:

```javascript
const fs = require('fs');
const readline = require('readline');
const { parseTLE } = require('tle-parser');

async function streamParseTLEs(filePath, callback) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let buffer = [];
  let count = 0;

  for await (const line of rl) {
    buffer.push(line);

    // Detect complete TLE (2 or 3 lines)
    const isComplete =
      (buffer.length === 3 && buffer[0][0] !== '1') || // 3-line format
      (buffer.length === 2 && buffer[0][0] === '1');   // 2-line format

    if (isComplete) {
      try {
        const tleData = buffer.join('\n');
        const result = parseTLE(tleData, {
          validate: false,
          includeWarnings: false
        });

        // Process immediately (don't store all in memory)
        await callback(result);
        count++;

      } catch (error) {
        // Handle error
      }

      buffer = [];
    }
  }

  return count;
}

// Usage
let processed = 0;
await streamParseTLEs('huge_file.txt', async (satellite) => {
  // Process each satellite immediately
  console.log(satellite.satelliteName);
  processed++;
});

console.log(`Processed ${processed} satellites`);
```

---

### Parallel Processing with Worker Threads

For CPU-intensive tasks, use worker threads:

```javascript
// main.js
const { Worker } = require('worker_threads');
const fs = require('fs');

function parallelParseTLEs(filePath, numWorkers = 4) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tleBlocks = content.split(/\n\s*\n/).filter(Boolean);

  const chunkSize = Math.ceil(tleBlocks.length / numWorkers);
  const chunks = [];

  for (let i = 0; i < tleBlocks.length; i += chunkSize) {
    chunks.push(tleBlocks.slice(i, i + chunkSize));
  }

  const workers = chunks.map(chunk => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./tle-worker.js');

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.postMessage(chunk);
    });
  });

  return Promise.all(workers).then(results => {
    return results.flat();
  });
}

// Usage
parallelParseTLEs('all_satellites.txt', 4)
  .then(satellites => {
    console.log(`Parsed ${satellites.length} satellites`);
  });
```

```javascript
// tle-worker.js
const { parentPort } = require('worker_threads');
const { parseTLE } = require('tle-parser');

parentPort.on('message', (tleBlocks) => {
  const results = tleBlocks.map(block => {
    try {
      return parseTLE(block, {
        validate: false,
        includeWarnings: false
      });
    } catch (error) {
      return null;
    }
  }).filter(Boolean);

  parentPort.postMessage(results);
});
```

---

## Memory Optimization

### Extract Only Needed Fields

Don't store entire ParsedTLE objects if you only need specific fields:

```javascript
const satellites = tleBlocks.map(block => {
  const parsed = parseTLE(block, {
    validate: false,
    includeWarnings: false,
    includeComments: false
  });

  // Extract only what you need
  return {
    id: parsed.satelliteNumber1,
    name: parsed.satelliteName,
    inclination: parseFloat(parsed.inclination),
    period: 1440 / parseFloat(parsed.meanMotion)
  };
});

// Much smaller memory footprint
```

---

### Streaming Write to Database

Don't accumulate all results in memory:

```javascript
async function parseToDatabaseStreaming(filePath, db) {
  let processed = 0;

  await streamParseTLEs(filePath, async (satellite) => {
    // Write to database immediately
    await db.collection('satellites').insertOne({
      noradId: satellite.satelliteNumber1,
      name: satellite.satelliteName,
      inclination: parseFloat(satellite.inclination),
      meanMotion: parseFloat(satellite.meanMotion),
      updatedAt: new Date()
    });

    processed++;

    // Log progress
    if (processed % 1000 === 0) {
      console.log(`Processed ${processed} satellites`);
    }
  });

  return processed;
}
```

---

### Clear References

Help garbage collection:

```javascript
function processLargeBatch(tleBlocks) {
  let results = [];

  for (let i = 0; i < tleBlocks.length; i++) {
    const parsed = parseTLE(tleBlocks[i]);
    results.push(extractNeededFields(parsed));

    // Clear references periodically
    if (i % 10000 === 0) {
      // Process batch
      processBatch(results);
      results = [];  // Clear for garbage collection
      global.gc && global.gc();  // Force GC if available
    }
  }

  return results;
}
```

---

## Caching Strategies

### Cache Parsed Results

If parsing the same TLE multiple times:

```javascript
const parseCache = new Map();

function parseTLECached(tleData, options) {
  const cacheKey = tleData.trim();

  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey);
  }

  const result = parseTLE(tleData, options);
  parseCache.set(cacheKey, result);

  return result;
}

// Usage
const result1 = parseTLECached(issTLE);  // Parses
const result2 = parseTLECached(issTLE);  // Returns cached
```

### LRU Cache for Limited Memory

Use an LRU cache to limit memory usage:

```javascript
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key, value) {
    // Delete oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

const parseCache = new LRUCache(1000);  // Cache last 1000 TLEs

function parseTLECached(tleData, options) {
  const cacheKey = tleData.trim();
  const cached = parseCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = parseTLE(tleData, options);
  parseCache.set(cacheKey, result);

  return result;
}
```

---

### TTL Cache for Stale Data

Cache with time-to-live:

```javascript
class TTLCache {
  constructor(ttlMs = 3600000) {  // 1 hour default
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

const parseCache = new TTLCache(3600000);  // 1 hour TTL
```

---

## Best Practices

### 1. Profile Before Optimizing

Measure actual performance bottlenecks:

```javascript
console.time('Total parsing');

console.time('Read file');
const content = fs.readFileSync('satellites.txt', 'utf8');
console.timeEnd('Read file');

console.time('Split blocks');
const blocks = content.split(/\n\s*\n/);
console.timeEnd('Split blocks');

console.time('Parse TLEs');
const results = blocks.map(b => parseTLE(b.trim()));
console.timeEnd('Parse TLEs');

console.timeEnd('Total parsing');
```

---

### 2. Choose Appropriate Mode

```javascript
// Critical application - use strict
const result = parseTLE(tleData, { mode: 'strict' });

// Batch processing - use optimized
const result = parseTLE(tleData, {
  validate: false,
  includeWarnings: false
});
```

---

### 3. Batch Network Requests

```javascript
// Bad: Sequential requests
for (const satId of satelliteIds) {
  const tle = await fetch(`/api/tle/${satId}`).then(r => r.text());
  const parsed = parseTLE(tle);
  // Process
}

// Good: Parallel requests
const tlePromises = satelliteIds.map(satId =>
  fetch(`/api/tle/${satId}`).then(r => r.text())
);

const tles = await Promise.all(tlePromises);
const parsed = tles.map(tle => parseTLE(tle));
```

---

### 4. Pre-validate Large Batches

Quick validation before expensive operations:

```javascript
const { validateTLE } = require('tle-parser');

// Quick validation pass
const validBlocks = tleBlocks.filter(block => {
  return validateTLE(block).valid;
});

// Only parse valid TLEs
const parsed = validBlocks.map(block => parseTLE(block));
```

---

### 5. Monitor Memory Usage

```javascript
function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`
  });
}

// Before processing
logMemoryUsage();

// Process TLEs
const results = processLargeBatch(tleBlocks);

// After processing
logMemoryUsage();
```

---

### 6. Use Async/Await for I/O

Don't block the event loop:

```javascript
// Bad: Synchronous
const content = fs.readFileSync('large-file.txt', 'utf8');
const parsed = parseTLE(content);

// Good: Asynchronous
const content = await fs.promises.readFile('large-file.txt', 'utf8');
const parsed = parseTLE(content);
```

---

## See Also

- [Usage Examples](USAGE_EXAMPLES.md) - Practical patterns
- [API Reference](../api/API_REFERENCE.md) - Function documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
