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

/** Response headers disabling caching. */
const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/** @returns Acknowledged sorting only after database-backed account and service authorization. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const body: unknown = await request.json().catch(() => null);
  const service = typeof body === 'object' && body !== null && 'service' in body ? body.service : undefined;
  if (service !== undefined && (typeof service !== 'string' || !service.trim() || service.length > 128)) {
    return NextResponse.json({ error: 'A valid service is required.' }, { status: 400 });
  }
  const targetServices = typeof service === 'string'
    ? [service.trim()]
    : undefined;

  const result = await equallyDistributeCounterQueues({ actorAuthId: guard.user.id, targetServices });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Failed to auto-sort counter queues.' },
      { status: result.status, headers: NO_CACHE_HEADERS }
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
