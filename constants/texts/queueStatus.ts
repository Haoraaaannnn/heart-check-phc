/**
 * Single source of truth for patient ticket statuses.
 *
 * `patients.status` holds free-text values written by several screens
 * (kiosk, nurse, transfer). Rather than compare raw strings everywhere,
 * every consumer maps a raw status to a StatusGroup via getStatusGroup(),
 * then reads presentation from STATUS_STYLES.
 *
 * @module constants/texts/queueStatus
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

import {
  STATUS_STYLES,
  type StatusStyle,
} from '@/constants/designs/statusPillStyles';

export { STATUS_STYLES, type StatusStyle };

/**
 * Maps a raw `patients.status` value to its StatusGroup.
 *
 * @param status - Raw status text from the database (may be null/undefined).
 * @returns The matching group, or 'unknown' if the value is not recognised.
 */
export function getStatusGroup(status: string | null | undefined): StatusGroup {
  if (!status) return 'unknown';
  const clean = status.trim().toLowerCase();
  for (const [group, members] of Object.entries(STATUS_GROUPS) as [
    StatusGroup,
    readonly string[]
  ][]) {
    if (members.includes(clean)) return group;
  }
  return 'unknown';
}
