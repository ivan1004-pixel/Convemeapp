/**
 * Store de autenticación con Zustand
 * Persiste el estado del usuario en memoria (el token en SecureStore)
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  id_usuario: number;
  username: string;
  rol_id: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  /** Guarda el token en SecureStore y actualiza el estado */
  setAuth: async (token: string, user: AuthUser) => {
    await SecureStore.setItemAsync('token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  /** Cierra sesión: elimina el token de SecureStore y limpia el estado */
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  /** Carga el token almacenado al iniciar la app */
  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user: AuthUser) => set({ user }),
}));
