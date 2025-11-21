# TLE Parser Demo Applications - Technical Documentation

This document provides detailed technical information about all 12 demo applications built with the TLE Parser library.

## Overview

The demo applications demonstrate real-world use cases for satellite tracking, orbital mechanics calculations, and TLE data management. Each demo showcases different features of the TLE Parser library and provides production-ready code that can be adapted for custom applications.

## Architecture

### Common Patterns

All demos follow similar architectural patterns:

1. **TLE Data Fetching**: Retrieve TLE data from CelesTrak or use sample data
2. **Parsing**: Use TLE Parser to extract orbital elements
3. **Propagation**: Calculate satellite positions using SGP4
4. **Visualization**: Display data using appropriate UI framework
5. **Real-time Updates**: Refresh positions at regular intervals

### Technology Stack

#### Frontend Frameworks
- **React** (7 demos): Component-based UI with hooks
- **Vue.js** (3 demos): Reactive UI with composition API
- **Phaser.js** (1 demo): Game engine for orbital simulation

#### Visualization
- **Leaflet**: 2D mapping (ISS Tracker, Starlink Visualizer)
- **Three.js**: 3D graphics (Educational Tool, 3D Earth Viewer)
- **D3.js**: Data visualization (Starlink, Space Debris)
- **Chart.js**: Charts and graphs (Pass Predictor, Collision Warning)

#### Build System
- **Vite**: Fast development server and optimized builds
- **ES Modules**: Modern JavaScript module system

## Demo Details

### 01: ISS Tracker

**Purpose**: Real-time tracking of the International Space Station

**Key Features**:
- Live position updates every second
- Interactive Leaflet map with ISS marker
- Orbital parameters display
- Pass prediction for user location
- Ground track visualization
- Crew information

**TLE Parser Integration**:
```javascript
// Fetch and parse ISS TLE
const tleData = await fetchISSTLE();
const parsed = parseTLE(tleData);

// Extract orbital parameters
const inclination = parseFloat(parsed.inclination);
const eccentricity = parseFloat('0.' + parsed.eccentricity);
const meanMotion = parseFloat(parsed.meanMotion);
```

**Position Calculation**:
```javascript
import * as satellite from 'satellite.js';

const satrec = satellite.twoline2satrec(
  tleData.line1Raw,
  tleData.line2Raw
);

const positionAndVelocity = satellite.propagate(satrec, new Date());
const gmst = satellite.gstime(new Date());
const positionGd = satellite.eciToGeodetic(
  positionAndVelocity.position,
  gmst
);
```

**Components**:
- `ISSMap.jsx`: Leaflet map with ISS marker and ground track
- `OrbitalParameters.jsx`: Display current orbital parameters
- `PassPredictor.jsx`: Calculate and show upcoming passes
- `CrewInfo.jsx`: Current ISS crew members

**Performance**: Updates at 1Hz without performance degradation

---

### 02: Starlink Visualizer

**Purpose**: Visualize and analyze the Starlink satellite constellation

**Key Features**:
- Track 4000+ Starlink satellites
- Orbital shell classification
- Altitude distribution charts
- Coverage area analysis
- Satellite search and filtering
- Statistics dashboard

**TLE Parser Integration**:
```javascript
// Batch parse Starlink TLEs
const starlinkTLEs = await fetchStarlinkTLEs();
const satellites = starlinkTLEs.map(tle => {
  const parsed = parseTLE(tle);
  return {
    ...parsed,
    shell: classifyOrbitalShell(parsed),
    altitude: calculateAltitude(parsed)
  };
});
```

**Orbital Shell Classification**:
```javascript
function classifyOrbitalShell(tle) {
  const altitude = calculateMeanAltitude(tle);
  if (altitude < 350) return 'Shell 1 (340 km)';
  if (altitude < 370) return 'Shell 2 (350 km)';
  if (altitude < 560) return 'Shell 3 (550 km)';
  return 'Other';
}
```

**Visualization**:
- D3.js scatter plot for altitude distribution
- Leaflet map for real-time positions
- Chart.js for statistics

**Performance**: Handles 4000+ satellites with 10-second update interval

---

### 03: Satellite Pass Predictor

**Purpose**: Calculate when satellites will be visible from observer location

**Key Features**:
- Manual and geolocation-based position input
- Satellite selection from catalog
- 7-day pass predictions
- Sky map visualization
- Rise/max/set timing with azimuth/elevation
- iCal calendar export

**TLE Parser Integration**:
```javascript
// Parse satellite TLE and predict passes
const tle = parseTLE(satelliteTLE);
const passes = calculatePasses(tle, observer, startDate, 7);

function calculatePasses(tle, observer, start, days) {
  const passes = [];
  const satrec = satellite.twoline2satrec(tle.line1Raw, tle.line2Raw);

  // Check position every minute
  for (let i = 0; i < days * 24 * 60; i++) {
    const time = new Date(start.getTime() + i * 60 * 1000);
    const lookAngles = calculateLookAngles(observer, satrec, time);

    if (lookAngles.elevation > minElevation) {
      // Track pass...
    }
  }

  return passes;
}
```

**Look Angle Calculation**:
```javascript
function calculateLookAngles(observer, satrec, time) {
  const positionAndVelocity = satellite.propagate(satrec, time);
  const gmst = satellite.gstime(time);
  const positionGd = satellite.eciToGeodetic(
    positionAndVelocity.position,
    gmst
  );

  // Calculate azimuth and elevation
  const azimuth = calculateAzimuth(observer, positionGd);
  const elevation = calculateElevation(observer, positionGd);

  return { azimuth, elevation };
}
```

**Calendar Export**:
```javascript
function exportToIcal(passes) {
  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\n';

  passes.forEach(pass => {
    ical += 'BEGIN:VEVENT\n';
    ical += `DTSTART:${formatIcalDate(pass.rise.time)}\n`;
    ical += `DTEND:${formatIcalDate(pass.set.time)}\n`;
    ical += `SUMMARY:Satellite Pass - Max El: ${pass.max.elevation}°\n`;
    ical += 'END:VEVENT\n';
  });

  ical += 'END:VCALENDAR';
  return ical;
}
```

---

### 04: Ham Radio Scheduler

**Purpose**: Track amateur radio satellites with Doppler shift calculations

**Key Features**:
- List of amateur radio satellites
- Frequency band filters
- Real-time Doppler shift calculation
- Antenna pointing angles
- Maidenhead grid locator support
- Equipment configuration

**TLE Parser Integration**:
```javascript
// Parse ham radio satellite TLEs
const hamSats = [
  { name: 'AO-73', norad: 39444, uplink: 145.975, downlink: 435.150 },
  { name: 'SO-50', norad: 27607, uplink: 145.850, downlink: 436.795 }
];

hamSats.forEach(async sat => {
  const tle = await fetchTLEByNorad(sat.norad);
  const parsed = parseTLE(tle);
  sat.orbital = parsed;
});
```

**Doppler Shift Calculation**:
```javascript
function calculateDopplerShift(tle, observer, frequency) {
  const satrec = satellite.twoline2satrec(tle.line1Raw, tle.line2Raw);
  const posVel = satellite.propagate(satrec, new Date());

  // Calculate range rate (velocity towards observer)
  const rangeRate = calculateRangeRate(observer, posVel);

  // Doppler shift formula: Δf = f * (v/c)
  const speedOfLight = 299792458; // m/s
  const dopplerShift = frequency * (rangeRate / speedOfLight);

  return {
    shift: dopplerShift,
    correctedFrequency: frequency + dopplerShift
  };
}
```

**Maidenhead Grid Locator**:
```javascript
function latLonToMaidenhead(lat, lon) {
  const A = 'A'.charCodeAt(0);

  lon += 180;
  lat += 90;

  const field1 = String.fromCharCode(A + Math.floor(lon / 20));
  const field2 = String.fromCharCode(A + Math.floor(lat / 10));
  const square1 = Math.floor((lon % 20) / 2);
  const square2 = Math.floor((lat % 10) / 1);

  return `${field1}${field2}${square1}${square2}`;
}
```

---

### 05: Space Debris Tracker

**Purpose**: Monitor and analyze space debris objects

**Key Features**:
- D3.js scatter plot visualization
- Filter by size, altitude, origin
- Collision probability calculation
- Debris density heatmap
- NORAD catalog search
- Risk alert system

**TLE Parser Integration**:
```javascript
// Parse debris TLEs and classify
const debrisTLEs = await fetchDebrisTLEs();
const debris = debrisTLEs.map(tle => {
  const parsed = parseTLE(tle);
  return {
    ...parsed,
    altitude: calculateAltitude(parsed),
    size: estimateSize(parsed),
    riskLevel: assessRisk(parsed)
  };
});
```

**Collision Probability**:
```javascript
function calculateCollisionProbability(tle1, tle2, timeWindow) {
  let minDistance = Infinity;
  let collisionTime = null;

  for (let t = 0; t < timeWindow; t += 60) {
    const time = new Date(Date.now() + t * 1000);
    const pos1 = calculatePosition(tle1, time);
    const pos2 = calculatePosition(tle2, time);

    const distance = calculateDistance(pos1, pos2);

    if (distance < minDistance) {
      minDistance = distance;
      collisionTime = time;
    }
  }

  // Simplified probability model
  const collisionRadius = 10; // km
  const probability = minDistance < collisionRadius ?
    1 - (minDistance / collisionRadius) : 0;

  return { probability, minDistance, collisionTime };
}
```

**Risk Classification**:
```javascript
function assessRisk(tle) {
  const altitude = calculateAltitude(tle);
  const eccentricity = parseFloat('0.' + tle.eccentricity);

  if (altitude < 600 && eccentricity < 0.01) return 'HIGH';
  if (altitude < 1000) return 'MEDIUM';
  return 'LOW';
}
```

---

### 06: Ground Station Planner

**Purpose**: Schedule multiple satellite passes for ground station operations

**Key Features**:
- Ground station configuration
- Multi-satellite scheduling
- Conflict detection
- Coverage area visualization
- CSV/iCal export
- Equipment profiles

**TLE Parser Integration**:
```javascript
// Schedule multiple satellites
const satellites = await fetchMultipleTLEs(satList);
const schedule = [];

satellites.forEach(sat => {
  const parsed = parseTLE(sat.tle);
  const passes = calculatePasses(parsed, groundStation, startDate, 7);

  passes.forEach(pass => {
    schedule.push({
      satellite: sat.name,
      ...pass,
      conflicts: []
    });
  });
});

// Detect conflicts
detectScheduleConflicts(schedule);
```

**Conflict Detection**:
```javascript
function detectScheduleConflicts(schedule) {
  schedule.forEach((pass1, i) => {
    schedule.forEach((pass2, j) => {
      if (i >= j) return;

      // Check time overlap
      if (pass1.rise.time < pass2.set.time &&
          pass1.set.time > pass2.rise.time) {
        pass1.conflicts.push(pass2.satellite);
        pass2.conflicts.push(pass1.satellite);
      }
    });
  });
}
```

**Coverage Optimization**:
```javascript
function optimizeSchedule(passes, groundStation) {
  // Prioritize by elevation and duration
  return passes.sort((a, b) => {
    const scoreA = a.max.elevation * getDuration(a);
    const scoreB = b.max.elevation * getDuration(b);
    return scoreB - scoreA;
  });
}
```

---

### 07: TLE File Manager

**Purpose**: Comprehensive TLE file management and validation

**Key Features**:
- Drag-and-drop file upload
- Parse and display in table format
- Search and filter
- Checksum validation
- TLE diff viewer
- Export to JSON/CSV/XML

**TLE Parser Integration**:
```javascript
// Parse uploaded TLE file
function handleFileUpload(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target.result;
    const lines = content.split('\n');
    const tles = [];

    // Parse multiple TLEs
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        try {
          const tle = parseTLE(
            lines.slice(i, i + 3).join('\n')
          );
          tle.valid = true;
          tles.push(tle);
        } catch (err) {
          tles.push({
            error: err.message,
            valid: false,
            raw: lines.slice(i, i + 3)
          });
        }
      }
    }

    setTLEData(tles);
  };

  reader.readAsText(file);
}
```

**Checksum Validation**:
```javascript
function validateChecksum(line) {
  let sum = 0;

  for (let i = 0; i < 68; i++) {
    const char = line[i];
    if (char >= '0' && char <= '9') {
      sum += parseInt(char);
    } else if (char === '-') {
      sum += 1;
    }
  }

  const expected = sum % 10;
  const actual = parseInt(line[68]);

  return {
    valid: expected === actual,
    expected,
    actual
  };
}
```

**Export Formats**:
```javascript
// Export to JSON
function exportToJSON(tles) {
  return JSON.stringify(tles, null, 2);
}

// Export to CSV
function exportToCSV(tles) {
  const headers = ['Name', 'NORAD', 'Epoch', 'Inclination', 'Eccentricity'];
  const rows = tles.map(tle => [
    tle.satelliteName,
    tle.satelliteNumber1,
    `${tle.epochYear}-${tle.epochDay}`,
    tle.inclination,
    tle.eccentricity
  ]);

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

// Export to XML
function exportToXML(tles) {
  let xml = '<?xml version="1.0"?>\n<tles>\n';

  tles.forEach(tle => {
    xml += '  <tle>\n';
    xml += `    <name>${tle.satelliteName}</name>\n`;
    xml += `    <norad>${tle.satelliteNumber1}</norad>\n`;
    xml += `    <line1><![CDATA[${tle.line1Raw}]]></line1>\n`;
    xml += `    <line2><![CDATA[${tle.line2Raw}]]></line2>\n`;
    xml += '  </tle>\n';
  });

  xml += '</tles>';
  return xml;
}
```

---

### 08: Orbital Simulation Game

**Purpose**: Educational game teaching orbital mechanics

**Key Features**:
- Interactive orbital challenges
- Tutorial mode for beginners
- Real SGP4 physics
- Multiple difficulty levels
- Scoring and achievements
- Educational content

**TLE Parser Integration**:
```javascript
// Use TLE for realistic orbital physics
class Satellite {
  constructor(tle) {
    this.tle = parseTLE(tle);
    this.satrec = satellite.twoline2satrec(
      this.tle.line1Raw,
      this.tle.line2Raw
    );
  }

  update(gameTime) {
    const posVel = satellite.propagate(this.satrec, gameTime);
    this.position = posVel.position;
    this.velocity = posVel.velocity;
  }

  applyManeuver(deltaV) {
    // Apply delta-V and update TLE elements
    this.velocity.x += deltaV.x;
    this.velocity.y += deltaV.y;
    this.velocity.z += deltaV.z;
  }
}
```

**Game Challenges**:
1. Achieve circular orbit at specific altitude
2. Rendezvous with target satellite
3. Deorbit safely
4. Optimize fuel usage
5. Avoid debris

---

### 09: Educational Astronomy Tool

**Purpose**: Interactive learning about satellite orbits

**Key Features**:
- Lessons on orbital mechanics
- Parameter visualization
- Quiz mode
- Orbital glossary
- Real satellite examples

**TLE Parser Integration**:
```javascript
// Demonstrate effect of orbital parameters
function demonstrateParameter(parameter, value) {
  const baseTLE = getExampleTLE();
  const modified = { ...baseTLE };

  // Modify specific parameter
  modified[parameter] = value;

  // Show visual difference
  const baseOrbit = visualizeOrbit(baseTLE);
  const modifiedOrbit = visualizeOrbit(modified);

  return { baseOrbit, modifiedOrbit };
}
```

**Interactive Lessons**:
- What is orbital inclination?
- Understanding eccentricity
- Orbital period and altitude relationship
- Right ascension and orbital planes

---

### 10: Collision Warning System

**Purpose**: Monitor satellite conjunctions and collision risks

**Key Features**:
- Conjunction monitoring
- Miss distance calculation
- Risk alert dashboard
- Timeline visualization
- Report export

**TLE Parser Integration**:
```javascript
// Monitor conjunctions
function monitorConjunctions(satellites, threshold = 10) {
  const conjunctions = [];
  const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days

  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {
      const tle1 = parseTLE(satellites[i].tle);
      const tle2 = parseTLE(satellites[j].tle);

      const conjunction = findClosestApproach(
        tle1, tle2, timeWindow
      );

      if (conjunction.distance < threshold) {
        conjunctions.push({
          sat1: satellites[i].name,
          sat2: satellites[j].name,
          ...conjunction,
          riskLevel: classifyRisk(conjunction.distance)
        });
      }
    }
  }

  return conjunctions;
}
```

---

### 11: Satellite Photography Planner

**Purpose**: Plan satellite photography sessions

**Key Features**:
- ISS/satellite pass planning
- Camera settings calculator
- Angular velocity calculations
- Lighting analysis
- Equipment recommendations

**TLE Parser Integration**:
```javascript
// Calculate photography parameters
function calculatePhotoParams(tle, observer, time) {
  const pos = calculatePosition(tle, time);
  const lookAngles = calculateLookAngles(observer, pos);

  // Angular velocity (degrees per second)
  const angularVelocity = calculateAngularVelocity(tle, observer, time);

  // Recommended exposure
  const exposure = 1 / (angularVelocity * 100); // Rule of thumb

  // ISO recommendation based on lighting
  const sunAngle = calculateSunAngle(pos, time);
  const iso = sunAngle > 0 ? 400 : 1600;

  return {
    elevation: lookAngles.elevation,
    azimuth: lookAngles.azimuth,
    angularVelocity,
    recommendedExposure: exposure,
    recommendedISO: iso,
    focalLength: recommendFocalLength(lookAngles.elevation)
  };
}
```

---

### 12: Real-time 3D Earth Viewer

**Purpose**: Immersive 3D satellite orbit visualization

**Key Features**:
- 3D Earth globe
- Real-time satellite tracking
- Multiple satellites
- Ground tracks
- Time controls
- Camera follow mode

**TLE Parser Integration**:
```javascript
// Create 3D satellite mesh
function createSatellite3D(tle) {
  const parsed = parseTLE(tle);
  const satellite = {
    tle: parsed,
    mesh: new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
  };

  updateSatellitePosition(satellite);
  return satellite;
}

function updateSatellitePosition(satellite) {
  const satrec = satellite.twoline2satrec(
    satellite.tle.line1Raw,
    satellite.tle.line2Raw
  );

  const posVel = satellite.propagate(satrec, new Date());
  const gmst = satellite.gstime(new Date());
  const posGd = satellite.eciToGeodetic(posVel.position, gmst);

  // Convert to 3D coordinates
  const earthRadius = 6371;
  const altitude = posGd.height;
  const radius = earthRadius + altitude;

  const lat = posGd.latitude;
  const lon = posGd.longitude;

  satellite.mesh.position.set(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lon)
  );
}
```

## Common Utilities

### TLE Fetching

```javascript
// Fetch from CelesTrak
async function fetchTLE(group) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
  const response = await fetch(url);
  return await response.text();
}

// Fetch by NORAD ID
async function fetchTLEByNorad(norad) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${norad}&FORMAT=tle`;
  const response = await fetch(url);
  return await response.text();
}
```

### Position Calculation

```javascript
// Generic position calculator
function calculatePosition(tle, date = new Date()) {
  const satrec = satellite.twoline2satrec(tle.line1Raw, tle.line2Raw);
  const posVel = satellite.propagate(satrec, date);
  const gmst = satellite.gstime(date);
  const posGd = satellite.eciToGeodetic(posVel.position, gmst);

  return {
    latitude: satellite.degreesLat(posGd.latitude),
    longitude: satellite.degreesLong(posGd.longitude),
    altitude: posGd.height,
    velocity: Math.sqrt(
      posVel.velocity.x ** 2 +
      posVel.velocity.y ** 2 +
      posVel.velocity.z ** 2
    )
  };
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process multiple TLEs in parallel
2. **Caching**: Cache calculated positions for short intervals
3. **Throttling**: Update UI at reasonable rates (1-10 Hz)
4. **Web Workers**: Move heavy calculations to background threads
5. **Lazy Loading**: Load satellite data on demand

### Memory Management

```javascript
// Limit number of tracked satellites
const MAX_SATELLITES = 1000;

// Clean up old data
function cleanupOldData(satellites, maxAge) {
  return satellites.filter(sat => {
    const age = Date.now() - sat.lastUpdate;
    return age < maxAge;
  });
}
```

## Deployment

All demos can be deployed to:
- **Vercel**: Zero-config deployment
- **Netlify**: Continuous deployment from git
- **GitHub Pages**: Static hosting
- **AWS S3 + CloudFront**: Scalable CDN delivery

### Example Vercel Deployment

```bash
npm install -g vercel
cd demos/01-iss-tracker
vercel deploy
```

## Testing

Each demo should include:
- Unit tests for utility functions
- Integration tests for TLE parsing
- E2E tests for critical user flows

Example test:

```javascript
describe('TLE Parsing', () => {
  it('should parse valid ISS TLE', () => {
    const tle = `ISS (ZARYA)
1 25544U 98067A   23305.54321875  .00012456  00000-0  22456-3 0  9995
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849`;

    const parsed = parseTLE(tle);
    expect(parsed.satelliteName).toBe('ISS (ZARYA)');
    expect(parsed.satelliteNumber1).toBe('25544');
  });
});
```

## Future Enhancements

Potential improvements for demos:
- [ ] PWA support with offline caching
- [ ] WebAssembly for performance-critical calculations
- [ ] Real-time collaboration features
- [ ] Mobile app versions (React Native)
- [ ] VR/AR visualization modes
- [ ] Machine learning for prediction improvements
- [ ] Social features (share passes, screenshots)
- [ ] API backends for data persistence

## License

All demo applications are released under the MIT License.

## Support

For issues or questions:
- GitHub Issues: [Report bugs](https://github.com/gv-sh/tle-parser/issues)
- Documentation: [Full docs](../docs/)
- Examples: Individual demo READMEs

---

**Last Updated**: November 2025
