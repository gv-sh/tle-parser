/**
 * React Native Component for TLE Tracking
 *
 * This component provides a mobile-friendly satellite tracker
 * using React Native and the useTLE hooks.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTLEParser, useSatelliteTracker, useVisibilityWindow } from './useTLE';

// Use the React hooks from examples/frameworks/react/useTLE.ts
// Import or copy the hooks to your React Native project

export default function TLETracker() {
  const [userLocation, setUserLocation] = useState(null);
  const { parse, data: tleData, loading: parseLoading, error: parseError } = useTLEParser();

  // Get user's location
  useEffect(() => {
    // Use react-native-geolocation or expo-location
    // For demo purposes, using hardcoded location
    setUserLocation({
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0
    });
  }, []);

  // Track satellite
  const {
    position,
    lookAngles,
    isVisible,
    isTracking,
    start,
    stop,
    error: trackError
  } = useSatelliteTracker(tleData, {
    updateInterval: 1000,
    groundLocation: userLocation
  });

  // Calculate visibility windows
  const { windows, loading: windowsLoading } = useVisibilityWindow(
    tleData,
    userLocation || { latitude: 0, longitude: 0, altitude: 0 },
    { startDate: new Date(), days: 7 }
  );

  const handleParseTLE = () => {
    const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
    const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";
    const line0 = "ISS (ZARYA)";
    parse(line1, line2, line0);
  };

  if (parseLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text>Parsing TLE...</Text>
      </View>
    );
  }

  if (parseError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Error: {parseError.message}</Text>
        <Button title="Retry" onPress={handleParseTLE} />
      </View>
    );
  }

  if (!tleData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>🛰️ Satellite Tracker</Text>
        <Button title="Load ISS Data" onPress={handleParseTLE} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛰️ {tleData.satelliteName}</Text>

      {/* Tracking Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real-Time Tracking</Text>
        <Button
          title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={isTracking ? stop : start}
          color={isTracking ? '#cc0000' : '#00cc00'}
        />
      </View>

      {/* Current Position */}
      {position && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Position</Text>
          <Text>Latitude: {position.latitude.toFixed(4)}°</Text>
          <Text>Longitude: {position.longitude.toFixed(4)}°</Text>
          <Text>Altitude: {position.altitude.toFixed(2)} km</Text>
          <Text>Velocity: {position.velocity.toFixed(2)} km/s</Text>
        </View>
      )}

      {/* Look Angles */}
      {lookAngles && userLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From Your Location</Text>
          <Text>Azimuth: {lookAngles.azimuth.toFixed(2)}°</Text>
          <Text>Elevation: {lookAngles.elevation.toFixed(2)}°</Text>
          <Text>Range: {lookAngles.range.toFixed(2)} km</Text>
          <Text style={isVisible ? styles.visible : styles.notVisible}>
            {isVisible ? '✅ Currently Visible' : '❌ Below Horizon'}
          </Text>
        </View>
      )}

      {/* Visibility Windows */}
      {windows.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Passes</Text>
          {windowsLoading && <ActivityIndicator />}
          {windows.slice(0, 5).map((window, index) => (
            <View key={index} style={styles.passItem}>
              <Text style={styles.passTitle}>Pass {index + 1}</Text>
              <Text>Rise: {window.rise.toLocaleString()}</Text>
              <Text>Set: {window.set.toLocaleString()}</Text>
              <Text>Max Elevation: {window.maxElevation.toFixed(2)}°</Text>
              <Text>
                Duration: {((window.set.getTime() - window.rise.getTime()) / 60000).toFixed(1)} min
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  passItem: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 4
  },
  passTitle: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  visible: {
    color: 'green',
    fontWeight: 'bold'
  },
  notVisible: {
    color: 'red'
  },
  error: {
    color: 'red',
    marginBottom: 10
  }
});
