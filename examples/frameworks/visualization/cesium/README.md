# Cesium.js 3D Globe Visualization

3D satellite visualization on an interactive globe using Cesium.js.

## Installation

```bash
npm install cesium tle-parser
```

## Setup

1. Get a Cesium Ion token from https://cesium.com/ion/
2. Configure your build tool to include Cesium assets

## Usage

```typescript
import { SatelliteViewer } from './SatelliteViewer';
import { parseTLE } from 'tle-parser';

// Create viewer
const viewer = new SatelliteViewer({
  container: 'cesiumContainer',
  cesiumToken: 'YOUR_CESIUM_TOKEN'
});

// Parse TLE and add satellite
const tle = parseTLE(line1, line2, "ISS");
viewer.addSatellite(tle, {
  color: Cesium.Color.YELLOW,
  showOrbit: true
});

// Add ground station
viewer.addGroundStation('New York', 40.7128, -74.0060);

// Start tracking
viewer.startTracking([tle], 1000);

// Focus on satellite
viewer.focusSatellite('sat-25544');

// Draw line of sight
viewer.drawLineOfSight('New York', 'sat-25544');

// Clean up
viewer.destroy();
```

## HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cesium Satellite Viewer</title>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
  <style>
    #cesiumContainer {
      width: 100%;
      height: 100vh;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## Features

- 3D globe with terrain
- Real-time satellite tracking
- Orbital path visualization
- Ground station markers
- Line of sight calculations
- Camera tracking

## License

MIT
