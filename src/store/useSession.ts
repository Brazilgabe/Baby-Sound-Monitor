import { create } from 'zustand';

interface SessionState {
  role: 'monitor' | 'listener' | null;
  threshold: number;
  listenerToken: string;
  lastAlert: string | null;
  isMonitoring: boolean;
  setRole: (role: 'monitor' | 'listener' | null) => void;
  setThreshold: (threshold: number) => void;
  setListenerToken: (token: string) => void;
  setLastAlert: (time: string | null) => void;
  setIsMonitoring: (monitoring: boolean) => void;
}

export const useSession = create<SessionState>((set) => ({
  role: null,
  threshold: 0.3, // 30% threshold by default
  listenerToken: '',
  lastAlert: null,
  isMonitoring: false,
  setRole: (role) => set({ role }),
  setThreshold: (threshold) => set({ threshold }),
  setListenerToken: (listenerToken) => set({ listenerToken }),
  setLastAlert: (lastAlert) => set({ lastAlert }),
  setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
}));