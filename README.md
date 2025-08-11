# Baby Sound Monitor

A minimal React Native app with Expo that acts as a one-way baby sound monitor. The Monitor device captures audio and sends push notifications to the Listener device when sound levels exceed a configurable threshold.

## Features

- **Monitor Mode**: Records audio, shows real-time levels, sends alerts when threshold exceeded
- **Listener Mode**: Receives push notifications, displays connection status and last alert time
- **One-way communication**: Monitor → Listener only (no audio streaming)
- **Configurable threshold**: Adjustable sensitivity via slider
- **Real-time audio level display**: Visual feedback of current sound levels
- **No cloud storage**: All processing happens locally on device

## Tech Stack

- Expo SDK 53
- React Native 0.79
- Expo Router for navigation
- expo-av for microphone input
- expo-notifications for push alerts
- @react-native-community/slider for threshold control
- Zustand for state management
- TypeScript
- Jest for testing

## Installation

```bash
npm install
```

## Development

### EAS Dev Client Setup

1. Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

2. Login to EAS:
```bash
eas login
```

3. Build development client for iOS:
```bash
eas build --profile development --platform ios
```

4. Build development client for Android:
```bash
eas build --profile development --platform android
```

5. Install the development build on your devices and run:
```bash
npx expo start --dev-client
```

### Local Development (Expo Go)

```bash
npx expo start
```

Note: Some features like background audio may not work in Expo Go. Use EAS Dev Client for full functionality.

## Usage

### Setup Process

1. **Listener Device**: 
   - Open app and select "Listener"
   - Allow push notification permissions
   - Copy the displayed Expo push token

2. **Monitor Device**:
   - Open app and select "Monitor" 
   - Allow microphone permissions
   - Paste the Listener's push token
   - Adjust threshold slider (default 30%)
   - Press "Start Monitoring"

3. **Testing**:
   - Make noise near Monitor device
   - Listener should receive push notification when threshold exceeded

### Threshold Guidelines

- **10-20%**: Very sensitive (picks up quiet sounds)
- **30-40%**: Normal sensitivity (crying, loud talking)
- **50-60%**: Less sensitive (only loud sounds)
- **70%+**: Very insensitive (only very loud sounds)

## Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation setup
│   │   └── index.tsx          # Role selection screen
│   ├── _layout.tsx            # Root layout
│   ├── monitor.tsx            # Monitor screen
│   └── listener.tsx           # Listener screen
├── src/
│   ├── audio/
│   │   ├── monitor.ts         # Audio monitoring class
│   │   └── monitor.test.ts    # Unit tests
│   ├── notify/
│   │   └── index.ts           # Push notification helpers
│   └── store/
│       └── useSession.ts      # Zustand state store
├── components/
│   ├── LevelBar.tsx           # Audio level visualization
│   └── ThresholdSlider.tsx    # Threshold control slider
├── hooks/
│   └── useFrameworkReady.ts   # Framework initialization
├── app.json                   # Expo configuration
├── eas.json                   # EAS build configuration
└── package.json
```

## Permissions

### iOS
- `NSMicrophoneUsageDescription`: Required for audio monitoring
- `UIBackgroundModes: ["audio"]`: Allows background audio processing

### Android
- `android.permission.RECORD_AUDIO`: Required for microphone access
- `android.permission.FOREGROUND_SERVICE`: For background monitoring
- `android.permission.WAKE_LOCK`: Keep device awake during monitoring

## Troubleshooting

### Microphone Permission Issues
- Ensure permissions are granted in device settings
- Try restarting the app after granting permissions
- On iOS, check Privacy & Security → Microphone settings

### Push Notification Issues
- Verify Expo push token is correctly copied (no extra spaces)
- Check notification permissions in device settings
- Ensure devices are on same network or have internet connectivity
- Test with a simple push notification first

### Background Audio Issues
- iOS: Ensure `UIBackgroundModes` includes "audio" in app.json
- Android: Use EAS Dev Client instead of Expo Go for background functionality
- Keep the Monitor app in foreground for reliable operation

### EAS Build Issues
- Ensure you're logged into EAS CLI: `eas whoami`
- Check your Expo account has the necessary build minutes
- Verify app.json configuration matches EAS requirements

## Testing

Run unit tests:
```bash
npm test
```

The test suite includes:
- Audio monitor initialization
- Threshold detection logic
- Event listener management
- RMS calculation validation

## Limitations

- **One-way only**: No audio streaming from Monitor to Listener
- **No cloud storage**: No permanent record of events
- **Push notification dependency**: Requires internet for notifications
- **Platform differences**: iOS has better real-time audio analysis than Android
- **Background limitations**: May require keeping Monitor app in foreground on some devices

## Contributing

1. Keep dependencies minimal
2. Follow the existing TypeScript patterns
3. Add tests for new audio processing logic
4. Ensure cross-platform compatibility

## License

MIT