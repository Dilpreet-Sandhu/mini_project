import { create } from 'zustand';
import { api, ApiError, configureAuth } from '../lib/api';
import { sessionStorage } from '../lib/storage';
import type { RegisterInput, Session, User } from '../lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  booting: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (body: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (body: {
    name: string;
    phone: string;
    hostel?: string;
    room?: string;
  }) => Promise<void>;
}
async function persist(session: Session) {
  await sessionStorage.set(JSON.stringify(session));
}
export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  booting: true,
  bootstrap: async () => {
    try {
      const saved = await sessionStorage.get();
      if (saved) {
        const session = JSON.parse(saved) as Session;
        if (!session.access_token || !session.user?.id) throw new Error('Invalid saved session');
        set({ token: session.access_token, user: session.user });
        try {
          const user = await api<User>('/user/me');
          if (get().token === session.access_token) set({ user });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) await get().logout();
        }
      }
    } catch {
      set({ user: null, token: null });
    } finally {
      set({ booting: false });
    }
  },
  login: async (email, password) => {
    const session = await api<Session>('/auth/login', 'POST', { email, password });
    await persist(session);
    set({ token: session.access_token, user: session.user });
  },
  register: async (body) => {
    const session = await api<Session>('/auth/register', 'POST', body);
    await persist(session);
    set({ token: session.access_token, user: session.user });
  },
  logout: async () => {
    set({ token: null, user: null });
    await sessionStorage.remove().catch(() => {});
  },
  updateProfile: async (body) => {
    const token = get().token;
    const user = await api<User>('/user/me', 'PATCH', body);
    if (token && token === get().token) {
      await persist({ access_token: token, user });
      set({ user });
    }
  },
}));
configureAuth(
  () => useAuth.getState().token,
  () => {
    void useAuth.getState().logout();
  },
);
