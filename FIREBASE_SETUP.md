# Firebase Setup for Baby Sound Monitor

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `baby-sound-monitor` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left sidebar
2. Click "Create database"
3. Choose a location (US region is fine)
4. Start in test mode (we'll update rules later)
5. Click "Done"

## 3. Get Web App Configuration

1. In Project settings (gear icon), click "General" tab
2. Scroll down to "Your apps" section
3. Click the web app icon (`</>`)
4. Enter app nickname: `baby-sound-monitor-web`
5. Click "Register app"
6. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 4. Update Environment Variables

1. Open `eas.json` in your project
2. Replace all `YOUR_FIREBASE_*` values with the actual values from your config:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "AIzaSyC...",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "your-project.firebaseapp.com",
        "EXPO_PUBLIC_FIREBASE_DATABASE_URL": "https://your-project-default-rtdb.firebaseio.com",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "your-project",
        "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET": "your-project.appspot.com",
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "123456789",
        "EXPO_PUBLIC_FIREBASE_APP_ID": "1:123456789:web:abc123def456"
      }
    }
  }
}
```

## 5. Update Database Rules

1. In Realtime Database, click "Rules" tab
2. Replace the rules with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**⚠️ IMPORTANT**: These rules are for development only. Replace with proper authentication before shipping to production.

## 6. Optional: TURN Server Setup

For WebRTC to work across different networks (cellular, different WiFi), you'll need a TURN server:

1. **Free TURN servers** (for testing):
   - `stun:stun.l.google.com:19302`
   - `stun:stun1.l.google.com:19302`

2. **Paid TURN services** (for production):
   - [Twilio Network Traversal Service](https://www.twilio.com/stun-turn)
   - [CoTURN](https://github.com/coturn/coturn) (self-hosted)

3. Add TURN credentials to `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_TURN_URL": "turn:your-turn.example.com:3478",
        "EXPO_PUBLIC_TURN_USERNAME": "your-username",
        "EXPO_PUBLIC_TURN_CREDENTIAL": "your-password"
      }
    }
  }
}
```

## 7. Test Configuration

1. Build your app: `eas build --profile development`
2. The Firebase environment variables will be available at runtime
3. Check console logs for Firebase connection status

## 8. Production Considerations

Before shipping:

1. **Authentication**: Implement proper user authentication
2. **Security Rules**: Update database rules to restrict access
3. **TURN Server**: Use a production TURN service
4. **Monitoring**: Set up Firebase Analytics and Crashlytics
5. **Backup**: Configure database backup and retention policies

## Troubleshooting

- **"Firebase not initialized"**: Check that all environment variables are set correctly
- **"Permission denied"**: Verify database rules allow read/write
- **"Network error"**: Ensure database URL is correct and accessible
- **WebRTC issues**: Check TURN server configuration and credentials
