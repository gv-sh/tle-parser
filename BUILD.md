# Build System Documentation

This document describes the modern build pipeline for the TLE Parser library.

## Overview

The TLE Parser uses a modern, multi-format build system based on Rollup that generates optimized bundles for different JavaScript environments:

- **ESM (ES Modules)**: Modern JavaScript modules (`.mjs`)
- **CommonJS**: Node.js compatibility (`.cjs`)
- **UMD (Universal Module Definition)**: Browser and Node.js compatibility (`.js`)
- **Browser**: Standalone browser bundles with no Node.js dependencies (`.js`)

All builds include both regular and minified versions, plus source maps for debugging.

## Build Outputs

### Node.js Builds

#### ESM (ES Modules)
- `dist/index.mjs` - Standard ESM build with source maps
- `dist/index.min.mjs` - Minified ESM build with source maps
- **Use case**: Modern Node.js applications (Node 14+), TypeScript projects
- **Import**: `import { parseTLE } from 'tle-parser'`

#### CommonJS
- `dist/index.cjs` - Standard CommonJS build with source maps
- `dist/index.min.cjs` - Minified CommonJS build with source maps
- **Use case**: Legacy Node.js applications, older build tools
- **Import**: `const { parseTLE } = require('tle-parser')`

### Universal Builds

#### UMD (Universal Module Definition)
- `dist/index.umd.js` - Standard UMD build with source maps
- `dist/index.umd.min.js` - Minified UMD build with source maps
- **Use case**: Script tags, AMD loaders, both browser and Node.js
- **CDN Usage**:
  ```html
  <script src="https://unpkg.com/tle-parser/dist/index.umd.min.js"></script>
  <script>
    const tle = TLEParser.parseTLE(tleData);
  </script>
  ```

### Browser Builds

#### Pure Browser
- `dist/index.browser.js` - Browser ESM build (no Node.js dependencies)
- `dist/index.browser.min.js` - Minified browser build
- **Use case**: Modern browsers with ESM support
- **Import**: `import { parseTLE } from './node_modules/tle-parser/dist/index.browser.min.js'`

## Build Scripts

```bash
# Clean dist directory
npm run clean

# Build TypeScript (generates .d.ts files)
npm run build:tsc

# Build all Rollup bundles
npm run build:rollup

# Full build (clean + TypeScript + Rollup)
npm run build

# Watch mode for development
npm run build:watch

# Check bundle sizes
npm run size

# Analyze bundle composition
npm run size:why
```

## Bundle Size Monitoring

The project uses `size-limit` to monitor and enforce bundle size limits:

```bash
npm run size
```

Current limits:
- Browser Build: 25 KB (gzipped)
- Browser Build (Minified): 15 KB (gzipped)

Actual sizes (as of latest build):
- Browser Build: ~8.4 KB (gzipped)
- Browser Build (Minified): ~8.4 KB (gzipped)

## Package Exports

The package uses modern Node.js exports for automatic format selection:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/index.browser.min.js",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    }
  }
}
```

This means:
- TypeScript will use type definitions from `dist/index.d.ts`
- Browsers will use `dist/index.browser.min.js`
- ESM `import` will use `dist/index.mjs`
- CommonJS `require` will use `dist/index.cjs`

## Build Features

### Tree-Shaking

All builds support tree-shaking, allowing bundlers to eliminate unused code:

```javascript
// Only parseTLE will be included in your bundle
import { parseTLE } from 'tle-parser';
```

The package is marked as `"sideEffects": false` to enable maximum tree-shaking.

### Source Maps

All builds include source maps (`.map` files) for debugging:
- Enables stepping through TypeScript source in debuggers
- Shows original line numbers in stack traces
- Works in both Node.js and browser dev tools

### Minification

Production builds are minified using Terser:
- Dead code elimination
- Variable name mangling (preserving public API)
- Comment removal (except license banner)
- Constant folding and other optimizations

## Build Tools

### Rollup
Primary build tool for creating optimized bundles:
- **Plugins**:
  - `@rollup/plugin-typescript` - TypeScript compilation
  - `@rollup/plugin-node-resolve` - Module resolution
  - `@rollup/plugin-commonjs` - CommonJS to ESM conversion
  - `@rollup/plugin-terser` - Minification
  - `@rollup/plugin-json` - JSON imports
  - `rollup-plugin-dts` - Type definition bundling

### TypeScript
Used for:
- Type checking
- Generating `.d.ts` type definitions
- Source to JavaScript transpilation

### Size Limit
Bundle size monitoring and limiting:
- Enforces maximum bundle sizes
- Prevents bundle bloat
- CI/CD integration

## Development Workflow

### Local Development

1. **Make changes** to TypeScript source files in `src/`
2. **Build** with `npm run build`
3. **Test** with `npm test`
4. **Check sizes** with `npm run size`

### Watch Mode

For continuous development:

```bash
npm run build:watch
```

This will rebuild bundles automatically when source files change.

### Testing Builds

Test scripts are included to verify all build outputs:

```bash
# Test CommonJS builds
node test-builds.cjs

# Test ESM and browser builds
node test-builds.mjs
```

## Publishing Workflow

### Manual Publishing

```bash
npm run build
npm test
npm run size
npm publish
```

### Automated Publishing

GitHub Actions workflow (`.github/workflows/publish.yml`) automatically publishes to npm when:

1. **Release is created** on GitHub
   - Regular releases → published with `latest` tag
   - Pre-releases → published with `beta`, `alpha`, or `next` tag

2. **Manual workflow dispatch**
   - Allows manual triggering with optional version tag

The workflow includes:
- Dependency installation
- Full test suite execution
- Bundle size verification
- Package content verification
- npm provenance attestation

## Continuous Integration

### Build Verification (`.github/workflows/ci.yml`)

Runs on every push and PR:
- Tests on Node.js versions 18, 20, and 22
- Verifies all build outputs
- Runs test suite with coverage
- Tests both ESM and CommonJS imports

### Bundle Size Checks (`.github/workflows/size.yml`)

Runs on PRs to main/master:
- Compares bundle sizes with base branch
- Reports size changes in PR comments
- Enforces bundle size limits
- Generates detailed size reports

## Browser Compatibility

The browser builds have special handling for Node.js built-ins:

### File System Shim
The `tleConfig.json` file is inlined into browser builds, eliminating the need for file system access.

### Path Shim
A minimal path module shim is included for basic path operations.

### Compatibility
Browser builds target ES2015 (ES6) for broad compatibility while maintaining small bundle sizes.

## Advanced Configuration

### Rollup Configuration

The Rollup configuration (`rollup.config.js`) can be customized:

```javascript
// Add new output formats
configs.push({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.custom.js',
    format: 'iife',
    name: 'TLEParser'
  },
  plugins: [...]
});
```

### Size Limits

Adjust bundle size limits in `.size-limit.json`:

```json
[
  {
    "name": "Browser Build (Minified)",
    "path": "dist/index.browser.min.js",
    "limit": "15 KB",
    "gzip": true
  }
]
```

## Troubleshooting

### Build Fails with Module Errors

Ensure all dependencies are installed:
```bash
npm ci
```

### Source Maps Not Working

Verify source maps are being generated:
```bash
ls -la dist/*.map
```

### Bundle Size Too Large

Analyze what's in your bundle:
```bash
npm run size:why
```

Check for:
- Unnecessary dependencies
- Large data files
- Duplicate code

### Import Errors in Node.js

Make sure you're using the correct import syntax for your environment:

```javascript
// ESM (package.json has "type": "module")
import { parseTLE } from 'tle-parser';

// CommonJS
const { parseTLE } = require('tle-parser');
```

## Performance Considerations

### Bundle Optimization

The build system includes several optimizations:

1. **Code Splitting**: Separate builds for different environments
2. **Tree Shaking**: Unused exports are eliminated
3. **Minification**: Production builds are compressed
4. **Source Map Optimization**: Maps are generated separately

### Build Time

Typical build times on modern hardware:
- TypeScript compilation: ~2-3 seconds
- Rollup bundling: ~30-40 seconds (all formats)
- Total build time: ~40-45 seconds

## Future Enhancements

Potential improvements to the build system:

- [ ] Code splitting for optional features
- [ ] Lightweight core package with optional plugins
- [ ] Differential builds for modern vs. legacy browsers
- [ ] Further bundle size optimizations
- [ ] Brotli compression support
- [ ] Web Worker builds
