import { create } from 'zustand';
import type { Promocion } from '../types';

interface PromocionState {
  promociones: Promocion[];
  selectedPromocion: Promocion | null;
  isLoading: boolean;
  error: string | null;
  setPromociones: (promociones: Promocion[]) => void;
  setSelectedPromocion: (promocion: Promocion | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPromocion: (promocion: Promocion) => void;
  updatePromocion: (updated: Promocion) => void;
  removePromocion: (id: number) => void;
}

export const usePromocionStore = create<PromocionState>((set) => ({
  promociones: [],
  selectedPromocion: null,
  isLoading: false,
  error: null,
  setPromociones: (promociones) => set({ promociones }),
  setSelectedPromocion: (promocion) => set({ selectedPromocion: promocion }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addPromocion: (promocion) =>
    set((state) => ({ promociones: [...state.promociones, promocion] })),
  updatePromocion: (updated) =>
    set((state) => ({
      promociones: state.promociones.map((p) =>
        p.id_promocion === updated.id_promocion ? updated : p
      ),
    })),
  removePromocion: (id) =>
    set((state) => ({ promociones: state.promociones.filter((p) => p.id_promocion !== id) })),
}));
