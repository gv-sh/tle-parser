# Svelte Stores for TLE Parser

Svelte stores for reactive TLE (Two-Line Element) satellite data management.

## Installation

```bash
npm install tle-parser
```

## Usage

### Basic TLE Parsing

```svelte
<script>
import { createTLEParser } from './tleStores';

const parser = createTLEParser();

function handleParse() {
  const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
  const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";
  parser.parse(line1, line2, "ISS (ZARYA)");
}
</script>

<button on:click={handleParse} disabled={$parser.loading}>
  {$parser.loading ? 'Parsing...' : 'Parse TLE'}
</button>

{#if $parser.error}
  <div class="error">{$parser.error.message}</div>
{/if}

{#if $parser.data}
  <div>
    <h3>{$parser.data.satelliteName}</h3>
    <p>Satellite Number: {$parser.data.satelliteNumber}</p>
    <p>Inclination: {$parser.data.inclination}°</p>
  </div>
{/if}
```

### Real-Time Satellite Tracking

```svelte
<script>
import { onDestroy } from 'svelte';
import { createSatelliteTracker } from './tleStores';

let tleData = null; // Set to parsed TLE
const groundLocation = {
  latitude: 40.7128,
  longitude: -74.0060,
  altitude: 0
};

const tracker = createSatelliteTracker(tleData, groundLocation, 1000);

onDestroy(() => {
  tracker.destroy();
});
</script>

<button on:click={$tracker.isTracking ? tracker.stop : tracker.start}>
  {$tracker.isTracking ? 'Stop' : 'Start'} Tracking
</button>

{#if $tracker.position}
  <div>
    <h3>Current Position</h3>
    <p>Latitude: {$tracker.position.latitude.toFixed(4)}°</p>
    <p>Longitude: {$tracker.position.longitude.toFixed(4)}°</p>
    <p>Altitude: {$tracker.position.altitude.toFixed(2)} km</p>
  </div>
{/if}

{#if $tracker.lookAngles}
  <div>
    <h3>Look Angles</h3>
    <p>Azimuth: {$tracker.lookAngles.azimuth.toFixed(2)}°</p>
    <p>Elevation: {$tracker.lookAngles.elevation.toFixed(2)}°</p>
    <p class:visible={$tracker.isVisible} class:not-visible={!$tracker.isVisible}>
      {$tracker.isVisible ? '✅ Visible' : '❌ Below Horizon'}
    </p>
  </div>
{/if}

<style>
.visible { color: green; }
.not-visible { color: red; }
</style>
```

### Fetching TLE Data

```svelte
<script>
import { createTLEFetcher } from './tleStores';

const fetcher = createTLEFetcher('celestrak', {
  group: 'stations',
  satellites: ['ISS']
});
</script>

<button on:click={fetcher.refetch} disabled={$fetcher.loading}>
  {$fetcher.loading ? 'Loading...' : 'Refresh'}
</button>

{#if $fetcher.data}
  {#each $fetcher.data as tle}
    <div>
      <h4>{tle.satelliteName}</h4>
      <p>Satellite #: {tle.satelliteNumber}</p>
    </div>
  {/each}
{/if}
```

## License

MIT
