export type { UserRole } from '../types/auth';
import { UserRole } from '../types/auth';

export type Permission =
  | 'ventas:read' | 'ventas:write' | 'ventas:delete'
  | 'pedidos:read' | 'pedidos:write' | 'pedidos:delete'
  | 'productos:read' | 'productos:write' | 'productos:delete'
  | 'clientes:read' | 'clientes:write' | 'clientes:delete'
  | 'empleados:read' | 'empleados:write' | 'empleados:delete'
  | 'comprobantes:read' | 'comprobantes:write'
  | 'reportes:read'
  | 'eventos:read' | 'eventos:write' | 'eventos:delete'
  | 'insumos:read' | 'insumos:write'
  | 'promociones:read' | 'promociones:write' | 'promociones:delete'
  | 'escuelas:read' | 'escuelas:write'
  | 'categorias:read' | 'categorias:write' | 'categorias:delete'
  | 'dashboard:full' | 'dashboard:basic';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'ventas:read', 'ventas:write', 'ventas:delete',
    'pedidos:read', 'pedidos:write', 'pedidos:delete',
    'productos:read', 'productos:write', 'productos:delete',
    'clientes:read', 'clientes:write', 'clientes:delete',
    'empleados:read', 'empleados:write', 'empleados:delete',
    'comprobantes:read', 'comprobantes:write',
    'reportes:read',
    'eventos:read', 'eventos:write', 'eventos:delete',
    'insumos:read', 'insumos:write',
    'promociones:read', 'promociones:write', 'promociones:delete',
    'escuelas:read', 'escuelas:write',
    'categorias:read', 'categorias:write', 'categorias:delete',
    'dashboard:full', 'dashboard:basic',
  ],
  VENDEDOR: [
    'ventas:read', 'ventas:write',
    'pedidos:read', 'pedidos:write',
    'productos:read',
    'clientes:read',
    'comprobantes:read',
    'eventos:read',
    'insumos:read',
    'promociones:read',
    'escuelas:read',
    'categorias:read',
    'dashboard:basic',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleFromId(rol_id: number): UserRole {
  // Convention: rol_id 1 = ADMIN, 2 = VENDEDOR
  if (rol_id === 1) return 'ADMIN';
  return 'VENDEDOR';
}
