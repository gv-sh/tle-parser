/**
 * Flutter Widget for TLE Tracking
 *
 * This demonstrates how to use TLE Parser with Flutter
 * through JavaScript interop or a Dart wrapper.
 *
 * Note: For production use, create a Dart package wrapper
 * around the JavaScript library or reimplement in Dart.
 */

import 'package:flutter/material.dart';

/// TLE Data Model (simplified)
class TLEData {
  final String satelliteName;
  final int satelliteNumber;
  final double inclination;
  final double meanMotion;

  TLEData({
    required this.satelliteName,
    required this.satelliteNumber,
    required this.inclination,
    required this.meanMotion,
  });
}

/// Satellite Position Model
class SatellitePosition {
  final double latitude;
  final double longitude;
  final double altitude;
  final double velocity;

  SatellitePosition({
    required this.latitude,
    required this.longitude,
    required this.altitude,
    required this.velocity,
  });
}

/// TLE Tracker Widget
class TLETrackerWidget extends StatefulWidget {
  @override
  _TLETrackerWidgetState createState() => _TLETrackerWidgetState();
}

class _TLETrackerWidgetState extends State<TLETrackerWidget> {
  TLEData? _tleData;
  SatellitePosition? _position;
  bool _isTracking = false;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTLE();
  }

  Future<void> _loadTLE() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Call JavaScript interop or native TLE parser
      // For demo purposes, using mock data
      await Future.delayed(Duration(seconds: 1));

      setState(() {
        _tleData = TLEData(
          satelliteName: 'ISS (ZARYA)',
          satelliteNumber: 25544,
          inclination: 51.6461,
          meanMotion: 15.48919393,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _toggleTracking() {
    setState(() {
      _isTracking = !_isTracking;
    });

    if (_isTracking) {
      _startTracking();
    } else {
      _stopTracking();
    }
  }

  void _startTracking() {
    // TODO: Implement periodic position updates
    // Use Timer.periodic to update position every second
  }

  void _stopTracking() {
    // TODO: Cancel timer
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading TLE data...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: Colors.red, size: 48),
            SizedBox(height: 16),
            Text('Error: $_error', style: TextStyle(color: Colors.red)),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadTLE,
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_tleData == null) {
      return Center(child: Text('No TLE data available'));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('🛰️ ${_tleData!.satelliteName}'),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tracking Controls
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Real-Time Tracking',
                      style: Theme.of(context).textTheme.headline6,
                    ),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _toggleTracking,
                      child: Text(_isTracking ? 'Stop Tracking' : 'Start Tracking'),
                      style: ElevatedButton.styleFrom(
                        primary: _isTracking ? Colors.red : Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            SizedBox(height: 16),

            // TLE Information
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Orbital Elements',
                      style: Theme.of(context).textTheme.headline6,
                    ),
                    SizedBox(height: 8),
                    _buildInfoRow('Satellite Number', _tleData!.satelliteNumber.toString()),
                    _buildInfoRow('Inclination', '${_tleData!.inclination.toStringAsFixed(4)}°'),
                    _buildInfoRow('Mean Motion', '${_tleData!.meanMotion.toStringAsFixed(8)} rev/day'),
                  ],
                ),
              ),
            ),

            SizedBox(height: 16),

            // Current Position (if tracking)
            if (_isTracking && _position != null)
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Current Position',
                        style: Theme.of(context).textTheme.headline6,
                      ),
                      SizedBox(height: 8),
                      _buildInfoRow('Latitude', '${_position!.latitude.toStringAsFixed(4)}°'),
                      _buildInfoRow('Longitude', '${_position!.longitude.toStringAsFixed(4)}°'),
                      _buildInfoRow('Altitude', '${_position!.altitude.toStringAsFixed(2)} km'),
                      _buildInfoRow('Velocity', '${_position!.velocity.toStringAsFixed(2)} km/s'),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _stopTracking();
    super.dispose();
  }
}
