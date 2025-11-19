# React Hooks for TLE Parser

This package provides React hooks for working with TLE (Two-Line Element) data in React applications.

## Installation

```bash
npm install tle-parser
# or
yarn add tle-parser
```

## Hooks

### `useTLEParser`

Parse TLE data with React state management.

```tsx
import { useTLEParser } from './useTLE';

function TLEParserComponent() {
  const { parse, data, error, loading, reset } = useTLEParser();

  const handleParse = () => {
    const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
    const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";
    const line0 = "ISS (ZARYA)";

    parse(line1, line2, line0);
  };

  if (loading) return <div>Parsing...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <button onClick={handleParse}>Parse TLE</button>;

  return (
    <div>
      <h3>{data.satelliteName}</h3>
      <p>Satellite Number: {data.satelliteNumber}</p>
      <p>Inclination: {data.inclination}°</p>
      <p>Mean Motion: {data.meanMotion} rev/day</p>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### `useSatellitePosition`

Calculate satellite position at a specific time.

```tsx
import { useSatellitePosition } from './useTLE';

function SatellitePositionComponent({ tle }) {
  const { position, loading, error, updatePosition } = useSatellitePosition(tle);

  if (loading) return <div>Calculating position...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!position) return null;

  return (
    <div>
      <h3>Current Position</h3>
      <p>Latitude: {position.latitude.toFixed(4)}°</p>
      <p>Longitude: {position.longitude.toFixed(4)}°</p>
      <p>Altitude: {position.altitude.toFixed(2)} km</p>
      <button onClick={() => updatePosition(new Date())}>
        Update Position
      </button>
    </div>
  );
}
```

### `useSatelliteTracker`

Real-time satellite tracking with automatic position updates.

```tsx
import { useSatelliteTracker } from './useTLE';

function SatelliteTrackerComponent({ tle }) {
  const {
    position,
    lookAngles,
    isVisible,
    isTracking,
    start,
    stop,
    error
  } = useSatelliteTracker(tle, {
    updateInterval: 1000, // Update every second
    groundLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0
    }
  });

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Satellite Tracker</h3>

      <div>
        <button onClick={isTracking ? stop : start}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {position && (
        <div>
          <h4>Position</h4>
          <p>Latitude: {position.latitude.toFixed(4)}°</p>
          <p>Longitude: {position.longitude.toFixed(4)}°</p>
          <p>Altitude: {position.altitude.toFixed(2)} km</p>
        </div>
      )}

      {lookAngles && (
        <div>
          <h4>Look Angles</h4>
          <p>Azimuth: {lookAngles.azimuth.toFixed(2)}°</p>
          <p>Elevation: {lookAngles.elevation.toFixed(2)}°</p>
          <p>Range: {lookAngles.range.toFixed(2)} km</p>
          <p>
            Status: {isVisible ? '✅ Visible' : '❌ Below Horizon'}
          </p>
        </div>
      )}
    </div>
  );
}
```

### `useVisibilityWindow`

Calculate satellite visibility windows for a ground location.

```tsx
import { useVisibilityWindow } from './useTLE';

function VisibilityWindowComponent({ tle }) {
  const groundLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    altitude: 0
  };

  const { windows, loading, error, recalculate } = useVisibilityWindow(
    tle,
    groundLocation,
    { startDate: new Date(), days: 7 }
  );

  if (loading) return <div>Calculating visibility windows...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Visibility Windows (Next 7 Days)</h3>
      <button onClick={recalculate}>Recalculate</button>

      <ul>
        {windows.map((window, index) => (
          <li key={index}>
            <strong>Pass {index + 1}</strong>
            <br />
            Rise: {window.rise.toLocaleString()}
            <br />
            Set: {window.set.toLocaleString()}
            <br />
            Max Elevation: {window.maxElevation.toFixed(2)}°
            <br />
            Duration: {((window.set.getTime() - window.rise.getTime()) / 60000).toFixed(1)} minutes
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### `useTLEFetch`

Fetch TLE data from various sources (CelesTrak, Space-Track, etc.).

```tsx
import { useTLEFetch } from './useTLE';

function TLEFetchComponent() {
  const { data, loading, error, refetch } = useTLEFetch('celestrak', {
    group: 'stations',
    satellites: ['ISS']
  });

  if (loading) return <div>Fetching TLE data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Fetched TLE Data</h3>
      <button onClick={refetch}>Refresh</button>

      {data && data.map((tle, index) => (
        <div key={index}>
          <h4>{tle.satelliteName}</h4>
          <p>Satellite Number: {tle.satelliteNumber}</p>
          <p>Epoch: {tle.epochDate.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### `useTLECache`

Manage cached TLE data to reduce API calls.

```tsx
import { useTLECache, useTLEParser } from './useTLE';

function CachedTLEComponent() {
  const cache = useTLECache({ ttl: 3600000 }); // 1 hour TTL
  const { parse, data } = useTLEParser();

  const handleParse = (satelliteId: string) => {
    // Check cache first
    const cached = cache.get(satelliteId);
    if (cached) {
      console.log('Using cached TLE data');
      return cached;
    }

    // Parse and cache
    const line1 = "...";
    const line2 = "...";
    parse(line1, line2);

    if (data) {
      cache.set(satelliteId, data);
    }
  };

  return <div>...</div>;
}
```

### `useBatchTLEParser`

Parse multiple TLEs at once.

```tsx
import { useBatchTLEParser } from './useTLE';

function BatchTLEParserComponent() {
  const { parse, data, errors, loading } = useBatchTLEParser();

  const handleBatchParse = () => {
    const tles = [
      {
        line1: "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990",
        line2: "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018",
        line0: "ISS (ZARYA)"
      },
      {
        line1: "1 43013U 17073A   21001.00000000  .00001234  00000-0  56789-4 0  9999",
        line2: "2 43013  97.5000 123.4567 0012345  67.8901 292.1234 15.12345678901234",
        line0: "SENTINEL-5P"
      }
    ];

    parse(tles);
  };

  if (loading) return <div>Parsing TLEs...</div>;

  return (
    <div>
      <button onClick={handleBatchParse}>Parse Batch</button>

      {errors.length > 0 && (
        <div>
          <h4>Errors ({errors.length})</h4>
          {errors.map((err, i) => (
            <p key={i}>{err.message}</p>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div>
          <h4>Parsed TLEs ({data.length})</h4>
          {data.map((tle, i) => (
            <div key={i}>
              <p>{tle.satelliteName} - {tle.satelliteNumber}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### `useDebouncedTLEParser`

Parse TLE data with debouncing - useful for parsing user input.

```tsx
import { useDebouncedTLEParser } from './useTLE';
import { useState } from 'react';

function DebouncedTLEInput() {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const { data, error, loading, parse } = useDebouncedTLEParser(500);

  const handleLine1Change = (e) => {
    const value = e.target.value;
    setLine1(value);
    parse(value, line2);
  };

  const handleLine2Change = (e) => {
    const value = e.target.value;
    setLine2(value);
    parse(line1, value);
  };

  return (
    <div>
      <h3>TLE Input (Debounced)</h3>

      <textarea
        placeholder="Line 1"
        value={line1}
        onChange={handleLine1Change}
      />

      <textarea
        placeholder="Line 2"
        value={line2}
        onChange={handleLine2Change}
      />

      {loading && <div>Parsing...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <div>
          <h4>✅ Valid TLE</h4>
          <p>{data.satelliteName}</p>
        </div>
      )}
    </div>
  );
}
```

## Complete Example: ISS Tracker

Here's a complete example combining multiple hooks to create an ISS tracker:

```tsx
import React, { useState, useEffect } from 'react';
import {
  useTLEFetch,
  useSatelliteTracker,
  useVisibilityWindow
} from './useTLE';

function ISSTracker() {
  const [userLocation, setUserLocation] = useState(null);

  // Fetch ISS TLE data
  const { data: tleData, loading: fetchLoading, error: fetchError } = useTLEFetch(
    'celestrak',
    { group: 'stations', satellites: ['ISS'] }
  );

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: 0
        });
      });
    }
  }, []);

  // Track ISS in real-time
  const {
    position,
    lookAngles,
    isVisible,
    isTracking,
    start,
    stop
  } = useSatelliteTracker(
    tleData?.[0] || null,
    {
      updateInterval: 1000,
      groundLocation: userLocation
    }
  );

  // Calculate visibility windows
  const { windows } = useVisibilityWindow(
    tleData?.[0] || null,
    userLocation || { latitude: 0, longitude: 0, altitude: 0 },
    { startDate: new Date(), days: 7 }
  );

  if (fetchLoading) return <div>Loading ISS data...</div>;
  if (fetchError) return <div>Error: {fetchError.message}</div>;
  if (!tleData?.[0]) return <div>No TLE data available</div>;

  return (
    <div className="iss-tracker">
      <h1>🛰️ ISS Tracker</h1>

      <section>
        <h2>Real-Time Position</h2>
        <button onClick={isTracking ? stop : start}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>

        {position && (
          <div className="position-info">
            <p><strong>Latitude:</strong> {position.latitude.toFixed(4)}°</p>
            <p><strong>Longitude:</strong> {position.longitude.toFixed(4)}°</p>
            <p><strong>Altitude:</strong> {position.altitude.toFixed(2)} km</p>
            <p><strong>Velocity:</strong> {position.velocity.toFixed(2)} km/s</p>
          </div>
        )}

        {userLocation && lookAngles && (
          <div className="look-angles">
            <h3>From Your Location</h3>
            <p><strong>Azimuth:</strong> {lookAngles.azimuth.toFixed(2)}°</p>
            <p><strong>Elevation:</strong> {lookAngles.elevation.toFixed(2)}°</p>
            <p><strong>Range:</strong> {lookAngles.range.toFixed(2)} km</p>
            <p className={isVisible ? 'visible' : 'not-visible'}>
              {isVisible ? '✅ Currently Visible' : '❌ Below Horizon'}
            </p>
          </div>
        )}
      </section>

      {userLocation && windows.length > 0 && (
        <section>
          <h2>Upcoming Passes</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Rise Time</th>
                <th>Set Time</th>
                <th>Max Elevation</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {windows.slice(0, 10).map((window, index) => (
                <tr key={index}>
                  <td>{window.rise.toLocaleDateString()}</td>
                  <td>{window.rise.toLocaleTimeString()}</td>
                  <td>{window.set.toLocaleTimeString()}</td>
                  <td>{window.maxElevation.toFixed(1)}°</td>
                  <td>
                    {((window.set.getTime() - window.rise.getTime()) / 60000).toFixed(0)} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default ISSTracker;
```

## TypeScript Support

All hooks are fully typed with TypeScript. Import types from the main package:

```tsx
import type { ParsedTLE, GroundLocation, SatellitePosition } from 'tle-parser';
```

## Error Handling

All hooks provide error states for robust error handling:

```tsx
const { data, error, loading } = useTLEParser();

if (error) {
  // Handle error appropriately
  console.error('TLE parsing failed:', error.message);
}
```

## Performance Tips

1. **Use debounced parser** for user input to avoid excessive parsing
2. **Cache TLE data** to reduce network requests
3. **Limit tracking updates** to reasonable intervals (1-5 seconds)
4. **Stop tracking** when component unmounts or data isn't needed

## License

MIT
