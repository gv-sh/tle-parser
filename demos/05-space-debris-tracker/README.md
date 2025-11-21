# Space Debris Tracker

Monitor and analyze space debris using TLE Parser and D3.js visualization. Track debris objects, calculate collision risks, and visualize orbital density.

## Features

- **Debris Object Visualization**: D3.js scatter plots of debris distribution
- **Size/Altitude Filters**: Filter by debris size and orbital altitude
- **Collision Probability Calculator**: Estimate close approach risks
- **Density Heatmap**: Visualize orbital debris concentration
- **NORAD Catalog Search**: Search for specific debris objects
- **Alert System**: Real-time collision warnings
- **Risk Classification**: Color-coded risk levels (high/medium/low)
- **TLE Parsing**: Extract orbital parameters from debris TLEs

## Technology Stack

- **React**: UI framework
- **D3.js**: Data visualization
- **TLE Parser**: Orbital element parsing
- **satellite.js**: SGP4 propagation
- **Vite**: Development tooling

## Setup

```bash
cd demos/05-space-debris-tracker
npm install
npm run dev
```

Available at `http://localhost:5177`

## Usage

### Filter Debris
- **Size**: Large (>10cm), Medium (1-10cm), Small (<1cm)
- **Altitude**: Set min/max range in kilometers
- **Risk Level**: High, medium, or low collision risk

### Visualization
The scatter plot shows:
- **X-axis**: Orbital inclination (degrees)
- **Y-axis**: Altitude (km)
- **Colors**: Risk level (red=high, yellow=medium, green=low)
- **Size**: Relative debris size

### Collision Alerts
Monitor close approaches between debris and active satellites.

## TLE Parser Integration

### Parsing Debris TLEs

```javascript
// Parse debris object TLE
const debrisTLE = {
  name: 'COSMOS 2251 DEB',
  line1: '1 33592U 93036SX  23305.50000000  .00000123  00000-0  12345-4 0  9991',
  line2: '2 33592  74.0354 234.5678 0012345  89.0123 271.0123 14.55123456789012'
};

// Extract orbital parameters
const altitude = calculateAltitude(line2); // ~790 km
const inclination = parseFloat(line2.substring(8, 16)); // 74.0354°
```

### Collision Risk Calculation

```javascript
/**
 * Calculate miss distance between two objects
 */
function calculateMissDistance(obj1Position, obj2Position) {
  const dx = obj1Position.x - obj2Position.x;
  const dy = obj1Position.y - obj2Position.y;
  const dz = obj1Position.z - obj2Position.z;

  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Example: Check for close approach
const distance = calculateMissDistance(debris, satellite);
if (distance < 5.0) { // 5 km threshold
  alert('Collision warning!');
}
```

## Space Debris Statistics

- **Total tracked objects**: >34,000
- **Active satellites**: ~8,000
- **Debris objects**: >26,000
- **High-risk conjunctions**: ~20 per day

## License

MIT License

## Resources

- [Space-Track.org](https://www.space-track.org/) - TLE data
- [ESA Space Debris Office](https://www.esa.int/Safety_Security/Space_Debris)
- [NASA ODPO](https://orbitaldebris.jsc.nasa.gov/)

## Credits

Built with TLE Parser library
