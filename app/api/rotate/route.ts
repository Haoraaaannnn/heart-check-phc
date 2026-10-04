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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Permitted patient update column whitelist for rotation mutations.
 */
const ALLOWED_UPDATE_FIELDS = new Set<string>([
  'status',
  'rotation_count',
  'queue_position',
  'idle_at',
  'counter',
  'counter_top_started_at',
  'counter_rejoin_at',
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

interface RawRotateItem {
  id: number;
  expected?: Record<string, string | number | null>;
  [key: string]: unknown;
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
  if (!item || typeof item !== 'object') return null;
  const raw = item as RawRotateItem;

  const id = Number(raw.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const cleanChanges: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'id' || key === 'expected') continue;
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      cleanChanges[key] = value;
    }
  }

  const cleanExpected: Record<string, string | number | null> = {};
  if (raw.expected && typeof raw.expected === 'object') {
    for (const [col, expVal] of Object.entries(raw.expected)) {
      if (ALLOWED_EXPECTED_FIELDS.has(col)) {
        cleanExpected[col] = expVal;
      }
    }
  }

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
      console.warn(`[ROTATE FORBIDDEN] Unauthorized role attempt by user ${guard.user.id}`);
      return NextResponse.json({ error: 'Clinical authorization required.' }, { status: 403 });
    }

    // 3. Parse and validate payload
    const body = await request.json();
    const rawUpdates = body?.updates;

    if (!Array.isArray(rawUpdates) || rawUpdates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Cap batch size to prevent denial of service
    if (rawUpdates.length > 50) {
      return NextResponse.json({ error: 'Batch size exceeds maximum limit of 50' }, { status: 400 });
    }

    // 4. Execute whitelisted updates with historical data protection
    const results = await Promise.all(
      rawUpdates.map(async (rawItem) => {
        const parsed = sanitizeUpdate(rawItem);
        if (!parsed) {
          return { id: (rawItem as any)?.id ?? 0, applied: false, error: 'Malformed update structure' };
        }

        const { id, expected, changes } = parsed;

        if (Object.keys(changes).length === 0) {
          return { id, applied: false, error: 'No whitelisted fields to update' };
        }

        // Apply strict historical data protection (.eq('is_historical', false))
        let query = supabaseAdmin
          .from('patients')
          .update(changes)
          .eq('id', id)
          .eq('is_historical', false);

        for (const [column, value] of Object.entries(expected)) {
          query = value === null ? query.is(column, null) : query.eq(column, value);
        }

        const { data, error } = await query.select('id');
        return {
          id,
          applied: !error && (data?.length ?? 0) > 0,
          error: error ? 'Database update rejected' : undefined,
        };
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('[ROTATE SERVER ERROR]:', message);
    return NextResponse.json({ error: 'Internal server error processing rotation' }, { status: 500 });
  }
}