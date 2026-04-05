import { create } from 'zustand';
import { Venta } from '../types/venta';

interface VentasStore {
  ventas: Venta[];
  selectedVenta: Venta | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setVentas: (ventas: Venta[]) => void;
  addVenta: (venta: Venta) => void;
  updateVenta: (venta: Venta) => void;
  removeVenta: (id: number) => void;
  setSelectedVenta: (venta: Venta | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (query: string) => void;
}

export const useVentasStore = create<VentasStore>((set) => ({
  ventas: [],
  selectedVenta: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setVentas: (ventas) => set({ ventas }),
  addVenta: (venta) => set((state) => ({ ventas: [venta, ...state.ventas] })),
  updateVenta: (venta) => set((state) => ({
    ventas: state.ventas.map((v) => v.id_venta === venta.id_venta ? venta : v),
  })),
  removeVenta: (id) => set((state) => ({ ventas: state.ventas.filter((v) => v.id_venta !== id) })),
  setSelectedVenta: (selectedVenta) => set({ selectedVenta }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (searchQuery) => set({ searchQuery }),
}));
