import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateGroundTrack } from '../utils/satellite';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom ISS icon
const issIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzAwN2JmZiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMjAiIHk9IjI2IiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPvCfm7A8L3RleHQ+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, map]);

  return null;
}

function ISSMap({ position, tleData }) {
  const [groundTrack, setGroundTrack] = React.useState([]);

  useEffect(() => {
    if (tleData) {
      try {
        const track = calculateGroundTrack(tleData, 90); // 90 minute orbit
        setGroundTrack(track);
      } catch (err) {
        console.error('Ground track calculation error:', err);
      }
    }
  }, [tleData]);

  if (!position) {
    return (
      <div className="map-loading">
        <p>Calculating ISS position...</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ISS current position */}
        <Marker position={[position.latitude, position.longitude]} icon={issIcon}>
          <Popup>
            <div className="iss-popup">
              <h3>ISS (ZARYA)</h3>
              <p><strong>Latitude:</strong> {position.latitude.toFixed(4)}°</p>
              <p><strong>Longitude:</strong> {position.longitude.toFixed(4)}°</p>
              <p><strong>Altitude:</strong> {position.altitude.toFixed(2)} km</p>
              <p><strong>Velocity:</strong> {position.velocity.toFixed(2)} km/s</p>
            </div>
          </Popup>
        </Marker>

        {/* Ground track */}
        {groundTrack.length > 0 && (
          <Polyline
            positions={groundTrack}
            color="#007bff"
            weight={2}
            opacity={0.6}
            dashArray="5, 10"
          />
        )}

        <MapController position={position} />
      </MapContainer>
    </div>
  );
}

export default ISSMap;
