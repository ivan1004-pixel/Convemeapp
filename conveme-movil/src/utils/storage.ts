import * as SecureStore from 'expo-secure-store';

export const storage = {
  get: async (key: string): Promise<string | null> => {
    try { return await SecureStore.getItemAsync(key); }
    catch { return null; }
  },
  set: async (key: string, value: string): Promise<void> => {
    try { await SecureStore.setItemAsync(key, value); }
    catch (e) { console.error('Storage set error:', e); }
  },
  remove: async (key: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(key); }
    catch (e) { console.error('Storage remove error:', e); }
  },
};
