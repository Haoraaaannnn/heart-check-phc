/**
 * @fileoverview Patient Rotation and Dynamic Queue Rebalancing Route Handler.
 *
 * Atomically updates patient queue states, timeout counters, and cubicle/counter
 * re-assignments during automated or manual queue balancing.
 *
 * Security Considerations (SEC-027 / SEC-AUD-004):
 * - Authenticated Role Verification: Validates caller session token and requires
 *   verified clinical role (superadmin, admin, nurse, staff, doctor, registration).
 * - Strict Schema Whitelisting: Strips any unapproved columns to prevent mass-assignment
 *   attacks on immutable patient demographics, medical notes, or ticket identifiers.
 * - Historical Data Protection (Rule 12): Explicitly appends `.eq('is_historical', false)`
 *   to ensure research datasets (March 2024 - December 2025) cannot be altered.
 *
 * @module app/api/rotate/route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error('Queue service configuration is missing.');
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

/**
 * Permitted patient update column whitelist for rotation mutations.
 */
const ALLOWED_UPDATE_FIELDS = new Set<string>([
  'status',
  'rotation_count',
  'queue_position',
  'idle_at',
  'removed_at',
  'counter',
  'counter_top_started_at',
  'counter_rejoin_at',
  'counter_paused_at',
  'cubicleNum',
  'called_at',
  'cubicle_top_started_at',
  'progress_started_at',
  'cooldown_until',
  'preferredCubicleNums',
]);

/**
 * Permitted concurrency check column whitelist for optimistic locking.
 */
const ALLOWED_EXPECTED_FIELDS = new Set<string>([
  'rotation_count',
  'counter_paused_at',
  'counter_top_started_at',
  'counter_rejoin_at',
  'status',
  'cubicleNum',
  'counter',
]);

/**
 * Permitted clinical roles authorized to execute patient queue rotations.
 */
const CLINICAL_ROLES = new Set<string>([
  'superadmin',
  'admin',
  'nurse',
  'staff',
  'doctor',
  'registration',
]);

/** @param value - External input. @returns Whether it can be inspected by field name. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Sanitizes and validates an individual rotation update object.
 *
 * @param item - Raw update object from request payload.
 * @returns Sanitized update containing only whitelisted columns, or null if invalid.
 */
function sanitizeUpdate(item: unknown): {
  id: number;
  expected: Record<string, string | number | null>;
  changes: Record<string, unknown>;
} | null {
  if (!isRecord(item)) return null;
  const raw = item;

  const id = raw.id;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;

  const cleanChanges: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'id' || key === 'expected') continue;
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      cleanChanges[key] = value;
    }
  }

  const cleanExpected: Record<string, string | number | null> = {};
  if (isRecord(raw.expected)) {
    for (const [col, expVal] of Object.entries(raw.expected)) {
      if (ALLOWED_EXPECTED_FIELDS.has(col) && (expVal === null || typeof expVal === 'string' || typeof expVal === 'number')) {
        cleanExpected[col] = expVal;
      }
    }
  }

  if ('rotation_count' in cleanChanges && (typeof cleanChanges.rotation_count !== 'number' ||
      !Number.isSafeInteger(cleanChanges.rotation_count) || cleanChanges.rotation_count < 1 ||
      !('rotation_count' in cleanExpected))) return null;

  if (cleanChanges.status === 'Removed' &&
      (typeof cleanExpected.rotation_count !== 'number' || !Number.isSafeInteger(cleanExpected.rotation_count) ||
       cleanExpected.rotation_count < 4 || !['Waiting', 'On Progress', 'Assigned'].includes(String(cleanExpected.status)) ||
       typeof cleanChanges.removed_at !== 'string' || !Number.isFinite(Date.parse(cleanChanges.removed_at)))) return null;

  return { id, expected: cleanExpected, changes: cleanChanges };
}

/**
 * Handles POST requests to rotate patients across counters or cubicles.
 *
 * @param request - Next.js Request object carrying Authorization Bearer token.
 * @returns NextResponse with per-patient mutation results or error envelope.
 */
export async function POST(request: Request) {
  try {
    // 1. Enforce user authentication
    const guard = await requireUser(request);
    if (!guard.authorized) return guard.response;

    // 2. Enforce verified clinical role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', guard.user.id)
      .maybeSingle();

    if (profileError || !userProfile || !CLINICAL_ROLES.has(userProfile.role)) {
      return NextResponse.json({ error: 'Clinical authorization required.' }, { status: 403 });
    }

    // 3. Parse and validate payload
    const body: unknown = await request.json();
    const rawUpdates: unknown = isRecord(body) ? body.updates : null;

    if (!Array.isArray(rawUpdates) || rawUpdates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Cap batch size to prevent denial of service
    if (rawUpdates.length > 50) {
      return NextResponse.json({ error: 'Batch size exceeds maximum limit of 50' }, { status: 400 });
    }

    // 4. Execute whitelisted updates with historical data protection
    const results = await Promise.all(
      rawUpdates.map(async (rawItem: unknown) => {
        const parsed = sanitizeUpdate(rawItem);
        if (!parsed) {
          return { id: isRecord(rawItem) && typeof rawItem.id === 'number' ? rawItem.id : 0, applied: false, code: 'invalid', error: 'Malformed update structure' };
        }

        const { id, expected, changes } = parsed;

        if (Object.keys(changes).length === 0) {
          return { id, applied: false, code: 'invalid', error: 'No whitelisted fields to update' };
        }

        // Apply strict historical data protection (.eq('is_historical', false))
        let query = supabaseAdmin
          .from('patients')
          .update(changes)
          .setHeader('x-hc-actor-id', guard.user.id)
          .eq('id', id)
          .eq('is_historical', false)
          .in('status', ['Waiting', 'On Progress', 'Assigned']);

        for (const [column, value] of Object.entries(expected)) {
          query = value === null ? query.is(column, null) : query.eq(column, value);
        }

        // A stale workstation must never rotate a patient paused by another registrar.
        if ('rotation_count' in changes && 'counter' in expected) {
          query = query.is('counter_paused_at', null);
        }

        const { data, error } = await query.select('id');
        return {
          id,
          applied: !error && (data?.length ?? 0) > 0,
          code: error ? 'rejected' : (data?.length ?? 0) > 0 ? 'applied' : 'stale',
          error: error ? 'Database update rejected' : undefined,
        };
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid rotation request.' : 'Unable to process rotation.' }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
