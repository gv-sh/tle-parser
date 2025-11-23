# Real-time 3D Earth Viewer

Interactive 3D visualization of satellites orbiting Earth using TLE Parser and Three.js.

## Features

- 3D globe visualization
- Real-time satellite tracking
- Multiple satellite support
- Ground tracks
- Time controls (play/pause/speed)
- Camera modes (free/follow/ground)
- Orbital path visualization

## Technology Stack

- React
- Three.js (@react-three/fiber)
- TLE Parser
- satellite.js

## Setup

```bash
cd demos/12-realtime-3d-earth-viewer
npm install
npm run dev
```

## TLE Parser Integration

Uses TLE data to propagate satellite positions in real-time and render them in 3D space around a textured Earth globe.

## License

MIT License
