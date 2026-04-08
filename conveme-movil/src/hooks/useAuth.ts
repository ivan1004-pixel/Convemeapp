import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { loginService, logoutService } from '../services/auth.service';
import { getVendedorByUsuarioId } from '../services/vendedor.service';

export const ROLE_ADMIN = 1;
export const ROLE_VENDEDOR = 2;

export const useAuth = () => {
  const { token, usuario, isAuthenticated, setToken, setUsuario, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = usuario?.rol_id === ROLE_ADMIN;

  /**
   * Attempts login. Re-throws on failure so callers can handle errors.
   */
  const login = async (username: string, password_raw: string) => {
    setIsLoading(true);
    try {
      const result = await loginService(username, password_raw);
      setToken(result.token);
      
      // 👇 Si es vendedor, obtener su id_vendedor
      let vendedorData = null;
      if (result.usuario.rol_id === ROLE_VENDEDOR) {
        try {
          vendedorData = await getVendedorByUsuarioId(result.usuario.id_usuario);
        } catch (err) {
          console.error('Error al obtener datos del vendedor:', err);
        }
      }
      
      // 👇 Guardar el usuario con el id_vendedor incluido
      setUsuario({
        ...result.usuario,
        id_vendedor: vendedorData?.id_vendedor || null,
      });
      
      // Redirect based on role
      router.replace('/(app)');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    storeLogout();
    router.replace('/auth/splash');
  };

  return { token, usuario, isAuthenticated, isAdmin, isLoading, login, logout };
};
