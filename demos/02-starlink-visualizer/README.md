# Starlink Constellation Visualizer

A real-time visualization of the Starlink satellite constellation built with React and the TLE Parser library.

![Starlink Visualizer Demo](screenshot.png)

## Features

- **Real-time Constellation Tracking**: Track hundreds of Starlink satellites simultaneously
- **Interactive Map**: Visualize satellite positions on an interactive Leaflet map
- **Orbital Shell Classification**: Color-coded visualization of different orbital shells
- **Live Statistics**: Real-time constellation statistics and metrics
- **Altitude Distribution**: Chart showing satellite distribution by altitude
- **Satellite Search**: Search and filter satellites by name or NORAD ID
- **Shell Filtering**: Filter view by specific orbital shells
- **Adjustable Update Rate**: Control position update frequency
- **Coverage Analysis**: Global coverage estimation

## Technology Stack

- **React**: Modern UI framework
- **Leaflet**: Interactive mapping library
- **Chart.js**: Data visualization for altitude distribution
- **TLE Parser**: Parse and validate satellite orbital elements
- **satellite.js**: SGP4 propagation for real-time position calculation
- **Vite**: Fast development and build tool

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the demo directory
cd demos/02-starlink-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5174`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage Guide

### Viewing the Constellation

1. The map automatically loads and displays all Starlink satellites
2. Satellites are color-coded by orbital shell:
   - **Blue (#00d4ff)**: Shell 1 (550 km, 53°)
   - **Green (#00ff88)**: Shell 2 (540 km, 53.2°)
   - **Purple (#ff00ff)**: Shell 3 (570 km, 70°)
   - **Orange (#ffaa00)**: Shell 4 (560 km, 97.6°)

### Filtering by Orbital Shell

1. Use the "Orbital Shell" dropdown in the header
2. Select a specific shell to view only those satellites
3. The map and statistics update automatically

### Adjusting Update Rate

1. Use the "Update Rate" dropdown to control how frequently positions are recalculated
2. Options: 1s, 5s, 10s, or 30s
3. Lower update rates reduce CPU usage

### Searching Satellites

1. Use the search box in the satellite list panel
2. Search by satellite name (e.g., "STARLINK-1007")
3. Or search by NORAD catalog number

### Understanding Statistics

- **Total Satellites**: Number of satellites loaded from TLE data
- **Active Tracking**: Number of satellites with calculated positions
- **Orbital Shells**: Number of distinct orbital shells
- **Global Coverage**: Estimated global coverage percentage
- **Shell Distribution**: Bar chart showing satellite count per shell
- **Altitude Distribution**: Histogram of satellite altitudes

## TLE Parser Integration

This demo showcases comprehensive TLE Parser usage:

### Parsing Multiple TLE Entries

```javascript
// Parse batch TLE data (3-line format per satellite)
function parseTLEBatch(tleText) {
  const lines = tleText.trim().split('\n');
  const satellites = [];

  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();

    const parsed = parseTLE(name, line1, line2);
    satellites.push(parsed);
  }

  return satellites;
}
```

### Extracting Orbital Parameters

```javascript
// Extract key orbital elements from TLE
function parseTLE(name, line1, line2) {
  // Catalog number from line 1 (columns 3-7)
  const catalogNumber = parseInt(line1.substring(2, 7));

  // Inclination from line 2 (columns 9-16)
  const inclination = parseFloat(line2.substring(8, 16));

  // Mean motion from line 2 (columns 53-63)
  const meanMotion = parseFloat(line2.substring(52, 63));

  // Create SGP4 satellite record
  const satrec = satellite.twoline2satrec(line1, line2);

  return {
    name,
    catalogNumber,
    inclination,
    meanMotion,
    satrec
  };
}
```

### Orbital Shell Classification

```javascript
// Classify satellites by orbital parameters
function classifyOrbitalShell(inclination, meanMotion) {
  const altitude = altitudeFromMeanMotion(meanMotion);

  if (inclination >= 52 && inclination <= 54) {
    if (altitude >= 545 && altitude <= 555) {
      return 'Shell 1 (550 km, 53°)';
    }
  } else if (inclination >= 69 && inclination <= 71) {
    return 'Shell 3 (570 km, 70°)';
  }

  return 'Unknown Shell';
}
```

### Position Calculation

```javascript
// Calculate real-time positions using SGP4
export function calculatePositions(satellites) {
  const now = new Date();

  return satellites.map(sat => {
    const positionAndVelocity = satellite.propagate(sat.satrec, now);
    const gmst = satellite.gstime(now);
    const positionGd = satellite.eciToGeodetic(
      positionAndVelocity.position,
      gmst
    );

    return {
      ...sat,
      position: {
        latitude: positionGd.latitude * (180 / Math.PI),
        longitude: positionGd.longitude * (180 / Math.PI),
        altitude: positionGd.height
      }
    };
  });
}
```

## Data Sources

Starlink TLE data can be fetched from:
- **CelesTrak**: https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle
- **Space-Track**: https://www.space-track.org (requires registration)
- Update frequency: Multiple times per day

## API Documentation

### Main Components

#### `App`
Main application component coordinating all functionality.

#### `StarlinkMap`
Leaflet map component displaying satellite positions with color-coded markers.

#### `ConstellationStats`
Displays real-time constellation statistics and shell distribution.

#### `CoverageChart`
Chart.js visualization of altitude distribution.

#### `SatelliteList`
Scrollable, searchable list of satellites with key parameters.

### Utility Functions

#### `fetchStarlinkTLEs()`
Fetches Starlink TLE data from CelesTrak or uses sample data.

**Returns:** Promise<Array> - Array of parsed satellite objects

#### `calculatePositions(satellites)`
Calculates current positions for all satellites using SGP4.

**Parameters:**
- `satellites` (Array): Satellite objects with satrec

**Returns:** Array - Satellites with updated position data

#### `parseTLE(name, line1, line2)`
Parses individual TLE entry and extracts orbital elements.

**Parameters:**
- `name` (string): Satellite name
- `line1` (string): TLE line 1
- `line2` (string): TLE line 2

**Returns:** Object - Parsed satellite data

#### `classifyOrbitalShell(inclination, meanMotion)`
Classifies satellite into Starlink orbital shell.

**Parameters:**
- `inclination` (number): Orbital inclination in degrees
- `meanMotion` (number): Mean motion in revolutions/day

**Returns:** string - Orbital shell classification

## Starlink Orbital Shells

Starlink operates multiple orbital shells for global coverage:

### Shell 1 (Phase 1)
- **Altitude**: 550 km
- **Inclination**: 53°
- **Satellites**: ~1,584 planned
- **Coverage**: Mid-latitudes

### Shell 2
- **Altitude**: 540 km
- **Inclination**: 53.2°
- **Satellites**: ~1,600 planned
- **Coverage**: Enhanced mid-latitudes

### Shell 3
- **Altitude**: 570 km
- **Inclination**: 70°
- **Satellites**: ~720 planned
- **Coverage**: High latitudes

### Shell 4
- **Altitude**: 560 km
- **Inclination**: 97.6°
- **Satellites**: ~348 planned
- **Coverage**: Polar coverage

## Performance Optimization

### Tips for Handling Large Constellations

1. **Reduce Update Frequency**: Use 10s or 30s updates for >1000 satellites
2. **Filter by Shell**: View one shell at a time to reduce rendering load
3. **Limit Map Markers**: Component limits visible satellites automatically
4. **Use Production Build**: Much faster than development mode

### Browser Recommendations

- **Best Performance**: Chrome 90+, Edge 90+
- **Good Performance**: Firefox 88+, Safari 14+
- **Mobile**: May struggle with >500 satellites

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Satellites Not Appearing

- Check browser console for errors
- Verify TLE data is loading correctly
- Try refreshing TLE data with the "Refresh TLEs" button

### Poor Performance

- Reduce update frequency to 10s or 30s
- Filter by a specific orbital shell
- Close other browser tabs
- Use production build instead of dev mode

### Map Not Loading

- Check internet connection (map tiles require network)
- Verify Leaflet CSS is loaded
- Check browser console for tile loading errors

## Future Enhancements

- [ ] Live TLE data integration with CelesTrak API
- [ ] Ground station visibility calculations
- [ ] 3D globe visualization option
- [ ] Satellite ground track predictions
- [ ] Coverage area visualization
- [ ] Time slider for historical playback
- [ ] Export satellite positions to CSV/JSON
- [ ] Custom orbital shell definitions
- [ ] WebGL rendering for >10,000 satellites
- [ ] Mobile app version

## Educational Value

This demo teaches:
- TLE format and parsing
- Orbital mechanics basics
- SGP4 propagation model
- Satellite constellation design
- Global coverage strategies
- Real-time position calculation
- Large-scale data visualization

## License

MIT License - See root repository LICENSE file

## Contributing

Contributions welcome! Please see the main repository's contribution guidelines.

## Resources

- [Starlink Information](https://www.starlink.com/)
- [TLE Format Guide](../../docs/guides/TLE_FORMAT.md)
- [SGP4 Propagation](https://en.wikipedia.org/wiki/Simplified_perturbations_models)
- [CelesTrak TLE Data](https://celestrak.org/)
- [Orbital Mechanics Primer](../../docs/guides/ORBITAL_MECHANICS.md)

## Credits

- TLE data courtesy of [CelesTrak](https://celestrak.org/)
- Map tiles from [CartoDB](https://carto.com/)
- Orbital calculations using [satellite.js](https://github.com/shashwatak/satellite-js)
