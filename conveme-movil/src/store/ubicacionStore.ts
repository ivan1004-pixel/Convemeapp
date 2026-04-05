import { create } from 'zustand';
import type { Estado, Municipio } from '../types';

interface UbicacionState {
  estados: Estado[];
  municipios: Municipio[];
  isLoading: boolean;
  error: string | null;
  setEstados: (estados: Estado[]) => void;
  setMunicipios: (municipios: Municipio[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUbicacionStore = create<UbicacionState>((set) => ({
  estados: [],
  municipios: [],
  isLoading: false,
  error: null,
  setEstados: (estados) => set({ estados }),
  setMunicipios: (municipios) => set({ municipios }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
