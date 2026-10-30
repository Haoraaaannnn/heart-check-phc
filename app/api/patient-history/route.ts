/** @fileoverview Authenticated, scoped and paginated access to immutable ticket movement history. */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { historyId, historyRecord, parseHistoryEvents } from '@/lib/patientHistory';
import { canReadPatientHistory } from './scope';

const ROLES = new Set(['admin', 'superadmin', 'registration', 'nurse', 'staff', 'doctor']);
const HEADERS = { 'Cache-Control': 'private, no-store' };

/** @returns A sanitized failure without exposing database details or identifiers. */
function failure(error: string, status: number) { return NextResponse.json({ error }, { status, headers: HEADERS }); }

/**
 * Reads newest events first, with an exclusive cursor for older pages.
 * @param request - Bearer-authenticated request with patientId and optional before cursor.
 * @returns Minimal operational history; never names, contacts or internal authentication IDs.
 */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const params = new URL(request.url).searchParams;
  const patientId = historyId(params.get('patientId'));
  const rawBefore = params.get('before');
  const before = rawBefore === null ? null : historyId(rawBefore);
  if (!patientId || (rawBefore !== null && !before)) return failure('A valid ticket and history cursor are required.', 400);
  const profile = await supabaseAdmin.from('users').select('id,role').eq('auth_id', guard.user.id).maybeSingle();
  if (profile.error) return failure('Unable to verify history permissions.', 503);
  const user: unknown = profile.data;
  if (!historyRecord(user) || typeof user.role !== 'string' || !ROLES.has(user.role)
    || (typeof user.id !== 'string' && typeof user.id !== 'number')) return failure('Staff authorization required.', 403);
  const result = await supabaseAdmin.from('patients').select('id,is_historical,cubicleNum,counter,service')
    .eq('id', patientId).maybeSingle();
  if (result.error) return failure('Unable to verify this ticket.', 503);
  const allowed = await canReadPatientHistory({ db: supabaseAdmin, userId: user.id, authId: guard.user.id,
    role: user.role, patient: historyRecord(result.data) ? result.data : null });
  if (allowed === null) return failure('Unable to verify station assignments.', 503);
  if (!allowed) return failure('This ticket is outside your assigned stations.', 403);
  let query = supabaseAdmin.from('patient_movement_history')
    .select('id,ticket,occurred_at,actor_username,actor_role,actor_kind,event_type,from_state,to_state')
    .eq('patient_id', patientId).order('id', { ascending: false }).limit(51);
  if (before) query = query.lt('id', before);
  const history = await query;
  if (history.error) return failure('Detailed history is unavailable. Ask the superadmin to complete the history database setup.', 503);
  const events = parseHistoryEvents(history.data);
  if (!events) return failure('The history service returned an invalid response.', 503);
  const page = events.slice(0, 50);
  return NextResponse.json({ events: page, nextCursor: events.length > 50 ? page[page.length - 1].id : null }, { headers: HEADERS });
}
