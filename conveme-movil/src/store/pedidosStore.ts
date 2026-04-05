import { create } from 'zustand';
import { Pedido } from '../types/pedido';

interface PedidosStore {
  pedidos: Pedido[];
  selectedPedido: Pedido | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setPedidos: (pedidos: Pedido[]) => void;
  addPedido: (pedido: Pedido) => void;
  updatePedido: (pedido: Pedido) => void;
  removePedido: (id: number) => void;
  setSelectedPedido: (pedido: Pedido | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (query: string) => void;
}

export const usePedidosStore = create<PedidosStore>((set) => ({
  pedidos: [],
  selectedPedido: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setPedidos: (pedidos) => set({ pedidos }),
  addPedido: (pedido) => set((state) => ({ pedidos: [pedido, ...state.pedidos] })),
  updatePedido: (pedido) => set((state) => ({
    pedidos: state.pedidos.map((p) => p.id_pedido === pedido.id_pedido ? pedido : p),
  })),
  removePedido: (id) => set((state) => ({ pedidos: state.pedidos.filter((p) => p.id_pedido !== id) })),
  setSelectedPedido: (selectedPedido) => set({ selectedPedido }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (searchQuery) => set({ searchQuery }),
}));
