import { create } from 'zustand';
import type { Evento } from '../types';

interface EventoState {
  eventos: Evento[];
  selectedEvento: Evento | null;
  isLoading: boolean;
  error: string | null;
  setEventos: (eventos: Evento[]) => void;
  setSelectedEvento: (evento: Evento | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addEvento: (evento: Evento) => void;
  updateEvento: (updated: Evento) => void;
  removeEvento: (id: number) => void;
}

export const useEventoStore = create<EventoState>((set) => ({
  eventos: [],
  selectedEvento: null,
  isLoading: false,
  error: null,
  setEventos: (eventos) => set({ eventos }),
  setSelectedEvento: (evento) => set({ selectedEvento: evento }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addEvento: (evento) => set((state) => ({ eventos: [...state.eventos, evento] })),
  updateEvento: (updated) =>
    set((state) => ({
      eventos: state.eventos.map((e) => (e.id_evento === updated.id_evento ? updated : e)),
    })),
  removeEvento: (id) =>
    set((state) => ({ eventos: state.eventos.filter((e) => e.id_evento !== id) })),
}));
