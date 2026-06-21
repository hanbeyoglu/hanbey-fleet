import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} sa ${minutes} dk`;
  return `${minutes} dk`;
}

export const ADMIN_PORTAL_URL =
  import.meta.env.VITE_ADMIN_PORTAL_URL || 'http://localhost:5173';

export const DRIVER_PORTAL_URL =
  import.meta.env.VITE_DRIVER_PORTAL_URL || 'http://localhost:5174';
