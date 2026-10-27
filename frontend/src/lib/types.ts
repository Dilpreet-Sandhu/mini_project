export type Role = 'student' | 'worker' | 'admin';
export type Category = 'electrical' | 'plumbing' | 'carpentry' | 'housekeeping' | 'general';
export type Status = 'pending' | 'in_progress' | 'resolved' | 'cancelled';
export type Priority = 'low' | 'normal' | 'high';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  hostel: string | null;
  room: string | null;
  specialty: Category | null;
  created_at: string;
}
export interface Session {
  access_token: string;
  user: User;
}
export interface Complaint {
  id: string;
  student_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  hostel: string;
  room: string;
  created_at: string;
  updated_at: string;
  cycle_started_at: string;
  due_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  student_name: string;
  student_phone: string;
  worker_name: string | null;
}
export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: Role;
  kind: 'created' | 'assigned' | 'started' | 'resolved' | 'reopened' | 'cancelled' | 'comment';
  body: string;
  created_at: string;
}
export interface Detail {
  complaint: Complaint;
  events: ComplaintEvent[];
}
export interface WorkerStat {
  id: string;
  name: string;
  specialty: Category;
  open: number;
  resolved: number;
  overdue: number;
  on_time: number;
  on_time_percent: number | null;
  avg_resolution_hours: number | null;
}
export interface Dashboard {
  overview: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    cancelled: number;
    overdue: number;
    unassigned: number;
  };
  workers: WorkerStat[];
}
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  hostel: string;
  room: string;
}
export interface NewComplaint {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
}
export interface WorkerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialty: Category;
}
