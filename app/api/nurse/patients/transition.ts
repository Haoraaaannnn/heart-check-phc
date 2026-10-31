/** @fileoverview Server-verified nurse stage changes with scoped access and stale-write protection. */
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';

const ROLES = new Set(['nurse', 'staff', 'doctor', 'admin', 'superadmin']);
const TRANSITIONS: Record<string, readonly string[]> = {
  Assigned: ['With Doctor'], 'With Doctor': ['Assigned', 'Carryout'], Carryout: ['With Doctor', 'Done'],
};
const TIMESTAMPS = new Set(['consult_start', 'consult_end', 'carryout_start', 'carryout_end']);

/** @returns Whether an external value is a named-field object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns Runtime-checked rows without assuming an SDK response shape. */
function records(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter(isRecord) : []; }

/** @returns Validated clinical fields only, or null for malformed/mass-assignment attempts. */
function parseUpdates(value: unknown): Record<string, string | null> | null {
  if (!isRecord(value) || typeof value.status !== 'string') return null;
  const fields: Record<string, string | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'status') { fields.status = value.status; continue; }
    if (!TIMESTAMPS.has(key)) return null;
    if (item !== null && (typeof item !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(item) || !Number.isFinite(Date.parse(item)))) return null;
    fields[key] = item;
  }
  return fields;
}

/** @returns The fields allowed by this one clinical transition, with server defaults when omitted. */
function transitionFields(current: string, target: string, input: Record<string, string | null>) {
  const now = new Date().toISOString();
  let fields: Record<string, string | null>;
  if (target === 'Assigned') fields = { status: target, consult_start: null };
  else if (target === 'Carryout') fields = { status: target, consult_end: now, carryout_start: now, carryout_end: null };
  else if (target === 'Done') fields = { status: target, carryout_end: now };
  else fields = current === 'Carryout'
    ? { status: target, consult_end: null, carryout_start: null, carryout_end: null }
    : { status: target, consult_start: now };
  for (const [key, value] of Object.entries(input)) {
    if (!(key in fields) || (fields[key] === null ? value !== null : value === null)) return null;
    fields[key] = value;
  }
  return fields;
}

/** @returns True only when the patient is covered by the caller's current station assignments. */
async function hasPatientScope(db: SupabaseClient, userId: string | number, authId: string, patient: Record<string, unknown>) {
  const [links, services, rooms, doctors, station] = await Promise.all([
    db.from('user_cubicles').select('cubicle_id').eq('user_id', userId),
    db.from('user_services').select('service').eq('user_id', userId),
    db.from('user_rooms').select('service, subcategory, room').eq('user_id', userId),
    db.from('doctors').select('id').eq('auth_id', authId),
    db.from('cubicle').select('id, category, subcategory, room, doctorId').eq('cubicleNum', patient.cubicleNum).maybeSingle(),
  ]);
  if ([links, services, rooms, doctors, station].some(result => result.error)) return null;
  if (!isRecord(station.data)) return false;
  const cubicle = station.data;
  const claimed = records(links.data);
  if (claimed.length) return claimed.some(link => link.cubicle_id === cubicle.id);
  return records(services.data).some(link => link.service === patient.service)
    || records(doctors.data).some(doctor => doctor.id === cubicle.doctorId)
    || records(rooms.data).some(room => room.service === cubicle.category && room.room === cubicle.room
      && (room.subcategory == null || room.subcategory === cubicle.subcategory));
}

/**
 * Verifies identity, clinical role, patient ownership and the source stage before a live update.
 * @param request - Authenticated patientId/updates payload, optionally carrying the original status.
 * @param db - Server-only database client; never exposed to a workstation bundle.
 * @returns An acknowledged stage change, an idempotent success, or a typed HTTP failure.
 */
export async function handleNurseTransition(request: Request, db: SupabaseClient) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || !Number.isSafeInteger(body.patientId) || typeof body.patientId !== 'number' || body.patientId <= 0) {
    return NextResponse.json({ error: 'A valid patient and clinical updates are required.' }, { status: 400 });
  }
  const updates = parseUpdates(body.updates);
  if (!updates || !['Assigned', 'With Doctor', 'Carryout', 'Done'].includes(updates.status ?? '')) {
    return NextResponse.json({ error: 'Only valid clinical stage updates are allowed.' }, { status: 400 });
  }
  const { data: user, error: profileError } = await db.from('users').select('id, role').eq('auth_id', guard.user.id).maybeSingle();
  const workstations: unknown = guard.user.user_metadata?.allowed_workstations;
  if (profileError || !isRecord(user) || typeof user.role !== 'string' || !ROLES.has(user.role)
    || (typeof user.id !== 'string' && typeof user.id !== 'number')
    || (Array.isArray(workstations) && !workstations.includes('nurse'))) {
    return NextResponse.json({ error: 'Clinical workstation authorization required.' }, { status: 403 });
  }
  const { data, error: readError } = await db.from('patients').select('id,status,cubicleNum,service')
    .eq('id', body.patientId).eq('is_historical', false).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to verify the patient.' }, { status: 503 });
  if (!isRecord(data) || typeof data.status !== 'string' || typeof data.cubicleNum !== 'string') {
    return NextResponse.json({ error: 'The patient is no longer available at this station.' }, { status: 409 });
  }
  if (!['admin', 'superadmin'].includes(user.role)) {
    const scoped = await hasPatientScope(db, user.id, guard.user.id, data);
    if (scoped === null) return NextResponse.json({ error: 'Unable to verify station assignments.' }, { status: 503 });
    if (!scoped) return NextResponse.json({ error: 'This patient is outside your assigned station.' }, { status: 403 });
  }
  if (data.status === updates.status) return NextResponse.json({ success: true });
  if ((body.expectedStatus !== undefined && body.expectedStatus !== data.status)
    || !TRANSITIONS[data.status]?.includes(updates.status ?? '')) {
    return NextResponse.json({ error: 'The patient stage changed. Refresh and try again.' }, { status: 409 });
  }
  const fields = transitionFields(data.status, String(updates.status), updates);
  if (!fields) return NextResponse.json({ error: 'The timestamps do not match this stage change.' }, { status: 400 });
  const { data: applied, error } = await db.from('patients').update({ ...fields, updated_at: new Date().toISOString() })
    .setHeader('x-hc-actor-id', guard.user.id)
    .eq('id', body.patientId).eq('is_historical', false).eq('status', data.status).eq('cubicleNum', data.cubicleNum)
    .select('id').maybeSingle();
  if (error || !applied) return NextResponse.json({ error: 'The patient changed or the update was rejected.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
