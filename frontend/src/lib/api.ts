import Constants from 'expo-constants';
import { Platform } from 'react-native';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${devHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost')}:3000`
).replace(/\/$/, '');
let readToken: () => string | null = () => null;
let onExpired: () => void = () => {};
export function configureAuth(read: typeof readToken, expired: typeof onExpired) {
  readToken = read;
  onExpired = expired;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const token = readToken();
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token && readToken() === token && !path.startsWith('/auth/'))
        onExpired();
      throw new ApiError(
        response.status,
        payload?.message || `Request failed (${response.status})`,
      );
    }
    return payload.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`Cannot reach Roomline. Check your connection and API address (${API_URL}).`);
  } finally {
    clearTimeout(timeout);
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
