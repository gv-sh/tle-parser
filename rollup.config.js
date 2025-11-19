import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

// Read package.json for version info
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Banner for all bundles
const banner = `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * @license ${pkg.license}
 */`;

// Base plugins for all builds
const basePlugins = [
  json(),
  resolve({
    preferBuiltins: true
  }),
  commonjs()
];

// TypeScript plugin configuration
const typescriptPlugin = typescript({
  tsconfig: './tsconfig.json',
  declaration: false, // We'll generate types separately
  declarationMap: false,
  sourceMap: true,
  compilerOptions: {
    module: 'esnext',
    importHelpers: false
  }
});

// Minification plugin for production builds
const minifyPlugin = terser({
  format: {
    comments: false,
    preamble: banner
  },
  compress: {
    drop_console: false,
    passes: 2
  },
  mangle: {
    properties: false
  }
});

// Configuration for different build outputs
const configs = [
  // ===================================================================
  // ESM BUILD (Modern JavaScript modules)
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true,
      banner
    },
    plugins: [
      ...basePlugins,
      typescriptPlugin
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // ESM BUILD - MINIFIED
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.mjs',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      ...basePlugins,
      typescriptPlugin,
      minifyPlugin
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // CommonJS BUILD (Node.js compatibility)
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      banner,
      exports: 'named',
      interop: 'auto'
    },
    plugins: [
      ...basePlugins,
      typescriptPlugin
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // CommonJS BUILD - MINIFIED
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      interop: 'auto'
    },
    plugins: [
      ...basePlugins,
      typescriptPlugin,
      minifyPlugin
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // UMD BUILD (Universal - works in browser and Node.js)
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'TLEParser',
      sourcemap: true,
      banner,
      exports: 'named',
      globals: {
        fs: 'fs',
        path: 'path',
        util: 'util',
        stream: 'stream',
        zlib: 'zlib'
      }
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        compilerOptions: {
          module: 'esnext',
          target: 'es2015', // More compatible target for browsers
          importHelpers: false
        }
      })
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // UMD BUILD - MINIFIED (for CDN usage)
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'TLEParser',
      sourcemap: true,
      exports: 'named',
      globals: {
        fs: 'fs',
        path: 'path',
        util: 'util',
        stream: 'stream',
        zlib: 'zlib'
      }
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        compilerOptions: {
          module: 'esnext',
          target: 'es2015',
          importHelpers: false
        }
      }),
      minifyPlugin
    ],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  },

  // ===================================================================
  // BROWSER BUILD (No Node.js dependencies)
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.browser.js',
      format: 'esm',
      sourcemap: true,
      banner
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        compilerOptions: {
          module: 'esnext',
          target: 'es2015',
          importHelpers: false
        }
      }),
      {
        name: 'browser-build',
        resolveId(source) {
          // Replace Node.js built-ins with browser alternatives
          if (source === 'fs' || source === 'path' || source === 'util' || source === 'stream' || source === 'zlib') {
            return { id: source, external: false, moduleSideEffects: false };
          }
          return null;
        },
        load(id) {
          // Provide browser shims for Node.js modules
          if (id === 'fs') {
            // Inline tleConfig.json for browser builds
            const tleConfigContent = readFileSync('./tleConfig.json', 'utf-8');
            return `
              export function readFileSync(path, encoding) {
                if (path.includes('tleConfig.json')) {
                  return ${JSON.stringify(tleConfigContent)};
                }
                throw new Error('File system access is not available in browser builds');
              }
              export function readFile() {
                throw new Error('File system access is not available in browser builds');
              }
              export function createReadStream() {
                throw new Error('File system access is not available in browser builds');
              }
              export default { readFileSync, readFile, createReadStream };
            `;
          }
          if (id === 'path') {
            return `
              export function join(...args) { return args.join('/'); }
              export default { join };
            `;
          }
          if (id === 'util') {
            return `
              export function promisify(fn) {
                return function(...args) {
                  return new Promise((resolve, reject) => {
                    fn(...args, (err, result) => {
                      if (err) reject(err);
                      else resolve(result);
                    });
                  });
                };
              }
              export default { promisify };
            `;
          }
          if (id === 'stream') {
            return `
              export class Transform {
                constructor() {
                  throw new Error('Stream operations are not available in browser builds');
                }
              }
              export default { Transform };
            `;
          }
          if (id === 'zlib') {
            return `
              export function createGunzip() {
                throw new Error('Compression operations are not available in browser builds');
              }
              export default { createGunzip };
            `;
          }
          return null;
        }
      }
    ]
  },

  // ===================================================================
  // BROWSER BUILD - MINIFIED
  // ===================================================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.browser.min.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        compilerOptions: {
          module: 'esnext',
          target: 'es2015',
          importHelpers: false
        }
      }),
      {
        name: 'browser-build',
        resolveId(source) {
          if (source === 'fs' || source === 'path' || source === 'util' || source === 'stream' || source === 'zlib') {
            return { id: source, external: false, moduleSideEffects: false };
          }
          return null;
        },
        load(id) {
          if (id === 'fs') {
            // Inline tleConfig.json for browser builds
            const tleConfigContent = readFileSync('./tleConfig.json', 'utf-8');
            return `
              export function readFileSync(path, encoding) {
                if (path.includes('tleConfig.json')) {
                  return ${JSON.stringify(tleConfigContent)};
                }
                throw new Error('File system access is not available in browser builds');
              }
              export function readFile() {
                throw new Error('File system access is not available in browser builds');
              }
              export function createReadStream() {
                throw new Error('File system access is not available in browser builds');
              }
              export default { readFileSync, readFile, createReadStream };
            `;
          }
          if (id === 'path') {
            return `
              export function join(...args) { return args.join('/'); }
              export default { join };
            `;
          }
          if (id === 'util') {
            return `
              export function promisify(fn) {
                return function(...args) {
                  return new Promise((resolve, reject) => {
                    fn(...args, (err, result) => {
                      if (err) reject(err);
                      else resolve(result);
                    });
                  });
                };
              }
              export default { promisify };
            `;
          }
          if (id === 'stream') {
            return `
              export class Transform {
                constructor() {
                  throw new Error('Stream operations are not available in browser builds');
                }
              }
              export default { Transform };
            `;
          }
          if (id === 'zlib') {
            return `
              export function createGunzip() {
                throw new Error('Compression operations are not available in browser builds');
              }
              export default { createGunzip };
            `;
          }
          return null;
        }
      },
      minifyPlugin
    ]
  },

  // ===================================================================
  // TYPE DEFINITIONS (Bundled .d.ts file)
  // ===================================================================
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()],
    external: ['fs', 'path', 'util', 'stream', 'zlib']
  }
];

export default configs;
