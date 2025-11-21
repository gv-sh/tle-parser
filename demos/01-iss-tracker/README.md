# ISS Tracker Web Application

A real-time International Space Station tracker built with React and the TLE Parser library.

![ISS Tracker Demo](screenshot.png)

## Features

- **Real-time ISS Position**: Live tracking on interactive Leaflet map
- **Orbital Parameters Display**: Current altitude, velocity, and orbital period
- **Pass Predictions**: Calculate next visible passes for your location
- **Ground Track Visualization**: See the ISS's path across Earth
- **Crew Information**: Current crew members and mission details
- **Geolocation Support**: Automatic location detection for pass predictions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **React**: Modern UI framework
- **Leaflet**: Interactive mapping library
- **TLE Parser**: Parse and validate ISS orbital elements
- **satellite.js**: SGP4 propagation for real-time position calculation
- **Vite**: Fast development and build tool

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the demo directory
cd demos/01-iss-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage Guide

### Viewing ISS Position

1. The map automatically loads and shows the ISS's current position with a marker
2. The ISS updates its position every 1 second
3. Ground track shows the satellite's path over the next orbit

### Getting Pass Predictions

1. Click "Use My Location" to enable geolocation
2. Or manually enter your latitude/longitude coordinates
3. View upcoming visible passes with:
   - Rise time and azimuth
   - Maximum elevation and time
   - Set time and azimuth
   - Pass duration

### Understanding Orbital Parameters

- **Altitude**: Height above Earth's surface in kilometers
- **Velocity**: Current speed in km/s
- **Orbital Period**: Time for one complete orbit
- **Inclination**: Angle of orbit relative to equator
- **Eccentricity**: Measure of orbit circularity (0 = perfect circle)

## TLE Parser Integration

This demo showcases the TLE Parser library's capabilities:

```javascript
import { parseTLE } from 'tle-parser';

// Parse ISS TLE data
const tleData = `ISS (ZARYA)
1 25544U 98067A   23305.54321875  .00012456  00000-0  22456-3 0  9995
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849`;

const parsed = parseTLE(tleData);
console.log(parsed.satelliteName); // "ISS (ZARYA)"
console.log(parsed.inclination);   // "51.6416"
console.log(parsed.meanMotion);    // "15.72125391428849"
```

## Data Sources

ISS TLE data is fetched from:
- **CelesTrak**: https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle
- Update frequency: Every 6 hours

## API Documentation

### Main Components

#### `ISSTracker`
Main application component that coordinates all sub-components.

#### `Map`
Leaflet map component displaying ISS position and ground track.

#### `OrbitalParameters`
Displays current orbital parameters calculated from TLE data.

#### `PassPredictor`
Calculates and displays upcoming visible passes for user location.

#### `CrewInfo`
Shows current ISS crew members (static data, can be connected to API).

### Utility Functions

#### `calculatePosition(tle, date)`
Calculates satellite position at given date using SGP4 propagation.

**Parameters:**
- `tle` (object): Parsed TLE data
- `date` (Date): Time for position calculation

**Returns:** Object with `latitude`, `longitude`, `altitude`, `velocity`

#### `calculatePasses(tle, observer, startDate, duration)`
Calculates visible passes for observer location.

**Parameters:**
- `tle` (object): Parsed TLE data
- `observer` (object): Observer location `{latitude, longitude, altitude}`
- `startDate` (Date): Start time for pass predictions
- `duration` (number): Duration in days

**Returns:** Array of pass objects

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See root repository LICENSE file

## Contributing

Contributions welcome! Please see the main repository's contribution guidelines.

## Resources

- [ISS Information](https://www.nasa.gov/mission_pages/station/main/index.html)
- [TLE Format Guide](../../docs/guides/TLE_FORMAT.md)
- [Orbital Mechanics Primer](../../docs/guides/ORBITAL_MECHANICS.md)
- [CelesTrak TLE Data](https://celestrak.org/)

## Troubleshooting

### ISS position not updating
- Check browser console for errors
- Verify TLE data is loading correctly
- Ensure JavaScript is enabled

### Geolocation not working
- Grant location permissions in browser
- Use HTTPS (required for geolocation API)
- Fallback to manual coordinates if needed

### Pass predictions showing wrong times
- Verify observer location is correct
- Check system time is accurate
- Ensure timezone is set correctly

## Future Enhancements

- [ ] Live crew API integration
- [ ] ISS camera feed integration
- [ ] Historical orbit playback
- [ ] 3D orbit visualization
- [ ] Push notifications for passes
- [ ] Mobile app version
- [ ] Offline mode with cached TLEs
