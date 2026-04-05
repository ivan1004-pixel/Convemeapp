/**
 * Hook de autenticación
 * Combina el store de auth con las operaciones de login/logout
 */
import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { loginService, logoutService } from '../services/auth.service';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, logout: storeLogout, loadToken } = useAuthStore();

  const login = useCallback(
    async (username: string, password_raw: string) => {
      const result = await loginService(username, password_raw);
      await setAuth(result.token, result.usuario);
      return result;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    await logoutService();
    await storeLogout();
  }, [storeLogout]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    loadToken,
  };
}
