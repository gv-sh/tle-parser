# TLE Parser Demo Applications

This directory contains 12 production-quality demo applications showcasing the capabilities of the TLE Parser library for satellite tracking and orbital mechanics.

## 🚀 Demo Applications

| # | Demo | Tech Stack | Port | Description |
|---|------|------------|------|-------------|
| 01 | [ISS Tracker](#01-iss-tracker) | React + Leaflet | 5173 | Real-time ISS tracking with orbital parameters and pass predictions |
| 02 | [Starlink Visualizer](#02-starlink-visualizer) | React + Leaflet + D3 | 5174 | Interactive Starlink constellation visualization and analysis |
| 03 | [Satellite Pass Predictor](#03-satellite-pass-predictor) | Vue.js + Chart.js | 5175 | Calculate and visualize satellite passes for any location |
| 04 | [Ham Radio Scheduler](#04-ham-radio-scheduler) | React | 5176 | Amateur radio satellite scheduler with Doppler calculations |
| 05 | [Space Debris Tracker](#05-space-debris-tracker) | React + D3.js | 5177 | Track and analyze space debris with collision probability |
| 06 | [Ground Station Planner](#06-ground-station-planner) | Vue.js + FullCalendar | 5178 | Multi-satellite scheduling for ground stations |
| 07 | [TLE File Manager](#07-tle-file-manager) | React + TanStack Table | 5179 | Parse, validate, and manage TLE files with export options |
| 08 | [Orbital Simulation Game](#08-orbital-simulation-game) | Phaser.js | 5180 | Educational game teaching orbital mechanics |
| 09 | [Educational Astronomy Tool](#09-educational-astronomy) | React + Three.js | 5181 | Interactive lessons on satellite orbits and mechanics |
| 10 | [Collision Warning System](#10-collision-warning-system) | React + Chart.js | 5182 | Monitor satellite conjunctions and collision risks |
| 11 | [Satellite Photography Planner](#11-satellite-photography-planner) | Vue.js | 5183 | Plan and optimize satellite photography sessions |
| 12 | [3D Earth Orbit Viewer](#12-realtime-3d-earth-viewer) | React + Three.js | 5184 | Real-time 3D visualization of satellites orbiting Earth |

## 📋 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Modern web browser

### Running a Demo

```bash
# Navigate to any demo directory
cd 01-iss-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The demo will open in your browser at the specified port.

### Building for Production

```bash
# Build the demo
npm run build

# Preview production build
npm run preview
```

## 🎯 Demo Details

### 01: ISS Tracker

**Real-time International Space Station Tracking**

- Live ISS position on interactive map
- Current orbital parameters (altitude, velocity, period)
- Next pass predictions for your location
- Ground track visualization
- Crew information display
- Geolocation support

**Key TLE Parser Features:**
- 3-line TLE format parsing
- Orbital parameter extraction
- Real-time position calculation with SGP4

---

### 02: Starlink Visualizer

**Interactive Starlink Constellation Visualization**

- Real-time tracking of Starlink satellites
- Orbital shell classification
- Coverage area analysis
- Altitude distribution charts
- Satellite search and filtering
- Statistics dashboard

**Key TLE Parser Features:**
- Batch TLE parsing
- Constellation analysis
- Orbital shell grouping

---

### 03: Satellite Pass Predictor

**Calculate Visible Satellite Passes**

- Location input (manual + geolocation)
- Satellite selection from catalog
- 7-day pass predictions
- Sky map visualization
- Pass timing details (rise, max elevation, set)
- Calendar export (iCal format)

**Key TLE Parser Features:**
- Pass prediction algorithms
- Look angle calculations
- Multi-satellite support

---

### 04: Ham Radio Scheduler

**Amateur Radio Satellite Tracking**

- List of amateur radio satellites
- Frequency band filtering
- Real-time Doppler shift calculations
- Antenna pointing angles (azimuth/elevation)
- Maidenhead grid locator integration
- Equipment configuration

**Key TLE Parser Features:**
- Radio-specific orbital calculations
- Doppler shift computation
- Real-time tracking updates

---

### 05: Space Debris Tracker

**Space Debris Monitoring and Analysis**

- Debris object visualization (D3.js)
- Filter by size, altitude, origin
- Collision probability calculator
- Debris density heatmap
- NORAD catalog search
- Risk alert system

**Key TLE Parser Features:**
- Large dataset handling
- Conjunction analysis
- Risk assessment algorithms

---

### 06: Ground Station Planner

**Multi-Satellite Ground Station Scheduling**

- Ground station configuration
- Antenna coverage visualization
- Multi-satellite pass optimization
- Schedule conflict detection
- Export to CSV/iCal formats
- Equipment profiles

**Key TLE Parser Features:**
- Multi-satellite coordination
- Coverage area calculations
- Optimal scheduling algorithms

---

### 07: TLE File Manager

**Comprehensive TLE File Management**

- Drag-and-drop TLE file upload
- Parse and display TLE data in tables
- Search and filter satellites
- Checksum validation
- Compare TLEs (diff viewer)
- Export to JSON/CSV/XML formats
- TLE age indicators

**Key TLE Parser Features:**
- Validation and error handling
- Format conversion
- Batch processing
- Data integrity checks

---

### 08: Orbital Simulation Game

**Educational Orbital Mechanics Game**

- Interactive orbital challenges
- Tutorial mode for beginners
- Real SGP4 physics engine
- Multiple difficulty levels
- Scoring and achievements
- Educational content

**Key TLE Parser Features:**
- Real orbital mechanics
- Educational parameter visualization
- Interactive learning

---

### 09: Educational Astronomy Tool

**Interactive Orbital Mechanics Education**

- Lessons on satellite orbits
- Visualize TLE parameter effects
- Compare orbit types (LEO, MEO, GEO)
- Quiz mode
- Orbital terms glossary
- Real satellite examples

**Key TLE Parser Features:**
- Parameter manipulation and visualization
- Educational content delivery
- Orbit type classification

---

### 10: Collision Warning System

**Satellite Conjunction Monitoring**

- Monitor potential collisions
- Calculate miss distance and probability
- Risk-level alert dashboard
- Historical conjunction archive
- Timeline visualization
- Export analysis reports

**Key TLE Parser Features:**
- Conjunction detection
- Probability calculations
- Multi-satellite tracking

---

### 11: Satellite Photography Planner

**Plan Satellite Photography Sessions**

- ISS and satellite pass planning
- Camera settings recommendations
- Angular velocity calculations
- Lighting condition analysis
- Weather forecast integration
- Equipment suggestions

**Key TLE Parser Features:**
- Pass timing optimization
- Angular velocity calculations
- Photography-specific metrics

---

### 12: Real-time 3D Earth Orbit Viewer

**Immersive 3D Satellite Visualization**

- 3D Earth globe with real textures
- Real-time satellite positions
- Multiple satellite tracking
- Smooth orbital animations
- Day/night terminator
- Time controls (pause, speed up, rewind)
- Camera follow mode

**Key TLE Parser Features:**
- Real-time 3D positioning
- Multi-satellite coordination
- Time-based propagation

---

## 🛠️ Technology Stack

### Frontend Frameworks
- **React**: Used in 7 demos (ISS Tracker, Starlink, Ham Radio, Debris, TLE Manager, Educational, Collision, 3D Viewer)
- **Vue.js**: Used in 3 demos (Pass Predictor, Ground Station, Photography Planner)
- **Phaser.js**: Used in 1 demo (Orbital Game)

### Visualization Libraries
- **Leaflet**: Interactive 2D maps (ISS Tracker, Starlink)
- **Three.js**: 3D graphics (Educational Tool, 3D Viewer)
- **D3.js**: Data visualization (Starlink, Debris Tracker)
- **Chart.js**: Charts and graphs (Pass Predictor, Collision Warning)

### Orbital Calculations
- **satellite.js**: SGP4/SDP4 propagation
- **TLE Parser**: TLE data parsing and validation

### Build Tools
- **Vite**: Fast development and optimized builds
- **ES Modules**: Modern JavaScript

## 📚 Learning Resources

Each demo includes:
- Comprehensive README with setup instructions
- Inline code comments explaining TLE Parser integration
- Usage examples and API documentation
- Troubleshooting guides

## 🔧 Common Setup

All demos follow similar patterns:

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

Demos can be deployed to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Build and push to gh-pages branch
- **AWS S3**: Upload dist folder

## 📊 TLE Parser Features Demonstrated

### Core Parsing
- ✅ 2-line and 3-line TLE format
- ✅ Satellite name extraction
- ✅ Orbital element parsing
- ✅ Checksum validation
- ✅ Comment line handling

### Advanced Features
- ✅ Batch TLE processing
- ✅ Real-time position calculation
- ✅ Pass prediction algorithms
- ✅ Conjunction analysis
- ✅ Doppler shift calculation
- ✅ Look angle computation
- ✅ Ground track generation
- ✅ Orbital parameter analysis

### Data Management
- ✅ Format conversion (JSON, CSV, XML)
- ✅ TLE validation and error handling
- ✅ Data quality indicators
- ✅ Historical TLE comparison

## 🤝 Contributing

Want to add a new demo or improve existing ones?

1. Fork the repository
2. Create a new branch: `git checkout -b feature/new-demo`
3. Follow the existing demo structure
4. Add comprehensive documentation
5. Test thoroughly
6. Submit a pull request

## 📝 Demo Structure

Each demo follows this structure:

```
demo-name/
├── README.md              # Comprehensive documentation
├── package.json           # Dependencies
├── index.html            # Entry point
├── vite.config.js        # Build configuration
├── .gitignore            # Git ignore rules
└── src/
    ├── main.jsx/js       # Application entry
    ├── App.jsx/vue       # Main component
    ├── components/       # UI components
    ├── utils/            # Utility functions
    └── style.css         # Styling
```

## 🔍 Browser Compatibility

All demos support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT License - See root repository LICENSE file

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/gv-sh/tle-parser/issues)
- **Documentation**: [TLE Parser Docs](../docs/)
- **Examples**: Each demo's README

## 🎓 Educational Use

These demos are designed for:
- Learning satellite tracking
- Understanding orbital mechanics
- Teaching TLE data format
- Demonstrating real-world applications
- Building satellite tracking systems
- Amateur radio operations
- Space situational awareness

## 🚀 Next Steps

1. Choose a demo that matches your use case
2. Run it locally following the setup instructions
3. Explore the code to understand TLE Parser integration
4. Customize for your specific needs
5. Deploy your application

## 📞 Contact

For questions or feedback:
- Open an issue on GitHub
- Check the main repository documentation
- Review individual demo READMEs

---

**Happy Satellite Tracking! 🛰️**
