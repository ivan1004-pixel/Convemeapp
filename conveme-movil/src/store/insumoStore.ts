import { create } from 'zustand';
import type { Insumo } from '../types';

interface InsumoState {
  insumos: Insumo[];
  selectedInsumo: Insumo | null;
  isLoading: boolean;
  error: string | null;
  setInsumos: (insumos: Insumo[]) => void;
  setSelectedInsumo: (insumo: Insumo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addInsumo: (insumo: Insumo) => void;
  updateInsumo: (updated: Insumo) => void;
  removeInsumo: (id: number) => void;
}

export const useInsumoStore = create<InsumoState>((set) => ({
  insumos: [],
  selectedInsumo: null,
  isLoading: false,
  error: null,
  setInsumos: (insumos) => set({ insumos }),
  setSelectedInsumo: (insumo) => set({ selectedInsumo: insumo }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addInsumo: (insumo) => set((state) => ({ insumos: [...state.insumos, insumo] })),
  updateInsumo: (updated) =>
    set((state) => ({
      insumos: state.insumos.map((i) => (i.id_insumo === updated.id_insumo ? updated : i)),
    })),
  removeInsumo: (id) =>
    set((state) => ({ insumos: state.insumos.filter((i) => i.id_insumo !== id) })),
}));
