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
        ITSAppUsesNonExemptEncryption: false,
        NSBluetoothAlwaysUsageDescription: "Used to discover and connect to a nearby parent device.",
        NSLocalNetworkUsageDescription: "Used for peer discovery and connection over local network.",
        NSBonjourServices: ["_mpc._tcp", "_companion-link._tcp"],
      },
    },
    android: {
      package: "com.babysoundmonitor.app",
      permissions: [
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "WAKE_LOCK",
        "CAMERA",
        "POST_NOTIFICATIONS",
        "ACCESS_NETWORK_STATE",
        "INTERNET"
      ],
    },
    extra: {
      eas: { projectId: "5a4b6172-4622-45a2-8327-635cba91b806" },
      projectId: "5a4b6172-4622-45a2-8327-635cba91b806",
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      // Web-specific configuration
      build: {
        babel: {
          include: ["@expo/vector-icons", "lucide-react-native"]
        }
      }
    },
    plugins: [
      // Only include native plugins for mobile platforms
      ...(!isWeb ? ["expo-notifications"] : []),
      ...(useDevClient && !isWeb ? ["expo-dev-client"] : []),
      ...(!isWeb ? ["expo-camera"] : []),
      ...(!isWeb ? ["expo-av"] : []),
    ] as any[],
  };
};
