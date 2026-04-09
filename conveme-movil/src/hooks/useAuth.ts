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
    console.log('Intentando login móvil para:', username);
    try {
      const result = await loginService(username, password_raw);
      console.log('Login exitoso, usuario:', result.usuario.username);
      
      // Aseguramos que el token esté en SecureStore para el interceptor ANTES de navegar
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('token', result.token);
      
      setToken(result.token);
      
      // 👇 Si es vendedor, obtener su id_vendedor
      let vendedorData = null;
      if (result.usuario.rol_id === ROLE_VENDEDOR) {
        console.log('Obteniendo datos de vendedor para ID:', result.usuario.id_usuario);
        try {
          vendedorData = await getVendedorByUsuarioId(result.usuario.id_usuario);
          console.log('Datos de vendedor cargados:', vendedorData?.id_vendedor);
        } catch (err) {
          console.error('Error al obtener datos del vendedor:', err);
        }
      }
      
      // 👇 Guardar el usuario asegurando que id_vendedor no sea borrado si ya venía del backend
      setUsuario({
        ...result.usuario,
        id_vendedor: vendedorData?.id_vendedor || result.usuario.id_vendedor || null,
      });
      
      // Redirect based on role
      console.log('Redirigiendo a (app)...');
      router.replace('/(app)');
    } catch (error: any) {
      console.error('Error fatal en login:', error);
      if (error.response) {
        console.error('Data del error:', error.response.data);
        console.error('Status del error:', error.response.status);
      } else if (error.request) {
        console.error('No hubo respuesta del servidor (Error de red). Verifica la IP en convemeApi.ts');
      }
      throw error;
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
