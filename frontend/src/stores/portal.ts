import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import type {
  Complaint,
  Dashboard,
  Detail,
  NewComplaint,
  Status,
  User,
  WorkerInput,
} from '../lib/types';
import { useAuth } from './auth';

interface PortalState {
  complaints: Complaint[];
  workers: User[];
  dashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => void;
  detail: (id: string) => Promise<Detail>;
  create: (input: NewComplaint) => Promise<Detail>;
  claim: (id: string) => Promise<Detail>;
  status: (id: string, status: Status, note?: string) => Promise<Detail>;
  comment: (id: string, body: string) => Promise<Detail>;
  assign: (id: string, worker_id: string) => Promise<Detail>;
  addWorker: (input: WorkerInput) => Promise<void>;
}
const empty = { complaints: [], workers: [], dashboard: null, loading: false, error: null };
export const usePortal = create<PortalState>((set, get) => {
  const updated = async (request: Promise<Detail>) => {
    const result = await request;
    void get().refresh();
    return result;
  };
  return {
    ...empty,
    refresh: async () => {
      const { token, user } = useAuth.getState();
      if (!token || get().loading) return;
      set({ loading: true });
      try {
        const [complaints, workers, dashboard] = await Promise.all([
          api<Complaint[]>('/complaint'),
          api<User[]>('/user/workers'),
          user?.role === 'admin' ? api<Dashboard>('/admin/stats') : Promise.resolve(null),
        ]);
        if (useAuth.getState().token === token)
          set({ complaints, workers, dashboard, error: null });
      } catch (e) {
        if (useAuth.getState().token === token) set({ error: errorMessage(e) });
      } finally {
        if (useAuth.getState().token === token) set({ loading: false });
      }
    },
    reset: () => set(empty),
    detail: (id) => api<Detail>(`/complaint/${id}`),
    create: (input) => updated(api<Detail>('/complaint', 'POST', input)),
    claim: (id) => updated(api<Detail>(`/complaint/${id}/claim`, 'POST')),
    status: (id, status, note) =>
      updated(api<Detail>(`/complaint/${id}/status`, 'PATCH', { status, note })),
    comment: (id, body) => updated(api<Detail>(`/complaint/${id}/comment`, 'POST', { body })),
    assign: (id, worker_id) =>
      updated(api<Detail>(`/complaint/${id}/assign`, 'PATCH', { worker_id })),
    addWorker: async (input) => {
      await api<User>('/admin/workers', 'POST', input);
      await get().refresh();
    },
  };
});
useAuth.subscribe((state, previous) => {
  if (state.token !== previous.token) usePortal.getState().reset();
});
