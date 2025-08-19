import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import OnboardingScreen from '@/components/OnboardingScreen';
import BabyMonitorApp from '../BabyMonitorApp';

const AsyncStorage =
  Platform.OS !== 'web'
    ? require('@react-native-async-storage/async-storage').default
    : null;

export default function HomeScreen() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkOnboardingStatus();
    }
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage?.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        setShowOnboarding(false);
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.log('Error checking onboarding status:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage?.setItem('onboardingComplete', 'true');
      setShowOnboarding(false);
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  // Web compatibility check
  if (Platform.OS === 'web') {
    return <BabyMonitorApp />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  if (hasCompletedOnboarding) {
    return <BabyMonitorApp />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.bgDay,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.xl.fontSize,
    color: theme.color.textDay,
  },
});