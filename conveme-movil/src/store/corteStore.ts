import { create } from 'zustand';
import type { Corte } from '../types';

interface CorteState {
  cortes: Corte[];
  selectedCorte: Corte | null;
  isLoading: boolean;
  error: string | null;
  setCortes: (cortes: Corte[]) => void;
  setSelectedCorte: (corte: Corte | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCorte: (corte: Corte) => void;
  updateCorte: (updated: Corte) => void;
  removeCorte: (id: number) => void;
}

export const useCorteStore = create<CorteState>((set) => ({
  cortes: [],
  selectedCorte: null,
  isLoading: false,
  error: null,
  setCortes: (cortes) => set({ cortes }),
  setSelectedCorte: (corte) => set({ selectedCorte: corte }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCorte: (corte) => set((state) => ({ cortes: [...state.cortes, corte] })),
  updateCorte: (updated) =>
    set((state) => ({
      cortes: state.cortes.map((c) => (c.id_corte === updated.id_corte ? updated : c)),
    })),
  removeCorte: (id) =>
    set((state) => ({ cortes: state.cortes.filter((c) => c.id_corte !== id) })),
}));
