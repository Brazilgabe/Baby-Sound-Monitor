import { Platform } from 'react-native';
import { WebRTCSession } from '../webrtc/WebRTCSession';
import { useSession } from '../store/useSession';

export interface LanSignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  roomId: string;
  joinKey: string;
}

export class LanSignaling {
  private session: WebRTCSession;
  private ws: WebSocket | null = null;
  private onConnectionEstablished: (pc: RTCPeerConnection) => void;

  constructor(session: WebRTCSession, onConnectionEstablished: (pc: RTCPeerConnection) => void) {
    this.session = session;
    this.onConnectionEstablished = onConnectionEstablished;
  }

  // For parent device: start listening for connections
  async startHosting(roomId: string, joinKey: string, port: number = 8080): Promise<string> {
    // Generate a simple connection URL for QR code
    const localIP = await this.getLocalIP();
    const connectionUrl = `ws://${localIP}:${port}?room=${roomId}&key=${joinKey}`;
    
    // Start the WebSocket server using the existing transport
    // This will be handled by the WebSocketTransport in the existing system
    
    return connectionUrl;
  }

  // For baby device: connect to parent's hosted session
  async connectToHost(connectionUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(connectionUrl);
        
        this.ws.onopen = () => {
          console.log('[LanSignaling] Connected to host');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[LanSignaling] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[LanSignaling] Disconnected from host');
        };

        this.ws.onmessage = async (event) => {
          try {
            const msg: LanSignalingMessage = JSON.parse(event.data);
            await this.handleMessage(msg);
          } catch (error) {
            console.error('[LanSignaling] Error handling message:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Send offer to the connected peer
  async sendOffer(offer: RTCSessionDescription, roomId: string, joinKey: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to host');
    }

    const message: LanSignalingMessage = {
      type: 'offer',
      data: offer,
      roomId,
      joinKey
    };

    this.ws.send(JSON.stringify(message));
  }

  // Send answer to the connected peer
  async sendAnswer(answer: RTCSessionDescription, roomId: string, joinKey: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to host');
    }

    const message: LanSignalingMessage = {
      type: 'answer',
      data: answer,
      roomId,
      joinKey
    };

    this.ws.send(JSON.stringify(message));
  }

  // Send ICE candidate to the connected peer
  async sendIceCandidate(candidate: RTCIceCandidate, roomId: string, joinKey: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to host');
    }

    const message: LanSignalingMessage = {
      type: 'ice-candidate',
      data: candidate,
      roomId,
      joinKey
    };

    this.ws.send(JSON.stringify(message));
  }

  private async handleMessage(msg: LanSignalingMessage): Promise<void> {
    switch (msg.type) {
      case 'offer':
        console.log('[LanSignaling] Received offer');
        await this.session.acceptOffer(msg.data);
        
        // Create and send answer
        const answer = await this.session.createAnswer();
        await this.sendAnswer(answer.answer, msg.roomId, msg.joinKey);
        break;

      case 'answer':
        console.log('[LanSignaling] Received answer');
        await this.session.acceptAnswer(msg.data);
        break;

      case 'ice-candidate':
        console.log('[LanSignaling] Received ICE candidate');
        // Handle ICE candidate in the WebRTC session
        break;
    }
  }

  private async getLocalIP(): Promise<string> {
    // For development, return localhost
    // In production, you'd want to get the actual local IP
    if (Platform.OS === 'ios') {
      // iOS can use localhost for same-device testing
      return 'localhost';
    } else {
      // Android might need the actual local IP
      return '192.168.1.100'; // Placeholder - would need actual IP detection
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
