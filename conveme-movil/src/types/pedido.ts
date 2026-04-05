export interface Pedido {
  id_pedido: number;
  fecha_pedido?: string;
  fecha_entrega?: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  total?: number;
  notas?: string;
  cliente?: { id_cliente?: number; nombre_completo: string };
  vendedor?: { nombre_completo: string };
  detalles?: Array<{
    id_detalle?: number;
    cantidad: number;
    precio_unitario: number;
    producto?: { nombre: string; sku: string };
  }>;
}
