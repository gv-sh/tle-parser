import React, { useState, useEffect } from 'react';
import { calculatePasses } from '../utils/passCalculator';
import { format } from 'date-fns';
import './PassPredictor.css';

function PassPredictor({ tleData }) {
  const [location, setLocation] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: 0
        };
        setLocation(loc);
        setManualLat(loc.latitude.toFixed(4));
        setManualLon(loc.longitude.toFixed(4));
        setLoading(false);
      },
      (err) => {
        setError('Unable to get your location: ' + err.message);
        setLoading(false);
      }
    );
  };

  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180');
      return;
    }

    setLocation({ latitude: lat, longitude: lon, altitude: 0 });
    setError(null);
  };

  useEffect(() => {
    if (location && tleData) {
      try {
        setLoading(true);
        const calculatedPasses = calculatePasses(tleData, location, new Date(), 7);
        setPasses(calculatedPasses);
        setError(null);
      } catch (err) {
        setError('Failed to calculate passes: ' + err.message);
        console.error('Pass calculation error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [location, tleData]);

  return (
    <div className="pass-predictor">
      <h2>🔭 Pass Predictions</h2>

      <div className="location-controls">
        <button
          onClick={handleUseMyLocation}
          disabled={loading}
          className="btn btn-primary"
        >
          📍 Use My Location
        </button>

        <div className="manual-location">
          <input
            type="number"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            step="0.0001"
            min="-90"
            max="90"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={manualLon}
            onChange={(e) => setManualLon(e.target.value)}
            step="0.0001"
            min="-180"
            max="180"
          />
          <button onClick={handleManualLocation} className="btn btn-secondary">
            Set Location
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading && <div className="loading-msg">Calculating passes...</div>}

      {location && (
        <div className="current-location">
          <p>
            <strong>Your Location:</strong> {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
          </p>
        </div>
      )}

      {passes.length > 0 && (
        <div className="passes-list">
          <h3>Next {passes.length} Visible Passes</h3>
          {passes.map((pass, index) => (
            <div key={index} className="pass-item">
              <div className="pass-header">
                <span className="pass-number">Pass #{index + 1}</span>
                <span className="pass-date">
                  {format(pass.rise.time, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="pass-details">
                <div className="pass-event">
                  <span className="event-label">Rise:</span>
                  <span className="event-time">{format(pass.rise.time, 'HH:mm:ss')}</span>
                  <span className="event-az">Az: {pass.rise.azimuth.toFixed(1)}°</span>
                </div>
                <div className="pass-event highlight">
                  <span className="event-label">Max:</span>
                  <span className="event-time">{format(pass.max.time, 'HH:mm:ss')}</span>
                  <span className="event-el">El: {pass.max.elevation.toFixed(1)}°</span>
                </div>
                <div className="pass-event">
                  <span className="event-label">Set:</span>
                  <span className="event-time">{format(pass.set.time, 'HH:mm:ss')}</span>
                  <span className="event-az">Az: {pass.set.azimuth.toFixed(1)}°</span>
                </div>
              </div>
              <div className="pass-duration">
                Duration: {Math.round((pass.set.time - pass.rise.time) / 1000 / 60)} min
              </div>
            </div>
          ))}
        </div>
      )}

      {!location && !loading && (
        <div className="no-location">
          <p>Set your location to see upcoming ISS passes</p>
        </div>
      )}
    </div>
  );
}

export default PassPredictor;
