import { useSession, SessionData, ConnectionType } from '@/src/store/useSession';
import { Platform } from 'react-native';

export type TransportMessage =
  | { type: 'listener:hello'; roomId: string; joinKey: string; mode: string }
  | { type: 'parent:hello'; roomId: string; joinKey: string }
  | { type: 'audio'; roomId: string; data: ArrayBuffer; timestamp: number }
  | { type: 'video'; roomId: string; data: ArrayBuffer; timestamp: number }
  | { type: 'noise:detected'; roomId: string; level: number; timestamp: number }
  | { type: 'session:end'; roomId: string }
  | { type: 'ping'; roomId: string; timestamp: number }
  | { type: 'pong'; roomId: string; timestamp: number }
  | { type: 'mode:change'; roomId: string; joinKey: string; mode: string }
  | { type: 'remote-stream'; roomId: string; stream: MediaStream; timestamp: number };

export interface TransportCallbacks {
  onMessage: (message: TransportMessage) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
  onConnectionStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'failed') => void;
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
    this.callbacks.onConnectionStatusChange('connected');
    this.callbacks.onConnect();
  }

  protected handleDisconnect() {
    this.isConnected = false;
    this.callbacks.onConnectionStatusChange('disconnected');
    this.callbacks.onDisconnect();
  }

  protected handleError(error: string) {
    this.callbacks.onConnectionStatusChange('failed');
    this.callbacks.onError(error);
  }

  protected handleConnecting() {
    this.callbacks.onConnectionStatusChange('connecting');
  }
}

// WebSocket transport for "wifi" connectivity (works anywhere with internet)
export class WebSocketTransport extends BaseTransport {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverUrl: string;

  constructor(roomId: string, joinKey: string, callbacks: TransportCallbacks) {
    super(roomId, joinKey, callbacks);
    
    // Use configurable WebSocket server URL from environment
    // Falls back to a safe echo service if not configured
    const envUrl = process.env.EXPO_PUBLIC_WS_URL;
    if (envUrl) {
      this.serverUrl = `${envUrl}?room=${encodeURIComponent(this.roomId)}&key=${encodeURIComponent(this.joinKey)}`;
    } else {
      this.serverUrl = `wss://ws.postman-echo.com/raw?room=${encodeURIComponent(this.roomId)}&key=${encodeURIComponent(this.joinKey)}`;
      console.warn('[WebSocket] EXPO_PUBLIC_WS_URL not set, using fallback echo service');
    }
  }

  async connect(): Promise<void> {
    try {
      this.handleConnecting();
      
      console.log('[WebSocket] Connecting to:', this.serverUrl);
      
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
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
      try {
        const messageStr = JSON.stringify(message);
        this.ws.send(messageStr);
        console.log('[WebSocket] Sent message:', message.type);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
        this.handleError('Failed to send message');
      }
    } else {
      console.warn('[WebSocket] Cannot send message: WebSocket not ready');
      this.handleError('WebSocket not ready');
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

    console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  // Method to update server URL (useful for switching between environments)
  updateServerUrl(newUrl: string): void {
    this.serverUrl = newUrl;
    if (this.isConnected) {
      console.log('[WebSocket] Updating server URL, reconnecting...');
      this.disconnect();
      this.connect();
    }
  }
}

// Bluetooth transport for "bt" connectivity (nearby devices)
export class BluetoothTransport extends BaseTransport {
  private deviceId: string | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    
    try {
      this.isConnecting = true;
      this.handleConnecting();

      // For mobile, we'll simulate the connection process
      // In a real implementation, this would use React Native Bluetooth libraries
      console.log('[Bluetooth] Simulating connection...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.deviceId = `bt_${Date.now()}`;
      console.log('[Bluetooth] Simulated connection successful');
      this.handleConnect();

    } catch (error) {
      console.error('[Bluetooth] Connection failed:', error);
      this.handleError(`Bluetooth connection failed: ${error}`);
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    this.deviceId = null;
    this.handleDisconnect();
  }

  send(message: TransportMessage): void {
    // Bluetooth has limited bandwidth, so we'll send minimal data
    if (this.isConnected) {
      console.log('[Bluetooth] Sending message:', message.type);
      
      // Simulate sending delay
      setTimeout(() => {
        // Simulate receiving a response for certain message types
        if (message.type === 'ping') {
          this.callbacks.onMessage({
            type: 'pong',
            roomId: message.roomId,
            timestamp: Date.now(),
          });
        }
      }, 100);
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// WebRTC transport for "wifi" connectivity (same WiFi network)
export class WebRTCTransport extends BaseTransport {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isInitiator: boolean = false;
  private signalingServer: WebSocket | null = null;

  constructor(roomId: string, joinKey: string, callbacks: TransportCallbacks) {
    super(roomId, joinKey, callbacks);
  }

  async connect(): Promise<void> {
    try {
      this.handleConnecting();
      
      // Create peer connection with STUN servers for NAT traversal
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });

      // Set up data channel for signaling
      this.dataChannel = this.peerConnection.createDataChannel('signaling', {
        ordered: true,
        maxRetransmits: 3
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

      this.dataChannel.onerror = (error) => {
        console.error('[WebRTC] Data channel error:', error);
        this.handleError('Data channel error');
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate generated:', event.candidate);
          // Send ICE candidate to signaling server
          this.sendToSignalingServer({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId: this.roomId
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', this.peerConnection?.connectionState);
        
        switch (this.peerConnection?.connectionState) {
          case 'connected':
            console.log('[WebRTC] Peer connection established');
            break;
          case 'disconnected':
            console.log('[WebRTC] Peer connection disconnected');
            this.handleDisconnect();
            break;
          case 'failed':
            console.log('[WebRTC] Peer connection failed');
            this.handleError('Peer connection failed');
            break;
        }
      };

      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Remote track received');
        this.remoteStream = event.streams[0];
        
        // Notify about remote stream
        this.callbacks.onMessage({
          type: 'remote-stream',
          roomId: this.roomId,
          stream: this.remoteStream,
          timestamp: Date.now()
        } as any);
      };

      // Connect to signaling server
      await this.connectToSignalingServer();

    } catch (error) {
      console.error('[WebRTC] Setup failed:', error);
      this.handleError('Failed to setup WebRTC connection');
    }
  }

  private async connectToSignalingServer(): Promise<void> {
    try {
      // Connect to signaling server for WebRTC coordination
      // In production, this would be your own signaling server
      const signalingUrl = `wss://echo.websocket.org/?room=${encodeURIComponent(this.roomId)}&type=signaling`;
      
      this.signalingServer = new WebSocket(signalingUrl);
      
      this.signalingServer.onopen = () => {
        console.log('[WebRTC] Connected to signaling server');
        
        // Join the room
        this.sendToSignalingServer({
          type: 'join-room',
          roomId: this.roomId,
          joinKey: this.joinKey
        });
      };

      this.signalingServer.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'room-joined':
              console.log('[WebRTC] Joined room:', data.roomId);
              this.isInitiator = data.isInitiator;
              
              if (this.isInitiator) {
                // Create and send offer
                await this.createAndSendOffer();
              }
              break;
              
            case 'offer':
              console.log('[WebRTC] Received offer');
              await this.handleOffer(data.offer);
              break;
              
            case 'answer':
              console.log('[WebRTC] Received answer');
              await this.handleAnswer(data.answer);
              break;
              
            case 'ice-candidate':
              console.log('[WebRTC] Received ICE candidate');
              if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(data.candidate);
              }
              break;
          }
        } catch (error) {
          console.error('[WebRTC] Failed to handle signaling message:', error);
        }
      };

      this.signalingServer.onerror = (error) => {
        console.error('[WebRTC] Signaling server error:', error);
        this.handleError('Signaling server connection failed');
      };

    } catch (error) {
      console.error('[WebRTC] Failed to connect to signaling server:', error);
      this.handleError('Failed to connect to signaling server');
    }
  }

  private async createAndSendOffer(): Promise<void> {
    try {
      if (!this.peerConnection) return;
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      console.log('[WebRTC] Created offer');
      
      // Send offer to signaling server
      this.sendToSignalingServer({
        type: 'offer',
        offer: offer,
        roomId: this.roomId
      });
      
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
      this.handleError('Failed to create offer');
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) return;
      
      await this.peerConnection.setRemoteDescription(offer);
      console.log('[WebRTC] Set remote description from offer');
      
      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      console.log('[WebRTC] Created answer');
      
      // Send answer to signaling server
      this.sendToSignalingServer({
        type: 'answer',
        answer: answer,
        roomId: this.roomId
      });
      
    } catch (error) {
      console.error('[WebRTC] Failed to handle offer:', error);
      this.handleError('Failed to handle offer');
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) return;
      
      await this.peerConnection.setRemoteDescription(answer);
      console.log('[WebRTC] Set remote description from answer');
      
    } catch (error) {
      console.error('[WebRTC] Failed to handle answer:', error);
      this.handleError('Failed to handle answer');
    }
  }

  private sendToSignalingServer(message: any): void {
    if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
      try {
        this.signalingServer.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebRTC] Failed to send to signaling server:', error);
      }
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

    if (this.signalingServer) {
      this.signalingServer.close();
      this.signalingServer = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.isInitiator = false;
    this.handleDisconnect();
  }

  send(message: TransportMessage): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebRTC] Failed to send message:', error);
        this.handleError('Failed to send message');
      }
    } else {
      console.warn('[WebRTC] Cannot send message: data channel not ready');
      this.handleError('Data channel not ready');
    }
  }

  isReady(): boolean {
    return this.dataChannel?.readyState === 'open' && 
           this.peerConnection?.connectionState === 'connected';
  }

  async addLocalStream(stream: MediaStream): Promise<void> {
    if (this.peerConnection && stream) {
      try {
        this.localStream = stream;
        stream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, stream);
        });
        console.log('[WebRTC] Added local stream tracks');
      } catch (error) {
        console.error('[WebRTC] Failed to add local stream:', error);
        this.handleError('Failed to add local stream');
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Method to get connection statistics
  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      try {
        return await this.peerConnection.getStats();
      } catch (error) {
        console.error('[WebRTC] Failed to get connection stats:', error);
        return null;
      }
    }
    return null;
  }
}

// Transport factory
export class TransportFactory {
  static create(
    connectionType: ConnectionType,
    roomId: string,
    joinKey: string,
    callbacks: TransportCallbacks
  ): BaseTransport {
    switch (connectionType) {
      case 'wifi':
        // For WiFi, check if we're on a native platform before using WebRTC
        if (typeof Platform !== 'undefined' && (Platform.OS === 'ios' || Platform.OS === 'android')) {
          // Use WebRTC for nearby connections on native platforms
          return new WebRTCTransport(roomId, joinKey, callbacks);
        } else {
          throw new Error('WebRTC transport requires native WebRTC library');
        }
      case 'bt':
        return new BluetoothTransport(roomId, joinKey, callbacks);
      default:
        throw new Error(`Unsupported connection type: ${connectionType}`);
    }
  }
}
