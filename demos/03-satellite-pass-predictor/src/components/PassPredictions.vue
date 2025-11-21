<template>
  <div class="pass-predictions">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="passes.length === 0" class="empty-state">
      <div class="empty-state-icon">🔭</div>
      <h3>No Passes Yet</h3>
      <p>Configure your location and satellite, then click "Calculate Passes"</p>
    </div>

    <div v-else class="passes-table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rise</th>
            <th>Max Elevation</th>
            <th>Set</th>
            <th>Duration</th>
            <th>Visibility</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pass, index) in passes" :key="index">
            <td>
              <strong>{{ formatDate(pass.rise.time) }}</strong>
            </td>
            <td>
              <div>{{ formatTime(pass.rise.time) }}</div>
              <small>{{ pass.rise.azimuth.toFixed(1) }}° Az</small>
            </td>
            <td>
              <div>{{ formatTime(pass.maxElevation.time) }}</div>
              <small>{{ pass.maxElevation.elevation.toFixed(1) }}° El</small>
              <span :class="['badge', getVisibilityClass(pass.maxElevation.elevation)]">
                {{ pass.maxElevation.elevation.toFixed(0) }}°
              </span>
            </td>
            <td>
              <div>{{ formatTime(pass.set.time) }}</div>
              <small>{{ pass.set.azimuth.toFixed(1) }}° Az</small>
            </td>
            <td>{{ formatDuration(pass.duration) }}</td>
            <td>
              <span :class="['badge', getVisibilityClass(pass.maxElevation.elevation)]">
                {{ getVisibilityLabel(pass.maxElevation.elevation) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'PassPredictions',
  props: {
    passes: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const formatDate = (date) => {
      return format(new Date(date), 'MMM dd, yyyy');
    };

    const formatTime = (date) => {
      return format(new Date(date), 'HH:mm:ss');
    };

    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}m ${secs}s`;
    };

    const getVisibilityClass = (elevation) => {
      if (elevation >= 60) return 'badge-high';
      if (elevation >= 30) return 'badge-medium';
      return 'badge-low';
    };

    const getVisibilityLabel = (elevation) => {
      if (elevation >= 60) return 'Excellent';
      if (elevation >= 30) return 'Good';
      return 'Fair';
    };

    return {
      formatDate,
      formatTime,
      formatDuration,
      getVisibilityClass,
      getVisibilityLabel
    };
  }
};
</script>

<style scoped>
.passes-table-container {
  overflow-x: auto;
}

table {
  font-size: 0.9rem;
}

td small {
  display: block;
  color: #718096;
  font-size: 0.8rem;
  margin-top: 2px;
}

.badge {
  margin-left: 8px;
}
</style>
