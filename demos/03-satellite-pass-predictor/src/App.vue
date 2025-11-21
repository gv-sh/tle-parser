<template>
  <div>
    <header class="app-header">
      <h1>🛰️ Satellite Pass Predictor</h1>
      <p>Calculate and visualize satellite passes using TLE Parser</p>
    </header>

    <div class="main-grid">
      <!-- Configuration Panel -->
      <div class="card">
        <h2>Configuration</h2>

        <!-- Location Input -->
        <LocationInput
          v-model:latitude="location.latitude"
          v-model:longitude="location.longitude"
          v-model:altitude="location.altitude"
          @locate="handleGeolocation"
        />

        <!-- Satellite Selection -->
        <SatelliteSelector
          v-model="selectedSatellite"
          :satellites="satellites"
        />

        <!-- Prediction Settings -->
        <PredictionSettings
          v-model:days="predictionDays"
          v-model:minElevation="minElevation"
        />

        <!-- Calculate Button -->
        <div class="btn-group">
          <button
            class="btn btn-primary"
            @click="calculatePasses"
            :disabled="!isValid || loading"
          >
            {{ loading ? 'Calculating...' : 'Calculate Passes' }}
          </button>
          <button class="btn btn-secondary" @click="exportToCalendar">
            Export to iCal
          </button>
        </div>

        <!-- Alerts -->
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
      </div>

      <!-- Results Panel -->
      <div class="card">
        <h2>7-Day Pass Predictions</h2>

        <PassPredictions
          :passes="passes"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Sky Map Visualization -->
    <div v-if="passes.length > 0" class="card">
      <h2>Sky Map Visualization</h2>
      <SkyMap :passes="passes" :selectedPass="selectedPass" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import LocationInput from './components/LocationInput.vue';
import SatelliteSelector from './components/SatelliteSelector.vue';
import PredictionSettings from './components/PredictionSettings.vue';
import PassPredictions from './components/PassPredictions.vue';
import SkyMap from './components/SkyMap.vue';
import { calculatePasses as computePasses, getSampleSatellites } from './utils/passCalculator';
import { exportToICS } from './utils/calendarExport';

export default {
  name: 'App',
  components: {
    LocationInput,
    SatelliteSelector,
    PredictionSettings,
    PassPredictions,
    SkyMap
  },
  setup() {
    // State
    const location = ref({
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0
    });

    const selectedSatellite = ref('ISS');
    const predictionDays = ref(7);
    const minElevation = ref(10);
    const passes = ref([]);
    const selectedPass = ref(null);
    const loading = ref(false);
    const error = ref('');
    const success = ref('');

    // Sample satellites with TLE data
    const satellites = ref(getSampleSatellites());

    // Computed
    const isValid = computed(() => {
      return (
        location.value.latitude >= -90 &&
        location.value.latitude <= 90 &&
        location.value.longitude >= -180 &&
        location.value.longitude <= 180 &&
        selectedSatellite.value
      );
    });

    // Methods
    const handleGeolocation = () => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation is not supported by your browser';
        return;
      }

      loading.value = true;
      error.value = '';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          location.value.latitude = position.coords.latitude;
          location.value.longitude = position.coords.longitude;
          location.value.altitude = position.coords.altitude || 0;
          success.value = 'Location updated successfully!';
          loading.value = false;
          setTimeout(() => success.value = '', 3000);
        },
        (err) => {
          error.value = `Geolocation error: ${err.message}`;
          loading.value = false;
        }
      );
    };

    const calculatePasses = async () => {
      loading.value = true;
      error.value = '';
      success.value = '';

      try {
        // Find selected satellite data
        const satellite = satellites.value.find(
          s => s.name === selectedSatellite.value
        );

        if (!satellite) {
          throw new Error('Satellite not found');
        }

        // Calculate passes using TLE data
        const calculatedPasses = await computePasses(
          satellite,
          location.value,
          predictionDays.value,
          minElevation.value
        );

        passes.value = calculatedPasses;
        success.value = `Found ${calculatedPasses.length} passes in the next ${predictionDays.value} days`;

        loading.value = false;
        setTimeout(() => success.value = '', 5000);
      } catch (err) {
        error.value = `Calculation failed: ${err.message}`;
        loading.value = false;
      }
    };

    const exportToCalendar = () => {
      if (passes.value.length === 0) {
        error.value = 'No passes to export. Calculate passes first.';
        return;
      }

      try {
        exportToICS(passes.value, selectedSatellite.value);
        success.value = 'Calendar file downloaded successfully!';
        setTimeout(() => success.value = '', 3000);
      } catch (err) {
        error.value = `Export failed: ${err.message}`;
      }
    };

    return {
      location,
      selectedSatellite,
      predictionDays,
      minElevation,
      passes,
      selectedPass,
      loading,
      error,
      success,
      satellites,
      isValid,
      handleGeolocation,
      calculatePasses,
      exportToCalendar
    };
  }
};
</script>
