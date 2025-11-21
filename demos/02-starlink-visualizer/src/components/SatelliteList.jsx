import React, { useState } from 'react';
import './SatelliteList.css';

/**
 * SatelliteList Component
 *
 * Displays a scrollable list of satellites with key TLE-derived parameters.
 */
function SatelliteList({ satellites, selectedShell }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSatellites = satellites.filter(sat =>
    sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sat.catalogNumber && sat.catalogNumber.toString().includes(searchTerm))
  );

  return (
    <div className="satellite-list">
      <div className="list-header">
        <h3>Satellite List</h3>
        <input
          type="text"
          placeholder="Search by name or NORAD ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <p className="list-count">
          Showing {filteredSatellites.length} satellites
          {selectedShell !== 'all' && ` in ${selectedShell}`}
        </p>
      </div>

      <div className="list-content">
        {filteredSatellites.map((sat, index) => (
          <div key={sat.catalogNumber || index} className="satellite-item">
            <div className="satellite-item-header">
              <span className="satellite-name">{sat.name}</span>
              <span className="satellite-norad">{sat.catalogNumber}</span>
            </div>
            <div className="satellite-item-details">
              <span className="detail-item">
                Shell: <strong>{sat.shell}</strong>
              </span>
              {sat.position && (
                <>
                  <span className="detail-item">
                    Alt: <strong>{sat.position.altitude.toFixed(0)} km</strong>
                  </span>
                  <span className="detail-item">
                    Vel: <strong>{sat.position.velocity.toFixed(2)} km/s</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredSatellites.length === 0 && (
          <div className="no-results">
            No satellites found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

export default SatelliteList;
