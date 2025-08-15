import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Baby, Headphones, User, Shield, Bell, Settings, Mic, Camera } from 'lucide-react-native';
import { useSession, Role } from '@/src/store/useSession';
import { permissionManager } from '@/src/utils/PermissionManager';
import { notificationService } from '@/src/notify/NotificationService';
import OnboardingScreen from '@/components/OnboardingScreen';

export default function HomeScreen() {
  const { role, setRole, resetSession } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize notification service
      await notificationService.initialize();
      
      // Check if this is first run
      // In a real app, you'd check AsyncStorage or similar
      const isFirstRun = !hasCompletedOnboarding;
      if (isFirstRun) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    }
  };

  const handleRoleSelect = async (selectedRole: Role) => {
    try {
      // Ensure permissions for the selected role
      const hasPermissions = await permissionManager.ensurePermissions(selectedRole);
      
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'This role requires specific permissions. Please grant them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }},
          ]
        );
        return;
      }

      // Set role and navigate
      setRole(selectedRole);
      resetSession(); // Clear any previous session data
      
      if (selectedRole === 'listener') {
        router.push('/listener');
      } else {
        router.push('/parent');
      }
    } catch (error) {
      console.error('Failed to select role:', error);
      Alert.alert('Error', 'Failed to select role. Please try again.');
    }
  };

  const completeOnboarding = () => {
    console.log('[HomeScreen] Onboarding completed');
    console.log('[HomeScreen] Setting showOnboarding to false');
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    console.log('[HomeScreen] Onboarding state updated');
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Baby size={48} color="#3b82f6" />
          <Text style={styles.appName}>Baby Sound Monitor</Text>
        </View>
        <Text style={styles.tagline}>Secure, real-time baby monitoring</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Choose Your Role</Text>
        
        <View style={styles.roleContainer}>
          {/* Listener Role */}
          <TouchableOpacity 
            style={[styles.roleCard, styles.listenerCard]}
            onPress={() => handleRoleSelect('listener')}
          >
            <View style={styles.roleIconContainer}>
              <Headphones size={48} color="#ffffff" />
            </View>
            <Text style={styles.roleTitle}>Listener</Text>
            <Text style={styles.roleSubtitle}>Place in nursery</Text>
            <Text style={styles.roleDescription}>
              Monitor baby sounds and stream audio/video to parent devices
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.featureItem}>
                <Mic size={16} color="#ffffff" />
                <Text style={styles.featureText}>Microphone monitoring</Text>
              </View>
              <View style={styles.featureItem}>
                <Camera size={16} color="#ffffff" />
                <Text style={styles.featureText}>Optional video streaming</Text>
              </View>
              <View style={styles.featureItem}>
                <Bell size={16} color="#ffffff" />
                <Text style={styles.featureText}>Smart noise detection</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Parent Role */}
          <TouchableOpacity 
            style={[styles.roleCard, styles.parentCard]}
            onPress={() => handleRoleSelect('parent')}
          >
            <View style={styles.roleIconContainer}>
              <User size={48} color="#ffffff" />
            </View>
            <Text style={styles.roleTitle}>Parent</Text>
            <Text style={styles.roleSubtitle}>Receive alerts & stream</Text>
            <Text style={styles.roleDescription}>
              Connect to listener devices and receive real-time audio/video feeds
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.featureItem}>
                <Headphones size={16} color="#ffffff" />
                <Text style={styles.featureText}>Live audio streaming</Text>
              </View>
              <View style={styles.featureItem}>
                <Camera size={16} color="#ffffff" />
                <Text style={styles.featureText}>QR code scanning</Text>
              </View>
              <View style={styles.featureItem}>
                <Bell size={16} color="#ffffff" />
                <Text style={styles.featureText}>Instant notifications</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Connectivity Options */}
        <View style={styles.connectivitySection}>
          <Text style={styles.sectionTitle}>Connectivity Options</Text>
          <View style={styles.connectivityOptions}>
            <View style={styles.connectivityOption}>
              <View style={[styles.connectivityIcon, { backgroundColor: '#10b981' }]}>
                <Text style={styles.connectivityIconText}>🏠</Text>
              </View>
              <View style={styles.connectivityText}>
                <Text style={styles.connectivityTitle}>Nearby (Same WiFi)</Text>
                <Text style={styles.connectivityDescription}>Lowest latency, recommended for same network</Text>
              </View>
            </View>
            <View style={styles.connectivityOption}>
              <View style={[styles.connectivityIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.connectivityIconText}>🌐</Text>
              </View>
              <View style={styles.connectivityText}>
                <Text style={styles.connectivityTitle}>Anywhere (Internet)</Text>
                <Text style={styles.connectivityDescription}>Works across networks, slightly higher latency</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <Shield size={20} color="#8b5cf6" />
            <Text style={styles.securityTitle}>Security & Privacy</Text>
          </View>
          <Text style={styles.securityDescription}>
            All sessions are ephemeral, encrypted, and use unique codes. No recordings are stored, and each session expires after 10 minutes of inactivity.
          </Text>
        </View>
      </View>

      {/* Settings Button */}
      <TouchableOpacity style={styles.settingsButton}>
        <Settings size={24} color="#6b7280" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  roleContainer: {
    gap: 20,
    marginBottom: 32,
  },
  roleCard: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listenerCard: {
    backgroundColor: '#10b981',
  },
  parentCard: {
    backgroundColor: '#3b82f6',
  },
  roleIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  roleDescription: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.9,
  },
  roleFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  connectivitySection: {
    marginBottom: 32,
  },
  connectivityOptions: {
    gap: 16,
  },
  connectivityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  connectivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  connectivityIconText: {
    fontSize: 24,
  },
  connectivityText: {
    flex: 1,
  },
  connectivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  connectivityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  securitySection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  securityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});