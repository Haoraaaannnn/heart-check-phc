/**
 * Single source of truth for patient ticket statuses.
 *
 * `patients.status` holds free-text values written by several screens
 * (kiosk, nurse, transfer). Rather than compare raw strings everywhere,
 * every consumer maps a raw status to a StatusGroup via getStatusGroup(),
 * then reads presentation from STATUS_STYLES.
 */

export type StatusGroup =
  | 'waiting'
  | 'serving'
  | 'idle'
  | 'done'
  | 'cancelled'
  | 'unknown';

/**
 * Raw status strings (lowercase, trimmed) that belong to each group.
 *
 * Verified against the live `patients` table (Sep 2026): Done, Idle, Assigned,
 * On Progress, With Doctor, Waiting (plus some NULL rows, which map to 'unknown').
 * Extra spellings ('pending', 'serving', 'consulting', 'completed', 'served')
 * are legacy values kept for safety.
 *
 * `cancelled` is intentionally empty: no cancelled status exists in the data.
 * If cancellations are later tracked (e.g. via `removed_at`), wire them here.
 */
export const STATUS_GROUPS: Record<Exclude<StatusGroup, 'unknown'>, readonly string[]> = {
  waiting: ['pending', 'waiting', 'assigned'],
  serving: ['on progress', 'serving', 'consulting', 'with doctor'],
  idle: ['idle'],
  done: ['completed', 'done', 'served'],
  cancelled: [],
};

/** Presentation for one status group. */
export interface StatusStyle {
  /** Fixed label, or null to display the raw status text (capitalized). */
  label: string | null;
  /** Classes for the pill badge (background + text, light and dark). */
  badge: string;
  /** Classes for the small colored dot. */
  dot: string;
  /** Classes for a colored count/number in that status's color. */
  text: string;
  /** Literal hex for charts/conic-gradients (Recharts cannot read CSS variables). */
  hex: string;
}

export const STATUS_STYLES: Record<StatusGroup, StatusStyle> = {
  waiting: {
    label: null,
    badge: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    dot: 'bg-orange-500',
    text: 'text-orange-500',
    hex: '#f97316',
  },
  serving: {
    label: 'Serving',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    dot: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    hex: '#22c55e',
  },
  idle: {
    label: 'Idle',
    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-300',
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    hex: '#9ca3af',
  },
  done: {
    label: 'Done',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    hex: '#3b82f6',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    hex: '#ef4444',
  },
  unknown: {
    label: null,
    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-300',
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    hex: '#9ca3af',
  },
};

/**
 * Maps a raw `patients.status` value to its StatusGroup.
 *
 * @param status - Raw status text from the database (may be null/undefined).
 * @returns The matching group, or 'unknown' if the value is not recognised.
 */
export function getStatusGroup(status: string | null | undefined): StatusGroup {
  const normalized = (status ?? '').toLowerCase().trim();
  for (const [group, values] of Object.entries(STATUS_GROUPS)) {
    if (values.includes(normalized)) return group as StatusGroup;
  }
  return 'unknown';
}