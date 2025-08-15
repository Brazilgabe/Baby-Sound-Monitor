import * as Linking from 'expo-linking';
import { SessionData } from '@/src/store/useSession';

export interface QRCodeData {
  roomId: string;
  joinKey: string;
  mode: string;
  connectivity: string;
  timestamp: number;
}

export class QRCodeGenerator {
  static generateDeepLink(session: SessionData): string {
    return Linking.createURL('connect', {
      queryParams: {
        roomId: session.roomId,
        joinKey: session.joinKey,
        mode: session.mode,
        connectivity: session.connectivity,
        timestamp: session.timestamp.toString(),
      },
    });
  }

  static generateQRData(session: SessionData): QRCodeData {
    return {
      roomId: session.roomId,
      joinKey: session.joinKey,
      mode: session.mode,
      connectivity: session.connectivity,
      timestamp: session.timestamp,
    };
  }

  static parseQRCode(qrData: string): QRCodeData | null {
    try {
      // Try to parse as deep link first
      const parsed = Linking.parse(qrData);
      if (parsed.path === 'connect' && parsed.queryParams) {
        const params = parsed.queryParams as any;
        return {
          roomId: String(params.roomId || ''),
          joinKey: String(params.joinKey || ''),
          mode: String(params.mode || 'audio'),
          connectivity: String(params.connectivity || 'nearby'),
          timestamp: parseInt(String(params.timestamp || '0'), 10),
        };
      }

      // Try to parse as JSON
      const jsonData = JSON.parse(qrData);
      if (jsonData.roomId && jsonData.joinKey) {
        return {
          roomId: String(jsonData.roomId),
          joinKey: String(jsonData.joinKey),
          mode: String(jsonData.mode || 'audio'),
          connectivity: String(jsonData.connectivity || 'nearby'),
          timestamp: parseInt(String(jsonData.timestamp || '0'), 10),
        };
      }

      return null;
    } catch (error) {
      console.error('[QRCodeGenerator] Failed to parse QR data:', error);
      return null;
    }
  }

  static validateQRData(data: QRCodeData): { isValid: boolean; error?: string } {
    if (!data.roomId || data.roomId.length < 10) {
      return { isValid: false, error: 'Invalid room ID' };
    }

    if (!data.joinKey || data.joinKey.length < 8) {
      return { isValid: false, error: 'Invalid join key' };
    }

    if (!['audio', 'audio+video'].includes(data.mode)) {
      return { isValid: false, error: 'Invalid stream mode' };
    }

    if (!['nearby', 'anywhere'].includes(data.connectivity)) {
      return { isValid: false, error: 'Invalid connectivity type' };
    }

    // Check if QR code is expired (10 minutes)
    const now = Date.now();
    const qrAge = now - data.timestamp;
    if (qrAge > 10 * 60 * 1000) {
      return { isValid: false, error: 'QR code has expired' };
    }

    return { isValid: true };
  }

  static formatRoomId(roomId: string): string {
    // Format room ID for display (e.g., "room_1234567890_abc123def" -> "1234-5678-90")
    if (roomId.startsWith('room_')) {
      const parts = roomId.split('_');
      if (parts.length >= 3) {
        const timestamp = parts[1];
        const random = parts[2];
        return `${timestamp.slice(-4)}-${random.slice(0, 4)}-${random.slice(4, 6)}`;
      }
    }
    return roomId.slice(0, 12);
  }

  static formatJoinKey(joinKey: string): string {
    // Format join key for display (e.g., "key_abc123def456" -> "ABC1-23DE-F456")
    if (joinKey.startsWith('key_')) {
      const key = joinKey.slice(4).toUpperCase();
      return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 10)}`;
    }
    return joinKey.slice(0, 12);
  }
}

export class QRCodeScanner {
  static async requestCameraPermission(): Promise<boolean> {
    try {
      // This would typically use expo-camera's permission request
      // For now, we'll return true as a placeholder
      return true;
    } catch (error) {
      console.error('[QRCodeScanner] Camera permission request failed:', error);
      return false;
    }
  }

  static async scanQRCode(): Promise<string | null> {
    try {
      // This would typically use expo-camera's barcode scanner
      // For now, we'll return null as a placeholder
      // In the real implementation, this would scan and return the QR data
      return null;
    } catch (error) {
      console.error('[QRCodeScanner] QR code scanning failed:', error);
      return null;
    }
  }
}
