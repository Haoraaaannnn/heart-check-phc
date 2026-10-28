/**
 * @fileoverview Authenticated staff break controls scoped to the caller's assigned stations.
 * @remarks Uses the server-only service client after verifying role and station ownership.
 */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

const STAFF_ROLES = new Set(['superadmin', 'admin', 'registration', 'staff', 'nurse', 'doctor']);

/** Resolves the authenticated caller's explicit counter, cubicle, room, and doctor assignments. */
async function resolveStations(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return { response: guard.response };
  const { data: user, error } = await supabaseAdmin.from('users')
    .select('id, role').eq('auth_id', guard.user.id).maybeSingle();
  if (error || !user || !STAFF_ROLES.has(user.role)) {
    return { response: NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 }) };
  }
  const [counters, cubicles, counterLinks, cubicleLinks, rooms, doctors] = await Promise.all([
    supabaseAdmin.from('counters').select('counter_number, active, on_break').order('counter_number'),
    supabaseAdmin.from('cubicle').select('id, cubicleNum, category, subcategory, room, doctorId, on_break').order('cubicleNum'),
    supabaseAdmin.from('user_counters').select('counter').eq('user_id', user.id),
    supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
    supabaseAdmin.from('user_rooms').select('service, subcategory, room').eq('user_id', user.id),
    supabaseAdmin.from('doctors').select('id').eq('auth_id', guard.user.id),
  ]);
  if ([counters, cubicles, counterLinks, cubicleLinks, rooms, doctors].some(result => result.error)) {
    return { response: NextResponse.json({ error: 'Unable to load station permissions.' }, { status: 503 }) };
  }
  const admin = user.role === 'admin' || user.role === 'superadmin';
  const allowedCounters = new Set((counterLinks.data ?? []).map(link => link.counter));
  const allowedCubicles = new Set((cubicleLinks.data ?? []).map(link => link.cubicle_id));
  const doctorIds = new Set((doctors.data ?? []).map(doctor => doctor.id));
  const stations = [
    ...(counters.data ?? []).filter(counter => admin || ['registration', 'staff', 'nurse'].includes(user.role) || allowedCounters.has(counter.counter_number)).map(counter => ({
      kind: 'counter', id: counter.counter_number, label: `Counter ${counter.counter_number}`,
      onBreak: counter.on_break, active: counter.active,
    })),
    ...(cubicles.data ?? []).filter(cubicle => admin || allowedCubicles.has(cubicle.id) || doctorIds.has(cubicle.doctorId) ||
      (rooms.data ?? []).some(room => room.service === cubicle.category && room.room === cubicle.room &&
        (room.subcategory == null || room.subcategory === cubicle.subcategory))).map(cubicle => ({
      kind: 'cubicle', id: cubicle.id, label: cubicle.cubicleNum, onBreak: cubicle.on_break, active: true,
    })),
  ];
  return { stations };
}

/** @returns Only stations the authenticated staff member may put on break. */
export async function GET(request: Request) {
  const result = await resolveStations(request);
  if (result.response) return result.response;
  return NextResponse.json({ stations: result.stations }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Changes one authorized station's break flag without touching patients or admin activation.
 * @param request - Authenticated request containing kind, id, and onBreak.
 * @returns Success after persistence, or a permission/validation error.
 */
export async function POST(request: Request) {
  const result = await resolveStations(request);
  if (result.response) return result.response;
  const body = await request.json().catch(() => null);
  if (!body || !['counter', 'cubicle'].includes(body.kind) || !Number.isSafeInteger(body.id) || typeof body.onBreak !== 'boolean') {
    return NextResponse.json({ error: 'A valid station and break state are required.' }, { status: 400 });
  }
  if (!result.stations?.some(station => station.kind === body.kind && station.id === body.id)) {
    return NextResponse.json({ error: 'This station is not assigned to you.' }, { status: 403 });
  }
  const table = body.kind === 'counter' ? 'counters' : 'cubicle';
  const column = body.kind === 'counter' ? 'counter_number' : 'id';
  const { data, error } = await supabaseAdmin.from(table).update({ on_break: body.onBreak })
    .eq(column, body.id).select(column).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Unable to change station availability.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
