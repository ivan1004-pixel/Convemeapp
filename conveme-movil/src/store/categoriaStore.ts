import { create } from 'zustand';
import type { Categoria } from '../types';

interface CategoriaState {
  categorias: Categoria[];
  selectedCategoria: Categoria | null;
  isLoading: boolean;
  error: string | null;
  setCategorias: (categorias: Categoria[]) => void;
  setSelectedCategoria: (categoria: Categoria | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCategoria: (categoria: Categoria) => void;
  updateCategoria: (updated: Categoria) => void;
  removeCategoria: (id: number) => void;
}

export const useCategoriaStore = create<CategoriaState>((set) => ({
  categorias: [],
  selectedCategoria: null,
  isLoading: false,
  error: null,
  setCategorias: (categorias) => set({ categorias }),
  setSelectedCategoria: (categoria) => set({ selectedCategoria: categoria }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCategoria: (categoria) =>
    set((state) => ({ categorias: [...state.categorias, categoria] })),
  updateCategoria: (updated) =>
    set((state) => ({
      categorias: state.categorias.map((c) =>
        c.id_categoria === updated.id_categoria ? updated : c
      ),
    })),
  removeCategoria: (id) =>
    set((state) => ({
      categorias: state.categorias.filter((c) => c.id_categoria !== id),
    })),
}));
