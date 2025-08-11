import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Copy, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useSession } from '@/src/store/useSession';
import { registerForPushNotifications } from '@/src/notify';
import { copyText } from '@/src/utils/copy';
import * as Notifications from 'expo-notifications';

export default function ListenerScreen() {
  const { lastAlert, setLastAlert } = useSession();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Listen for received notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const timestamp = new Date().toLocaleTimeString();
      setLastAlert(timestamp);
    });

    // Register for push notifications
    await connectToPushService();

    return () => subscription.remove();
  };

  const connectToPushService = async () => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        setIsRegistered(true);
      } else {
        Alert.alert('Error', 'Failed to register for push notifications');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      Alert.alert('Error', 'Failed to connect to push service');
    }
  };

  const copyTokenToClipboard = async () => {
    if (expoPushToken) {
      const result = await copyText(expoPushToken);
      Alert.alert(result.ok ? 'Success!' : 'Error', result.msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Listener</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={[
            styles.statusIndicator, 
            isRegistered ? styles.statusConnected : styles.statusDisconnected
          ]}>
            {isRegistered && <CheckCircle size={20} color="#10b981" />}
            <Text style={[
              styles.statusText,
              isRegistered ? styles.statusTextConnected : styles.statusTextDisconnected
            ]}>
              {isRegistered ? 'Ready to receive alerts' : 'Setting up notifications...'}
            </Text>
          </View>
        </View>

        {expoPushToken && (
          <View style={styles.tokenContainer}>
            <Text style={styles.sectionTitle}>Your Push Token</Text>
            <Text style={styles.instruction}>
              Copy this token and paste it in the Monitor app:
            </Text>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText} numberOfLines={4}>
                {expoPushToken}
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={copyTokenToClipboard}
              >
                <Copy size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {lastAlert && (
          <View style={styles.alertContainer}>
            <Text style={styles.sectionTitle}>Last Alert</Text>
            <View style={styles.alertBox}>
              <Text style={styles.alertTime}>{lastAlert}</Text>
              <Text style={styles.alertMessage}>Baby sound detected</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.connectButton}
          onPress={connectToPushService}
        >
          <Text style={styles.connectButtonText}>
            {isRegistered ? 'Reconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 32,
  },
  statusContainer: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusConnected: {
    backgroundColor: '#dcfce7',
  },
  statusDisconnected: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusTextConnected: {
    color: '#166534',
  },
  statusTextDisconnected: {
    color: '#991b1b',
  },
  tokenContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instruction: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  tokenBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  alertContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 18,
    color: '#92400e',
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 14,
    color: '#92400e',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});