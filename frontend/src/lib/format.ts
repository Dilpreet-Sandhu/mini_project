import type { Complaint } from './types';
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
export function relativeDate(date: string) {
  const hours = Math.max(0, (Date.now() - Date.parse(date)) / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
export function fullDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
export function isOverdue(c: Complaint) {
  return ['pending', 'in_progress'].includes(c.status) && Date.parse(c.due_at) < Date.now();
}
export function deadline(c: Complaint) {
  if (c.status === 'resolved')
    return c.resolved_at && Date.parse(c.resolved_at) <= Date.parse(c.due_at)
      ? 'Fixed on time'
      : 'Fixed after target';
  if (c.status === 'cancelled') return 'Closed by student';
  if (isOverdue(c)) return 'Past target time';
  const hours = Math.max(1, Math.ceil((Date.parse(c.due_at) - Date.now()) / 3600000));
  return `Target: ${hours < 24 ? `${hours}h` : `${Math.ceil(hours / 24)}d`} left`;
}
export function complaintCode(id: string) {
  return `RL-${id.slice(-6).toUpperCase()}`;
}
