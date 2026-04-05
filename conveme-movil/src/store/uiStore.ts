import { create } from 'zustand';

interface UIStore {
  isConnected: boolean;
  isSyncing: boolean;
  globalError: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  setConnected: (connected: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setGlobalError: (error: string | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isConnected: true,
  isSyncing: false,
  globalError: null,
  toast: null,
  setConnected: (isConnected) => set({ isConnected }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setGlobalError: (globalError) => set({ globalError }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
