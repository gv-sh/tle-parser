# Flutter Integration for TLE Parser

Flutter widget example for satellite tracking.

## Installation

For Flutter integration, you have several options:

### Option 1: WebView with JavaScript

```yaml
dependencies:
  webview_flutter: ^latest
```

Load the TLE parser library in a WebView and use JavaScript interop.

### Option 2: Platform Channels

Create platform channels to call the Node.js TLE parser from Dart.

### Option 3: Pure Dart Implementation

Implement TLE parsing in pure Dart based on the library logic.

## Usage

```dart
import 'package:flutter/material.dart';
import 'tle_tracker.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TLE Tracker',
      home: TLETrackerWidget(),
    );
  }
}
```

## Features

- Material Design UI
- Real-time tracking
- Cross-platform (iOS, Android, Web, Desktop)

## License

MIT
