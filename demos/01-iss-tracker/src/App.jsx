import React, { useState, useEffect } from 'react';
import ISSMap from './components/ISSMap';
import OrbitalParameters from './components/OrbitalParameters';
import PassPredictor from './components/PassPredictor';
import CrewInfo from './components/CrewInfo';
import { fetchISSTLE, calculateISSPosition } from './utils/satellite';
import './App.css';

function App() {
  const [issPosition, setIssPosition] = useState(null);
  const [tleData, setTleData] = useState(null);
  const [orbitalParams, setOrbitalParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch ISS TLE data on mount
  useEffect(() => {
    const loadTLE = async () => {
      try {
        setLoading(true);
        const tle = await fetchISSTLE();
        setTleData(tle);
        setError(null);
      } catch (err) {
        setError('Failed to load ISS data: ' + err.message);
        console.error('TLE fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTLE();
    // Refresh TLE data every 6 hours
    const interval = setInterval(loadTLE, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update ISS position every second
  useEffect(() => {
    if (!tleData) return;

    const updatePosition = () => {
      try {
        const position = calculateISSPosition(tleData);
        setIssPosition(position);
        setOrbitalParams({
          altitude: position.altitude,
          velocity: position.velocity,
          latitude: position.latitude,
          longitude: position.longitude,
          orbitalPeriod: 90.5, // ~90.5 minutes for ISS
          inclination: parseFloat(tleData.inclination),
          eccentricity: parseFloat('0.' + tleData.eccentricity)
        });
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Position calculation error:', err);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [tleData]);

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading ISS data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛰️ ISS Tracker</h1>
        <p className="subtitle">Real-time International Space Station Tracking</p>
        {lastUpdate && (
          <p className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </header>

      <main className="app-main">
        <div className="map-container">
          <ISSMap position={issPosition} tleData={tleData} />
        </div>

        <div className="info-grid">
          <div className="info-card">
            <OrbitalParameters params={orbitalParams} />
          </div>

          <div className="info-card">
            <PassPredictor tleData={tleData} />
          </div>

          <div className="info-card">
            <CrewInfo />
          </div>
        </div>

        <div className="tle-info">
          <h3>Current TLE Data</h3>
          <div className="tle-display">
            {tleData && (
              <>
                <div className="tle-line">
                  <span className="tle-label">Name:</span>
                  <code>{tleData.satelliteName || 'ISS (ZARYA)'}</code>
                </div>
                <div className="tle-line">
                  <span className="tle-label">NORAD ID:</span>
                  <code>{tleData.satelliteNumber1}</code>
                </div>
                <div className="tle-line">
                  <span className="tle-label">Epoch:</span>
                  <code>{tleData.epochYear}-{tleData.epochDay}</code>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Powered by{' '}
          <a href="https://github.com/gv-sh/tle-parser" target="_blank" rel="noopener noreferrer">
            TLE Parser
          </a>{' '}
          | Data from{' '}
          <a href="https://celestrak.org" target="_blank" rel="noopener noreferrer">
            CelesTrak
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
