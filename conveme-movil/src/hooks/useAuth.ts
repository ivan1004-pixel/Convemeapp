import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { loginService, logoutService } from '../services/auth.service';
import { parseApiError } from '../utils/errors';
import { getRoleFromId } from '../constants/permissions';
import { analytics } from '../utils/analytics';

export const useAuth = () => {
  const { token, usuario, isAuthenticated, isLoading, setAuth, logout: storeLogout, setLoading } = useAuthStore();
  const router = useRouter();

  const login = useCallback(async (username: string, password_raw: string) => {
    setLoading(true);
    try {
      const result = await loginService(username, password_raw);
      const serviceUsuario = result.usuario as { id_usuario: number; rol_id: number; username?: string };
      const usuarioWithRole = {
        id_usuario: serviceUsuario.id_usuario,
        username: serviceUsuario.username ?? username,
        rol_id: serviceUsuario.rol_id,
        rol: getRoleFromId(serviceUsuario.rol_id),
      };
      setAuth(result.token, usuarioWithRole);
      await analytics.logEvent('login', { method: 'password' });
      router.replace('/(app)/dashboard');
    } catch (err) {
      throw new Error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAuth, router]);

  const logout = useCallback(async () => {
    await logoutService();
    storeLogout();
    router.replace('/auth/login');
  }, [storeLogout, router]);

  return { token, usuario, isAuthenticated, isLoading, login, logout };
};
