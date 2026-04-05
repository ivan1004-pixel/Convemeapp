import { useAuthStore } from '../store/authStore';
import { hasPermission, Permission, UserRole, getRoleFromId } from '../constants/permissions';

export const useHasPermission = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const role: UserRole | null = usuario ? (usuario.rol ?? getRoleFromId(usuario.rol_id)) : null;

  return {
    can: (permission: Permission): boolean => role ? hasPermission(role, permission) : false,
    role,
    isAdmin: role === 'ADMIN',
    isVendedor: role === 'VENDEDOR',
  };
};
