import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => {
  const useDevClient = process.env.USE_DEV_CLIENT === "1";
  const isWeb = process.env.EXPO_OS === "web";

  return {
    name: "baby-sound-monitor",
    slug: "baby-sound-monitor",
    scheme: "bsm",
    experiments: { typedRoutes: true },
    plugins: [
      ...(!isWeb ? [["expo-notifications"]] : []),
      ...(useDevClient && !isWeb ? ["expo-dev-client"] : []),
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: "This app uses the microphone to monitor sound.",
        UIBackgroundModes: ["audio"],
      },
    },
    android: {
      permissions: ["RECORD_AUDIO", "WAKE_LOCK"],
    },
  };
};
