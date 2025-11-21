<template>
  <div class="satellite-selector">
    <h3>Select Satellite</h3>

    <div class="form-group">
      <label for="satellite">Satellite</label>
      <select
        id="satellite"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="sat in satellites" :key="sat.name" :value="sat.name">
          {{ sat.name }} (NORAD {{ sat.noradId }})
        </option>
      </select>
    </div>

    <div v-if="selectedSatellite" class="satellite-info">
      <h4>Orbital Parameters</h4>
      <table class="info-table">
        <tr>
          <td>Inclination:</td>
          <td>{{ selectedSatellite.inclination }}°</td>
        </tr>
        <tr>
          <td>Period:</td>
          <td>{{ selectedSatellite.period }} min</td>
        </tr>
        <tr>
          <td>Altitude:</td>
          <td>{{ selectedSatellite.altitude }} km</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'SatelliteSelector',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    satellites: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const selectedSatellite = computed(() => {
      return props.satellites.find(s => s.name === props.modelValue);
    });

    return {
      selectedSatellite
    };
  }
};
</script>

<style scoped>
.satellite-selector {
  margin-bottom: 30px;
}

h3 {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.satellite-info {
  margin-top: 15px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
}

h4 {
  color: #667eea;
  font-size: 0.95rem;
  margin-bottom: 10px;
}

.info-table {
  width: 100%;
  margin: 0;
}

.info-table td {
  padding: 5px 0;
  border: none;
  font-size: 0.9rem;
}

.info-table td:first-child {
  color: #718096;
  font-weight: 600;
}

.info-table td:last-child {
  text-align: right;
  color: #2d3748;
}
</style>
