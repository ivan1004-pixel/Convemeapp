import { create } from 'zustand';
import { Cliente } from '../types/cliente';

interface ClientesStore {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setClientes: (clientes: Cliente[]) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (cliente: Cliente) => void;
  removeCliente: (id: number) => void;
  setSelectedCliente: (cliente: Cliente | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (query: string) => void;
}

export const useClientesStore = create<ClientesStore>((set) => ({
  clientes: [],
  selectedCliente: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setClientes: (clientes) => set({ clientes }),
  addCliente: (cliente) => set((state) => ({ clientes: [cliente, ...state.clientes] })),
  updateCliente: (cliente) => set((state) => ({
    clientes: state.clientes.map((c) => c.id_cliente === cliente.id_cliente ? cliente : c),
  })),
  removeCliente: (id) => set((state) => ({ clientes: state.clientes.filter((c) => c.id_cliente !== id) })),
  setSelectedCliente: (selectedCliente) => set({ selectedCliente }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (searchQuery) => set({ searchQuery }),
}));
