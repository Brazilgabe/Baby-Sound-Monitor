import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => {
  const useDevClient = process.env.USE_DEV_CLIENT === "1";
  const isWeb = process.env.EXPO_OS === "web";

  return {
    name: "Baby Sound Monitor",
    slug: "baby-sound-monitor",
    scheme: "baby-sound-monitor",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.babysoundmonitor.app",
      infoPlist: {
        NSMicrophoneUsageDescription: "This app uses the microphone to monitor baby sounds in the nursery.",
        NSCameraUsageDescription: "This app uses the camera to scan QR codes and stream video from the nursery.",
        UIBackgroundModes: ["audio", "background-processing"],
        NSUserNotificationsUsageDescription: "This app needs to send notifications when baby sounds are detected.",
      },
    },
    android: {
      package: "com.babysoundmonitor.app",
      permissions: [
        "RECORD_AUDIO",
        "WAKE_LOCK",
        "CAMERA",
        "POST_NOTIFICATIONS",
        "ACCESS_NETWORK_STATE",
        "INTERNET"
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ...(!isWeb ? [["expo-notifications"]] : []),
      ...(useDevClient && !isWeb ? ["expo-dev-client"] : []),
      "expo-camera",
      "expo-av",
    ] as any[], // Fix for linter error
  };
};
