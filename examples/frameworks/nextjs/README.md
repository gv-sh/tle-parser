# Next.js API Routes for TLE Parser

Next.js App Router API examples for TLE parsing and satellite tracking.

## Installation

```bash
npm install tle-parser
```

## API Routes

Place these files in your `app/api/tle/` directory:

- `parse/route.ts` - Parse TLE data
- `track/route.ts` - Track satellite position

## Usage

### Client Component Example

```tsx
'use client';

import { useState } from 'react';

export default function TLEParser() {
  const [result, setResult] = useState(null);

  const handleParse = async () => {
    const response = await fetch('/api/tle/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line1: "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990",
        line2: "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018",
        line0: "ISS (ZARYA)"
      })
    });

    const data = await response.json();
    setResult(data.data);
  };

  return (
    <div>
      <button onClick={handleParse}>Parse TLE</button>
      {result && (
        <div>
          <h3>{result.satelliteName}</h3>
          <p>Satellite Number: {result.satelliteNumber}</p>
        </div>
      )}
    </div>
  );
}
```

### Server Component Example

```tsx
// app/satellites/[id]/page.tsx
import { parseTLE } from 'tle-parser';

export default async function SatellitePage({ params }: { params: { id: string } }) {
  // Fetch TLE data server-side
  const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
  const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";
  const tle = parseTLE(line1, line2, "ISS");

  return (
    <div>
      <h1>{tle.satelliteName}</h1>
      <p>Satellite Number: {tle.satelliteNumber}</p>
      <p>Inclination: {tle.inclination}°</p>
    </div>
  );
}
```

### With React Hooks

```tsx
'use client';

import { useTLEParser } from '@/hooks/useTLE'; // Use React hooks from examples/frameworks/react

export default function ISSTracker() {
  const { parse, data, loading, error } = useTLEParser();

  // Use the hooks as shown in React examples
  return <div>...</div>;
}
```

## License

MIT
