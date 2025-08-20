import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType } from '@/src/store/useSession';
import { useRouter } from 'expo-router';

interface ConnectionSelectProps {
  onNext: (choice: ConnectionType) => void;
}

export default function ConnectionSelect({ onNext }: ConnectionSelectProps) {
  const { connectionStatus, isConnected } = useSession();
  const router = useRouter();

  const handleConnectionSelect = async (choice: ConnectionType) => {
    try {
      // Check if we're already connected
      if (isConnected) {
        Alert.alert(
          'Already Connected',
          'You are already connected. Would you like to disconnect and reconnect?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reconnect', 
              onPress: () => {
                if (choice === 'bt' && Platform.OS === 'ios') {
                  // iOS nearby: go directly to nearby flow
                  router.push('/NearbyConnect');
                } else {
                  onNext(choice);
                }
              },
              style: 'destructive'
            }
          ]
        );
        return;
      }

      // Handle iOS nearby routing
      if (choice === 'bt' && Platform.OS === 'ios') {
        // iOS nearby: go directly to nearby flow
        router.push('/NearbyConnect');
      } else {
        onNext(choice);
      }
    } catch (error) {
      console.error('[ConnectionSelect] Error selecting connection:', error);
      Alert.alert('Error', 'Failed to select connection type. Please try again.');
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
      default:
        return 'Not Connected';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '#F59E0B';
      case 'connected':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'disconnected':
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Baby Sound Monitor</Text>
        <Text style={styles.subtitle}>Choose how to connect</Text>
        
        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
          <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleConnectionSelect('wifi')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="wifi" size={32} color="#4C6EF5" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Wi-Fi or Data</Text>
            <Text style={styles.optionDescription}>
              Connect over the internet from anywhere
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleConnectionSelect('bt')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="bluetooth" size={32} color="#8B5CF6" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              {Platform.OS === 'ios' ? 'Nearby (Bluetooth/Wi-Fi)' : 'Nearby (QR)'}
            </Text>
            <Text style={styles.optionDescription}>
              {Platform.OS === 'ios' 
                ? 'One-tap pairing over Bluetooth/Wi-Fi. Media stays on Wi-Fi.'
                : 'Pair with QR codes on the same Wi-Fi.'
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {Platform.OS === 'ios' 
            ? 'Choose Wi-Fi or Data for remote monitoring, or Nearby for one-tap local pairing'
            : 'Choose Wi-Fi or Data for remote monitoring, or QR codes for local connections'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
