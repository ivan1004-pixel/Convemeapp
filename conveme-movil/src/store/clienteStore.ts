import { create } from 'zustand';
import type { Cliente } from '../types';

interface ClienteState {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  isLoading: boolean;
  error: string | null;
  setClientes: (clientes: Cliente[]) => void;
  setSelectedCliente: (cliente: Cliente | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (updated: Cliente) => void;
  removeCliente: (id: number) => void;
}

export const useClienteStore = create<ClienteState>((set) => ({
  clientes: [],
  selectedCliente: null,
  isLoading: false,
  error: null,
  setClientes: (clientes) => set({ clientes }),
  setSelectedCliente: (cliente) => set({ selectedCliente: cliente }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
  updateCliente: (updated) =>
    set((state) => ({
      clientes: state.clientes.map((c) => (c.id_cliente === updated.id_cliente ? updated : c)),
    })),
  removeCliente: (id) =>
    set((state) => ({ clientes: state.clientes.filter((c) => c.id_cliente !== id) })),
}));
