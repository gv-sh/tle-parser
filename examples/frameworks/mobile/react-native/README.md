# React Native Integration for TLE Parser

React Native mobile app example for satellite tracking.

## Installation

```bash
npm install tle-parser
# or with Expo
expo install tle-parser
```

## Usage

1. Copy the React hooks from `examples/frameworks/react/useTLE.ts` to your project
2. Import and use the TLETracker component

```tsx
import TLETracker from './components/TLETracker';

export default function App() {
  return <TLETracker />;
}
```

## Features

- Real-time satellite tracking
- Visibility calculations from user's location
- Pass predictions
- Mobile-optimized UI

## Requirements

- React Native 0.64+
- For location: `@react-native-community/geolocation` or `expo-location`

## License

MIT
