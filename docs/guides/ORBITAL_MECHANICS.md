# Orbital Mechanics Concepts

Understanding the orbital mechanics behind TLE data.

## Table of Contents

- [Introduction](#introduction)
- [Classical Orbital Elements](#classical-orbital-elements)
- [TLE-Specific Parameters](#tle-specific-parameters)
- [Orbit Types](#orbit-types)
- [Perturbations](#perturbations)
- [Practical Applications](#practical-applications)
- [Further Reading](#further-reading)

---

## Introduction

A Two-Line Element Set (TLE) contains orbital elements that describe a satellite's orbit around Earth. This guide explains the orbital mechanics concepts behind these parameters, making TLE data more accessible to those without an aerospace engineering background.

### What is an Orbit?

An orbit is the path a satellite follows around Earth due to the balance between:
- **Gravitational force**: Pulling the satellite toward Earth
- **Orbital velocity**: Satellite's forward motion

### Orbital Period

The time it takes to complete one orbit, calculated from mean motion:

```
Period (minutes) = 1440 / Mean Motion (rev/day)
Period (hours) = 24 / Mean Motion (rev/day)
```

**Examples:**
- ISS: 15.49 rev/day → ~93 minutes
- GPS: 2.0 rev/day → 12 hours
- GEO: 1.0 rev/day → 24 hours

---

## Classical Orbital Elements

### 1. Inclination (i)

**Range:** 0° to 180°

**Definition:** Angle between the orbital plane and Earth's equatorial plane.

**Physical Meaning:**
- Determines which latitudes the satellite passes over
- 0° = Equatorial orbit (moves along equator)
- 90° = Polar orbit (passes over both poles)
- 0° < i < 90° = Prograde (eastward, with Earth's rotation)
- 90° < i < 180° = Retrograde (westward, against Earth's rotation)

**Common Values:**
- **0°**: Geostationary satellites (above equator)
- **28.5°**: Cape Canaveral launches (latitude of launch site)
- **51.6°**: ISS (accessible from Baikonur and Kennedy)
- **98°**: Sun-synchronous (Earth observation)
- **63.4°**: Molniya (minimizes apsidal precession)

**Coverage:**
- Satellite can only pass over latitudes ≤ inclination
- 51.6° inclination → passes between 51.6°N and 51.6°S

**Visual Analogy:** Imagine tilting a hula hoop (orbit) relative to a table (equator). The tilt angle is the inclination.

---

### 2. Right Ascension of the Ascending Node (RAAN / Ω)

**Range:** 0° to 360°

**Definition:** Angle from the vernal equinox direction to where the orbit crosses the equator going north (ascending node).

**Physical Meaning:**
- Defines the orientation of the orbital plane in space
- Measured eastward along the equator
- Changes over time due to Earth's oblateness (precession)

**Vernal Equinox:**
- Direction from Earth to the Sun on the March equinox
- Fixed reference direction in space (like "north" on a map)

**Precession:**
- RAAN drifts over time
- Rate depends on inclination and altitude
- Sun-synchronous orbits: RAAN precesses ~1°/day to maintain constant solar angle

**Visualization:**
```
        North Pole
            ↑
            |
Vernal  ←---+---→ Ascending Node
Equinox     |     (orbit crosses equator going north)
            |
            ↓
        South Pole

RAAN = angle from vernal equinox to ascending node
```

---

### 3. Eccentricity (e)

**Range:** 0 (circle) to <1 (ellipse)

**Definition:** Shape of the orbit (how elliptical it is).

**Values:**
- **e = 0**: Perfect circle (constant altitude)
- **0 < e < 1**: Ellipse (altitude varies)
- **e = 1**: Parabola (escape trajectory)
- **e > 1**: Hyperbola (not in TLEs)

**Physical Meaning:**
```
e = (apogee - perigee) / (apogee + perigee)
```

**Examples:**
- **0.0001671** (ISS): Nearly circular
  - Perigee: ~408 km
  - Apogee: ~410 km
  - Difference: ~2 km
- **0.0001** (typical GEO): Nearly circular
- **0.7** (Molniya): Highly elliptical
  - Perigee: ~500 km
  - Apogee: ~40,000 km

**Relationship to Altitude:**
- Low eccentricity = altitude changes little
- High eccentricity = large altitude variation

**TLE Quirk:** Eccentricity has assumed decimal point
- TLE: `0001671`
- Actual: `0.0001671`

---

### 4. Argument of Perigee (ω)

**Range:** 0° to 360°

**Definition:** Angle from the ascending node to perigee (closest point to Earth).

**Physical Meaning:**
- Defines where in the orbit the satellite is closest to Earth
- Measured in the direction of satellite motion
- For nearly circular orbits (e ≈ 0), this is arbitrary/meaningless

**Importance:**
- Critical for highly elliptical orbits (HEO)
- Determines where satellite spends most time
- Molniya orbits: ω ≈ 270° (apogee over northern hemisphere)

**Changes Over Time:**
- Precesses due to Earth's oblateness
- Rate depends on inclination and altitude

**Visualization:**
```
        Apogee
           *
          / \
         /   \
        /     \
       /       \
      /    ω    \
Ascending ----→ Perigee
Node            (closest to Earth)
```

---

### 5. Mean Anomaly (M)

**Range:** 0° to 360°

**Definition:** Angle indicating satellite's position along its orbit at the epoch time.

**Values:**
- **0°**: At perigee (closest point)
- **90°**: One quarter orbit past perigee
- **180°**: At apogee (farthest point)
- **270°**: Three quarters orbit past perigee

**Physical Meaning:**
- "Where is the satellite now?"
- Combined with mean motion, allows position calculation at any time

**Note:** This is the "mean" anomaly, not the actual position. True position calculation requires solving Kepler's equation.

**Time Evolution:**
```
M(t) = M₀ + n × (t - t₀)
where:
  M(t) = Mean anomaly at time t
  M₀ = Mean anomaly at epoch
  n = Mean motion (rad/s)
  t = Current time
  t₀ = Epoch time
```

---

### 6. Mean Motion (n)

**Units:** Revolutions per day

**Definition:** Average number of orbits completed per day.

**Relationship to Altitude:**
Higher orbit → slower motion → lower mean motion

**Kepler's Third Law:**
```
Period² ∝ Semi-major axis³
```

**Altitude Estimation:**
```javascript
// Rough altitude calculation (km)
const meanMotion = 15.49;  // rev/day
const mu = 398600.4418;    // Earth's gravitational parameter (km³/s²)
const n = meanMotion * 2 * Math.PI / 86400;  // Convert to rad/s
const a = Math.pow(mu / (n * n), 1/3);       // Semi-major axis
const altitude = a - 6371;  // Subtract Earth's radius
console.log('Altitude:', altitude, 'km');  // ~408 km for ISS
```

**Typical Values:**
- **LEO (200-2000 km)**: 12-17 rev/day
- **MEO (GPS, ~20,000 km)**: ~2 rev/day
- **GEO (~35,786 km)**: 1 rev/day
- **HEO (elliptical)**: 0.5-2 rev/day

---

## TLE-Specific Parameters

### First Time Derivative of Mean Motion

**Symbol:** dn/dt / 2

**Units:** Revolutions per day²

**Physical Meaning:** Rate of change of orbital period.

**Sign:**
- **Positive**: Orbit accelerating (usually from maneuvers or solar pressure)
- **Negative**: Orbit decaying (atmospheric drag)
- **Zero**: Stable orbit (high altitude, minimal drag)

**Example:**
- ISS: `+.00001534` rev/day²
  - Slight decay, requires periodic reboosts
  - Without reboost, orbit would decay in months

**Usage:** Input to SGP4 propagator for accurate orbit prediction.

---

### Second Time Derivative of Mean Motion

**Symbol:** d²n/dt² / 6

**Units:** Revolutions per day³

**Physical Meaning:** Rate of change of orbital decay.

**Typical Value:** Usually `00000-0` (effectively zero)

**When Non-Zero:**
- Rapid atmospheric density changes
- Complex perturbations
- Rarely significant

---

### B* Drag Term

**Definition:** Ballistic coefficient related to atmospheric drag.

**Formula:**
```
B* = Cd × A / (2 × m)
where:
  Cd = Drag coefficient (~2.0-2.5 for satellites)
  A = Cross-sectional area (m²)
  m = Mass (kg)
```

**Physical Meaning:**
- How much the satellite is affected by atmospheric drag
- Larger value = more drag

**Typical Values:**
- **LEO satellites**: 1×10⁻⁵ to 1×10⁻³
  - ISS: ~3.5×10⁻⁵ (large, low altitude)
  - Small CubeSat: ~1×10⁻³ (high area-to-mass ratio)
- **MEO/GEO**: ~0 (negligible atmosphere)

**Factors:**
- Altitude (lower = more drag)
- Solar activity (expands atmosphere)
- Satellite shape/orientation
- Mass

**Impact:**
- High B* = orbit decays quickly
- Near zero = stable orbit

---

### Ephemeris Type

**Typical Value:** 0

**Meaning:** Which orbital model to use for propagation.

**Values:**
- **0**: SGP4/SDP4 (standard)
  - SGP4: Simplified General Perturbations 4 (near-Earth)
  - SDP4: Simplified Deep-Space Perturbations 4 (deep-space)
- **Other**: Rarely used

**Automatic Selection:**
- Mean motion > 1.0 rev/day → SGP4
- Mean motion ≤ 1.0 rev/day → SDP4

---

### Revolution Number

**Definition:** Number of complete orbits since launch.

**Example:** ISS rev number ~52,428
```
Launches: April 1998
Revs/day: ~15.5
Days in orbit: ~8,000 (as of 2020)
Expected revs: 15.5 × 8,000 ≈ 124,000
(Actual may differ due to altitude changes)
```

**Rollover:** Resets after 99,999

**Uses:**
- Estimate satellite age
- Track mission duration
- Identify specific orbits for observations

---

## Orbit Types

### Low Earth Orbit (LEO)

**Altitude:** 200-2000 km
**Period:** 88-127 minutes
**Mean Motion:** 11-17 rev/day

**Examples:**
- ISS: ~408 km, 93 min
- Starlink: ~550 km, 95 min
- Hubble: ~540 km, 96 min

**Characteristics:**
- Short orbital period
- Significant atmospheric drag
- Requires regular reboosts
- Low latency for communications
- High spatial resolution for imaging

---

### Medium Earth Orbit (MEO)

**Altitude:** 2,000-35,786 km
**Period:** 2-24 hours
**Mean Motion:** 1-12 rev/day

**Examples:**
- GPS: ~20,200 km, 12 hours (2 rev/day)
- GLONASS: ~19,100 km, 11.25 hours
- Galileo: ~23,222 km, 14 hours

**Characteristics:**
- Moderate latency
- Good coverage with constellation
- Minimal atmospheric drag
- Long orbital lifetime

---

### Geostationary Orbit (GEO)

**Altitude:** 35,786 km
**Period:** 24 hours (1 rev/day)
**Inclination:** 0°
**Eccentricity:** ~0

**Characteristics:**
- Appears stationary over equator
- Fixed ground coverage
- High latency (~240 ms)
- Communications, weather satellites

**Station-Keeping:** Requires periodic maneuvers to maintain position

---

### Geosynchronous Orbit (GSO)

**Altitude:** 35,786 km
**Period:** 24 hours
**Inclination:** >0° or eccentricity >0

**Difference from GEO:**
- GEO: Special case of GSO (i=0, e=0)
- GSO: Any 24-hour orbit

**Ground Track:**
- Figure-8 pattern
- Repeats daily

---

### Sun-Synchronous Orbit (SSO)

**Altitude:** Typically 600-800 km
**Inclination:** ~98° (retrograde)
**Period:** ~100 minutes

**Special Property:**
- Orbital plane precesses ~1°/day
- Matches Earth's orbit around Sun
- Same solar time on each pass

**Uses:**
- Earth observation (consistent lighting)
- Weather satellites
- Reconnaissance

**Example:** Landsat, Sentinel satellites

---

### Molniya Orbit

**Altitude:**
- Perigee: ~500-1000 km
- Apogee: ~40,000 km

**Inclination:** 63.4° or 116.6° (critical inclination)
**Eccentricity:** ~0.7
**Period:** 12 hours
**Argument of Perigee:** ~270°

**Special Properties:**
- Apogee over high northern latitudes
- Satellite spends ~11 hours above horizon
- Minimal apsidal precession at critical inclination

**Uses:**
- Communications for high-latitude regions
- Russian satellite communications

---

### Polar Orbit

**Inclination:** 90° (passes over poles)

**Characteristics:**
- Eventually covers entire Earth
- Each orbit passes over different longitude
- Good for global coverage

**Uses:**
- Earth observation
- Reconnaissance
- Weather monitoring

---

### Equatorial Orbit

**Inclination:** 0°

**Characteristics:**
- Stays over equatorial region
- Never passes over high latitudes

**Uses:**
- Geostationary satellites
- Equatorial communications

---

## Perturbations

Factors that cause orbits to deviate from ideal Keplerian motion:

### Earth's Oblateness (J2)

**Effect:** Earth is not perfectly spherical (equatorial bulge)

**Consequences:**
- **RAAN precession**: Orbital plane rotates
  - Prograde orbits: RAAN decreases (westward)
  - Retrograde orbits: RAAN increases (eastward)
- **Argument of perigee precession**: Perigee location rotates
  - Critical inclination (63.4°): Minimal precession

**Rate:** Depends on inclination and altitude

---

### Atmospheric Drag

**Effect:** Resistance from Earth's atmosphere

**Consequences:**
- Orbit decay (semi-major axis decreases)
- Eccentricity decrease (orbit circularizes)
- Eventually: Re-entry and burnup

**Factors:**
- **Altitude**: Lower = more drag
- **Solar activity**: Solar max = expanded atmosphere
- **Satellite properties**: B* drag term
- **Orientation**: Tumbling satellites have more drag

**Mitigation:** Periodic reboosts (ISS, Hubble)

---

### Solar Radiation Pressure

**Effect:** Photons from Sun push on satellite

**Magnitude:** Small but significant for large, lightweight satellites

**Consequences:**
- Eccentricity changes
- Semi-major axis variations

**Most Affected:**
- Large solar panels
- High area-to-mass ratio
- GEO satellites (no atmospheric drag)

---

### Third-Body Perturbations

**Effect:** Gravitational pull from Moon and Sun

**Consequences:**
- Orbital plane changes
- Eccentricity variations

**Most Significant:**
- High-altitude orbits (MEO, GEO)
- Long-term evolution

---

### Earth's Gravitational Anomalies

**Effect:** Earth's mass distribution is not uniform

**Consequences:**
- Small variations in orbital motion
- "Lumpy" gravitational field

**Impact:** Minor, but included in high-precision models

---

## Practical Applications

### Calculating Orbital Period

```javascript
const { parseTLE } = require('tle-parser');

const tle = parseTLE(tleData);
const meanMotion = parseFloat(tle.meanMotion);  // rev/day

const periodMinutes = 1440 / meanMotion;
const periodHours = 24 / meanMotion;

console.log(`Period: ${periodMinutes.toFixed(2)} minutes`);
console.log(`Period: ${periodHours.toFixed(2)} hours`);
```

---

### Determining Orbit Type

```javascript
function getOrbitType(tle) {
  const meanMotion = parseFloat(tle.meanMotion);
  const inclination = parseFloat(tle.inclination);
  const eccentricity = parseFloat('0.' + tle.eccentricity);

  if (meanMotion > 11) {
    return 'LEO';
  } else if (Math.abs(meanMotion - 1.0) < 0.01) {
    if (inclination < 5 && eccentricity < 0.01) {
      return 'GEO';
    } else {
      return 'GSO';
    }
  } else if (meanMotion > 1.5) {
    return 'MEO';
  } else {
    return 'HEO';
  }
}
```

---

### Checking Ground Coverage

```javascript
function canSeeFromLatitude(tle, stationLatitude) {
  const inclination = parseFloat(tle.inclination);

  // Satellite passes over latitudes ≤ inclination
  return Math.abs(stationLatitude) <= inclination;
}

// Example: Can see ISS from 40°N?
const canSee = canSeeFromLatitude(issTLE, 40);
console.log('Can see ISS:', canSee);  // true (ISS: 51.6° inclination)
```

---

### Estimating Altitude (Simplified)

```javascript
function estimateAltitude(tle) {
  const meanMotion = parseFloat(tle.meanMotion);  // rev/day

  // Convert to rad/s
  const n = meanMotion * 2 * Math.PI / 86400;

  // Earth's gravitational parameter (km³/s²)
  const mu = 398600.4418;

  // Kepler's third law: a = (mu / n²)^(1/3)
  const semiMajorAxis = Math.pow(mu / (n * n), 1/3);

  // Subtract Earth's radius
  const earthRadius = 6371;  // km
  const altitude = semiMajorAxis - earthRadius;

  return altitude.toFixed(2);
}
```

---

## Further Reading

### Books

- "Fundamentals of Astrodynamics" by Bate, Mueller, and White
- "Orbital Mechanics for Engineering Students" by Howard Curtis
- "Satellite Orbits: Models, Methods and Applications" by Montenbruck and Gill

### Online Resources

- **Celestrak**: https://celestrak.org/ - TLE data and tutorials
- **Space-Track**: https://www.space-track.org/ - Official TLE source
- **NASA**: https://spaceflight.nasa.gov/ - Orbital mechanics tutorials
- **AGI**: https://www.agi.com/ - STK satellite toolkit

### Related Topics

- **SGP4/SDP4**: Simplified perturbations models
- **Kepler's Laws**: Foundation of orbital mechanics
- **Coordinate Systems**: ECI, ECEF, geodetic
- **Orbit Determination**: How TLEs are generated
- **Conjunction Analysis**: Collision avoidance

---

## See Also

- [TLE Format Guide](TLE_FORMAT.md) - Detailed field descriptions
- [API Reference](../api/API_REFERENCE.md) - Parser functions
- [Usage Examples](USAGE_EXAMPLES.md) - Practical code examples
- [FAQ](../FAQ.md) - Common questions
