import { create } from 'zustand';
import type { Asignacion } from '../types';

interface AsignacionState {
  asignaciones: Asignacion[];
  selectedAsignacion: Asignacion | null;
  isLoading: boolean;
  error: string | null;
  setAsignaciones: (asignaciones: Asignacion[]) => void;
  setSelectedAsignacion: (asignacion: Asignacion | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addAsignacion: (asignacion: Asignacion) => void;
  updateAsignacion: (updated: Asignacion) => void;
  removeAsignacion: (id: number) => void;
}

export const useAsignacionStore = create<AsignacionState>((set) => ({
  asignaciones: [],
  selectedAsignacion: null,
  isLoading: false,
  error: null,
  setAsignaciones: (asignaciones) => set({ asignaciones }),
  setSelectedAsignacion: (asignacion) => set({ selectedAsignacion: asignacion }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addAsignacion: (asignacion) =>
    set((state) => ({ asignaciones: [...state.asignaciones, asignacion] })),
  updateAsignacion: (updated) =>
    set((state) => ({
      asignaciones: state.asignaciones.map((a) =>
        a.id_asignacion === updated.id_asignacion ? updated : a
      ),
    })),
  removeAsignacion: (id) =>
    set((state) => ({
      asignaciones: state.asignaciones.filter((a) => a.id_asignacion !== id),
    })),
}));
