# TLE Parser Browser Extension Example

This is an example browser extension that demonstrates how to use the TLE Parser library in a Chrome/Edge extension.

## Features

- Parse TLE data directly in the browser
- Save frequently used TLEs
- Display parsed orbital parameters
- Works offline with Chrome's extension storage

## Installation (Development)

1. Build the TLE Parser library:
   ```bash
   npm run build
   ```

2. Copy the browser build to the extension directory:
   ```bash
   cp ../../dist/index.browser.min.js .
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

## Usage

1. Click the extension icon in your browser toolbar
2. Paste TLE data into the text area
3. Click "Parse" to view orbital parameters
4. Click "Save" to store the TLE for later use

## Production Build

For a production extension, you would:

1. Bundle the TLE Parser library with your extension code using a bundler (webpack, rollup, etc.)
2. Minify the code
3. Create proper icon files (16x16, 48x48, 128x128)
4. Submit to the Chrome Web Store

## Notes

- This example uses Chrome Extension Manifest V3
- The parser code in `popup.js` is simplified for demonstration
- In production, import the full `tle-parser` library
- Consider using Web Workers for parsing large files

## License

MIT
