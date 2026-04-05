export interface Empleado {
  id_empleado: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  fecha_contrato?: string;
  activo?: boolean;
  usuario?: { id_usuario: number; username: string; rol_id: number };
}
