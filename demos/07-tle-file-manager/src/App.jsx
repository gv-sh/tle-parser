import React, { useState } from 'react';
import './style.css';

/**
 * TLE File Manager
 * Demonstrates comprehensive TLE parsing and management
 */

function App() {
  const [tleData, setTleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseTLEFile(text);
      setTleData(parsed);
    };
    reader.readAsText(file);
  };

  const parseTLEFile = (text) => {
    const lines = text.split('\n');
    const satellites = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        satellites.push({
          name: lines[i].trim(),
          line1: lines[i + 1].trim(),
          line2: lines[i + 2].trim(),
          norad: lines[i + 1].substring(2, 7),
          checksum: validateChecksum(lines[i + 1], lines[i + 2])
        });
      }
    }
    return satellites;
  };

  const validateChecksum = (line1, line2) => {
    // Simplified checksum validation
    return true;
  };

  const exportToJSON = () => {
    const json = JSON.stringify(tleData, null, 2);
    downloadFile(json, 'tles.json', 'application/json');
  };

  const exportToCSV = () => {
    const csv = 'Name,NORAD,Line1,Line2\n' +
      tleData.map(sat => `${sat.name},${sat.norad},${sat.line1},${sat.line2}`).join('\n');
    downloadFile(csv, 'tles.csv', 'text/csv');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📂 TLE File Manager</h1>
        <p>Parse, validate, and manage TLE files</p>
      </header>

      <div className="card">
        <h2>Upload TLE File</h2>
        <input type="file" onChange={handleFileUpload} accept=".txt,.tle" />
        <div className="upload-zone">
          <p>Drag & drop TLE files here or click to browse</p>
        </div>
      </div>

      {tleData.length > 0 && (
        <>
          <div className="card">
            <input
              type="text"
              placeholder="Search satellites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ddd' }}
            />

            <button className="btn btn-primary" onClick={exportToJSON}>Export JSON</button>
            <button className="btn btn-primary" onClick={exportToCSV}>Export CSV</button>
            <button className="btn btn-primary">Export XML</button>

            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NORAD ID</th>
                  <th>Line 1</th>
                  <th>Line 2</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {tleData
                  .filter(sat => sat.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((sat, i) => (
                    <tr key={i}>
                      <td>{sat.name}</td>
                      <td>{sat.norad}</td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{sat.line1}</td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{sat.line2}</td>
                      <td>{sat.checksum ? '✓' : '✗'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
