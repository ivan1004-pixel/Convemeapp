import { create } from 'zustand';
import type { Usuario } from '../types';

interface UsuarioState {
  usuarios: Usuario[];
  selectedUsuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  setUsuarios: (usuarios: Usuario[]) => void;
  setSelectedUsuario: (usuario: Usuario | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addUsuario: (usuario: Usuario) => void;
  updateUsuario: (updated: Usuario) => void;
  removeUsuario: (id: number) => void;
}

export const useUsuarioStore = create<UsuarioState>((set) => ({
  usuarios: [],
  selectedUsuario: null,
  isLoading: false,
  error: null,
  setUsuarios: (usuarios) => set({ usuarios }),
  setSelectedUsuario: (usuario) => set({ selectedUsuario: usuario }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addUsuario: (usuario) =>
    set((state) => ({ usuarios: [...state.usuarios, usuario] })),
  updateUsuario: (updated) =>
    set((state) => ({
      usuarios: state.usuarios.map((u) =>
        u.id_usuario === updated.id_usuario ? updated : u
      ),
    })),
  removeUsuario: (id) =>
    set((state) => ({ usuarios: state.usuarios.filter((u) => u.id_usuario !== id) })),
}));
