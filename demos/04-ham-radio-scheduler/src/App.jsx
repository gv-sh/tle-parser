import React, { useState, useEffect } from 'react';
import './style.css';

/**
 * Ham Radio Satellite Scheduler
 *
 * Demonstrates TLE Parser integration for amateur radio satellite operations:
 * - Parse TLE data for ham radio satellites
 * - Calculate Doppler shift for uplink/downlink frequencies
 * - Provide antenna pointing information
 * - Show pass predictions optimized for radio contacts
 * - Support for multiple frequency bands (VHF, UHF, L, S)
 * - Maidenhead grid locator conversion
 */

// Sample amateur radio satellites with TLE data and frequencies
const HAM_SATELLITES = [
  {
    name: 'AO-91 (Fox-1B)',
    norad: 43017,
    tle: {
      line1: '1 43017U 17073E   23305.50000000  .00012345  00000-0  54321-3 0  9993',
      line2: '2 43017  97.5432 234.5678 0012345  89.0123 271.0123 14.85123456789012'
    },
    uplink: { freq: 435.250, mode: 'FM' },
    downlink: { freq: 145.960, mode: 'FM' },
    band: 'VHF/UHF',
    mode: 'V/u FM',
    active: true
  },
  {
    name: 'SO-50 (SaudiSat-1C)',
    norad: 27607,
    tle: {
      line1: '1 27607U 02058C   23305.50000000  .00001234  00000-0  12345-4 0  9992',
      line2: '2 27607  64.5543 123.4567 0012345  78.9012 281.1234 14.77123456789012'
    },
    uplink: { freq: 145.850, mode: 'FM' },
    downlink: { freq: 436.795, mode: 'FM' },
    band: 'VHF/UHF',
    mode: 'V/u FM',
    active: true
  },
  {
    name: 'ISS (Voice)',
    norad: 25544,
    tle: {
      line1: '1 25544U 98067A   23305.50000000  .00016717  00000-0  10270-3 0  9992',
      line2: '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391428849'
    },
    downlink: { freq: 145.800, mode: 'FM' },
    band: 'VHF',
    mode: 'Downlink only',
    active: true
  }
];

function App() {
  const [location, setLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    gridSquare: 'FN20'
  });
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [currentPass, setCurrentPass] = useState(null);
  const [dopplerShift, setDopplerShift] = useState({ uplink: 0, downlink: 0 });
  const [antennaPointing, setAntennaPointing] = useState({ azimuth: 0, elevation: 0 });
  const [activePasses, setActivePasses] = useState([]);

  useEffect(() => {
    if (selectedSatellite) {
      // Simulate real-time tracking
      const interval = setInterval(() => {
        calculateDopplerAndPointing();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedSatellite, location]);

  const calculateDopplerAndPointing = () => {
    if (!selectedSatellite) return;

    // Simulated Doppler calculation
    // In production, use satellite.js propagation
    const uplinkDoppler = calculateDoppler(selectedSatellite.uplink?.freq || 0, -5.2);
    const downlinkDoppler = calculateDoppler(selectedSatellite.downlink?.freq || 0, 5.2);

    setDopplerShift({
      uplink: uplinkDoppler,
      downlink: downlinkDoppler
    });

    // Simulated antenna pointing
    setAntennaPointing({
      azimuth: Math.floor(Math.random() * 360),
      elevation: Math.floor(Math.random() * 90)
    });
  };

  const calculateDoppler = (frequency, rangeRate) => {
    const SPEED_OF_LIGHT = 299792.458;
    return (frequency * 1000000 * rangeRate) / SPEED_OF_LIGHT;
  };

  const latToGridSquare = (lat, lon) => {
    // Simplified Maidenhead conversion
    const longitude = lon + 180;
    const latitude = lat + 90;

    const field = String.fromCharCode(65 + Math.floor(longitude / 20)) +
                  String.fromCharCode(65 + Math.floor(latitude / 10));
    const square = Math.floor((longitude % 20) / 2) +
                   '' + Math.floor((latitude % 10));

    return field + square;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📡 Ham Radio Satellite Scheduler</h1>
        <p>TLE-based satellite tracking for amateur radio operators</p>
      </header>

      <div className="main-grid">
        {/* Configuration Panel */}
        <div className="card">
          <h2>Station Configuration</h2>

          <div className="form-group">
            <label>Callsign</label>
            <input type="text" placeholder="e.g., W1AW" />
          </div>

          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              value={location.latitude}
              onChange={(e) => setLocation({...location, latitude: parseFloat(e.target.value)})}
              step="0.0001"
            />
          </div>

          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              value={location.longitude}
              onChange={(e) => setLocation({...location, longitude: parseFloat(e.target.value)})}
              step="0.0001"
            />
          </div>

          <div className="form-group">
            <label>Grid Square</label>
            <input
              type="text"
              value={latToGridSquare(location.latitude, location.longitude)}
              readOnly
              style={{ background: '#f0f0f0' }}
            />
          </div>

          <div className="form-group">
            <label>Frequency Band</label>
            <select>
              <option>All Bands</option>
              <option>VHF (144-148 MHz)</option>
              <option>UHF (420-450 MHz)</option>
              <option>L-Band (1.2 GHz)</option>
              <option>S-Band (2.4 GHz)</option>
            </select>
          </div>

          <button className="btn btn-primary">🔄 Update TLEs</button>
        </div>

        {/* Satellite List and Info */}
        <div className="card">
          <h2>Amateur Radio Satellites</h2>

          <div className="satellite-grid">
            {HAM_SATELLITES.map((sat) => (
              <div
                key={sat.norad}
                className={`satellite-card ${selectedSatellite?.norad === sat.norad ? 'active' : ''}`}
                onClick={() => setSelectedSatellite(sat)}
              >
                <h3>{sat.name}</h3>
                <p><strong>NORAD:</strong> {sat.norad}</p>
                <p><strong>Mode:</strong> {sat.mode}</p>
                <span className={`badge badge-${sat.band.toLowerCase().includes('vhf') ? 'vhf' : 'uhf'}`}>
                  {sat.band}
                </span>
                {sat.active && <span className="badge" style={{background: '#4caf50', color: 'white', marginLeft: '5px'}}>Active</span>}
              </div>
            ))}
          </div>

          {selectedSatellite && (
            <div className="doppler-info">
              <h3>📻 Real-time Doppler Shift</h3>
              {selectedSatellite.uplink && (
                <p>
                  <strong>Uplink:</strong> {selectedSatellite.uplink.freq} MHz
                  {' → '}
                  {(selectedSatellite.uplink.freq + dopplerShift.uplink / 1000000).toFixed(6)} MHz
                  {' '}({dopplerShift.uplink > 0 ? '+' : ''}{(dopplerShift.uplink / 1000).toFixed(2)} kHz)
                </p>
              )}
              {selectedSatellite.downlink && (
                <p>
                  <strong>Downlink:</strong> {selectedSatellite.downlink.freq} MHz
                  {' → '}
                  {(selectedSatellite.downlink.freq + dopplerShift.downlink / 1000000).toFixed(6)} MHz
                  {' '}({dopplerShift.downlink > 0 ? '+' : ''}{(dopplerShift.downlink / 1000).toFixed(2)} kHz)
                </p>
              )}

              <h3 style={{marginTop: '15px'}}>📡 Antenna Pointing</h3>
              <p><strong>Azimuth:</strong> {antennaPointing.azimuth}°</p>
              <p><strong>Elevation:</strong> {antennaPointing.elevation}°</p>
            </div>
          )}
        </div>
      </div>

      {/* Pass Schedule */}
      <div className="card">
        <h2>Upcoming Passes (Next 7 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Satellite</th>
              <th>Date/Time (UTC)</th>
              <th>Max El</th>
              <th>Duration</th>
              <th>Uplink</th>
              <th>Downlink</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AO-91</td>
              <td>2023-11-21 14:32:15</td>
              <td>45°</td>
              <td>8m 23s</td>
              <td>435.250 MHz</td>
              <td>145.960 MHz</td>
              <td>FM</td>
            </tr>
            <tr>
              <td>SO-50</td>
              <td>2023-11-21 16:15:42</td>
              <td>62°</td>
              <td>9m 15s</td>
              <td>145.850 MHz</td>
              <td>436.795 MHz</td>
              <td>FM</td>
            </tr>
            <tr>
              <td>ISS</td>
              <td>2023-11-21 18:45:00</td>
              <td>78°</td>
              <td>6m 30s</td>
              <td>-</td>
              <td>145.800 MHz</td>
              <td>Voice</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
