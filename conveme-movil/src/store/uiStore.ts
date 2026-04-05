/**
 * Store de UI con Zustand
 * Maneja estados globales de la interfaz: loading, errores, toasts, etc.
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UIState {
  isGlobalLoading: boolean;
  globalLoadingMessage: string | undefined;
  toasts: Toast[];
  error: string | null;

  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  globalLoadingMessage: undefined,
  toasts: [],
  error: null,

  setGlobalLoading: (loading, message) =>
    set({ isGlobalLoading: loading, globalLoadingMessage: message }),

  showToast: (type, message, duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
