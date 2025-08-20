import { useSession, ConnectionType, SessionData } from '@/src/store/useSession';
import { TransportFactory, BaseTransport, TransportMessage, TransportCallbacks } from './RealtimeTransport';

export interface ConnectionCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: string) => void;
  onMessage: (message: TransportMessage) => void;
}

export class ConnectionManager {
  private transport: BaseTransport | null = null;
  private session: SessionData | null = null;
  private callbacks: ConnectionCallbacks;
  private isConnecting = false;

  constructor(callbacks: ConnectionCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(connectionType: ConnectionType, session: SessionData): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    try {
      this.isConnecting = true;
      this.session = session;

      // Create transport based on connection type
      this.transport = TransportFactory.create(
        connectionType,
        session.roomId,
        session.joinKey,
        {
          onMessage: this.callbacks.onMessage,
          onConnect: this.callbacks.onConnected,
          onDisconnect: this.callbacks.onDisconnected,
          onError: this.callbacks.onError,
          onConnectionStatusChange: (status) => {
            console.log('[ConnectionManager] Connection status:', status);
          }
        }
      );

      // Connect using the transport
      await this.transport.connect();
      
    } catch (error) {
      console.error('[ConnectionManager] Connection failed:', error);
      this.isConnecting = false;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async joinSession(connectionType: ConnectionType, session: SessionData): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    try {
      this.isConnecting = true;
      this.session = session;

      // Create transport based on connection type
      this.transport = TransportFactory.create(
        connectionType,
        session.roomId,
        session.joinKey,
        {
          onMessage: this.callbacks.onMessage,
          onConnect: this.callbacks.onConnected,
          onDisconnect: this.callbacks.onDisconnected,
          onError: this.callbacks.onError,
          onConnectionStatusChange: (status) => {
            console.log('[ConnectionManager] Connection status:', status);
          }
        }
      );

      // Connect using the transport
      await this.transport.connect();
      
    } catch (error) {
      console.error('[ConnectionManager] Failed to join session:', error);
      this.isConnecting = false;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      this.transport.disconnect();
      this.transport = null;
    }
    this.session = null;
  }

  async sendMessage(message: TransportMessage): Promise<void> {
    if (!this.transport || !this.transport.isReady()) {
      throw new Error('Transport not ready');
    }

    this.transport.send(message);
  }

  isConnected(): boolean {
    return this.transport?.isReady() || false;
  }

  getConnectionInfo() {
    if (!this.transport) {
      return null;
    }

    return {
      type: this.session?.connectionType,
      isConnected: this.transport.isReady(),
      roomId: this.session?.roomId,
      joinKey: this.session?.joinKey,
    };
  }
}

// Singleton instance management
let connectionManagerInstance: ConnectionManager | null = null;

export function getConnectionManager(callbacks: ConnectionCallbacks): ConnectionManager {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new ConnectionManager(callbacks);
  }
  return connectionManagerInstance;
}

export function clearConnectionManager(): void {
  if (connectionManagerInstance) {
    connectionManagerInstance.disconnect();
    connectionManagerInstance = null;
  }
}

