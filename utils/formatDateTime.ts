import { LOCALE, TIMEZONE } from '@/constants/app';

/**
 * Formats a date as a long Manila-time date, e.g. "Monday, September 21, 2026".
 *
 * @param date - Any Date instance (UTC instant); rendered in Asia/Manila.
 */
export function formatManilaDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a date as a 12-hour Manila-time clock string, e.g. "10:39 PM"
 * or "10:39:56 PM" when `withSeconds` is true.
 *
 * @param date - Any Date instance (UTC instant); rendered in Asia/Manila.
 * @param withSeconds - Include seconds (used by the header clock).
 */
export function formatManilaTime(date: Date, withSeconds = false): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Returns the hour of day (0-23) in Manila time. Used for the greeting so it
 * follows PHC's clock, not the viewer's browser timezone.
 *
 * @param date - Any Date instance (UTC instant).
 */
export function getManilaHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
}