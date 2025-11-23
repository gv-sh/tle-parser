<template>
  <div class="location-input">
    <h3>Observer Location</h3>

    <div class="form-group">
      <label for="latitude">Latitude (°)</label>
      <input
        id="latitude"
        type="number"
        :value="latitude"
        @input="$emit('update:latitude', parseFloat($event.target.value))"
        min="-90"
        max="90"
        step="0.0001"
        placeholder="e.g., 37.7749"
      />
    </div>

    <div class="form-group">
      <label for="longitude">Longitude (°)</label>
      <input
        id="longitude"
        type="number"
        :value="longitude"
        @input="$emit('update:longitude', parseFloat($event.target.value))"
        min="-180"
        max="180"
        step="0.0001"
        placeholder="e.g., -122.4194"
      />
    </div>

    <div class="form-group">
      <label for="altitude">Altitude (m)</label>
      <input
        id="altitude"
        type="number"
        :value="altitude"
        @input="$emit('update:altitude', parseFloat($event.target.value))"
        min="0"
        max="10000"
        step="1"
        placeholder="e.g., 0"
      />
    </div>

    <button class="btn btn-secondary" @click="$emit('locate')" style="width: 100%;">
      📍 Use My Location
    </button>
  </div>
</template>

<script>
export default {
  name: 'LocationInput',
  props: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    altitude: {
      type: Number,
      required: true
    }
  },
  emits: ['update:latitude', 'update:longitude', 'update:altitude', 'locate']
};
</script>

<style scoped>
.location-input {
  margin-bottom: 30px;
}

h3 {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 15px;
}
</style>
