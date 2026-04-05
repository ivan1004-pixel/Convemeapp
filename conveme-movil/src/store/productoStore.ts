import { create } from 'zustand';
import type { Producto } from '../types';

interface ProductoState {
  productos: Producto[];
  selectedProducto: Producto | null;
  isLoading: boolean;
  error: string | null;
  setProductos: (productos: Producto[]) => void;
  setSelectedProducto: (producto: Producto | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addProducto: (producto: Producto) => void;
  updateProducto: (updated: Producto) => void;
  removeProducto: (id: number) => void;
}

export const useProductoStore = create<ProductoState>((set) => ({
  productos: [],
  selectedProducto: null,
  isLoading: false,
  error: null,
  setProductos: (productos) => set({ productos }),
  setSelectedProducto: (producto) => set({ selectedProducto: producto }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addProducto: (producto) => set((state) => ({ productos: [...state.productos, producto] })),
  updateProducto: (updated) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id_producto === updated.id_producto ? updated : p
      ),
    })),
  removeProducto: (id) =>
    set((state) => ({ productos: state.productos.filter((p) => p.id_producto !== id) })),
}));
