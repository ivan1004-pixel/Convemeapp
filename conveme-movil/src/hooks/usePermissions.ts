import { useAuthStore } from '../store/authStore';
import { hasPermission, Permission, UserRole, getRoleFromId } from '../constants/permissions';

export const usePermissions = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const role: UserRole | null = usuario ? (usuario.rol ?? getRoleFromId(usuario.rol_id)) : null;

  const can = (permission: Permission): boolean =>
    role ? hasPermission(role, permission) : false;

  return {
    can,
    role,
    isAdmin: role === 'ADMIN',
    isVendedor: role === 'VENDEDOR',
  };
};
