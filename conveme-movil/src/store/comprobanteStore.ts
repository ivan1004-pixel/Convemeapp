import { create } from 'zustand';
import type { Comprobante } from '../types';

interface ComprobanteState {
  comprobantes: Comprobante[];
  selectedComprobante: Comprobante | null;
  isLoading: boolean;
  error: string | null;
  setComprobantes: (comprobantes: Comprobante[]) => void;
  setSelectedComprobante: (comprobante: Comprobante | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addComprobante: (comprobante: Comprobante) => void;
  updateComprobante: (updated: Comprobante) => void;
  removeComprobante: (id: number) => void;
}

export const useComprobanteStore = create<ComprobanteState>((set) => ({
  comprobantes: [],
  selectedComprobante: null,
  isLoading: false,
  error: null,
  setComprobantes: (comprobantes) => set({ comprobantes }),
  setSelectedComprobante: (comprobante) => set({ selectedComprobante: comprobante }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addComprobante: (comprobante) =>
    set((state) => ({ comprobantes: [...state.comprobantes, comprobante] })),
  updateComprobante: (updated) =>
    set((state) => ({
      comprobantes: state.comprobantes.map((c) =>
        c.id_comprobante === updated.id_comprobante ? updated : c
      ),
    })),
  removeComprobante: (id) =>
    set((state) => ({
      comprobantes: state.comprobantes.filter((c) => c.id_comprobante !== id),
    })),
}));
