import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prisma Decimal JSON, string, number veya null değerlerini güvenli sayıya çevirir. */
export function parseDecimal(value: unknown): number {
  if (value == null) return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === 'object' && Array.isArray((value as { d?: unknown }).d)) {
    const { s = 1, e = 0, d } = value as { s?: number; e?: number; d: number[] };
    const digits = d.join('');
    if (!digits) return 0;

    const sign = s < 0 ? -1 : 1;
    const exponent = e - digits.length + 1;
    const parsed = sign * Number(digits) * Math.pow(10, exponent);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatCurrency(amount: number | null | undefined, currency = 'TRY'): string {
  const value = amount ?? 0;
  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  date: string | Date | null | undefined,
  fallback = '—',
): string {
  if (date == null || date === '') return fallback;

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return new Intl.DateTimeFormat('tr-TR').format(parsed);
}

export function formatDateTime(
  date: string | Date | null | undefined,
  fallback = '—',
): string {
  if (date == null || date === '') return fallback;

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}
