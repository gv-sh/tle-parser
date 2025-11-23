import React, { useState, useEffect, useCallback } from 'react';
import StarlinkMap from './components/StarlinkMap';
import ConstellationStats from './components/ConstellationStats';
import CoverageChart from './components/CoverageChart';
import SatelliteList from './components/SatelliteList';
import { fetchStarlinkTLEs, calculatePositions } from './utils/satellite';
import './App.css';

/**
 * Starlink Constellation Visualizer
 *
 * This demo showcases the TLE Parser library by visualizing the entire
 * Starlink satellite constellation in real-time. It demonstrates:
 * - Parsing multiple TLE entries
 * - Real-time position calculation using SGP4
 * - Coverage analysis
 * - Orbital shell visualization
 */
function App() {
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShell, setSelectedShell] = useState('all');
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    shells: {},
    coverage: 0
  });

  // Fetch Starlink TLE data on mount
  useEffect(() => {
    loadStarlinkData();
  }, []);

  // Update satellite positions at specified interval
  useEffect(() => {
    if (satellites.length === 0) return;

    const interval = setInterval(() => {
      updatePositions();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [satellites, updateInterval]);

  const loadStarlinkData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch and parse Starlink TLE data using TLE Parser
      const data = await fetchStarlinkTLEs();
      setSatellites(data);

      // Calculate initial statistics
      calculateStats(data);

      setLoading(false);
    } catch (err) {
      console.error('Error loading Starlink data:', err);
      setError('Failed to load Starlink constellation data. Using sample data...');

      // Load sample data as fallback
      loadSampleData();
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    // Sample Starlink TLE data for demonstration
    const sampleTLEs = [
      {
        name: 'STARLINK-1007',
        line1: '1 44713U 19074A   23305.50000000  .00001234  00000-0  12345-3 0  9992',
        line2: '2 44713  53.0000 123.4567 0001234  89.0123 271.0123 15.19000000123456',
        shell: 'Shell 1 (550 km, 53°)'
      },
      {
        name: 'STARLINK-1008',
        line1: '1 44714U 19074B   23305.50000000  .00001234  00000-0  12345-3 0  9993',
        line2: '2 44714  53.0000 133.4567 0001234  89.0123 271.0123 15.19000000123456',
        shell: 'Shell 1 (550 km, 53°)'
      }
    ];

    const parsedSamples = calculatePositions(sampleTLEs);
    setSatellites(parsedSamples);
    calculateStats(parsedSamples);
  };

  const updatePositions = useCallback(() => {
    setSatellites(prevSatellites => {
      const updated = calculatePositions(prevSatellites);
      calculateStats(updated);
      return updated;
    });
  }, []);

  const calculateStats = (sats) => {
    const shellCounts = {};
    sats.forEach(sat => {
      const shell = sat.shell || 'Unknown';
      shellCounts[shell] = (shellCounts[shell] || 0) + 1;
    });

    setStats({
      total: sats.length,
      active: sats.filter(s => s.position).length,
      shells: shellCounts,
      coverage: calculateGlobalCoverage(sats)
    });
  };

  const calculateGlobalCoverage = (sats) => {
    // Simple coverage estimation based on number of satellites
    // In production, this would use proper coverage analysis
    const maxCoverage = 95; // Theoretical maximum
    const satRatio = Math.min(sats.length / 4000, 1);
    return Math.round(maxCoverage * satRatio);
  };

  const filteredSatellites = selectedShell === 'all'
    ? satellites
    : satellites.filter(sat => sat.shell === selectedShell);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2>Loading Starlink Constellation...</h2>
        <p>Parsing TLE data and calculating orbital parameters</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Starlink Constellation Visualizer</h1>
          <p className="subtitle">Real-time satellite tracking powered by TLE Parser</p>
        </div>
        <div className="header-controls">
          <label>
            Update Rate:
            <select
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </label>
          <label>
            Orbital Shell:
            <select
              value={selectedShell}
              onChange={(e) => setSelectedShell(e.target.value)}
            >
              <option value="all">All Shells</option>
              {Object.keys(stats.shells).map(shell => (
                <option key={shell} value={shell}>{shell}</option>
              ))}
            </select>
          </label>
          <button onClick={loadStarlinkData} className="refresh-btn">
            Refresh TLEs
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="main-content">
        <div className="left-panel">
          <ConstellationStats stats={stats} />
          <CoverageChart satellites={filteredSatellites} />
          <SatelliteList
            satellites={filteredSatellites.slice(0, 50)}
            selectedShell={selectedShell}
          />
        </div>

        <div className="map-container">
          <StarlinkMap satellites={filteredSatellites} />
        </div>
      </div>

      <footer className="app-footer">
        <p>
          TLE data from CelesTrak | Visualization updates every {updateInterval/1000}s |
          Showing {filteredSatellites.length} of {satellites.length} satellites
        </p>
      </footer>
    </div>
  );
}

export default App;
