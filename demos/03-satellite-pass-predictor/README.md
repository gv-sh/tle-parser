# Satellite Pass Predictor

A comprehensive satellite pass prediction tool built with Vue.js and the TLE Parser library. Calculate when satellites will be visible from your location with detailed timing, azimuth, and elevation data.

## Features

- **Location Input**: Manual entry or automatic geolocation
- **Multiple Satellites**: Choose from ISS, NOAA weather satellites, Hubble, and more
- **7-Day Predictions**: Calculate passes for up to 30 days in advance
- **Detailed Pass Data**: Rise/set times, azimuth, elevation, and duration
- **Sky Map Visualization**: Interactive polar plot showing satellite paths across the sky
- **Elevation Filtering**: Show only passes above specified elevation
- **Calendar Export**: Export passes to iCalendar (.ics) format
- **Visibility Rating**: Automatic quality rating based on maximum elevation

## Technology Stack

- **Vue 3**: Progressive JavaScript framework
- **Chart.js**: Sky map visualization
- **TLE Parser**: Parse and validate satellite orbital elements
- **satellite.js**: SGP4 propagation for position calculation
- **date-fns**: Date formatting and manipulation
- **Vite**: Fast development and build tool

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the demo directory
cd demos/03-satellite-pass-predictor

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5175`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage Guide

### Setting Your Location

#### Option 1: Use Geolocation
1. Click "Use My Location" button
2. Grant location permission when prompted
3. Your coordinates will be automatically filled

#### Option 2: Manual Entry
1. Enter latitude (-90 to 90)
2. Enter longitude (-180 to 180)
3. Enter altitude in meters (optional, default 0)

### Selecting a Satellite

1. Use the satellite dropdown menu
2. View orbital parameters for selected satellite:
   - Inclination
   - Orbital period
   - Average altitude

Available satellites:
- **ISS**: International Space Station
- **NOAA-18**: Polar weather satellite
- **NOAA-19**: Polar weather satellite
- **Hubble Space Telescope**: Low Earth orbit observatory
- **Tiangong**: Chinese space station

### Configuring Predictions

1. **Prediction Duration**: Choose 1-30 days (default: 7)
2. **Minimum Elevation**: Set threshold (0-90°, default: 10°)
   - Higher values = fewer but better quality passes
   - Recommended: 10° for general viewing, 30° for photography

### Calculating Passes

1. Ensure location and satellite are configured
2. Click "Calculate Passes"
3. View results in the predictions table

### Understanding Pass Data

Each pass includes:
- **Date**: Date of the pass
- **Rise Time**: When satellite appears above horizon
- **Rise Azimuth**: Compass direction of rise (0°=N, 90°=E, 180°=S, 270°=W)
- **Max Elevation Time**: When satellite reaches highest point
- **Max Elevation**: Highest angle above horizon
- **Max Elevation Azimuth**: Direction at maximum elevation
- **Set Time**: When satellite disappears below horizon
- **Set Azimuth**: Compass direction of set
- **Duration**: Total pass duration
- **Visibility**: Quality rating (Excellent/Good/Fair)

### Visibility Ratings

- **Excellent** (60°+): Overhead passes, best viewing
- **Good** (30-60°): High angle passes, very visible
- **Fair** (10-30°): Low angle passes, may be obscured

### Sky Map Visualization

The polar sky map shows:
- **Concentric circles**: Elevation angles (30°, 60°, 90°)
- **Radial lines**: Azimuth directions
- **Cardinal directions**: N, S, E, W markers
- **Pass paths**: Curved lines showing satellite trajectory
- **Color coding**:
  - Green dot: Rise point
  - Orange dot: Maximum elevation point
  - Red dot: Set point
  - Blue line: First (upcoming) pass
  - Light blue: Future passes

### Exporting to Calendar

1. Calculate passes first
2. Click "Export to iCal"
3. Import the downloaded .ics file into:
   - Google Calendar
   - Apple Calendar
   - Outlook
   - Any iCalendar-compatible app

Calendar events include:
- Pass start/end times
- Maximum elevation in title
- Complete pass details in description
- 5-minute reminder before each pass

## TLE Parser Integration

This demo showcases TLE Parser for pass prediction:

### Parsing TLE Data

```javascript
import { parseTLE } from './utils/passCalculator';

// Parse satellite TLE
const tleData = parseTLE(
  'ISS (ZARYA)',
  '1 25544U 98067A   23305.50000000  .00016717  00000-0  10270-3 0  9992',
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849'
);

console.log(tleData.inclination);  // 51.6416
console.log(tleData.period);       // 92.68 minutes
console.log(tleData.altitude);     // ~420 km
```

### Calculating Passes

```javascript
import { calculatePasses } from './utils/passCalculator';

const satellite = {
  name: 'ISS',
  tle: {
    line1: '1 25544U 98067A   ...',
    line2: '2 25544  51.6416 ...'
  }
};

const observer = {
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 0
};

const passes = await calculatePasses(
  satellite,
  observer,
  7,    // days
  10    // min elevation
);

passes.forEach(pass => {
  console.log(`Rise: ${pass.rise.time}`);
  console.log(`Max: ${pass.maxElevation.elevation}° at ${pass.maxElevation.time}`);
  console.log(`Set: ${pass.set.time}`);
});
```

### Look Angle Calculation

The pass calculator computes azimuth and elevation:

```javascript
// From passCalculator.js
function calculateLookAngles(satrec, observerGd, time) {
  // 1. Propagate satellite to current time
  const positionAndVelocity = satellite.propagate(satrec, time);

  // 2. Get Greenwich Mean Sidereal Time
  const gmst = satellite.gstime(time);

  // 3. Calculate look angles
  const lookAngles = satellite.ecfToLookAngles(
    observerGd,
    positionAndVelocity.position,
    gmst
  );

  return {
    azimuth: lookAngles.azimuth * 180 / Math.PI,
    elevation: lookAngles.elevation * 180 / Math.PI,
    range: lookAngles.rangeSat
  };
}
```

### TLE Field Extraction

```javascript
// Extract orbital parameters from TLE
const catalogNumber = parseInt(line1.substring(2, 7));
const inclination = parseFloat(line2.substring(8, 16));
const raan = parseFloat(line2.substring(17, 25));
const eccentricity = parseFloat('0.' + line2.substring(26, 33));
const meanMotion = parseFloat(line2.substring(52, 63));

// Calculate derived values
const period = 1440 / meanMotion; // minutes
const altitude = calculateAltitudeFromMeanMotion(meanMotion);
```

## Data Sources

TLE data can be obtained from:
- **CelesTrak**: https://celestrak.org/
- **Space-Track**: https://www.space-track.org (free registration required)
- **Heavens-Above**: https://www.heavens-above.com/

Update frequency: Daily or more frequent for active satellites

## API Documentation

### Components

#### `App.vue`
Main application component coordinating all functionality.

#### `LocationInput.vue`
Location configuration with manual entry and geolocation.

#### `SatelliteSelector.vue`
Satellite selection with orbital parameter display.

#### `PredictionSettings.vue`
Configure prediction duration and elevation threshold.

#### `PassPredictions.vue`
Tabular display of calculated passes.

#### `SkyMap.vue`
Canvas-based polar plot of satellite paths.

### Utility Functions

#### `calculatePasses(satellite, observer, days, minElevation)`
Calculate satellite passes over observer location.

**Parameters:**
- `satellite` (Object): Satellite with TLE data
- `observer` (Object): Observer location
- `days` (number): Prediction duration
- `minElevation` (number): Minimum elevation

**Returns:** Promise<Array> - Array of pass objects

#### `parseTLE(name, line1, line2)`
Parse TLE data and extract orbital parameters.

**Returns:** Object with parsed TLE fields

#### `exportToICS(passes, satelliteName)`
Export passes to iCalendar format.

#### `calculateDopplerShift(frequency, rangeRate)`
Calculate Doppler shift for radio tracking.

## Coordinate Systems

### Azimuth
- **0°**: North
- **90°**: East
- **180°**: South
- **270°**: West

### Elevation
- **0°**: Horizon
- **45°**: Halfway to zenith
- **90°**: Directly overhead (zenith)

### Negative Elevation
Satellite is below horizon (not visible)

## Practical Applications

### Amateur Astronomy
- Plan satellite observation sessions
- Time Hubble or ISS photography
- Coordinate group observations

### Ham Radio
- Schedule satellite contacts
- Calculate Doppler shift for frequency adjustment
- Plan antenna tracking

### Education
- Teach orbital mechanics
- Demonstrate satellite coverage
- Learn celestial navigation

### Photography
- Plan ISS transit photography
- Time satellite streak captures
- Calculate exposure timing

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Geolocation requires HTTPS in production.

## Troubleshooting

### No Passes Found

- Check location coordinates are correct
- Lower minimum elevation (try 0°)
- Increase prediction duration
- Verify satellite TLE is current

### Geolocation Not Working

- Grant location permission
- Use HTTPS (required for geolocation)
- Try manual coordinate entry
- Check browser compatibility

### Incorrect Pass Times

- Verify system time and timezone
- Use current TLE data (updated within 7 days)
- Check location coordinates

### Calendar Export Not Working

- Ensure passes are calculated first
- Check browser allows downloads
- Try different calendar app

## Future Enhancements

- [ ] Live TLE updates from CelesTrak API
- [ ] Sun/Moon position overlay
- [ ] Visibility analysis (daylight/darkness)
- [ ] Magnitude predictions
- [ ] Ground track visualization
- [ ] Multi-satellite comparison
- [ ] Mobile app version
- [ ] Pass notifications
- [ ] Weather integration
- [ ] Camera planning tools

## License

MIT License - See root repository LICENSE file

## Contributing

Contributions welcome! Please see the main repository's contribution guidelines.

## Resources

- [Satellite Pass Prediction Theory](../../docs/guides/PASS_PREDICTION.md)
- [TLE Format Guide](../../docs/guides/TLE_FORMAT.md)
- [Orbital Mechanics Primer](../../docs/guides/ORBITAL_MECHANICS.md)
- [Heavens-Above](https://www.heavens-above.com/)
- [N2YO Satellite Tracking](https://www.n2yo.com/)

## Credits

- TLE data courtesy of [CelesTrak](https://celestrak.org/)
- SGP4 calculations using [satellite.js](https://github.com/shashwatak/satellite-js)
- Built with [Vue.js](https://vuejs.org/)
