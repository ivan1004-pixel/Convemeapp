export interface Usuario {
  id_usuario: number;
  username: string;
  rol_id: number;
  activo?: boolean;
  created_at?: string;
  rol?: { nombre: string };
  id_vendedor?: number; // 👈 Agregado para guardar el ID del vendedor
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Municipio {
  id_municipio: number;
  nombre: string;
  estado?: Estado;
}

export interface Estado {
  id_estado: number;
  nombre: string;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export interface Tamano {
  id_tamano: number;
  descripcion: string;
}

export interface Producto {
  id_producto: number;
  sku: string;
  nombre: string;
  precio_unitario: number;
  precio_mayoreo: number;
  cantidad_minima_mayoreo?: number;
  costo_produccion?: number;
  categoria?: Categoria;
  tamano?: Tamano;
  imagen_url?: string;
}

export interface Cliente {
  id_cliente: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  direccion_envio?: string;
  fecha_registro?: string;
  activo?: boolean;
  usuario?: Usuario;
  vendedor?: Vendedor;
  vendedor_id?: number; // ID directo del vendedor
}

export interface Escuela {
  id_escuela: number;
  nombre: string;
  siglas?: string;
  activa?: boolean;
  municipio?: Municipio;
}

export interface Vendedor {
  id_vendedor: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  instagram_handle?: string;
  comision_fija_menudeo?: number;
  comision_fija_mayoreo?: number;
  meta_ventas_mensual?: number;
  escuela?: Escuela;
  municipio?: Municipio;
}

export interface Empleado {
  id_empleado: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  puesto?: string;
  calle_y_numero?: string;
  colonia?: string;
  codigo_postal?: string;
  usuario?: Usuario;
  municipio?: Municipio;
}

export interface DetalleVenta {
  cantidad: number;
  precio_unitario: number;
  producto?: Producto;
}

export interface Venta {
  id_venta: number;
  fecha_venta?: string;
  monto_total: number;
  metodo_pago?: string;
  estado?: string;
  vendedor?: Vendedor;
  vendedor_id?: number; // ID directo del vendedor
  id_vendedor?: number; // Alias alternativo
  detalles?: DetalleVenta[];
}

export interface DetallePedido {
  cantidad: number;
  precio_unitario: number;
  producto?: Producto;
}

export interface Pedido {
  id_pedido: number;
  fecha_pedido?: string;
  fecha_entrega_estimada?: string;
  monto_total: number;
  anticipo?: number;
  estado?: string;
  vendedor?: Vendedor;
  vendedor_id?: number; // ID directo del vendedor
  id_vendedor?: number; // Alias alternativo
  cliente?: Cliente;
  detalles?: DetallePedido[];
}

export interface Evento {
  id_evento: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  costo_stand?: number;
  escuela?: Escuela;
  municipio?: Municipio;
}

export interface Insumo {
  id_insumo: number;
  nombre: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock_minimo_alerta?: number;
}

export interface Promocion {
  id_promocion: number;
  nombre: string;
  descripcion?: string;
  tipo_promocion?: string;
  valor_descuento?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activa?: boolean;
}

export interface Comprobante {
  id_comprobante: number;
  total_vendido?: number;
  comision_vendedor?: number;
  monto_entregado?: number;
  saldo_pendiente?: number;
  fecha_corte?: string;
  notas?: string;
  vendedor?: Vendedor;
  vendedor_id?: number; // ID directo del vendedor
  id_vendedor?: number; // Alias alternativo
  admin?: Usuario;
}

export interface CuentaBancaria {
  id_cuenta: number;
  banco: string;
  titular_cuenta?: string;
  numero_cuenta?: string;
  clabe_interbancaria?: string;
  vendedor?: Vendedor;
}

export interface DetalleAsignacion {
  id_det_asignacion: number;
  cantidad_asignada: number;
  producto?: Producto;
}

export interface Asignacion {
  id_asignacion: number;
  fecha_asignacion?: string;
  estado?: string;
  vendedor?: Vendedor;
  detalles?: DetalleAsignacion[];
}

export interface DetalleCorte {
  id_det_corte: number;
  cantidad_vendida: number;
  cantidad_devuelta?: number;
  merma_reportada?: number;
  producto?: Producto;
}

export interface Corte {
  id_corte: number;
  fecha_corte?: string;
  dinero_esperado?: number;
  dinero_total_entregado?: number;
  diferencia_corte?: number;
  observaciones?: string;
  vendedor?: Vendedor;
  vendedor_id?: number; // ID directo del vendedor
  id_vendedor?: number; // Alias alternativo
  asignacion?: Asignacion;
  detalles?: DetalleCorte[];
}

export interface DetalleOrdenProduccion {
  id_det_orden: number;
  cantidad_consumida: number;
  insumo?: Insumo;
}

export interface OrdenProduccion {
  id_orden_produccion: number;
  cantidad_a_producir: number;
  fecha_orden?: string;
  estado?: string;
  producto?: Producto;
  empleado?: Empleado;
  detalles?: DetalleOrdenProduccion[];
}
