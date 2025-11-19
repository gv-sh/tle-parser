# Electron Integration for TLE Parser

Electron application example with IPC communication for TLE operations.

## Installation

```bash
npm install electron tle-parser
```

## Files

- `main.js` - Main process with IPC handlers
- `preload.js` - Preload script exposing TLE API
- `index.html` - Renderer process UI

## Usage in Renderer

```javascript
// In your renderer process (index.html or React component)
const parseTLE = async () => {
  const result = await window.tleAPI.parseTLE(line1, line2, line0);
  if (result.success) {
    console.log(result.data);
  }
};

const calculatePosition = async () => {
  const result = await window.tleAPI.calculatePosition(line1, line2, line0, new Date());
  if (result.success) {
    console.log(result.data);
  }
};
```

## Package.json

```json
{
  "name": "tle-electron-app",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron": "^latest",
    "tle-parser": "^1.0.0"
  }
}
```

## License

MIT
