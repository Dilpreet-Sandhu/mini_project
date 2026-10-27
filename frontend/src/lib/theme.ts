import type { Category, Status } from './types';
export const colors = {
  bg: '#F7F8F4',
  paper: '#FFFFFF',
  ink: '#16332F',
  muted: '#7A8985',
  line: '#E7EDE8',
  teal: '#147D69',
  tealDark: '#095C4B',
  mint: '#E5F3EB',
  lime: '#DAF49B',
  amber: '#A46A12',
  amberBg: '#FFF3DB',
  blue: '#387DB2',
  blueBg: '#EAF2FC',
  red: '#BC514B',
  redBg: '#FBEDEB',
};
export const categories: {
  key: Category;
  label: string;
  worker: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  {
    key: 'electrical',
    label: 'Electrical',
    worker: 'Electrician',
    icon: 'flash-outline',
    color: '#A87B20',
    bg: '#FFF3D6',
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    worker: 'Plumber',
    icon: 'water-outline',
    color: '#377DA8',
    bg: '#E5F2FB',
  },
  {
    key: 'carpentry',
    label: 'Carpentry',
    worker: 'Carpenter',
    icon: 'hammer-outline',
    color: '#AD7359',
    bg: '#F9ECE3',
  },
  {
    key: 'housekeeping',
    label: 'Cleaning',
    worker: 'Housekeeping',
    icon: 'sparkles-outline',
    color: '#8C70AD',
    bg: '#F0EAF9',
  },
  {
    key: 'general',
    label: 'Other',
    worker: 'General maintenance',
    icon: 'construct-outline',
    color: '#308B72',
    bg: '#E3F3EB',
  },
];
export const categoryInfo = (key: Category) => categories.find((c) => c.key === key)!;
export const statuses: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.amber, bg: colors.amberBg },
  in_progress: { label: 'In progress', color: colors.blue, bg: colors.blueBg },
  resolved: { label: 'Fixed', color: colors.teal, bg: colors.mint },
  cancelled: { label: 'Cancelled', color: colors.muted, bg: '#F0F2F0' },
};
