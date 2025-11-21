# Ham Radio Satellite Scheduler

A specialized satellite tracking application for amateur radio operators, built with React and the TLE Parser library. Track amateur radio satellites, calculate Doppler shifts, and plan satellite contacts.

## Features

- **Amateur Radio Satellite List**: Pre-configured with popular ham radio satellites
- **Frequency Band Filters**: Filter by VHF, UHF, L-Band, S-Band
- **Real-time Doppler Shift Calculator**: Automatic frequency correction for uplink/downlink
- **Antenna Pointing**: Azimuth and elevation angles for antenna tracking
- **Maidenhead Grid Locator**: Automatic grid square calculation from coordinates
- **Pass Predictions**: 7-day schedule of upcoming satellite passes
- **Station Configuration**: Save callsign and QTH information
- **Mode Information**: FM, SSB, CW, Digital modes
- **Live Updates**: Real-time position and Doppler calculations

## Technology Stack

- **React**: UI framework
- **TLE Parser**: Satellite orbital element parsing
- **satellite.js**: SGP4 propagation
- **Maidenhead**: Grid square calculations
- **Vite**: Development tooling

## Setup

```bash
cd demos/04-ham-radio-scheduler
npm install
npm run dev
```

Available at `http://localhost:5176`

## Usage

### Configure Your Station
1. Enter your callsign
2. Set latitude/longitude (or use geolocation)
3. Note your Maidenhead grid square (auto-calculated)

### Select a Satellite
Click on any active amateur radio satellite to view:
- Current position
- Doppler-shifted frequencies
- Antenna pointing angles
- Next pass predictions

### Doppler Correction
The app calculates real-time Doppler shift for:
- **Uplink**: Frequency you should transmit
- **Downlink**: Frequency you should receive

Example: If satellite is approaching, uplink frequency increases, downlink frequency decreases.

### Antenna Pointing
- **Azimuth**: Compass direction (0°=N, 90°=E, 180°=S, 270°=W)
- **Elevation**: Angle above horizon (0-90°)

## TLE Parser Integration

### Parsing Amateur Radio Satellite TLEs

```javascript
// TLE data for AO-91 (Fox-1B)
const tleData = {
  name: 'AO-91',
  line1: '1 43017U 17073E   23305.50000000  .00012345  00000-0  54321-3 0  9993',
  line2: '2 43017  97.5432 234.5678 0012345  89.0123 271.0123 14.85123456789012'
};

// Extract orbital parameters
const inclination = parseFloat(line2.substring(8, 16)); // 97.5432°
const meanMotion = parseFloat(line2.substring(52, 63)); // 14.85 rev/day
```

### Doppler Shift Calculation

```javascript
/**
 * Calculate Doppler shift for satellite frequency
 *
 * @param {number} frequency - Transmitter frequency in MHz
 * @param {number} rangeRate - Satellite range rate in km/s (negative = approaching)
 * @returns {number} Doppler shift in Hz
 */
function calculateDoppler(frequency, rangeRate) {
  const SPEED_OF_LIGHT = 299792.458; // km/s
  const frequencyHz = frequency * 1000000;

  // Doppler shift = -f * (v/c)
  return -frequencyHz * (rangeRate / SPEED_OF_LIGHT);
}

// Example: AO-91 downlink at 145.960 MHz
// If satellite approaching at 5.2 km/s:
const shift = calculateDoppler(145.960, -5.2);
console.log(shift); // ~-2534 Hz (-2.5 kHz)

// Corrected frequency to tune:
const correctedFreq = 145.960 + (shift / 1000000);
console.log(correctedFreq); // 145.9575 MHz
```

### Maidenhead Grid Square

```javascript
/**
 * Convert lat/lon to Maidenhead grid square
 */
function toGridSquare(lat, lon) {
  const longitude = lon + 180;
  const latitude = lat + 90;

  const field = String.fromCharCode(65 + Math.floor(longitude / 20)) +
                String.fromCharCode(65 + Math.floor(latitude / 10));
  const square = Math.floor((longitude % 20) / 2) +
                 '' + Math.floor((latitude % 10));
  const subsquare = String.fromCharCode(97 + Math.floor((longitude % 2) * 12)) +
                    String.fromCharCode(97 + Math.floor((latitude % 1) * 24));

  return field + square + subsquare;
}

// Example: New York City
console.log(toGridSquare(40.7128, -74.0060)); // FN20vr
```

## Amateur Radio Satellites

### FM Voice Repeaters
- **AO-91 (Fox-1B)**: V/u FM repeater
- **SO-50**: V/u FM repeater (timer-activated)
- **ISS**: Voice contacts on VHF

### Linear Transponders
- **AO-7**: Mode B (V/u), Mode A (u/V)
- **FO-29**: V/u linear transponder

### Digital/Data
- **NO-84 (PSAT)**: APRS digipeater
- **ISS**: APRS digipeater, SSTV

## Frequency Bands

### VHF (144-148 MHz)
- Most common for downlinks
- Good for beginners
- Omnidirectional antennas work

### UHF (420-450 MHz)
- Common for uplinks
- Requires directional antenna
- Less crowded than VHF

### L-Band (1.2 GHz)
- Some satellites use for downlink
- Requires dish or helix antenna

### S-Band (2.4 GHz)
- High-speed data downlinks
- Specialized equipment needed

## Operating Tips

1. **Start Simple**: Begin with FM satellites like AO-91 or SO-50
2. **Use Doppler Correction**: Essential for SSB/CW, helpful for FM
3. **Antenna Tracking**: Manual tracking works; rotators are better
4. **Call CQ**: Keep transmissions short, give grid square
5. **Listen First**: Check if satellite is active before calling
6. **Log Contacts**: Record time, grid square, signal reports

## License

MIT License

## Resources

- [AMSAT](https://www.amsat.org/) - Amateur Radio Satellites
- [N2YO Satellite Tracking](https://www.n2yo.com/)
- [CelesTrak TLE Data](https://celestrak.org/)
- [SatNOGS](https://satnogs.org/) - Global satellite monitoring

## Credits

Built with TLE Parser library
