import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { loginService, logoutService } from '../services/auth.service';
import { parseGraphQLError } from '../utils/errors';

export const useAuth = () => {
  const { token, usuario, isAuthenticated, setToken, setUsuario, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password_raw: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginService(username, password_raw);
      setToken(result.token);
      setUsuario(result.usuario);
      router.replace('/(app)');
    } catch (err) {
      setError(parseGraphQLError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    storeLogout();
    router.replace('/auth/login');
  };

  return { token, usuario, isAuthenticated, isLoading, error, login, logout };
};
