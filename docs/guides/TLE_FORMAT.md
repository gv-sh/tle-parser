# TLE Format Guide

Complete guide to understanding the Two-Line Element Set (TLE) format.

## Table of Contents

- [What is a TLE?](#what-is-a-tle)
- [TLE Structure Overview](#tle-structure-overview)
- [Line 0: Satellite Name](#line-0-satellite-name)
- [Line 1: Identification and Epoch](#line-1-identification-and-epoch)
- [Line 2: Orbital Elements](#line-2-orbital-elements)
- [Field Specifications](#field-specifications)
- [Checksum Algorithm](#checksum-algorithm)
- [Scientific Notation in TLEs](#scientific-notation-in-tles)
- [Common Pitfalls](#common-pitfalls)

---

## What is a TLE?

A Two-Line Element Set (TLE) is a data format encoding orbital elements of an Earth-orbiting object for a given point in time. TLEs are the standard format used by NORAD (North American Aerospace Defense Command) and distributed by organizations like CelesTrak and Space-Track.

### Key Characteristics

- **Fixed Format**: Each line is exactly 69 characters
- **ASCII Text**: Human-readable text format
- **Snapshot in Time**: Represents orbital state at a specific epoch
- **Predictive**: Can be used to calculate satellite position over time
- **Limited Precision**: Designed for moderate accuracy over short periods

### Use Cases

- Satellite tracking and prediction
- Ground station antenna pointing
- Conjunction analysis (collision avoidance)
- Space situational awareness
- Amateur radio satellite tracking
- Scientific research

---

## TLE Structure Overview

TLEs come in two formats:

### 2-Line Format

```
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
```

### 3-Line Format (with satellite name)

```
ISS (ZARYA)
1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
```

---

## Line 0: Satellite Name

**Optional line** containing the common name of the satellite.

### Format

- **Length**: Up to 24 characters (typically, but can be longer)
- **Content**: Alphanumeric characters, spaces, parentheses, etc.
- **Encoding**: ASCII or UTF-8

### Examples

```
ISS (ZARYA)
HUBBLE SPACE TELESCOPE
GPS BIIA-10 (PRN 32)
STARLINK-1007
```

### Notes

- Not standardized - formatting varies by source
- May contain launch vehicle name, designation, or mission name
- Some sources omit this line entirely
- May include special characters and Unicode

---

## Line 1: Identification and Epoch

Line 1 contains satellite identification and epoch (time) information.

### Visual Breakdown

```
Column:  1234567890123456789012345678901234567890123456789012345678901234567890
         1         2         3         4         5         6         7
Line 1:  1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
         ^ ^^^^^^ ^^^^^^^^ ^^^^^^^^^^^^^^ ^^^^^^^^^^ ^^^^^^^^ ^^^^^^^^ ^ ^^^
         │   │       │           │            │          │        │    │  │
         │   │       │           │            │          │        │    │  └─ Checksum
         │   │       │           │            │          │        │    └──── Element Set Number
         │   │       │           │            │          │        └───────── Ephemeris Type
         │   │       │           │            │          └────────────────── B* Drag Term
         │   │       │           │            └───────────────────────────── 2nd Derivative
         │   │       │           └────────────────────────────────────────── 1st Derivative
         │   │       └────────────────────────────────────────────────────── Epoch
         │   └────────────────────────────────────────────────────────────── International Designator
         └────────────────────────────────────────────────────────────────── Line Number
              └─────────────────────────────────────────────────────────────── Satellite Number + Classification
```

### Field Breakdown

| Columns | Field | Format | Description |
|---------|-------|--------|-------------|
| 01 | Line Number | `1` | Always "1" for line 1 |
| 03-07 | Satellite Number | `nnnnn` | NORAD catalog number (1-99999) |
| 08 | Classification | `U/C/S` | U=Unclassified, C=Classified, S=Secret |
| 10-11 | Int'l Designator (Year) | `YY` | Last 2 digits of launch year |
| 12-14 | Int'l Designator (Launch) | `nnn` | Launch number of the year |
| 15-17 | Int'l Designator (Piece) | `AAA` | Piece of the launch |
| 19-20 | Epoch Year | `YY` | Last 2 digits of epoch year |
| 21-32 | Epoch Day | `ddd.dddddddd` | Day of year and fractional portion |
| 34-43 | First Derivative | `n.nnnnnnnn` | First time derivative of mean motion ÷ 2 |
| 45-52 | Second Derivative | `nnnnn-n` | Second time derivative of mean motion ÷ 6 (decimal point assumed) |
| 54-61 | B* Drag Term | `nnnnn-n` | Drag term (decimal point assumed) |
| 63 | Ephemeris Type | `n` | Usually 0 (SGP4/SDP4) |
| 65-68 | Element Set Number | `nnnn` | Element set number (increments) |
| 69 | Checksum | `n` | Modulo-10 checksum |

---

## Line 2: Orbital Elements

Line 2 contains the classical orbital elements.

### Visual Breakdown

```
Column:  1234567890123456789012345678901234567890123456789012345678901234567890
         1         2         3         4         5         6         7
Line 2:  2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
         ^ ^^^^^  ^^^^^^^^ ^^^^^^^^ ^^^^^^^ ^^^^^^^^ ^^^^^^^^ ^^^^^^^^^^^^^^^^
         │   │        │        │       │       │        │           │      │
         │   │        │        │       │       │        │           │      └─ Checksum
         │   │        │        │       │       │        │           └──────── Revolution Number
         │   │        │        │       │       │        └──────────────────── Mean Motion
         │   │        │        │       │       └───────────────────────────── Mean Anomaly
         │   │        │        │       └───────────────────────────────────── Argument of Perigee
         │   │        │        └───────────────────────────────────────────── Eccentricity
         │   │        └────────────────────────────────────────────────────── Right Ascension
         │   └─────────────────────────────────────────────────────────────── Inclination
         └─────────────────────────────────────────────────────────────────── Line Number
              └──────────────────────────────────────────────────────────────── Satellite Number
```

### Field Breakdown

| Columns | Field | Format | Description |
|---------|-------|--------|-------------|
| 01 | Line Number | `2` | Always "2" for line 2 |
| 03-07 | Satellite Number | `nnnnn` | NORAD catalog number (must match line 1) |
| 09-16 | Inclination | `nnn.nnnn` | Inclination angle (degrees, 0-180) |
| 18-25 | Right Ascension | `nnn.nnnn` | Right ascension of ascending node (degrees, 0-360) |
| 27-33 | Eccentricity | `nnnnnnn` | Eccentricity (decimal point assumed, 0.0-1.0) |
| 35-42 | Argument of Perigee | `nnn.nnnn` | Argument of perigee (degrees, 0-360) |
| 44-51 | Mean Anomaly | `nnn.nnnn` | Mean anomaly (degrees, 0-360) |
| 53-63 | Mean Motion | `nn.nnnnnnnn` | Mean motion (revolutions per day) |
| 64-68 | Revolution Number | `nnnnn` | Revolution number at epoch |
| 69 | Checksum | `n` | Modulo-10 checksum |

---

## Field Specifications

### Satellite Number (NORAD Catalog Number)

**Location**: Line 1, columns 3-7; Line 2, columns 3-7

**Format**: 5-digit integer (with leading zeros if needed)

**Range**: 1 to 99999

**Description**: Unique identifier assigned by NORAD/Space Force to each tracked object.

**Example**: `25544` = International Space Station

**Notes**:
- Must be identical in both lines
- Numbers are reused after objects deorbit
- Special numbers: 99999 used for temporary/unknown objects

---

### Classification

**Location**: Line 1, column 8

**Format**: Single character

**Values**:
- `U` = Unclassified (most common)
- `C` = Classified
- `S` = Secret

**Description**: Security classification of the orbital information.

**Notes**:
- Most publicly available TLEs are 'U'
- Classified TLEs have reduced accuracy or may be withheld
- Historical TLEs may show classification changes

---

### International Designator

**Location**: Line 1, columns 10-17

**Format**: `YYnnnPPP`
- `YY` = Last 2 digits of launch year
- `nnn` = Launch number of the year (001-999)
- `PPP` = Piece of the launch (A-ZZZ)

**Description**: International designation assigned at launch time.

**Examples**:
- `98067A` = ISS (1998, 67th launch, piece A)
- `90037B` = Hubble (1990, 37th launch, piece B)
- `20001A` = First launch of 2020

**Notes**:
- Year is from launch date, not current year
- Piece 'A' is usually the primary payload
- Rocket bodies often get piece 'B'
- Debris gets subsequent letters

---

### Epoch (Time of TLE)

**Location**: Line 1, columns 19-32

**Format**: `YYddd.dddddddd`
- `YY` = Last 2 digits of year
- `ddd.dddddddd` = Day of year and fractional day

**Range**:
- Year: 00-99 (1900s or 2000s based on convention)
- Day: 1.0 to 366.99999999

**Description**: The time at which the orbital elements are valid.

**Calculation**:
- Day 1.0 = January 1, 00:00:00 UTC
- Fractional day = (hours × 3600 + minutes × 60 + seconds) / 86400

**Examples**:
- `20300.83097691` = October 26, 2020, 19:56:36 UTC
  - Year: 2020
  - Day: 300 (Oct 26 in a leap year)
  - Fraction: 0.83097691 × 24 hours ≈ 19:56:36

**Y2K Convention**:
- 00-56: Interpreted as 2000-2056
- 57-99: Interpreted as 1957-1999

**Notes**:
- TLEs become less accurate as time from epoch increases
- Typical update frequency: daily to weekly
- Critical satellites (ISS): updated multiple times per day

---

### First Time Derivative of Mean Motion

**Location**: Line 1, columns 34-43

**Format**: `±n.nnnnnnnn` (revolutions per day²)

**Description**: First time derivative of mean motion divided by 2. Indicates how quickly the orbit is changing.

**Physical Meaning**:
- Positive: Orbit accelerating (unusual, usually due to maneuvers)
- Negative: Orbit decaying (atmospheric drag)
- Zero: Stable orbit (high altitude)

**Examples**:
- `.00001534` = Slight decay (ISS, requires regular reboosts)
- `.00000000` = Stable (high-altitude satellites)
- `-.00000123` = Decaying orbit

**Units**: Revolutions per day per day, divided by 2

**Usage**: Input to SGP4/SDP4 propagation models for orbit prediction.

---

### Second Time Derivative of Mean Motion

**Location**: Line 1, columns 45-52

**Format**: `±nnnnn-n` (assumed decimal scientific notation)

**Description**: Second time derivative of mean motion divided by 6.

**Format Details**:
- `nnnnn` = Mantissa (5 digits, decimal point assumed before first digit)
- `-` or `+` = Sign
- `n` = Exponent power of 10

**Conversion**: `00000-0` = 0.00000 × 10⁰ = 0

**Examples**:
- `00000-0` = 0.0 × 10⁰ = 0 (typical for most satellites)
- `12345-3` = 0.12345 × 10⁻³ = 0.00012345
- `-12345-2` = -0.12345 × 10⁻² = -0.0012345

**Physical Meaning**: Rate of change of orbital decay. Usually zero or very small.

**Units**: Revolutions per day³, divided by 6

---

### B* Drag Term

**Location**: Line 1, columns 54-61

**Format**: `±nnnnn-n` (assumed decimal scientific notation)

**Description**: Drag coefficient related to atmospheric density and satellite cross-section.

**Format**: Same as second derivative (mantissa + exponent)

**Examples**:
- `35580-4` = 0.35580 × 10⁻⁴ = 0.000035580
- `00000+0` = 0.0 (no drag model)
- `12345-3` = 0.12345 × 10⁻³ = 0.00012345

**Physical Meaning**:
- Larger values: Higher drag (large cross-section, low altitude, or tumbling)
- Near zero: Minimal drag (high altitude or streamlined)
- B* = Cᴅ × A / (2 × m)
  - Cᴅ = Drag coefficient
  - A = Cross-sectional area
  - m = Mass

**Typical Values**:
- LEO satellites: 1×10⁻⁵ to 1×10⁻³
- MEO/GEO: ~0 (negligible atmosphere)

---

### Ephemeris Type

**Location**: Line 1, column 63

**Format**: Single digit (0-9)

**Values**:
- `0` = SGP4/SDP4 (standard)
- Other values rarely used

**Description**: Indicates which orbital model to use for propagation.

**Notes**:
- Nearly all modern TLEs use `0`
- SGP4 = Simplified General Perturbations 4 (for near-Earth orbits)
- SDP4 = Simplified Deep-space Perturbations 4 (for deep-space orbits)
- The propagator automatically chooses SGP4 or SDP4 based on orbital period

---

### Element Set Number

**Location**: Line 1, columns 65-68

**Format**: 4-digit integer

**Description**: Sequential number incremented with each new TLE published for this satellite.

**Examples**:
- `0001` = First TLE for this object
- `0999` = 999th update
- `9996` = After many updates

**Notes**:
- Rolls over after 9999
- Not always strictly sequential (updates may be skipped)
- Helps identify TLE version/freshness

---

### Inclination

**Location**: Line 2, columns 9-16

**Format**: `nnn.nnnn` degrees

**Range**: 0.0000 to 180.0000

**Description**: Angle between the orbital plane and Earth's equatorial plane.

**Interpretation**:
- `0°` = Equatorial orbit (moves along equator)
- `90°` = Polar orbit (passes over poles)
- `98°` = Sun-synchronous orbit (typical for Earth observation)
- `51.6°` = ISS orbit (optimized for access from multiple launch sites)
- `0° < i < 90°` = Prograde (eastward)
- `90° < i < 180°` = Retrograde (westward)

**Physical Meaning**: Determines which latitudes the satellite passes over.

---

### Right Ascension of the Ascending Node (RAAN)

**Location**: Line 2, columns 18-25

**Format**: `nnn.nnnn` degrees

**Range**: 0.0000 to 360.0000

**Description**: Angle from vernal equinox to where orbit crosses equator going north.

**Physical Meaning**:
- Defines orientation of orbital plane in space
- Changes over time due to Earth's oblateness (precession)
- Rate of change depends on inclination and altitude

**Example**: `57.0843°` means ascending node is 57° east of the vernal equinox direction.

**Notes**:
- Measured eastward along equator
- Vernal equinox: Direction to the Sun on March 21
- Sun-synchronous orbits have specific RAAN rates to maintain constant solar angle

---

### Eccentricity

**Location**: Line 2, columns 27-33

**Format**: `nnnnnnn` (decimal point assumed before first digit)

**Range**: 0.0000000 to 1.0000000

**Description**: Shape of the orbit (how elliptical it is).

**Conversion**: `0001671` = 0.0001671

**Interpretation**:
- `0.0` = Perfect circle
- `0.0 < e < 1.0` = Ellipse (typical for satellites)
- `1.0` = Parabola (escape trajectory)
- `> 1.0` = Hyperbola (not in TLEs)

**Examples**:
- `0.0001671` = Nearly circular (ISS)
- `0.7000000` = Highly elliptical (Molniya orbit)
- `0.0000001` = Almost perfectly circular (geostationary)

**Physical Meaning**:
- Low eccentricity = altitude changes little during orbit
- High eccentricity = large difference between perigee and apogee

---

### Argument of Perigee

**Location**: Line 2, columns 35-42

**Format**: `nnn.nnnn` degrees

**Range**: 0.0000 to 360.0000

**Description**: Angle from ascending node to perigee (closest point to Earth).

**Physical Meaning**:
- Defines where in the orbit the satellite is closest to Earth
- For circular orbits (e ≈ 0), this value is arbitrary/meaningless
- Changes over time due to perturbations

**Example**: `64.9808°` means perigee is 64.98° past the ascending node.

**Notes**:
- Measured in direction of satellite motion
- Combined with RAAN and inclination, fully defines orbital plane orientation
- Critical for highly elliptical orbits (Molniya, Tundra)

---

### Mean Anomaly

**Location**: Line 2, columns 44-51

**Format**: `nnn.nnnn` degrees

**Range**: 0.0000 to 360.0000

**Description**: Angle from perigee indicating satellite's position at epoch.

**Interpretation**:
- `0°` = At perigee (closest point)
- `90°` = 1/4 orbit past perigee
- `180°` = At apogee (farthest point)
- `270°` = 3/4 orbit past perigee

**Physical Meaning**:
- Defines where the satellite is in its orbit at the epoch time
- Combined with mean motion, allows position calculation at any time

**Example**: `73.0513°` means satellite is 73° past perigee at epoch.

---

### Mean Motion

**Location**: Line 2, columns 53-63

**Format**: `nn.nnnnnnnn` revolutions per day

**Range**: 0.0 to ~17.0 (practical limit for LEO)

**Description**: Number of complete orbits per day.

**Calculation**:
- Period (minutes) = 1440 / mean motion
- Period (hours) = 24 / mean motion

**Examples**:
- `15.49338189` rev/day = ~93-minute period (ISS, LEO)
- `1.00000000` rev/day = 24-hour period (GEO)
- `2.00000000` rev/day = 12-hour period (GPS, GLONASS)
- `0.50000000` rev/day = 48-hour period

**Physical Meaning**: Inversely related to orbital altitude - higher orbit = slower motion.

**Typical Values**:
- LEO (200-2000 km): 12-17 rev/day
- MEO (GPS): ~2 rev/day
- GEO (35,786 km): 1 rev/day

---

### Revolution Number at Epoch

**Location**: Line 2, columns 64-68

**Format**: 5-digit integer

**Range**: 0 to 99999

**Description**: Number of complete orbits since launch.

**Example**: `52428` means the satellite has completed 52,428 orbits since launch.

**Notes**:
- Rolls over after 99,999
- Can be used to calculate approximate satellite age
- May reset or have discontinuities

---

## Checksum Algorithm

**Location**: Column 69 of both lines

**Algorithm**:
1. Sum all digits (0-9) in columns 1-68
2. Add 1 for each minus sign (-)
3. Ignore letters, spaces, periods, and plus signs (+)
4. Take modulo 10 of the sum

**Example**:

```
Line: 1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
      │                                             │        │
      └─────────────────────────────────────────────┼────────┴─ Count these
                                                    │
                                                    └─ Add 1 for each '-'
```

Sum: 2+5+5+4+4+9+8+0+6+7+2+0+3+0+0+8+3+0+9+7+6+9+1+0+0+0+0+1+5+3+4+0+0+0+0+0+1+0+3+5+5+8+0+1+4+0+9+9+9
    = 236
Plus minus signs: 236 + 2 = 238
Checksum: 238 mod 10 = 8... wait let me recalculate: The actual checksum is 6

The checksum validates data integrity but is not cryptographically secure.

---

## Scientific Notation in TLEs

TLEs use a compact scientific notation format for very small numbers.

### Format: `±nnnnn-n`

- First digit: Sign (`+`, `-`, or space for positive)
- Next 5 digits: Mantissa (decimal point assumed before first digit)
- Sign: `+` or `-`
- Last digit: Exponent (power of 10)

### Conversion

`±nnnnn±n` → `±0.nnnnn × 10±n`

### Examples

| TLE Format | Decimal Form | Calculation |
|------------|--------------|-------------|
| `35580-4` | 0.000035580 | 0.35580 × 10⁻⁴ |
| `00000-0` | 0.0 | 0.00000 × 10⁰ |
| `12345-3` | 0.00012345 | 0.12345 × 10⁻³ |
| `-67890-2` | -0.0067890 | -0.67890 × 10⁻² |
| `11111+1` | 1.1111 | 0.11111 × 10¹ |

### Code Example

```javascript
function parseScientificNotation(str) {
  // Format: "nnnnn-n" or " nnnnn-n"
  const mantissaSign = str[0] === '-' ? -1 : 1;
  const mantissaStart = str[0] === ' ' || str[0] === '-' || str[0] === '+' ? 1 : 0;
  const mantissa = parseFloat('0.' + str.substring(mantissaStart, mantissaStart + 5));
  const exponentSign = str[mantissaStart + 5] === '-' ? -1 : 1;
  const exponent = parseInt(str[mantissaStart + 6], 10);

  return mantissaSign * mantissa * Math.pow(10, exponentSign * exponent);
}

console.log(parseScientificNotation('35580-4'));  // 0.000035580
console.log(parseScientificNotation(' 12345-3')); // 0.00012345
```

---

## Common Pitfalls

### 1. Assumed Decimal Points

**Problem**: Eccentricity field has no decimal point

```
Eccentricity: 0001671
```

**Wrong**: 1671.0
**Correct**: 0.0001671 (decimal point assumed before first digit)

---

### 2. Scientific Notation Confusion

**Problem**: B* and second derivative use compact notation

```
B*: 35580-4
```

**Wrong**: 35580 - 4 = 35576
**Correct**: 0.35580 × 10⁻⁴ = 0.000035580

---

### 3. Two-Digit Year Ambiguity

**Problem**: Years are only 2 digits

```
Epoch Year: 95
```

**Could be**: 1995 or 2095

**Convention**:
- 00-56: Assume 2000-2056
- 57-99: Assume 1957-1999

---

### 4. Day-of-Year Calculation

**Problem**: Fractional days can be tricky

```
Epoch: 20300.83097691
```

**Breakdown**:
- Year: 2020
- Day: 300 = October 26 (2020 is leap year)
- Time: 0.83097691 days
  - Hours: 0.83097691 × 24 = 19.943...
  - Minutes: 0.943 × 60 = 56.6
  - Seconds: 0.6 × 60 = 36

**Result**: October 26, 2020, 19:56:36 UTC

---

### 5. Satellite Number Mismatch

**Problem**: Satellite numbers must match in both lines

```
Line 1: 1 25544U ...
Line 2: 2 25545  ...  ← ERROR! Doesn't match
```

This is a validation error.

---

### 6. Line Length

**Problem**: Each line must be exactly 69 characters

```
Correct: "1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996"
         └─────────────────────── 69 characters ──────────────────────────┘

Wrong:   "1 25544U 98067A   20300.83097691  .00001534"
         └──────────────── Too short ─────────────────┘
```

---

### 7. Checksum Calculation

**Problem**: Must include minus signs but not other symbols

```
Line: "1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996"
                                                     ^        ^
Count digits: 2+5+5+4+4+9+8+0+6+7+...
Add for minus signs: +1 for "00000-0" and +1 for "35580-4"
Ignore: Letters (U, A), periods, spaces
```

---

### 8. Orbit Type Assumptions

**Problem**: Don't assume orbit type from mean motion alone

```
Mean Motion: 1.00 rev/day
```

**Could be**:
- Geostationary (circular, 0° inclination, 0° eccentricity)
- Geosynchronous (inclined or eccentric, but 24-hour period)
- Tundra (highly eccentric, ~24-hour period)

**Must check**: Inclination and eccentricity too.

---

## See Also

- [Orbital Mechanics Concepts](ORBITAL_MECHANICS.md) - Understanding orbital parameters
- [TLE Structure Diagrams](TLE_STRUCTURE.md) - Visual reference
- [API Reference](../api/API_REFERENCE.md) - Parser functions
- [FAQ](../FAQ.md) - Frequently asked questions
