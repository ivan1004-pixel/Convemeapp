import { create } from 'zustand';
import type { Vendedor } from '../types';

interface VendedorState {
  vendedores: Vendedor[];
  selectedVendedor: Vendedor | null;
  isLoading: boolean;
  error: string | null;
  setVendedores: (vendedores: Vendedor[]) => void;
  setSelectedVendedor: (vendedor: Vendedor | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addVendedor: (vendedor: Vendedor) => void;
  updateVendedor: (updated: Vendedor) => void;
  removeVendedor: (id: number) => void;
}

export const useVendedorStore = create<VendedorState>((set) => ({
  vendedores: [],
  selectedVendedor: null,
  isLoading: false,
  error: null,
  setVendedores: (vendedores) => set({ vendedores }),
  setSelectedVendedor: (vendedor) => set({ selectedVendedor: vendedor }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addVendedor: (vendedor) =>
    set((state) => ({ vendedores: [...state.vendedores, vendedor] })),
  updateVendedor: (updated) =>
    set((state) => ({
      vendedores: state.vendedores.map((v) =>
        v.id_vendedor === updated.id_vendedor ? updated : v
      ),
    })),
  removeVendedor: (id) =>
    set((state) => ({ vendedores: state.vendedores.filter((v) => v.id_vendedor !== id) })),
}));
