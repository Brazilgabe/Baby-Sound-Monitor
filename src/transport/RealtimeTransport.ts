import { useSession, SessionData, Connectivity } from '@/src/store/useSession';

export type TransportMessage =
  | { type: 'listener:hello'; roomId: string; joinKey: string; mode: string }
  | { type: 'parent:hello'; roomId: string; joinKey: string }
  | { type: 'audio'; roomId: string; data: ArrayBuffer; timestamp: number }
  | { type: 'video'; roomId: string; data: ArrayBuffer; timestamp: number }
  | { type: 'noise:detected'; roomId: string; level: number; timestamp: number }
  | { type: 'session:end'; roomId: string }
  | { type: 'ping'; roomId: string; timestamp: number }
  | { type: 'pong'; roomId: string; timestamp: number }
  | { type: 'mode:change'; roomId: string; joinKey: string; mode: string };

export interface TransportCallbacks {
  onMessage: (message: TransportMessage) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
}

export abstract class BaseTransport {
  protected roomId: string;
  protected joinKey: string;
  protected callbacks: TransportCallbacks;
  protected isConnected = false;

  constructor(roomId: string, joinKey: string, callbacks: TransportCallbacks) {
    this.roomId = roomId;
    this.joinKey = joinKey;
    this.callbacks = callbacks;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): void;
  abstract send(message: TransportMessage): void;
  abstract isReady(): boolean;

  protected validateMessage(message: TransportMessage): boolean {
    return message.roomId === this.roomId &&
           (message as any).joinKey === this.joinKey;
  }

  protected handleConnect() {
    this.isConnected = true;
    this.callbacks.onConnect();
  }

  protected handleDisconnect() {
    this.isConnected = false;
    this.callbacks.onDisconnect();
  }

  protected handleError(error: string) {
    this.callbacks.onError(error);
  }
}

// WebSocket transport for "anywhere" connectivity
export class WebSocketTransport extends BaseTransport {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    try {
      // Use a public WebSocket service for demo purposes
      // In production, use your own WebSocket server
      const url = `wss://echo.websocket.org/?room=${encodeURIComponent(this.roomId)}&key=${encodeURIComponent(this.joinKey)}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.handleConnect();

        // Send initial hello message
        this.send({
          type: 'listener:hello',
          roomId: this.roomId,
          joinKey: this.joinKey,
          mode: 'audio'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as TransportMessage;
          if (this.validateMessage(message)) {
            this.callbacks.onMessage(message);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.handleDisconnect();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.handleError('WebSocket connection failed');
      };

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.handleError('Failed to establish WebSocket connection');
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  send(message: TransportMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  isReady(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimer = setTimeout(() => {
      console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }
}

// WebRTC transport for "nearby" connectivity (same WiFi)
export class WebRTCTransport extends BaseTransport {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;

  async connect(): Promise<void> {
    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Set up data channel for signaling
      this.dataChannel = this.peerConnection.createDataChannel('signaling', {
        ordered: true
      });

      this.dataChannel.onopen = () => {
        console.log('[WebRTC] Data channel opened');
        this.handleConnect();
      };

      this.dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as TransportMessage;
          if (this.validateMessage(message)) {
            this.callbacks.onMessage(message);
          }
        } catch (error) {
          console.error('[WebRTC] Failed to parse message:', error);
        }
      };

      this.dataChannel.onclose = () => {
        console.log('[WebRTC] Data channel closed');
        this.handleDisconnect();
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real app, you'd send this to the other peer via signaling server
          console.log('[WebRTC] ICE candidate:', event.candidate);
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', this.peerConnection?.connectionState);
      };

    } catch (error) {
      console.error('[WebRTC] Setup failed:', error);
      this.handleError('Failed to setup WebRTC connection');
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.isConnected = false;
  }

  send(message: TransportMessage): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  isReady(): boolean {
    return this.dataChannel?.readyState === 'open';
  }

  async addLocalStream(stream: MediaStream): Promise<void> {
    if (this.peerConnection && stream) {
      this.localStream = stream;
      stream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, stream);
      });
    }
  }
}

// Transport factory
export class TransportFactory {
  static create(
    connectivity: Connectivity,
    roomId: string,
    joinKey: string,
    callbacks: TransportCallbacks
  ): BaseTransport {
    switch (connectivity) {
      case 'nearby':
        return new WebRTCTransport(roomId, joinKey, callbacks);
      case 'anywhere':
        return new WebSocketTransport(roomId, joinKey, callbacks);
      default:
        throw new Error(`Unsupported connectivity type: ${connectivity}`);
    }
  }
}
