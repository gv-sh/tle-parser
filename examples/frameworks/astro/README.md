# Astro Components for TLE Parser

Astro component examples for TLE parsing with server-side rendering and client-side interactivity.

## Installation

```bash
npm install tle-parser
```

## Usage

```astro
---
// pages/satellite-tracker.astro
import TLETracker from '../components/TLETracker.astro';
---

<html>
  <head>
    <title>Satellite Tracker</title>
  </head>
  <body>
    <TLETracker />
  </body>
</html>
```

## Astro Islands Pattern

The TLETracker component uses Astro's islands architecture:
- Server-side TLE parsing for initial data
- Client-side JavaScript for real-time updates

## License

MIT
