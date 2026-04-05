import { create } from 'zustand';

interface PrediccionVentas {
  mes_predicho: string;
  ventas_esperadas: number;
  factor_alpha: number;
  crecimiento_pct: number;
  confianza_pct: number;
}

interface PrediccionDemanda {
  producto: string;
  piezas_necesarias: number;
  tendencia: string;
  confianza_pct: number;
}

interface PrediccionState {
  prediccionVentas: PrediccionVentas | null;
  prediccionDemanda: PrediccionDemanda[];
  isLoading: boolean;
  error: string | null;
  setPrediccionVentas: (data: PrediccionVentas | null) => void;
  setPrediccionDemanda: (data: PrediccionDemanda[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePrediccionStore = create<PrediccionState>((set) => ({
  prediccionVentas: null,
  prediccionDemanda: [],
  isLoading: false,
  error: null,
  setPrediccionVentas: (prediccionVentas) => set({ prediccionVentas }),
  setPrediccionDemanda: (prediccionDemanda) => set({ prediccionDemanda }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
