import * as SecureStore from 'expo-secure-store';

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('token', token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('token');
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('token');
};

export const saveItem = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

export const getItem = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const removeItem = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};
