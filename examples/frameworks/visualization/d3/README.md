# D3.js Orbit Visualization

2D orbital plots and ground track visualizations using D3.js.

## Installation

```bash
npm install d3 tle-parser
```

## Usage

```typescript
import { OrbitPlot } from './OrbitPlot';
import { parseTLE } from 'tle-parser';

// Parse TLE
const tle = parseTLE(line1, line2, "ISS");

// Create plot
const plot = new OrbitPlot({
  container: document.getElementById('plot')!,
  width: 960,
  height: 500,
  showEarth: true,
  showGrid: true
});

// Plot ground track
plot.plotGroundTrack(tle, {
  points: 100,
  color: '#ff6b6b',
  label: true
});

// Animate position
const stopAnimation = plot.animatePosition(tle, 60000);

// Clear when done
plot.clear();
```

## HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Orbit Plot</title>
</head>
<body>
  <div id="plot"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## License

MIT
