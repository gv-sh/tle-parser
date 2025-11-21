import React from 'react';
import './ConstellationStats.css';

/**
 * ConstellationStats Component
 *
 * Displays real-time statistics about the Starlink constellation
 * parsed from TLE data.
 */
function ConstellationStats({ stats }) {
  return (
    <div className="constellation-stats">
      <h2>Constellation Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Satellites</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Tracking</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{Object.keys(stats.shells).length}</div>
          <div className="stat-label">Orbital Shells</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.coverage}%</div>
          <div className="stat-label">Global Coverage</div>
        </div>
      </div>

      <div className="shell-breakdown">
        <h3>Shell Distribution</h3>
        <div className="shell-bars">
          {Object.entries(stats.shells).map(([shell, count]) => {
            const percentage = (count / stats.total) * 100;
            return (
              <div key={shell} className="shell-bar-item">
                <div className="shell-bar-label">
                  <span>{shell}</span>
                  <span>{count} sats</span>
                </div>
                <div className="shell-bar">
                  <div
                    className="shell-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConstellationStats;
