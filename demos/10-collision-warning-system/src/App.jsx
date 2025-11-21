import React, { useState } from 'react';
import './style.css';

/**
 * Collision Warning System
 * Monitor and analyze satellite conjunctions using TLE data
 */

const CONJUNCTIONS = [
  {
    id: 1,
    object1: 'ISS (ZARYA)',
    object2: 'COSMOS 2251 DEB',
    tca: '2023-11-21T14:23:45Z',
    missDistance: 1.2,
    probability: 0.001,
    riskLevel: 'high'
  },
  {
    id: 2,
    object1: 'STARLINK-1234',
    object2: 'FENGYUN 1C DEB',
    tca: '2023-11-21T18:45:00Z',
    missDistance: 3.5,
    probability: 0.0001,
    riskLevel: 'medium'
  }
];

function App() {
  const [conjunctions] = useState(CONJUNCTIONS);
  const [selectedConjunction, setSelectedConjunction] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <h1>⚠️ Collision Warning System</h1>
        <p>Real-time satellite conjunction monitoring using TLE Parser</p>
      </header>

      <div className="dashboard-grid">
        <div className="card alert-card">
          <div className="stat-value">2</div>
          <div className="stat-label">Active Warnings</div>
        </div>

        <div className="card warning-card">
          <div className="stat-value">5</div>
          <div className="stat-label">Monitored Conjunctions</div>
        </div>

        <div className="card safe-card">
          <div className="stat-value">98.5%</div>
          <div className="stat-label">Safe Trajectories</div>
        </div>
      </div>

      <div className="card">
        <h2>Conjunction List</h2>
        <div className="conjunction-list">
          {conjunctions.map(conj => (
            <div
              key={conj.id}
              className="conjunction-item"
              onClick={() => setSelectedConjunction(conj)}
              style={{ cursor: 'pointer' }}
            >
              <h3>{conj.object1} ↔ {conj.object2}</h3>
              <p><strong>TCA:</strong> {new Date(conj.tca).toLocaleString()}</p>
              <p><strong>Miss Distance:</strong> {conj.missDistance} km</p>
              <p><strong>Collision Probability:</strong> {(conj.probability * 100).toFixed(3)}%</p>
              <p><strong>Risk:</strong> <span style={{
                color: conj.riskLevel === 'high' ? '#ff4757' : conj.riskLevel === 'medium' ? '#ffa502' : '#2ed573',
                fontWeight: 'bold'
              }}>{conj.riskLevel.toUpperCase()}</span></p>
            </div>
          ))}
        </div>
      </div>

      {selectedConjunction && (
        <div className="card">
          <h2>Timeline Visualization</h2>
          <div className="timeline-viz">
            <p>Conjunction timeline for {selectedConjunction.object1} and {selectedConjunction.object2}</p>
            <p style={{ marginTop: '20px' }}>Chart.js timeline would be rendered here</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
