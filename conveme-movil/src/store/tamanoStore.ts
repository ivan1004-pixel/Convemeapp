import { create } from 'zustand';
import type { Tamano } from '../types';

interface TamanoState {
  tamanos: Tamano[];
  selectedTamano: Tamano | null;
  isLoading: boolean;
  error: string | null;
  setTamanos: (tamanos: Tamano[]) => void;
  setSelectedTamano: (tamano: Tamano | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTamano: (tamano: Tamano) => void;
  updateTamano: (updated: Tamano) => void;
  removeTamano: (id: number) => void;
}

export const useTamanoStore = create<TamanoState>((set) => ({
  tamanos: [],
  selectedTamano: null,
  isLoading: false,
  error: null,
  setTamanos: (tamanos) => set({ tamanos }),
  setSelectedTamano: (tamano) => set({ selectedTamano: tamano }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTamano: (tamano) => set((state) => ({ tamanos: [...state.tamanos, tamano] })),
  updateTamano: (updated) =>
    set((state) => ({
      tamanos: state.tamanos.map((t) => (t.id_tamano === updated.id_tamano ? updated : t)),
    })),
  removeTamano: (id) =>
    set((state) => ({ tamanos: state.tamanos.filter((t) => t.id_tamano !== id) })),
}));
