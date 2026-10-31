/** @fileoverview Server-authorized registration counter handoffs with database concurrency guards. */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

/** @param value - External identifier. @returns Whether it is a positive whole identifier. */
function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Moves a live intake ticket only after server and database authorization.
 * @param request - Authenticated source and destination details.
 * @returns Acknowledgement after a durable handoff or an explicit failure.
 */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== 'object' || body === null || !('patientId' in body) || !('sourceCounter' in body) || !('targetCounter' in body) ||
      !isId(body.patientId) || !isId(body.sourceCounter) || !isId(body.targetCounter)) {
    return NextResponse.json({ error: 'A valid ticket, source counter and target counter are required.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.rpc('move_registration_ticket', {
    caller_auth_id: guard.user.id, patient_id: body.patientId, source_counter: body.sourceCounter, destination_counter: body.targetCounter,
  }).setHeader('x-hc-actor-id', guard.user.id);
  if (error || data !== true) return NextResponse.json({ error: 'Transfer rejected. Refresh and choose an open, staffed counter serving this service.' }, { status: 409 });
  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
