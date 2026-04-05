import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Usuario, UserRole } from '../types/auth';
import { getRoleFromId } from '../constants/permissions';
import { TOKEN_KEY } from '../constants/api';

interface AuthStore {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUsuario: (usuario: Usuario) => void;
  setAuth: (token: string, usuario: Usuario) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  getRole: () => UserRole | null;
}

const secureStorage = createJSONStorage(() => ({
  getItem: async (name: string) => await SecureStore.getItemAsync(name) ?? null,
  setItem: async (name: string, value: string) => { await SecureStore.setItemAsync(name, value); },
  removeItem: async (name: string) => { await SecureStore.deleteItemAsync(name); },
}));

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      isLoading: false,
      setToken: (token) => set({ token, isAuthenticated: true }),
      setUsuario: (usuario) => set({ usuario }),
      setAuth: (token, usuario) => set({ token, usuario, isAuthenticated: true }),
      logout: () => set({ token: null, usuario: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
      getRole: () => {
        const { usuario } = get();
        if (!usuario) return null;
        return usuario.rol ?? getRoleFromId(usuario.rol_id);
      },
    }),
    {
      name: TOKEN_KEY,
      storage: secureStorage,
    }
  )
);
