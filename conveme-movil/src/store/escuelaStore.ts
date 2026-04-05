import { create } from 'zustand';
import type { Escuela } from '../types';

interface EscuelaState {
  escuelas: Escuela[];
  selectedEscuela: Escuela | null;
  isLoading: boolean;
  error: string | null;
  setEscuelas: (escuelas: Escuela[]) => void;
  setSelectedEscuela: (escuela: Escuela | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addEscuela: (escuela: Escuela) => void;
  updateEscuela: (updated: Escuela) => void;
  removeEscuela: (id: number) => void;
}

export const useEscuelaStore = create<EscuelaState>((set) => ({
  escuelas: [],
  selectedEscuela: null,
  isLoading: false,
  error: null,
  setEscuelas: (escuelas) => set({ escuelas }),
  setSelectedEscuela: (escuela) => set({ selectedEscuela: escuela }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addEscuela: (escuela) => set((state) => ({ escuelas: [...state.escuelas, escuela] })),
  updateEscuela: (updated) =>
    set((state) => ({
      escuelas: state.escuelas.map((e) => (e.id_escuela === updated.id_escuela ? updated : e)),
    })),
  removeEscuela: (id) =>
    set((state) => ({ escuelas: state.escuelas.filter((e) => e.id_escuela !== id) })),
}));
