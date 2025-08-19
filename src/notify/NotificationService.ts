import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  priority?: 'default' | 'normal' | 'high';
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permissions not granted');
      }

      // Get push token
      if (Platform.OS !== 'web') {
        try {
          const projectId = Constants.expoConfig?.extra?.projectId;
          
          // Only request push token if we have a valid projectId
          if (projectId && projectId !== '12345678-1234-1234-1234-123456789abc') {
            const token = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            this.pushToken = token.data;
            console.log('[NotificationService] Push token:', this.pushToken);
          } else {
            console.log('[NotificationService] Skipping push token request - no valid projectId');
          }
        } catch (error) {
          console.warn('[NotificationService] Failed to get push token:', error);
          // Don't throw error - app can still work without push notifications
        }
      }

      this.isInitialized = true;
      console.log('[NotificationService] Initialized successfully');

    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      throw error;
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: notification.priority || 'high',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send local notification:', error);
    }
  }

  async sendNoiseAlert(level: number, roomId: string): Promise<void> {
    const notification: NotificationData = {
      title: 'Baby Noise Detected',
      body: `Sound level: ${Math.round(level * 100)}%`,
      data: {
        type: 'noise_detected',
        roomId,
        level,
        timestamp: Date.now(),
      },
      sound: true,
      priority: 'high',
    };

    await this.sendLocalNotification(notification);
  }

  async sendSessionEnded(roomId: string, reason: string): Promise<void> {
    const notification: NotificationData = {
      title: 'Session Ended',
      body: reason,
      data: {
        type: 'session_ended',
        roomId,
        reason,
        timestamp: Date.now(),
      },
      sound: false,
      priority: 'normal',
    };

    await this.sendLocalNotification(notification);
  }

  async sendReconnectionAttempt(roomId: string, attempt: number): Promise<void> {
    const notification: NotificationData = {
      title: 'Reconnecting...',
      body: `Attempt ${attempt}/5`,
      data: {
        type: 'reconnection_attempt',
        roomId,
        attempt,
        timestamp: Date.now(),
      },
      sound: false,
      priority: 'normal',
    };

    await this.sendLocalNotification(notification);
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Listen for notification events
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove listeners
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    subscription.remove();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
