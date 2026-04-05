export interface DetalleVenta {
  id_detalle?: number;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  producto?: { id_producto: number; nombre: string; sku: string };
  id_producto?: number;
}

export interface Venta {
  id_venta: number;
  fecha_venta?: string;
  monto_total: number;
  metodo_pago?: string;
  estado?: string;
  notas?: string;
  vendedor?: { id_vendedor?: number; nombre_completo: string };
  cliente?: { id_cliente?: number; nombre_completo?: string };
  detalles?: DetalleVenta[];
}

export interface CreateVentaInput {
  metodo_pago: string;
  notas?: string;
  detalles: Array<{ id_producto: number; cantidad: number; precio_unitario: number }>;
}
