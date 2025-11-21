import React, { useState } from 'react';
import './style.css';

/**
 * Real-time 3D Earth Viewer
 * Visualize satellites in 3D using TLE data and Three.js
 */

const SATELLITES = [
  { id: 1, name: 'ISS (ZARYA)', tracking: true },
  { id: 2, name: 'HUBBLE SPACE TELESCOPE', tracking: false },
  { id: 3, name: 'TIANGONG', tracking: false }
];

function App() {
  const [satellites, setSatellites] = useState(SATELLITES);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState('free');

  const toggleSatellite = (id) => {
    setSatellites(satellites.map(sat =>
      sat.id === id ? { ...sat, tracking: !sat.tracking } : sat
    ));
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'radial-gradient(circle, #1a1a2e 0%, #0f0f1e 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🌍</h1>
            <p style={{ fontSize: '1.5rem' }}>3D Earth Viewer</p>
            <p style={{ marginTop: '10px', color: '#888' }}>
              Three.js 3D globe would be rendered here
            </p>
            <p style={{ marginTop: '5px', color: '#888' }}>
              Showing real-time satellite positions from TLE data
            </p>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="controls-panel">
        <h2>Satellite Tracking</h2>

        <div>
          <label>
            <input
              type="checkbox"
              checked={!paused}
              onChange={() => setPaused(!paused)}
            />
            {' '}Real-time Update
          </label>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label>Time Speed: {timeSpeed}x</label>
          <input
            type="range"
            min="1"
            max="100"
            value={timeSpeed}
            onChange={(e) => setTimeSpeed(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="satellite-list">
          <h3 style={{ marginBottom: '10px' }}>Satellites</h3>
          {satellites.map(sat => (
            <div
              key={sat.id}
              className="satellite-item"
              onClick={() => toggleSatellite(sat.id)}
              style={{
                borderLeft: sat.tracking ? '4px solid #4CAF50' : '4px solid #333'
              }}
            >
              <input
                type="checkbox"
                checked={sat.tracking}
                readOnly
              />
              {' '}{sat.name}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '15px' }}>
          <button className="btn">Add Satellite</button>
          <button className="btn" style={{ background: '#2196F3' }}>
            Settings
          </button>
        </div>
      </div>

      {/* Time Controls */}
      <div className="time-controls">
        <button className="btn" onClick={() => setPaused(!paused)}>
          {paused ? '▶️ Play' : '⏸️ Pause'}
        </button>
        <button className="btn">⏮️ Rewind</button>
        <button className="btn">⏭️ Forward</button>
        <select
          value={cameraMode}
          onChange={(e) => setCameraMode(e.target.value)}
          style={{
            marginLeft: '10px',
            padding: '10px',
            borderRadius: '5px',
            border: 'none'
          }}
        >
          <option value="free">Free Camera</option>
          <option value="follow">Follow Satellite</option>
          <option value="ground">Ground View</option>
        </select>
      </div>
    </div>
  );
}

export default App;
