/**
 * @fileoverview Loads station ownership assignments for counters and cubicles.
 * @remarks Scopes visibility to authenticated staff without leaking auth_ids or PII.
 */

import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import type { StationOwner } from '@/types/StationOwnership';

/**
 * Extracts a username string from database joined user records.
 *
 * @param users - Joined user record, array, or null.
 * @returns Clean username string or null if unavailable.
 */
function extractUsername(users: unknown): string | null {
  if (!users) return null;
  if (Array.isArray(users)) {
    const first = users[0];
    if (first && typeof first === 'object' && 'username' in first) {
      const u = (first as { username?: unknown }).username;
      return typeof u === 'string' && u.trim().length > 0 ? u.trim() : null;
    }
    return null;
  }
  if (typeof users === 'object' && 'username' in users) {
    const u = (users as { username?: unknown }).username;
    return typeof u === 'string' && u.trim().length > 0 ? u.trim() : null;
  }
  return null;
}

/**
 * Loads distinct assigned staff usernames for all active counters and cubicles.
 *
 * @param currentUserId - The authenticated user's ID to determine ownership attribution.
 * @returns Map of station identifier ('counter:1', 'cubicle:10') to assigned StationOwner records.
 * @throws Error if database queries fail.
 */
export async function loadStationOwnership(
  currentUserId: number | string
): Promise<Record<string, StationOwner[]>> {
  const [counterRes, cubicleRes] = await Promise.all([
    supabaseAdmin
      .from('user_counters')
      .select('counter, user_id, users(username)'),
    supabaseAdmin
      .from('user_cubicles')
      .select('cubicle_id, user_id, users(username)'),
  ]);

  if (counterRes.error || cubicleRes.error || !counterRes.data || !cubicleRes.data) {
    throw new Error('Unable to load station ownership.');
  }

  const ownership: Record<string, StationOwner[]> = {};
  const seenAssignments = new Set<string>();

  const targetUserIdStr = String(currentUserId);

  // 1. Process counter assignments
  for (const row of counterRes.data as Array<{
    counter?: number | string | null;
    user_id?: number | string | null;
    users?: unknown;
  }>) {
    if (row.counter == null) continue;
    const username = extractUsername(row.users);
    if (!username) continue;

    const stationKey = `counter:${row.counter}`;
    const dedupeKey = `${stationKey}:${row.user_id ?? username}`;
    if (seenAssignments.has(dedupeKey)) continue;
    seenAssignments.add(dedupeKey);

    const isCurrentUser = row.user_id != null && String(row.user_id) === targetUserIdStr;
    const owner: StationOwner = {
      isCurrentUser,
      username,
    };

    if (!ownership[stationKey]) {
      ownership[stationKey] = [];
    }
    ownership[stationKey].push(owner);
  }

  // 2. Process cubicle assignments
  for (const row of cubicleRes.data as Array<{
    cubicle_id?: number | string | null;
    user_id?: number | string | null;
    users?: unknown;
  }>) {
    if (row.cubicle_id == null) continue;
    const username = extractUsername(row.users);
    if (!username) continue;

    const stationKey = `cubicle:${row.cubicle_id}`;
    const dedupeKey = `${stationKey}:${row.user_id ?? username}`;
    if (seenAssignments.has(dedupeKey)) continue;
    seenAssignments.add(dedupeKey);

    const isCurrentUser = row.user_id != null && String(row.user_id) === targetUserIdStr;
    const owner: StationOwner = {
      isCurrentUser,
      username,
    };

    if (!ownership[stationKey]) {
      ownership[stationKey] = [];
    }
    ownership[stationKey].push(owner);
  }

  return ownership;
}
