# WebGL Satellite Visualization

WebGL-based 3D visualization of satellites and their orbits.

## Usage

```typescript
import { SatelliteVisualization } from './SatelliteVisualization';
import { parseTLE } from 'tle-parser';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Parse TLE
const tle = parseTLE(line1, line2, "ISS");

// Create visualization
const viz = new SatelliteVisualization({
  canvas,
  width: 800,
  height: 600
});

// Render
viz.render([tle]);

// Or start animation
viz.startAnimation([tle]);

// Clean up
viz.stopAnimation();
viz.destroy();
```

## HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Satellite Visualization</title>
</head>
<body>
  <canvas id="canvas" width="800" height="600"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## License

MIT
