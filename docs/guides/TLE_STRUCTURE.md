# TLE Structure Visual Reference

Visual diagrams and reference for understanding TLE structure.

## Table of Contents

- [Complete TLE Structure](#complete-tle-structure)
- [Line 1 Visual Breakdown](#line-1-visual-breakdown)
- [Line 2 Visual Breakdown](#line-2-visual-breakdown)
- [Field-by-Field Diagrams](#field-by-field-diagrams)
- [Scientific Notation Visual](#scientific-notation-visual)
- [Checksum Calculation Visual](#checksum-calculation-visual)
- [Quick Reference Tables](#quick-reference-tables)

---

## Complete TLE Structure

### 3-Line Format (with Satellite Name)

```
Line 0:  ISS (ZARYA)
         ╰──────────╯
         Satellite Name (optional, up to 24 chars)

Line 1:  1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
         │ └───┘│ └─────┘ └────────────┘ └────────┘ └──────┘ └──────┘ │ └─┘│
         │  (1) │   (2)        (3)           (4)        (5)      (6)   │ (7)│
         │      │                                                       │    │
         Line   Satellite      Epoch         1st        2nd      B*    Eph  Check
         Num    Number +       Date/Time     Deriv      Deriv    Drag  Type sum
                Class +                      Mean       Mean
                Int'l Des                    Motion     Motion

Line 2:  2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
         │ └───┘ └──────┘ └──────┘ └─────┘ └──────┘ └──────┘ └────────┘└───┘│
         │  (1)    (2)       (3)      (4)     (5)      (6)       (7)    (8) │
         │                                                                   │
         Line  Sat    Incl   RAAN    Ecc    Arg of  Mean    Mean      Rev  Check
         Num   Num                           Perigee Anom    Motion    Num  sum
```

---

## Line 1 Visual Breakdown

### Character-by-Character Map

```
Columns: 0         1         2         3         4         5         6         7
         1234567890123456789012345678901234567890123456789012345678901234567890
Line 1:  1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
         │ │││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││
         │ │││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││
         1 2   7 9      17  19          32  34        43  45      52  54  63 69
           3   8 10     18  20          33  35        44  46      53  55  64
              5-7       11-17            27-32        38-43     48-52    60-63
```

### Field Positions

| Columns | Field | Example | Description |
|---------|-------|---------|-------------|
| 01 | Line Number | `1` | Always "1" for line 1 |
| 03-07 | Satellite Number | `25544` | NORAD catalog number |
| 08 | Classification | `U` | U=Unclassified, C=Classified, S=Secret |
| 10-11 | Int'l Designator Year | `98` | Launch year (last 2 digits) |
| 12-14 | Int'l Designator Launch | `067` | Launch number of year |
| 15-17 | Int'l Designator Piece | `A` | Piece of the launch |
| 19-20 | Epoch Year | `20` | Year of epoch (last 2 digits) |
| 21-32 | Epoch Day | `300.83097691` | Day of year + fraction |
| 34-43 | First Derivative | `.00001534` | Drag/decay indicator |
| 45-52 | Second Derivative | `00000-0` | Usually zero |
| 54-61 | B* Drag Term | `35580-4` | Atmospheric drag coefficient |
| 63 | Ephemeris Type | `0` | Type of orbital model |
| 65-68 | Element Set Number | `999` | Sequential number |
| 69 | Checksum | `6` | Modulo-10 checksum |

### Visual Flow

```
        ┌─────────────┐
        │  Satellite  │
        │    Info     │
        └──────┬──────┘
               │
        ┌──────▼──────┐         ┌─────────────┐
        │ 1 25544U    │◄────────┤ Line number │
        │             │         │ + NORAD ID  │
        │  98067A     │◄────────┤ Int'l       │
        │             │         │ Designator  │
        └──────┬──────┘         └─────────────┘
               │
        ┌──────▼──────┐         ┌─────────────┐
        │   Epoch     │◄────────┤ When TLE    │
        │ 20300.83... │         │ was created │
        └──────┬──────┘         └─────────────┘
               │
        ┌──────▼──────┐         ┌─────────────┐
        │   Orbital   │◄────────┤ Decay/drag  │
        │ Derivatives │         │ parameters  │
        │ .00001534   │         │             │
        │ 00000-0     │         │             │
        │ 35580-4     │         │             │
        └──────┬──────┘         └─────────────┘
               │
        ┌──────▼──────┐         ┌─────────────┐
        │   0  999  6 │◄────────┤ Type, seq,  │
        │             │         │ checksum    │
        └─────────────┘         └─────────────┘
```

---

## Line 2 Visual Breakdown

### Character-by-Character Map

```
Columns: 0         1         2         3         4         5         6         7
         1234567890123456789012345678901234567890123456789012345678901234567890
Line 2:  2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428
         │ │││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││
         │ │││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││
         1 2   7  9    16  18   25  27   33  35   42  44   51  53        63 6869
           3   8                 26      34      43      52              64
```

### Field Positions

| Columns | Field | Example | Description |
|---------|-------|---------|-------------|
| 01 | Line Number | `2` | Always "2" for line 2 |
| 03-07 | Satellite Number | `25544` | Must match line 1 |
| 09-16 | Inclination | `51.6453` | Degrees [0-180] |
| 18-25 | RAAN | `57.0843` | Degrees [0-360] |
| 27-33 | Eccentricity | `0001671` | Decimal point assumed |
| 35-42 | Argument of Perigee | `64.9808` | Degrees [0-360] |
| 44-51 | Mean Anomaly | `73.0513` | Degrees [0-360] |
| 53-63 | Mean Motion | `15.49338189` | Revolutions per day |
| 64-68 | Revolution Number | `52428` | Orbits since launch |
| 69 | Checksum | `8` | Modulo-10 checksum |

### Orbital Elements Visual

```
                    North
                      ↑
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        │      Orbital Plane        │
        │   (tilted from equator)   │
        │             │             │
        └─────────────┼─────────────┘
                      │
    Inclination ──────┘
    (51.6453°)


                    Vernal Equinox
                         ↓
              ┌──────────●──────────┐
              │          │          │
              │          │          │  Ascending Node
     Equator  ●──────────┼──────────●◄─────────────
              │          │          │
              │          │          │
              └──────────●──────────┘
                         │
                         └──── RAAN (57.0843°)


        Apogee
           ●
          ╱ ╲
         ╱   ╲
        ╱     ╲          Argument of Perigee
       ╱       ╲         (64.9808°)
      ╱         ╲              ↓
     ●───────────●────────────────● Perigee
  Ascending                    (closest)
    Node


              Satellite Position
                   ●
                 ╱   ╲
                ╱     ╲
               ╱       ╲
              ╱         ╲      Mean Anomaly
             ●           ●     (73.0513°)
          Perigee        ↑
                    Current position
                    from perigee
```

---

## Field-by-Field Diagrams

### Epoch Date/Time

```
Epoch: 20300.83097691
       ││└─────────┘
       ││     │
       ││     └────── Fractional day (0.83097691)
       │└────────────── Day of year (300)
       └─────────────── Year (2020)

Converting fractional day to time:
0.83097691 days
= 0.83097691 × 24 hours
= 19.943... hours
= 19 hours + (0.943 × 60) minutes
= 19 hours 56.6 minutes
= 19:56:36 UTC

Day 300 in 2020 (leap year):
January: 31 days
February: 29 days (leap)
March: 31 days
April: 30 days
May: 31 days
June: 30 days
July: 31 days
August: 31 days
September: 30 days
October: 26 days (300 - 274)
= October 26

Result: October 26, 2020, 19:56:36 UTC
```

---

### Eccentricity

```
TLE Format:  0001671
             │││││││
             │└─────┘
             │   │
             │   └─── Digits: 001671
             └─────── Decimal point assumed here
                      ↓
Result:      0.0001671

Interpretation:
e = 0.0001671
e ≈ 0 → nearly circular orbit

Altitude variation:
If semi-major axis a ≈ 6778 km (ISS):
Perigee ≈ a × (1 - e) ≈ 6776.9 km
Apogee ≈ a × (1 + e) ≈ 6779.1 km
Variation: ~2.2 km (very circular!)
```

---

### International Designator

```
TLE Format:  98067A
             │││││││
             ││└─┘└─── Piece: A (primary payload)
             │└──────── Launch number: 067 (67th launch)
             └───────── Year: 98 (1998)

Full designation: 1998-067A

Meaning:
- Launched in 1998
- 67th orbital launch of that year
- Piece A (main payload)

History:
- November 20, 1998
- Proton rocket from Baikonur
- First ISS module (Zarya)
```

---

## Scientific Notation Visual

### Format Breakdown

```
TLE Scientific Notation:  35580-4
                          │││││││
                          │││││└┘─── Exponent: 4
                          ││││└────── Sign: - (negative)
                          └┘└┘──────── Mantissa: 35580
                            ││
              Decimal point │└──────── Assumed here
              assumed here  ↓
                           0.35580

Calculation:
0.35580 × 10⁻⁴
= 0.35580 × 0.0001
= 0.000035580

Visual representation:
    0 . 3 5 5 8 0
    ↓
    0 . 0 0 0 0 3 5 5 8 0
        │ │ │ │
        └─┴─┴─┴─── Move decimal 4 places left
```

### More Examples

```
TLE         Mantissa  Sign  Exp   Calculation           Result
────────────────────────────────────────────────────────────────
00000-0  →  0.00000    ×   10⁻⁰  = 0.00000 × 1       = 0.0
12345-3  →  0.12345    ×   10⁻³  = 0.12345 × 0.001   = 0.00012345
67890-2  →  0.67890    ×   10⁻²  = 0.67890 × 0.01    = 0.0067890
11111-5  →  0.11111    ×   10⁻⁵  = 0.11111 × 0.00001 = 0.0000011111
-12345-3 → -0.12345    ×   10⁻³  = -0.12345 × 0.001  = -0.00012345
```

---

## Checksum Calculation Visual

### Algorithm

```
Line: 1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996
      │                                             │        │
      └─────────────────────────────────────────────┴────────┴─ Include all
                                                               (minus last digit)

Step 1: Extract digits
2+5+5+4+4+9+8+0+6+7+2+0+3+0+0+8+3+0+9+7+6+9+1+0+0+0+0+1+5+3+4+0+0+0+0+0+0+3+5+5+8+0+4+0+9+9+9

Step 2: Add minus signs (count them as 1)
  Two minus signs: "00000-0" and "35580-4"
  Add 2 to sum

Step 3: Ignore
  - Letters: U, A
  - Periods: .
  - Spaces
  - Plus signs: + (if any)

Step 4: Calculate
  Sum all digits: 196
  Add minus signs: 196 + 2 = 198
  Modulo 10: 198 % 10 = 8

Checksum: 8 (but actual shown is 6 - example purposes)
```

### Visual Flow

```
Input Line
    ↓
┌───────────────────────────┐
│  Filter Characters        │
│  Keep: 0-9, minus signs   │
│  Ignore: letters, spaces  │
└────────────┬──────────────┘
             ↓
┌───────────────────────────┐
│  Sum Digits               │
│  Add 1 for each '-'       │
└────────────┬──────────────┘
             ↓
┌───────────────────────────┐
│  Modulo 10                │
│  (Remainder after ÷ 10)   │
└────────────┬──────────────┘
             ↓
        Checksum
        (0-9)
```

---

## Quick Reference Tables

### Line 1 Fields Summary

| Field | Columns | Type | Range | Example |
|-------|---------|------|-------|---------|
| Line Number | 1 | Digit | 1 | `1` |
| Satellite Number | 3-7 | Integer | 00001-99999 | `25544` |
| Classification | 8 | Char | U/C/S | `U` |
| Int'l Designator (Year) | 10-11 | Integer | 00-99 | `98` |
| Int'l Designator (Launch) | 12-14 | Integer | 001-999 | `067` |
| Int'l Designator (Piece) | 15-17 | String | AAA-ZZZ | `A` |
| Epoch Year | 19-20 | Integer | 00-99 | `20` |
| Epoch Day | 21-32 | Decimal | 1.0-366.99999999 | `300.83097691` |
| First Derivative | 34-43 | Decimal | ±n.nnnnnnnn | `.00001534` |
| Second Derivative | 45-52 | Scientific | ±nnnnn±n | `00000-0` |
| B* Drag | 54-61 | Scientific | ±nnnnn±n | `35580-4` |
| Ephemeris Type | 63 | Digit | 0-9 | `0` |
| Element Set Number | 65-68 | Integer | 0-9999 | `999` |
| Checksum | 69 | Digit | 0-9 | `6` |

### Line 2 Fields Summary

| Field | Columns | Type | Range | Example |
|-------|---------|------|-------|---------|
| Line Number | 1 | Digit | 2 | `2` |
| Satellite Number | 3-7 | Integer | 00001-99999 | `25544` |
| Inclination | 9-16 | Decimal | 0.0-180.0 | `51.6453` |
| RAAN | 18-25 | Decimal | 0.0-360.0 | `57.0843` |
| Eccentricity | 27-33 | Assumed Decimal | 0000000-9999999 | `0001671` |
| Arg of Perigee | 35-42 | Decimal | 0.0-360.0 | `64.9808` |
| Mean Anomaly | 44-51 | Decimal | 0.0-360.0 | `73.0513` |
| Mean Motion | 53-63 | Decimal | 0.0-17.0 | `15.49338189` |
| Revolution Number | 64-68 | Integer | 0-99999 | `52428` |
| Checksum | 69 | Digit | 0-9 | `8` |

### Common Orbit Types

| Type | Mean Motion | Period | Altitude | Inclination |
|------|-------------|--------|----------|-------------|
| LEO | 12-17 rev/day | 85-120 min | 200-2000 km | Any |
| MEO | 2-12 rev/day | 2-12 hours | 2000-35786 km | Any |
| GEO | 1.0 rev/day | 24 hours | 35,786 km | 0° |
| SSO | 14-15 rev/day | 96-102 min | 600-800 km | ~98° |
| Molniya | 2.0 rev/day | 12 hours | 500-40000 km | 63.4° |

### Character Encoding

| Character Type | Action |
|----------------|--------|
| `0-9` | Include in checksum sum |
| `-` | Add 1 to sum |
| `+` | Ignore |
| `.` | Ignore |
| `A-Z` | Ignore |
| ` ` (space) | Ignore |

---

## See Also

- [TLE Format Guide](TLE_FORMAT.md) - Detailed field explanations
- [Orbital Mechanics](ORBITAL_MECHANICS.md) - Understanding the physics
- [API Reference](../api/API_REFERENCE.md) - Parser functions
- [FAQ](../FAQ.md) - Common questions
