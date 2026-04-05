import { create } from 'zustand';
import type { Pedido } from '../types';

interface PedidoState {
  pedidos: Pedido[];
  selectedPedido: Pedido | null;
  isLoading: boolean;
  error: string | null;
  setPedidos: (pedidos: Pedido[]) => void;
  setSelectedPedido: (pedido: Pedido | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPedido: (pedido: Pedido) => void;
  updatePedido: (updated: Pedido) => void;
  removePedido: (id: number) => void;
}

export const usePedidoStore = create<PedidoState>((set) => ({
  pedidos: [],
  selectedPedido: null,
  isLoading: false,
  error: null,
  setPedidos: (pedidos) => set({ pedidos }),
  setSelectedPedido: (pedido) => set({ selectedPedido: pedido }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addPedido: (pedido) => set((state) => ({ pedidos: [...state.pedidos, pedido] })),
  updatePedido: (updated) =>
    set((state) => ({
      pedidos: state.pedidos.map((p) => (p.id_pedido === updated.id_pedido ? updated : p)),
    })),
  removePedido: (id) =>
    set((state) => ({ pedidos: state.pedidos.filter((p) => p.id_pedido !== id) })),
}));
