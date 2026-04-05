import { create } from 'zustand';
import { Producto } from '../types/producto';

interface ProductosStore {
  productos: Producto[];
  selectedProducto: Producto | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setProductos: (productos: Producto[]) => void;
  addProducto: (producto: Producto) => void;
  updateProducto: (producto: Producto) => void;
  removeProducto: (id: number) => void;
  setSelectedProducto: (producto: Producto | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (query: string) => void;
}

export const useProductosStore = create<ProductosStore>((set) => ({
  productos: [],
  selectedProducto: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setProductos: (productos) => set({ productos }),
  addProducto: (producto) => set((state) => ({ productos: [producto, ...state.productos] })),
  updateProducto: (producto) => set((state) => ({
    productos: state.productos.map((p) => p.id_producto === producto.id_producto ? producto : p),
  })),
  removeProducto: (id) => set((state) => ({ productos: state.productos.filter((p) => p.id_producto !== id) })),
  setSelectedProducto: (selectedProducto) => set({ selectedProducto }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (searchQuery) => set({ searchQuery }),
}));
