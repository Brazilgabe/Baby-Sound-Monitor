import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Push notification permission not granted');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.projectId,
    });
    
    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function notifyListener(pushToken: string, message: string): Promise<void> {
  try {
    const notification = {
      to: pushToken,
      sound: 'default',
      title: 'Baby Monitor Alert',
      body: message,
      data: { timestamp: Date.now() },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.data?.status === 'error') {
      throw new Error(`Push notification error: ${result.data.message}`);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}