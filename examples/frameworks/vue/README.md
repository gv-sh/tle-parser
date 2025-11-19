# Vue 3 Composition API for TLE Parser

Vue 3 composables for working with TLE (Two-Line Element) satellite data using the Composition API.

## Installation

```bash
npm install tle-parser
```

## Usage with `<script setup>`

### Basic TLE Parsing

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTLEParser } from './useTLE';

const line1 = ref('1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990');
const line2 = ref('2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018');
const line0 = ref('ISS (ZARYA)');

const { parse, data, error, loading, reset } = useTLEParser();

const handleParse = () => {
  parse(line1.value, line2.value, line0.value);
};
</script>

<template>
  <div>
    <button @click="handleParse" :disabled="loading">
      {{ loading ? 'Parsing...' : 'Parse TLE' }}
    </button>

    <div v-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <div v-if="data" class="result">
      <h3>{{ data.satelliteName }}</h3>
      <p>Satellite Number: {{ data.satelliteNumber }}</p>
      <p>Inclination: {{ data.inclination }}°</p>
      <p>Mean Motion: {{ data.meanMotion }} rev/day</p>
    </div>
  </div>
</template>
```

### Real-Time Satellite Tracking

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useSatelliteTracker } from './useTLE';

const tleData = ref(null); // Set this to parsed TLE
const groundLocation = ref({
  latitude: 40.7128,
  longitude: -74.0060,
  altitude: 0
});

const {
  position,
  lookAngles,
  isVisible,
  isTracking,
  start,
  stop,
  error
} = useSatelliteTracker(tleData, {
  updateInterval: 1000,
  groundLocation
});
</script>

<template>
  <div class="tracker">
    <h2>Satellite Tracker</h2>

    <button @click="isTracking ? stop() : start()">
      {{ isTracking ? 'Stop Tracking' : 'Start Tracking' }}
    </button>

    <div v-if="error" class="error">{{ error.message }}</div>

    <div v-if="position" class="position">
      <h3>Current Position</h3>
      <p>Latitude: {{ position.latitude.toFixed(4) }}°</p>
      <p>Longitude: {{ position.longitude.toFixed(4) }}°</p>
      <p>Altitude: {{ position.altitude.toFixed(2) }} km</p>
      <p>Velocity: {{ position.velocity.toFixed(2) }} km/s</p>
    </div>

    <div v-if="lookAngles" class="look-angles">
      <h3>Look Angles</h3>
      <p>Azimuth: {{ lookAngles.azimuth.toFixed(2) }}°</p>
      <p>Elevation: {{ lookAngles.elevation.toFixed(2) }}°</p>
      <p>Range: {{ lookAngles.range.toFixed(2) }} km</p>
      <p :class="isVisible ? 'visible' : 'not-visible'">
        {{ isVisible ? '✅ Visible' : '❌ Below Horizon' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.visible { color: green; }
.not-visible { color: red; }
</style>
```

### Fetching TLE Data

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTLEFetch } from './useTLE';

const source = ref('celestrak');
const query = ref({
  group: 'stations',
  satellites: ['ISS']
});

const { data, loading, error, refetch } = useTLEFetch(source, query);
</script>

<template>
  <div>
    <button @click="refetch" :disabled="loading">
      {{ loading ? 'Loading...' : 'Refresh TLE Data' }}
    </button>

    <div v-if="error" class="error">{{ error.message }}</div>

    <div v-if="data">
      <div v-for="(tle, index) in data" :key="index" class="tle-item">
        <h4>{{ tle.satelliteName }}</h4>
        <p>Satellite #: {{ tle.satelliteNumber }}</p>
        <p>Epoch: {{ tle.epochDate.toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>
```

### Visibility Windows

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useVisibilityWindow } from './useTLE';

const tleData = ref(null); // Set to parsed TLE
const location = ref({
  latitude: 40.7128,
  longitude: -74.0060,
  altitude: 0
});
const options = ref({
  startDate: new Date(),
  days: 7
});

const { windows, loading, error, recalculate } = useVisibilityWindow(
  tleData,
  location,
  options
);
</script>

<template>
  <div>
    <h2>Visibility Windows (Next 7 Days)</h2>
    <button @click="recalculate" :disabled="loading">
      {{ loading ? 'Calculating...' : 'Recalculate' }}
    </button>

    <div v-if="error">{{ error.message }}</div>

    <table v-if="windows.length > 0">
      <thead>
        <tr>
          <th>Pass</th>
          <th>Rise</th>
          <th>Set</th>
          <th>Max Elevation</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(window, index) in windows" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ window.rise.toLocaleString() }}</td>
          <td>{{ window.set.toLocaleString() }}</td>
          <td>{{ window.maxElevation.toFixed(2) }}°</td>
          <td>
            {{ ((window.set.getTime() - window.rise.getTime()) / 60000).toFixed(1) }} min
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

### Debounced Input Parsing

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useDebouncedTLEParser } from './useTLE';

const line1 = ref('');
const line2 = ref('');

const { data, error, loading, parse } = useDebouncedTLEParser(500);

const handleLine1Input = (event: Event) => {
  line1.value = (event.target as HTMLTextAreaElement).value;
  parse(line1.value, line2.value);
};

const handleLine2Input = (event: Event) => {
  line2.value = (event.target as HTMLTextAreaElement).value;
  parse(line1.value, line2.value);
};
</script>

<template>
  <div>
    <h3>TLE Input (Live Validation)</h3>

    <textarea
      placeholder="Line 1"
      :value="line1"
      @input="handleLine1Input"
      rows="2"
    />

    <textarea
      placeholder="Line 2"
      :value="line2"
      @input="handleLine2Input"
      rows="2"
    />

    <div v-if="loading" class="loading">Validating...</div>
    <div v-if="error" class="error">❌ {{ error.message }}</div>
    <div v-if="data" class="success">
      ✅ Valid TLE: {{ data.satelliteName }}
    </div>
  </div>
</template>

<style scoped>
textarea {
  width: 100%;
  font-family: monospace;
  margin: 5px 0;
}
.error { color: red; }
.success { color: green; }
</style>
```

### Reactive TLE Parser

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useReactiveTLEParser } from './useTLE';

const line1 = ref('1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990');
const line2 = ref('2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018');

// Automatically re-parses when line1 or line2 changes
const { data, error, loading } = useReactiveTLEParser(line1, line2);
</script>

<template>
  <div>
    <input v-model="line1" type="text" />
    <input v-model="line2" type="text" />

    <div v-if="loading">Parsing...</div>
    <div v-if="error">Error: {{ error.message }}</div>
    <div v-if="data">
      <p>Satellite: {{ data.satelliteName }}</p>
      <p>Number: {{ data.satelliteNumber }}</p>
    </div>
  </div>
</template>
```

## Complete Example: ISS Tracker

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  useTLEFetch,
  useSatelliteTracker,
  useVisibilityWindow
} from './useTLE';

const userLocation = ref(null);

// Fetch ISS TLE data
const { data: tleData, loading: fetchLoading } = useTLEFetch(
  ref('celestrak'),
  ref({ group: 'stations', satellites: ['ISS'] })
);

// Get first TLE from array
const issData = computed(() => tleData.value?.[0] || null);

// Track ISS in real-time
const {
  position,
  lookAngles,
  isVisible,
  isTracking,
  start,
  stop
} = useSatelliteTracker(issData, {
  updateInterval: 1000,
  groundLocation: userLocation
});

// Calculate visibility windows
const { windows } = useVisibilityWindow(
  issData,
  userLocation || ref({ latitude: 0, longitude: 0, altitude: 0 }),
  ref({ startDate: new Date(), days: 7 })
);

// Get user's location
onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: 0
      };
    });
  }
});
</script>

<template>
  <div class="iss-tracker">
    <h1>🛰️ ISS Tracker</h1>

    <div v-if="fetchLoading">Loading ISS data...</div>

    <template v-else-if="issData">
      <section class="tracking">
        <h2>Real-Time Position</h2>
        <button @click="isTracking ? stop() : start()">
          {{ isTracking ? 'Stop Tracking' : 'Start Tracking' }}
        </button>

        <div v-if="position" class="position-info">
          <p><strong>Latitude:</strong> {{ position.latitude.toFixed(4) }}°</p>
          <p><strong>Longitude:</strong> {{ position.longitude.toFixed(4) }}°</p>
          <p><strong>Altitude:</strong> {{ position.altitude.toFixed(2) }} km</p>
          <p><strong>Velocity:</strong> {{ position.velocity.toFixed(2) }} km/s</p>
        </div>

        <div v-if="userLocation && lookAngles" class="look-angles">
          <h3>From Your Location</h3>
          <p><strong>Azimuth:</strong> {{ lookAngles.azimuth.toFixed(2) }}°</p>
          <p><strong>Elevation:</strong> {{ lookAngles.elevation.toFixed(2) }}°</p>
          <p><strong>Range:</strong> {{ lookAngles.range.toFixed(2) }} km</p>
          <p :class="isVisible ? 'visible' : 'not-visible'">
            {{ isVisible ? '✅ Currently Visible' : '❌ Below Horizon' }}
          </p>
        </div>
      </section>

      <section v-if="userLocation && windows.length > 0" class="passes">
        <h2>Upcoming Passes</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Rise</th>
              <th>Set</th>
              <th>Max Elevation</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(window, index) in windows.slice(0, 10)" :key="index">
              <td>{{ window.rise.toLocaleDateString() }}</td>
              <td>{{ window.rise.toLocaleTimeString() }}</td>
              <td>{{ window.set.toLocaleTimeString() }}</td>
              <td>{{ window.maxElevation.toFixed(1) }}°</td>
              <td>
                {{ ((window.set.getTime() - window.rise.getTime()) / 60000).toFixed(0) }} min
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.iss-tracker {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.visible { color: green; font-weight: bold; }
.not-visible { color: red; }
</style>
```

## API Reference

See the main [README](../react/README.md) for detailed API documentation. All composables follow similar patterns to React hooks but use Vue's reactive system.

## TypeScript Support

All composables are fully typed. Import types from the main package:

```ts
import type { ParsedTLE, GroundLocation, SatellitePosition } from 'tle-parser';
```

## License

MIT
