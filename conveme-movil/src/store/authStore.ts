import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { Usuario } from '../types';

interface AuthState {
  token: string | null;
  usuario: (Usuario & { rol_id: number }) | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUsuario: (usuario: AuthState['usuario']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: true }),
      setUsuario: (usuario) => set({ usuario }),
      logout: () => set({ token: null, usuario: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
        setItem: async (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: async (name) => SecureStore.deleteItemAsync(name),
      })),
    }
  )
);
