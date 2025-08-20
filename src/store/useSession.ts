import { create } from 'zustand';

export type Role = 'listener' | 'parent';
export type SessionState = 'idle' | 'pairing' | 'connecting' | 'streaming' | 'paused' | 'disconnected';
export type StreamMode = 'audio' | 'audio+video';
export type Sensitivity = 'low' | 'medium' | 'high';
export type ConnectionType = 'wifi' | 'bt';

export interface SessionData {
  roomId: string;
  joinKey: string;
  mode: StreamMode;
  sensitivity: Sensitivity;
  connectionType: ConnectionType;
  createdAt: number;
  expiresAt: number;
  timestamp: number;
}

interface AppState {
  // Role and navigation
  role: Role | null;
  setRole: (role: Role | null) => void;
  
  // Session management
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  
  // Current session data
  currentSession: SessionData | null;
  setCurrentSession: (session: SessionData | null) => void;
  
  // Stream configuration
  streamMode: StreamMode;
  setStreamMode: (mode: StreamMode) => void;
  
  sensitivity: Sensitivity;
  setSensitivity: (sensitivity: Sensitivity) => void;
  
  connectionType: ConnectionType;
  setConnectionType: (type: ConnectionType) => void;
  
  // Audio monitoring
  threshold: number;
  setThreshold: (threshold: number) => void;
  
  // Notifications
  lastAlert: string | null;
  setLastAlert: (alert: string | null) => void;
  
  // Connection status
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  
  // Connection details
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'failed') => void;
  
  // Reconnection attempts
  reconnectAttempts: number;
  setReconnectAttempts: (attempts: number) => void;
  
  // Reset session (for cleanup)
  resetSession: () => void;
  
  // Generate new session
  generateNewSession: () => SessionData;
}

export const useSession = create<AppState>((set, get) => ({
  // Initial state
  role: null,
  sessionState: 'idle',
  currentSession: null,
  streamMode: 'audio',
  sensitivity: 'medium',
  connectionType: 'wifi',
  threshold: 0.5,
  lastAlert: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  
  // Actions
  setRole: (role) => set({ role }),
  setSessionState: (state) => set({ sessionState: state }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setStreamMode: (mode) => set({ streamMode: mode }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setConnectionType: (type) => set({ connectionType: type }),
  setThreshold: (threshold) => set({ threshold }),
  setLastAlert: (alert) => set({ lastAlert: alert }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setReconnectAttempts: (attempts) => set({ reconnectAttempts: attempts }),
  
  resetSession: () => set({
    sessionState: 'idle',
    currentSession: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    reconnectAttempts: 0,
    lastAlert: null,
  }),
  
  generateNewSession: () => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const joinKey = `key_${Math.random().toString(36).substr(2, 12)}`;
    const createdAt = Date.now();
    const expiresAt = createdAt + (10 * 60 * 1000); // 10 minutes
    
    const session: SessionData = {
      roomId,
      joinKey,
      mode: get().streamMode,
      sensitivity: get().sensitivity,
      connectionType: get().connectionType,
      createdAt,
      expiresAt,
      timestamp: createdAt,
    };
    
    set({ currentSession: session, sessionState: 'pairing' });
    return session;
  },
}));