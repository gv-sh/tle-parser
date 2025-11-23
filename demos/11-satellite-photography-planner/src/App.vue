<template>
  <div class="app">
    <header class="header">
      <h1>📸 Satellite Photography Planner</h1>
      <p>Plan ISS and satellite photography sessions using TLE data</p>
    </header>

    <div class="main-grid">
      <!-- Configuration -->
      <div class="card">
        <h2>Configuration</h2>

        <div class="form-group">
          <label>Satellite</label>
          <select v-model="selectedSatellite">
            <option value="ISS">ISS (ZARYA)</option>
            <option value="HST">Hubble Space Telescope</option>
            <option value="TIANGONG">Tiangong Space Station</option>
          </select>
        </div>

        <div class="form-group">
          <label>Location</label>
          <input v-model="location.latitude" type="number" placeholder="Latitude" step="0.0001" />
          <input v-model="location.longitude" type="number" placeholder="Longitude" step="0.0001" style="margin-top: 10px;" />
        </div>

        <div class="form-group">
          <label>Camera</label>
          <select v-model="camera">
            <option value="dslr">DSLR</option>
            <option value="mirrorless">Mirrorless</option>
            <option value="phone">Smartphone</option>
          </select>
        </div>

        <div class="form-group">
          <label>Focal Length (mm)</label>
          <input v-model="focalLength" type="number" />
        </div>

        <button class="btn" @click="calculatePasses">Calculate Photography Windows</button>

        <div v-if="cameraSettings" class="camera-settings">
          <h3>Recommended Settings</h3>
          <p><strong>ISO:</strong> {{ cameraSettings.iso }}</p>
          <p><strong>Shutter Speed:</strong> {{ cameraSettings.shutter }}</p>
          <p><strong>Aperture:</strong> {{ cameraSettings.aperture }}</p>
          <p><strong>Focus:</strong> {{ cameraSettings.focus }}</p>
        </div>
      </div>

      <!-- Photography Windows -->
      <div class="card">
        <h2>Photography Windows</h2>

        <div v-if="passes.length === 0">
          <p style="color: #666; padding: 40px; text-align: center;">
            Configure your location and click "Calculate Photography Windows"
          </p>
        </div>

        <div v-for="pass in passes" :key="pass.id" class="pass-item">
          <h3>{{ pass.date }}</h3>
          <p><strong>Rise:</strong> {{ pass.rise }} ({{ pass.riseAz }}° Az)</p>
          <p><strong>Max Elevation:</strong> {{ pass.maxEl }}° at {{ pass.maxTime }}</p>
          <p><strong>Set:</strong> {{ pass.set }} ({{ pass.setAz }}° Az)</p>
          <p><strong>Brightness:</strong> {{ pass.brightness }} ({{ pass.visible }})</p>
          <p><strong>Weather:</strong> {{ pass.weather }}</p>
          <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>Photography Tip:</strong> {{ pass.tip }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedSatellite: 'ISS',
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      camera: 'dslr',
      focalLength: 200,
      passes: [],
      cameraSettings: null
    };
  },
  methods: {
    calculatePasses() {
      this.passes = [
        {
          id: 1,
          date: 'Nov 21, 2023',
          rise: '18:30:15',
          riseAz: 245,
          maxEl: 78,
          maxTime: '18:33:45',
          set: '18:37:20',
          setAz: 95,
          brightness: 'Mag -3.5',
          visible: 'Excellent',
          weather: 'Clear skies expected',
          tip: 'Use burst mode for this overhead pass. Start tracking 30 seconds before rise.'
        }
      ];

      this.cameraSettings = {
        iso: '800-1600',
        shutter: '1/250s - 1/500s',
        aperture: 'f/5.6',
        focus: 'Manual - Infinity'
      };
    }
  }
};
</script>
