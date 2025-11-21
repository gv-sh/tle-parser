<template>
  <div class="prediction-settings">
    <h3>Prediction Settings</h3>

    <div class="form-group">
      <label for="days">Prediction Duration (days)</label>
      <input
        id="days"
        type="number"
        :value="days"
        @input="$emit('update:days', parseInt($event.target.value))"
        min="1"
        max="30"
        step="1"
      />
      <small>Calculate passes for the next {{ days }} days</small>
    </div>

    <div class="form-group">
      <label for="minElevation">Minimum Elevation (°)</label>
      <input
        id="minElevation"
        type="number"
        :value="minElevation"
        @input="$emit('update:minElevation', parseInt($event.target.value))"
        min="0"
        max="90"
        step="5"
      />
      <small>Only show passes with elevation above {{ minElevation }}°</small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PredictionSettings',
  props: {
    days: {
      type: Number,
      required: true
    },
    minElevation: {
      type: Number,
      required: true
    }
  },
  emits: ['update:days', 'update:minElevation']
};
</script>

<style scoped>
.prediction-settings {
  margin-bottom: 30px;
}

h3 {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

small {
  display: block;
  margin-top: 5px;
  color: #718096;
  font-size: 0.85rem;
}
</style>
