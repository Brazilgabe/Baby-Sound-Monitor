import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

export interface PermissionStatus {
  microphone: boolean;
  camera: boolean;
  notifications: boolean;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissionStatus: PermissionStatus = {
    microphone: false,
    camera: false,
    notifications: false,
  };

  private constructor() {}

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  async requestAllPermissions(): Promise<PermissionStatus> {
    try {
      const [microphone, camera, notifications] = await Promise.all([
        this.requestMicrophonePermission(),
        this.requestCameraPermission(),
        this.requestNotificationPermission(),
      ]);

      this.permissionStatus = { microphone, camera, notifications };
      return this.permissionStatus;
    } catch (error) {
      console.error('[PermissionManager] Failed to request permissions:', error);
      throw error;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      
      if (!granted) {
        this.showPermissionAlert('Microphone', 'This app needs microphone access to monitor baby sounds.');
      }
      
      return granted;
    } catch (error) {
      console.error('[PermissionManager] Microphone permission request failed:', error);
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      
      if (!granted) {
        this.showPermissionAlert('Camera', 'This app needs camera access to scan QR codes and stream video.');
      }
      
      return granted;
    } catch (error) {
      console.error('[PermissionManager] Camera permission request failed:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      
      if (!granted) {
        this.showPermissionAlert('Notifications', 'This app needs notification access to alert you when baby sounds are detected.');
      }
      
      return granted;
    } catch (error) {
      console.error('[PermissionManager] Notification permission request failed:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<PermissionStatus> {
    try {
      const [microphone, camera, notifications] = await Promise.all([
        this.checkMicrophonePermission(),
        this.checkCameraPermission(),
        this.checkNotificationPermission(),
      ]);

      this.permissionStatus = { microphone, camera, notifications };
      return this.permissionStatus;
    } catch (error) {
      console.error('[PermissionManager] Failed to check permissions:', error);
      return this.permissionStatus;
    }
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private showPermissionAlert(permission: string, message: string): void {
    Alert.alert(
      `${permission} Permission Required`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => this.openSettings() },
      ]
    );
  }

  private openSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  getPermissionStatus(): PermissionStatus {
    return { ...this.permissionStatus };
  }

  hasRequiredPermissions(role: 'listener' | 'parent'): boolean {
    const { microphone, camera, notifications } = this.permissionStatus;
    
    if (role === 'listener') {
      // Listener needs microphone and notifications
      return microphone && notifications;
    } else {
      // Parent needs camera (for QR scan) and notifications
      return camera && notifications;
    }
  }

  async ensurePermissions(role: 'listener' | 'parent'): Promise<boolean> {
    const currentStatus = await this.checkPermissions();
    
    if (this.hasRequiredPermissions(role)) {
      return true;
    }

    // Request missing permissions
    const requestedStatus = await this.requestAllPermissions();
    return this.hasRequiredPermissions(role);
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();
