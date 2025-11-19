# Browser Support Guide

The TLE Parser library provides comprehensive browser support with multiple features designed specifically for web applications.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Web Worker Support](#web-worker-support)
- [Caching Strategies](#caching-strategies)
- [File API Support](#file-api-support)
- [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features)
- [Web Components](#web-components)
- [Browser Extension](#browser-extension)
- [Examples](#examples)

## Installation

### Via NPM

```bash
npm install tle-parser
```

### Via CDN

```html
<!-- ESM build -->
<script type="module">
  import { parseTLE } from 'https://cdn.jsdelivr.net/npm/tle-parser/dist/index.browser.min.js';
</script>

<!-- UMD build (for legacy browsers) -->
<script src="https://cdn.jsdelivr.net/npm/tle-parser/dist/index.umd.min.js"></script>
<script>
  const { parseTLE } = window.TLEParser;
</script>
```

## Basic Usage

### Parsing TLE Data

```javascript
import { parseTLE } from 'tle-parser';

const tleString = `ISS (ZARYA)
1 25544U 98067A   24001.00000000  .00016717  00000-0  10270-3 0  9005
2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.50030060000000`;

const parsed = parseTLE(tleString);
console.log(parsed.name); // "ISS (ZARYA)"
console.log(parsed.satelliteNumber); // "25544"
console.log(parsed.inclination); // 51.6400
```

## Web Worker Support

For non-blocking parsing of large TLE datasets, use the Web Worker API:

```javascript
import { TLEWorkerClient } from 'tle-parser/browser';

// Create worker client
const worker = new TLEWorkerClient();

// Parse in background
const result = await worker.parse(tleString);
console.log(result);

// Parse multiple TLEs
const results = await worker.parseBatch([tle1, tle2, tle3]);

// Clean up when done
worker.terminate();
```

### Custom Worker Setup

```javascript
// Create worker with custom URL
const worker = new TLEWorkerClient('/path/to/worker.js');
```

## Caching Strategies

### IndexedDB Cache

For persistent caching of large TLE datasets:

```javascript
import { IndexedDBCache } from 'tle-parser/browser';

// Initialize cache
const cache = new IndexedDBCache('my-tle-cache');
await cache.init();

// Store TLE data (with 1 hour TTL)
await cache.set('ISS', tleData, 3600);

// Retrieve cached data
const cached = await cache.get('ISS');

// Check if exists
const exists = await cache.has('ISS');

// Clean up expired entries
const removed = await cache.cleanupExpired();

// Clear all cache
await cache.clear();

// Close connection
cache.close();
```

### LocalStorage Cache

For simpler, smaller datasets:

```javascript
import { LocalStorageCache } from 'tle-parser/browser';

const cache = new LocalStorageCache('tle-');

// Store data
cache.set('ISS', tleData, 3600);

// Retrieve data
const cached = cache.get('ISS');

// Get cache size
console.log(cache.getFormattedStorageSize()); // "15.32 KB"

// Export/import
const exported = cache.export();
cache.import(exported);
```

## File API Support

### Parsing from File Input

```html
<input type="file" id="fileInput" accept=".txt,.tle" multiple>
```

```javascript
import { parseFromFileList } from 'tle-parser/browser';

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const results = await parseFromFileList(e.target.files);

  results.forEach(result => {
    console.log(`File: ${result.fileName}`);
    console.log(`TLEs found: ${result.tleCount}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    console.log('TLEs:', result.tles);
  });
});
```

### Drag and Drop

```javascript
import { parseFromDragEvent } from 'tle-parser/browser';

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const results = await parseFromDragEvent(e);
  console.log(results);
});
```

### Parsing from URL

```javascript
import { parseFromURL } from 'tle-parser/browser';

const result = await parseFromURL('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle');
console.log(result);
```

### Downloading TLE Files

```javascript
import { downloadTLEFile } from 'tle-parser/browser';

// Download parsed TLEs as a file
downloadTLEFile(tlesArray, 'satellites.txt');
```

## Progressive Web App (PWA) Features

### Service Worker Registration

```javascript
import { registerServiceWorker } from 'tle-parser/browser';

// Register service worker
const registration = await registerServiceWorker('/sw.js');

if (registration) {
  console.log('Service Worker registered');
}
```

### Background Sync

```javascript
import { registerBackgroundSync } from 'tle-parser/browser';

// Register background sync for TLE updates
await registerBackgroundSync('sync-tle-data');
```

### Install Prompt

```javascript
import { setupInstallPrompt } from 'tle-parser/browser';

const { prompt, isInstallable } = setupInstallPrompt();

// Show install button when available
if (isInstallable()) {
  installButton.style.display = 'block';
  installButton.onclick = () => prompt();
}
```

### Storage Management

```javascript
import {
  getStorageEstimate,
  requestPersistentStorage,
  isStoragePersisted
} from 'tle-parser/browser';

// Check storage usage
const estimate = await getStorageEstimate();
console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);

// Request persistent storage
const granted = await requestPersistentStorage();

// Check if storage is persisted
const persisted = await isStoragePersisted();
```

## Web Components

### Using Built-in Components

```html
<!-- Include the library -->
<script type="module" src="tle-parser/dist/browser/components.js"></script>

<!-- TLE Parser Component -->
<tle-parser tle="1 25544U..."></tle-parser>

<!-- File Upload Component -->
<tle-file-upload></tle-file-upload>

<script>
  // Listen for events
  document.querySelector('tle-parser').addEventListener('tle-parsed', (e) => {
    console.log('Parsed:', e.detail);
  });

  document.querySelector('tle-file-upload').addEventListener('files-parsed', (e) => {
    console.log('Files:', e.detail);
  });
</script>
```

### Manual Registration

```javascript
import { registerTLEComponents } from 'tle-parser/browser';

// Register all components
registerTLEComponents();
```

## Browser Extension

See the [browser extension example](../examples/browser-extension/) for a complete implementation.

### Key Points

- Use Chrome Extension Manifest V3
- Bundle the library with your extension code
- Use `chrome.storage` for persistence
- Consider Web Workers for heavy parsing

```javascript
// In your extension's popup or content script
import { parseTLE } from 'tle-parser';

chrome.storage.local.get(['tleData'], (result) => {
  if (result.tleData) {
    const parsed = parseTLE(result.tleData);
    displayResults(parsed);
  }
});
```

## Examples

### Complete Drag-and-Drop Application

See [examples/browser/drag-and-drop.html](../examples/browser/drag-and-drop.html)

### Orbit Visualization

See [examples/browser/visualization.html](../examples/browser/visualization.html)

### Browser Extension

See [examples/browser-extension/](../examples/browser-extension/)

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic Parsing | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |
| File API | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Web Components | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ⚠️ | ❌ | ✅ |

✅ Fully supported | ⚠️ Partial support | ❌ Not supported

## Performance Tips

1. **Use Web Workers** for parsing large files (>1000 TLEs)
2. **Enable caching** to avoid re-parsing the same data
3. **Use IndexedDB** for large datasets (>5MB)
4. **Use LocalStorage** for small, frequently accessed data
5. **Implement lazy loading** for TLE visualization
6. **Compress TLE data** before storing in cache

## Troubleshooting

### CORS Issues

When fetching TLE data from external sources:

```javascript
// Use a CORS proxy if needed
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const result = await parseFromURL(proxyUrl + originalUrl);
```

### Service Worker Not Updating

```javascript
// Force service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.update());
  });
}
```

### IndexedDB Quota Exceeded

```javascript
import { IndexedDBCache } from 'tle-parser/browser';

const cache = new IndexedDBCache();
await cache.init();

// Clean up expired entries regularly
setInterval(() => cache.cleanupExpired(), 3600000); // Every hour
```

## Security Considerations

1. **Validate TLE data** before parsing untrusted input
2. **Sanitize user input** in browser extensions
3. **Use Content Security Policy** (CSP) in web apps
4. **Implement rate limiting** for external TLE sources
5. **Don't store sensitive data** in LocalStorage/IndexedDB

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/gv-sh/tle-parser/issues
- Documentation: https://github.com/gv-sh/tle-parser#readme
