import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './StarlinkMap.css';

/**
 * MapUpdater component to handle dynamic map updates
 */
function MapUpdater({ satellites }) {
  const map = useMap();

  useEffect(() => {
    if (satellites.length > 0 && satellites[0].position) {
      // Auto-fit bounds to show all satellites
      const bounds = satellites
        .filter(s => s.position)
        .map(s => [s.position.latitude, s.position.longitude]);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
      }
    }
  }, [satellites, map]);

  return null;
}

/**
 * StarlinkMap Component
 *
 * Displays Starlink satellites on an interactive map using Leaflet.
 * Each satellite is rendered as a marker with position calculated from TLE data.
 */
function StarlinkMap({ satellites }) {
  const mapRef = useRef(null);

  // Color coding by orbital shell
  const getShellColor = (shell) => {
    const colors = {
      'Shell 1 (550 km, 53°)': '#00d4ff',
      'Shell 2 (540 km, 53.2°)': '#00ff88',
      'Shell 3 (570 km, 70°)': '#ff00ff',
      'Shell 4 (560 km, 97.6°)': '#ffaa00',
      'Shell 5 (560 km, 97.6°)': '#ff0088'
    };
    return colors[shell] || '#ffffff';
  };

  return (
    <div className="starlink-map">
      <MapContainer
        ref={mapRef}
        center={[0, 0]}
        zoom={2}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        worldCopyJump={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {satellites.filter(sat => sat.position).map((sat, index) => (
          <CircleMarker
            key={sat.catalogNumber || index}
            center={[sat.position.latitude, sat.position.longitude]}
            radius={4}
            pathOptions={{
              fillColor: getShellColor(sat.shell),
              fillOpacity: 0.7,
              color: getShellColor(sat.shell),
              weight: 1,
              opacity: 0.9
            }}
          >
            <Popup>
              <div className="satellite-popup">
                <h3>{sat.name}</h3>
                <table>
                  <tbody>
                    <tr>
                      <td>NORAD ID:</td>
                      <td>{sat.catalogNumber}</td>
                    </tr>
                    <tr>
                      <td>Shell:</td>
                      <td>{sat.shell}</td>
                    </tr>
                    <tr>
                      <td>Altitude:</td>
                      <td>{sat.position.altitude.toFixed(1)} km</td>
                    </tr>
                    <tr>
                      <td>Velocity:</td>
                      <td>{sat.position.velocity.toFixed(2)} km/s</td>
                    </tr>
                    <tr>
                      <td>Latitude:</td>
                      <td>{sat.position.latitude.toFixed(4)}°</td>
                    </tr>
                    <tr>
                      <td>Longitude:</td>
                      <td>{sat.position.longitude.toFixed(4)}°</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <MapUpdater satellites={satellites} />
      </MapContainer>

      <div className="map-legend">
        <h4>Orbital Shells</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#00d4ff' }}></span>
            <span>Shell 1 (550km, 53°)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#00ff88' }}></span>
            <span>Shell 2 (540km, 53.2°)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ff00ff' }}></span>
            <span>Shell 3 (570km, 70°)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ffaa00' }}></span>
            <span>Shell 4 (560km, 97.6°)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StarlinkMap;
