import { SessionData, ConnectionType, StreamMode, Sensitivity } from '../store/useSession';

export interface QRCodeData {
  roomId: string;
  joinKey: string;
  mode: StreamMode;
  sensitivity: Sensitivity;
  connectionType: ConnectionType;
  timestamp: number;
}

// QR Code generation functions for LAN connections
export function generateLANQRCode(wsUrl: string): string {
  // Simple QR code containing just the WebSocket URL
  // Format: ws://<ip>:<port>?room=<roomId>&key=<joinKey>
  return wsUrl;
}

export function parseLANQRCode(qrData: string): { wsUrl: string; roomId: string; joinKey: string } | null {
  try {
    // Check if it's a WebSocket URL
    if (qrData.startsWith('ws://') || qrData.startsWith('wss://')) {
      const url = new URL(qrData);
      const roomId = url.searchParams.get('room');
      const joinKey = url.searchParams.get('key');
      
      if (roomId && joinKey) {
        return { wsUrl: qrData, roomId, joinKey };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Legacy QR code generation for backward compatibility
export function generateQRCodeData(sessionData: SessionData): QRCodeData {
  return {
    roomId: sessionData.roomId,
    joinKey: sessionData.joinKey,
    mode: sessionData.mode,
    sensitivity: sessionData.sensitivity,
    connectionType: sessionData.connectionType,
    timestamp: Date.now(),
  };
}

export function parseQRCodeData(qrData: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrData) as QRCodeData;
    
    // Validate required fields
    if (!data.roomId || !data.joinKey || !data.mode || !data.connectionType) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}
