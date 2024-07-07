# TLE Parser

A parser for TLE (Two-Line Element) satellite data.

## Installation

Clone the repository:

```bash
git clone https://github.com/gv-sh/tle-parser.git
cd tle-parser
npm install
```

## Usage

```javascript
const { parseTLE } = require('tle-parser');

const tleData = `
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
`;

console.log(parseTLE(tleData));
```

