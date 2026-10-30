/**
 * @fileoverview Authenticated endpoint for triggering auto-sort and equal distribution
 * of waiting registration patients across all active counters serving each clinical service.
 *
 * Adheres strictly to AGENTS.md:
 * - Server-side authentication and role-checking via requireUser
 * - Atomic database operations via supabaseAdmin
 * - Strict type-safety, guard clauses, and maximum 3 nesting levels
 * - Zero emojis in comments or logs
 *
 * @module app/api/workstation/auto-sort-counters/route
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { equallyDistributeCounterQueues } from '@/lib/supabase/queueDistribution';

/** Authorized staff roles. */
const AUTHORIZED_ROLES = new Set([
  'superadmin',
  'admin',
  'registration',
  'nurse',
  'doctor',
  'staff',
]);

/** Response headers disabling caching. */
const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

interface AutoSortRequestBody {
  service?: string;
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  // Verify staff role
  const role = guard.user.user_metadata?.role || guard.user.role || '';
  if (role && !AUTHORIZED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as AutoSortRequestBody;
  const targetServices = body.service && typeof body.service === 'string' && body.service.trim().length > 0
    ? [body.service.trim()]
    : undefined;

  const result = await equallyDistributeCounterQueues({ targetServices });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Failed to auto-sort counter queues.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      redistributedCount: result.redistributedCount,
      affectedPatientIds: result.affectedPatientIds,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
