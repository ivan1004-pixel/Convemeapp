import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store'; // La bóveda segura de Expo


export const API_URL =
  Platform.OS === 'android'
    ? 'http://192.168.100.9:3000/graphql' // Para emulador Android apuntando a localhost
    : 'http://localhost:3000/graphql';

export const convemeApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isLoggingOut = false;

convemeApi.interceptors.request.use(async (config) => {
    const getStoredToken = async () => {
        // 1. Intentar obtener de la clave individual 'token'
        let t = await SecureStore.getItemAsync('token');

        // 2. Si no está, intentar obtener del auth-storage (Zustand persistido en SecureStore)
        if (!t) {
            try {
                const rawStorage = await SecureStore.getItemAsync('auth-storage');
                if (rawStorage) {
                    const parsed = JSON.parse(rawStorage);
                    t = parsed.state?.token;
                }
            } catch (e) {}
        }

        // 3. Si sigue sin estar, intentar obtener del estado actual de Zustand
        if (!t) {
            try {
                const { useAuthStore } = require('../store/authStore');
                t = useAuthStore.getState().token;
            } catch (e) {}
        }
        return t;
    };

    let token = await getStoredToken();

    // Re-intento rápido si el token no está (puede ser una carrera en el inicio)
    if (!token) {
        await new Promise(resolve => setTimeout(resolve, 500));
        token = await getStoredToken();
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.log('[API] No token found for request - URL:', config.url);
    }
    return config;
});

convemeApi.interceptors.response.use(
  (response) => {
    // Si la respuesta es 200 pero tiene errores de GraphQL con mensaje 'Unauthorized'
    if (response.data?.errors && response.data.errors.some((e: any) => e.message === 'Unauthorized')) {
      console.warn('[API] Unauthorized detected in GraphQL body');
      handleForceLogout();
      return Promise.reject(new Error('Unauthorized'));
    }
    return response;
  },
  async (error) => {
    const isUnauthorized = 
      error.response?.status === 401 || 
      (error.response?.data?.errors && error.response.data.errors.some((e: any) => e.message === 'Unauthorized')) ||
      (error.message === 'Unauthorized');

    if (isUnauthorized) {
      console.log('[API] Session expired or invalid, forcing logout...');
      handleForceLogout();
    }
    return Promise.reject(error);
  }
);

async function handleForceLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
        const { useAuthStore } = require('../store/authStore');
        const state = useAuthStore.getState();
        
        // Solo procedemos si realmente estamos autenticados en el store
        // para evitar limpiar estados que ya están limpios y disparar re-renders innecesarios
        if (state.isAuthenticated || state.token) {
            console.log('[API] Forcing logout: clearing tokens and state');
            
            // Limpiamos la clave individual
            await SecureStore.deleteItemAsync('token');
            
            // El logout del store debería limpiar también el auth-storage (vía persistencia)
            state.logout();
            
            console.log('[API] Logout forced successfully');
        } else {
            console.log('[API] Logout skipped: user is not authenticated');
        }
    } catch (e) {
        console.error('[API] Error in force logout:', e);
    } finally {
        // Permitir re-intentar logout después de un tiempo si fuera necesario
        setTimeout(() => { isLoggingOut = false; }, 5000);
    }
}
