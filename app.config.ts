import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  const useDevClient = process.env.USE_DEV_CLIENT === '1';
  
  const basePlugins = [
    "expo-router", 
    "expo-font", 
    "expo-web-browser",
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#ffffff"
      }
    ]
  ];

  const plugins = useDevClient ? ["expo-dev-client", ...basePlugins] : basePlugins;

  return {
    expo: {
      name: "Baby Sound Monitor",
      slug: "baby-sound-monitor",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "babysoundmonitor",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        infoPlist: {
          NSMicrophoneUsageDescription: "This app needs access to the microphone to monitor baby sounds",
          UIBackgroundModes: ["audio"]
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/icon.png",
          backgroundColor: "#ffffff"
        },
        permissions: [
          "android.permission.RECORD_AUDIO",
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.WAKE_LOCK"
        ],
        usesCleartextTraffic: false
      },
      web: {
        bundler: "metro",
        output: "single",
        favicon: "./assets/images/favicon.png"
      },
      plugins,
      experiments: {
        typedRoutes: true
      }
    }
  } as any;
};