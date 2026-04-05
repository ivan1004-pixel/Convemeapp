export interface Categoria { id_categoria: number; nombre: string }
export interface Tamano { id_tamano: number; descripcion: string }
export interface Producto {
  id_producto: number;
  sku: string;
  nombre: string;
  precio_unitario: number;
  precio_mayoreo?: number;
  cantidad_minima_mayoreo?: number;
  costo_produccion?: number;
  imagen_url?: string;
  activo?: boolean;
  categoria?: Categoria;
  tamano?: Tamano;
  id_categoria?: number;
  id_tamano?: number;
}
