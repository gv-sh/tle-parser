<template>
  <div class="app">
    <header class="header">
      <h1>🛰️ Ground Station Planner</h1>
      <p>Schedule satellite tracking sessions using TLE data</p>
    </header>

    <div class="main-grid">
      <!-- Configuration -->
      <div class="card">
        <h2>Station Config</h2>

        <div class="form-group">
          <label>Station Name</label>
          <input v-model="stationName" placeholder="e.g., My Ground Station" />
        </div>

        <div class="form-group">
          <label>Latitude</label>
          <input v-model="latitude" type="number" step="0.0001" />
        </div>

        <div class="form-group">
          <label>Longitude</label>
          <input v-model="longitude" type="number" step="0.0001" />
        </div>

        <h2>Satellites</h2>
        <div v-for="sat in satellites" :key="sat.name" class="satellite-item">
          <input type="checkbox" :id="sat.name" v-model="sat.selected" />
          <label :for="sat.name">{{ sat.name }}</label>
        </div>

        <button class="btn btn-primary" @click="schedulePasses">Schedule Passes</button>
      </div>

      <!-- Calendar -->
      <div class="card">
        <h2>Tracking Schedule</h2>
        <div class="calendar-container">
          <p style="color: #666;">Calendar visualization would be rendered here using FullCalendar</p>
          <div v-for="event in events" :key="event.id" style="padding: 10px; background: #f0f0f0; margin: 10px 0; border-radius: 5px;">
            <strong>{{ event.title }}</strong><br>
            <small>{{ event.start }}</small>
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
      stationName: 'My Ground Station',
      latitude: 40.7128,
      longitude: -74.0060,
      satellites: [
        { name: 'ISS', selected: true },
        { name: 'NOAA-18', selected: false },
        { name: 'NOAA-19', selected: false }
      ],
      events: []
    };
  },
  methods: {
    schedulePasses() {
      this.events = [
        { id: 1, title: 'ISS Pass', start: '2023-11-21T14:30:00' },
        { id: 2, title: 'ISS Pass', start: '2023-11-21T16:15:00' }
      ];
    }
  }
};
</script>
