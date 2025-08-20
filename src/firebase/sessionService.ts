import { ref, set, get, onValue, off, push, remove, DatabaseReference } from 'firebase/database';
import { database } from './config';
import { SessionData, ConnectionType, StreamMode, Sensitivity } from '../store/useSession';

export interface FirebaseSessionData extends Omit<SessionData, 'timestamp'> {
  timestamp: number;
  lastActivity: number;
  isActive: boolean;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'session-info';
  roomId: string;
  joinKey: string;
  data?: any;
  timestamp: number;
}

export class FirebaseSessionService {
  private sessionsRef: DatabaseReference;
  private signalingRef: DatabaseReference;

  constructor() {
    this.sessionsRef = ref(database, 'sessions');
    this.signalingRef = ref(database, 'signaling');
  }

  // Create a new session
  async createSession(sessionData: SessionData): Promise<void> {
    const firebaseSession: FirebaseSessionData = {
      ...sessionData,
      lastActivity: Date.now(),
      isActive: true,
    };

    const sessionRef = ref(database, `sessions/${sessionData.roomId}`);
    await set(sessionRef, firebaseSession);
  }

  // Join an existing session
  async joinSession(roomId: string, joinKey: string): Promise<FirebaseSessionData | null> {
    const sessionRef = ref(database, `sessions/${roomId}`);
    const snapshot = await get(sessionRef);
    
    if (snapshot.exists()) {
      const session = snapshot.val() as FirebaseSessionData;
      if (session.joinKey === joinKey && session.isActive) {
        // Update last activity
        await set(ref(database, `sessions/${roomId}/lastActivity`), Date.now());
        return session;
      }
    }
    
    return null;
  }

  // Listen for session updates
  onSessionUpdate(roomId: string, callback: (session: FirebaseSessionData | null) => void): () => void {
    const sessionRef = ref(database, `sessions/${roomId}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as FirebaseSessionData);
      } else {
        callback(null);
      }
    });

    return () => off(sessionRef, 'value', unsubscribe);
  }

  // End a session
  async endSession(roomId: string): Promise<void> {
    const sessionRef = ref(database, `sessions/${roomId}`);
    await set(ref(database, `sessions/${roomId}/isActive`), false);
    await set(ref(database, `sessions/${roomId}/lastActivity`), Date.now());
  }

  // Send signaling message for WebRTC
  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    const messageRef = push(ref(database, `signaling/${message.roomId}`));
    await set(messageRef, message);
  }

  // Listen for signaling messages
  onSignalingMessage(roomId: string, callback: (message: SignalingMessage) => void): () => void {
    const signalingRef = ref(database, `signaling/${roomId}`);
    
    const unsubscribe = onValue(signalingRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = snapshot.val();
        // Get the latest message
        const messageKeys = Object.keys(messages);
        if (messageKeys.length > 0) {
          const latestKey = messageKeys[messageKeys.length - 1];
          const message = messages[latestKey] as SignalingMessage;
          callback(message);
        }
      }
    });

    return () => off(signalingRef, 'value', unsubscribe);
  }

  // Clean up old sessions (for maintenance)
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const sessionsRef = ref(database, 'sessions');
    
    const snapshot = await get(sessionsRef);
    if (snapshot.exists()) {
      const sessions = snapshot.val();
      const cleanupPromises: Promise<void>[] = [];
      
      Object.entries(sessions).forEach(([roomId, session]: [string, any]) => {
        if (session.lastActivity < cutoffTime) {
          cleanupPromises.push(remove(ref(database, `sessions/${roomId}`)));
        }
      });
      
      await Promise.all(cleanupPromises);
    }
  }
}

export default new FirebaseSessionService();
