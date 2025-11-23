import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './style.css';

/**
 * Space Debris Tracker
 *
 * Demonstrates TLE Parser for space debris monitoring:
 * - Parse TLE data for debris objects
 * - Visualize debris distribution in Earth orbit
 * - Calculate collision probabilities
 * - Filter by size, altitude, and risk level
 * - Generate collision alerts
 * - Show density heatmaps
 */

// Sample debris objects with TLE data
const DEBRIS_CATALOG = [
  {
    id: 'DEB-001',
    name: 'COSMOS 2251 DEB',
    norad: 33592,
    size: 'Large (>10cm)',
    altitude: 790,
    inclination: 74.0,
    riskLevel: 'high',
    tle: {
      line1: '1 33592U 93036SX  23305.50000000  .00000123  00000-0  12345-4 0  9991',
      line2: '2 33592  74.0354 234.5678 0012345  89.0123 271.0123 14.55123456789012'
    }
  },
  {
    id: 'DEB-002',
    name: 'IRIDIUM 33 DEB',
    norad: 33591,
    size: 'Medium (1-10cm)',
    altitude: 785,
    inclination: 86.4,
    riskLevel: 'medium',
    tle: {
      line1: '1 33591U 97051C   23305.50000000  .00000456  00000-0  45678-4 0  9992',
      line2: '2 33591  86.3987 123.4567 0012345  78.9012 281.1234 14.54123456789012'
    }
  },
  {
    id: 'DEB-003',
    name: 'FENGYUN 1C DEB',
    norad: 29651,
    size: 'Small (<1cm tracked)',
    altitude: 850,
    inclination: 98.5,
    riskLevel: 'low',
    tle: {
      line1: '1 29651U 99025AAA 23305.50000000  .00000789  00000-0  78901-4 0  9993',
      line2: '2 29651  98.5123 234.5678 0012345  89.0123 271.0123 14.58123456789012'
    }
  }
];

function App() {
  const [debrisData, setDebrisData] = useState(DEBRIS_CATALOG);
  const [filters, setFilters] = useState({
    sizeFilter: 'all',
    altitudeMin: 0,
    altitudeMax: 2000,
    riskLevel: 'all'
  });
  const [stats, setStats] = useState({
    total: DEBRIS_CATALOG.length,
    highRisk: 1,
    mediumRisk: 1,
    lowRisk: 1
  });
  const vizRef = useRef(null);

  useEffect(() => {
    if (vizRef.current) {
      renderD3Visualization();
    }
  }, [debrisData, filters]);

  const renderD3Visualization = () => {
    const svg = d3.select(vizRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    svg.attr('width', width).attr('height', height);

    // Create altitude vs inclination scatter plot
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 2000])
      .range([height - margin.bottom, margin.top]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#c9d1d9')
      .text('Inclination (°)');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -35)
      .attr('fill', '#c9d1d9')
      .text('Altitude (km)');

    // Add debris points
    const colorScale = d3.scaleOrdinal()
      .domain(['low', 'medium', 'high'])
      .range(['#3fb950', '#d29922', '#f85149']);

    svg.selectAll('circle')
      .data(debrisData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.inclination))
      .attr('cy', d => yScale(d.altitude))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.riskLevel))
      .attr('opacity', 0.7)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 5);
      });
  };

  const filteredDebris = debrisData.filter(d => {
    if (filters.sizeFilter !== 'all' && !d.size.includes(filters.sizeFilter)) return false;
    if (d.altitude < filters.altitudeMin || d.altitude > filters.altitudeMax) return false;
    if (filters.riskLevel !== 'all' && d.riskLevel !== filters.riskLevel) return false;
    return true;
  });

  return (
    <div className="app">
      <header className="header">
        <h1>🛰️ Space Debris Tracker</h1>
        <p>Monitor and analyze space debris using TLE data</p>
      </header>

      <div className="main-container">
        {/* Filters Panel */}
        <div className="panel">
          <h2>Filters</h2>

          <div className="filter-group">
            <label>Debris Size</label>
            <select
              value={filters.sizeFilter}
              onChange={(e) => setFilters({...filters, sizeFilter: e.target.value})}
            >
              <option value="all">All Sizes</option>
              <option value="Large">Large (&gt;10cm)</option>
              <option value="Medium">Medium (1-10cm)</option>
              <option value="Small">Small (&lt;1cm)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Altitude Range (km)</label>
            <input
              type="number"
              value={filters.altitudeMin}
              onChange={(e) => setFilters({...filters, altitudeMin: parseInt(e.target.value)})}
              placeholder="Min"
            />
            <input
              type="number"
              value={filters.altitudeMax}
              onChange={(e) => setFilters({...filters, altitudeMax: parseInt(e.target.value)})}
              placeholder="Max"
              style={{marginTop: '10px'}}
            />
          </div>

          <div className="filter-group">
            <label>Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <button className="btn" style={{width: '100%'}}>🔄 Update TLEs</button>
          <button className="btn btn-secondary" style={{width: '100%', marginTop: '10px'}}>
            📥 Search NORAD Catalog
          </button>
        </div>

        {/* Visualization Panel */}
        <div className="panel">
          <h2>Debris Distribution Visualization</h2>
          <div className="debris-viz">
            <svg ref={vizRef}></svg>
          </div>
        </div>

        {/* Stats and Alerts Panel */}
        <div className="panel">
          <h2>Statistics</h2>

          <div className="stat-card">
            <div className="stat-value">{filteredDebris.length}</div>
            <div className="stat-label">Tracked Objects</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{stats.highRisk}</div>
            <div className="stat-label">High Risk</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{stats.mediumRisk}</div>
            <div className="stat-label">Medium Risk</div>
          </div>

          <h2 style={{marginTop: '20px'}}>Collision Alerts</h2>

          <div className="alert-item">
            <h4>⚠️ Close Approach</h4>
            <p>COSMOS 2251 DEB → 12.3 km from active satellite</p>
            <p style={{fontSize: '0.75rem', marginTop: '5px', color: '#8b949e'}}>
              Estimated time: 2h 34m
            </p>
          </div>

          <h2 style={{marginTop: '20px'}}>Debris List</h2>

          {filteredDebris.map(debris => (
            <div key={debris.id} className={`debris-item ${debris.riskLevel}-risk`}>
              <div className="debris-name">{debris.name}</div>
              <div className="debris-info">
                <div>NORAD: {debris.norad}</div>
                <div>Alt: {debris.altitude} km | Inc: {debris.inclination}°</div>
                <div>Size: {debris.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
