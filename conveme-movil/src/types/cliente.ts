export interface Cliente {
  id_cliente: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
  fecha_registro?: string;
}
