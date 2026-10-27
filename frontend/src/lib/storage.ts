import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const key = 'roomline.session';
export const sessionStorage = {
  get: async () =>
    Platform.OS === 'web'
      ? (globalThis.sessionStorage?.getItem(key) ?? null)
      : SecureStore.getItemAsync(key),
  set: async (value: string) => {
    if (Platform.OS === 'web') globalThis.sessionStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  remove: async () => {
    if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
