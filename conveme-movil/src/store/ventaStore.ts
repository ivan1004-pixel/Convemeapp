import { create } from 'zustand';
import type { Venta } from '../types';

interface VentaState {
  ventas: Venta[];
  selectedVenta: Venta | null;
  isLoading: boolean;
  error: string | null;
  setVentas: (ventas: Venta[]) => void;
  setSelectedVenta: (venta: Venta | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addVenta: (venta: Venta) => void;
  updateVenta: (updated: Venta) => void;
  removeVenta: (id: number) => void;
}

export const useVentaStore = create<VentaState>((set) => ({
  ventas: [],
  selectedVenta: null,
  isLoading: false,
  error: null,
  setVentas: (ventas) => set({ ventas }),
  setSelectedVenta: (venta) => set({ selectedVenta: venta }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addVenta: (venta) => set((state) => ({ ventas: [...state.ventas, venta] })),
  updateVenta: (updated) =>
    set((state) => ({
      ventas: state.ventas.map((v) => (v.id_venta === updated.id_venta ? updated : v)),
    })),
  removeVenta: (id) =>
    set((state) => ({ ventas: state.ventas.filter((v) => v.id_venta !== id) })),
}));
