import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { Usuario } from '../types';

interface AuthState {
  token: string | null;
  usuario: (Usuario & { rol_id: number; id_vendedor?: number | null }) | null;
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
  partialize: (state) => ({
    // 🟢 Guardamos el token
    token: state.token,
    // 🟢 Guardamos el estado de autenticación
    isAuthenticated: state.isAuthenticated,
    // 🟢 Guardamos el usuario pero EXCLUIMOS la foto_perfil
    // porque en Base64 supera el límite de 2048 bytes de SecureStore
    usuario: state.usuario ? {
      ...state.usuario,
      foto_perfil: undefined // No persistimos la imagen base64 pesada
    } : null,
  }),
  storage: createJSONStorage(() => ({
    getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
    setItem: async (name, value) => SecureStore.setItemAsync(name, value),
    removeItem: async (name) => SecureStore.deleteItemAsync(name),
  })),
},
  ),
);
