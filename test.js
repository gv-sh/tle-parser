// test.js
const { parseTLE } = require('./index');

const tleData = `
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
`;

console.log(parseTLE(tleData));