/**
 * Utilidades para almacenamiento seguro con expo-secure-store
 * Wrapper tipado sobre SecureStore
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'token',
  USER: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
} as const;

type StorageKey = (typeof KEYS)[keyof typeof KEYS];

/** Lee un valor del almacenamiento seguro */
export const getSecureItem = async (key: StorageKey): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

/** Guarda un valor en el almacenamiento seguro */
export const setSecureItem = async (key: StorageKey, value: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch {
    return false;
  }
};

/** Elimina un valor del almacenamiento seguro */
export const removeSecureItem = async (key: StorageKey): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch {
    return false;
  }
};

/** Guarda el token de autenticación */
export const saveToken = (token: string) => setSecureItem(KEYS.TOKEN, token);

/** Lee el token de autenticación */
export const getToken = () => getSecureItem(KEYS.TOKEN);

/** Elimina el token de autenticación */
export const removeToken = () => removeSecureItem(KEYS.TOKEN);

/** Guarda datos del usuario (serializados a JSON) */
export const saveUserData = async (user: object): Promise<boolean> => {
  try {
    return await setSecureItem(KEYS.USER, JSON.stringify(user));
  } catch {
    return false;
  }
};

/** Lee datos del usuario (deserializados desde JSON) */
export const getUserData = async <T = unknown>(): Promise<T | null> => {
  const raw = await getSecureItem(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/** Elimina datos del usuario */
export const removeUserData = () => removeSecureItem(KEYS.USER);

/** Limpia toda la sesión (token + datos de usuario) */
export const clearSession = async (): Promise<void> => {
  await Promise.all([removeToken(), removeUserData()]);
};

export { KEYS as STORAGE_KEYS };
