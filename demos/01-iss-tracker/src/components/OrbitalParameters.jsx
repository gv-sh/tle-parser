import React from 'react';
import './OrbitalParameters.css';

function OrbitalParameters({ params }) {
  if (!params) {
    return (
      <div className="orbital-parameters">
        <h2>Orbital Parameters</h2>
        <p>Calculating...</p>
      </div>
    );
  }

  const parameters = [
    {
      label: 'Altitude',
      value: `${params.altitude.toFixed(2)} km`,
      description: 'Height above Earth surface',
      icon: '📏'
    },
    {
      label: 'Velocity',
      value: `${params.velocity.toFixed(2)} km/s`,
      description: 'Current orbital speed',
      icon: '⚡'
    },
    {
      label: 'Orbital Period',
      value: `${params.orbitalPeriod.toFixed(1)} min`,
      description: 'Time for one complete orbit',
      icon: '🔄'
    },
    {
      label: 'Inclination',
      value: `${params.inclination.toFixed(2)}°`,
      description: 'Angle relative to equator',
      icon: '📐'
    },
    {
      label: 'Eccentricity',
      value: params.eccentricity.toFixed(6),
      description: 'Orbit circularity (0 = circle)',
      icon: '⭕'
    },
    {
      label: 'Latitude',
      value: `${params.latitude.toFixed(4)}°`,
      description: 'Current latitude',
      icon: '🌍'
    },
    {
      label: 'Longitude',
      value: `${params.longitude.toFixed(4)}°`,
      description: 'Current longitude',
      icon: '🌎'
    }
  ];

  return (
    <div className="orbital-parameters">
      <h2>📊 Orbital Parameters</h2>
      <div className="parameters-grid">
        {parameters.map((param, index) => (
          <div key={index} className="parameter-item">
            <div className="parameter-icon">{param.icon}</div>
            <div className="parameter-content">
              <div className="parameter-label">{param.label}</div>
              <div className="parameter-value">{param.value}</div>
              <div className="parameter-description">{param.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrbitalParameters;
