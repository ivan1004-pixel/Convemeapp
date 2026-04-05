import { create } from 'zustand';
import type { OrdenProduccion } from '../types';

interface ProduccionState {
  ordenesProduccion: OrdenProduccion[];
  selectedOrden: OrdenProduccion | null;
  isLoading: boolean;
  error: string | null;
  setOrdenesProduccion: (ordenes: OrdenProduccion[]) => void;
  setSelectedOrden: (orden: OrdenProduccion | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addOrden: (orden: OrdenProduccion) => void;
  updateOrden: (updated: OrdenProduccion) => void;
  removeOrden: (id: number) => void;
}

export const useProduccionStore = create<ProduccionState>((set) => ({
  ordenesProduccion: [],
  selectedOrden: null,
  isLoading: false,
  error: null,
  setOrdenesProduccion: (ordenesProduccion) => set({ ordenesProduccion }),
  setSelectedOrden: (orden) => set({ selectedOrden: orden }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addOrden: (orden) =>
    set((state) => ({ ordenesProduccion: [...state.ordenesProduccion, orden] })),
  updateOrden: (updated) =>
    set((state) => ({
      ordenesProduccion: state.ordenesProduccion.map((o) =>
        o.id_orden_produccion === updated.id_orden_produccion ? updated : o
      ),
    })),
  removeOrden: (id) =>
    set((state) => ({
      ordenesProduccion: state.ordenesProduccion.filter(
        (o) => o.id_orden_produccion !== id
      ),
    })),
}));
