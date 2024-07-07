const fs = require('fs');
const path = require('path');

// Load the TLE configuration
const tleConfigPath = path.join(__dirname, 'tleConfig.json');
const tleConfig = JSON.parse(fs.readFileSync(tleConfigPath, 'utf-8'));

function parseTLE(tleString) {
    const tleLines = tleString.trim().split('\n');

    if (tleLines.length < 2) {
        throw new Error('Invalid TLE data');
    }

    const line1 = tleLines[0];
    const line2 = tleLines[1];

    const tleObject = {};
    for (const [key, value] of Object.entries(tleConfig)) {
        const [start, end] = value;
        const line = key.endsWith('2') ? line2 : line1;
        tleObject[key] = line.substring(start, end).trim();
    }

    return tleObject;
}

module.exports = { parseTLE };