/** @fileoverview Shared physician directory with administrator management and scoped nurse editing. */
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncDoctorAccounts } from '@/lib/doctors/syncAccounts';
import { isDoctorRecord, parseDoctorDirectory } from '@/lib/doctors/contracts';
import { editableDoctorStations } from '@/lib/doctors/access';

const READ_ROLES = new Set(['superadmin', 'admin', 'nurse', 'staff', 'doctor', 'registration']);
const HEADERS = { 'Cache-Control': 'no-store' };

/** @param request - Workstation request. @returns Verified clinical identity and scoped editing capabilities. */
async function authorize(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return { ok: false, response: guard.response } as const;
  const db = createAdminClient();
  const profile = await db.from('users').select('id,role').eq('auth_id', guard.user.id).maybeSingle();
  const user: unknown = profile.data;
  if (profile.error || !isDoctorRecord(user) || typeof user.role !== 'string' || !READ_ROLES.has(user.role) ||
      !(typeof user.id === 'string' || typeof user.id === 'number')) {
    return { ok: false, response: NextResponse.json({ error: 'Clinical authorization required.' }, { status: 403, headers: HEADERS }) } as const;
  }
  const stations = await db.from('cubicle').select('id,cubicleNum,category,room,subcategory,doctorId').order('category').order('room').order('cubicleNum');
  const cubicles: unknown = stations.data;
  if (stations.error || !Array.isArray(cubicles) || !cubicles.every(isDoctorRecord)) throw new Error('Station read failed.');
  const admin = ['superadmin', 'admin'].includes(user.role);
  const editableIds = await editableDoctorStations({ db, userId: user.id, role: user.role, cubicles });
  return { ok: true, db, role: user.role, authId: guard.user.id, admin, cubicles, editableIds } as const;
}

/** @param request - Directory read. @returns Physicians, doctor account names, and server-verified editing controls. */
export async function GET(request: Request) {
  try {
    const access = await authorize(request);
    if (!access.ok) return access.response;
    if (access.admin || access.role === 'nurse' || access.role === 'doctor') {
      await syncDoctorAccounts({ db: access.db, ...(access.role === 'doctor' ? { authId: access.authId } : {}) });
    }
    const doctors = await access.db.from('doctors').select('id,full_name,specialty,active,auth_id').order('full_name');
    const doctorRows: unknown = doctors.data;
    if (doctors.error || !Array.isArray(doctorRows) || !doctorRows.every(isDoctorRecord)) throw new Error('Directory read failed.');
    const linkedIds = new Set(access.cubicles.filter(station => typeof station.id === 'number' && access.editableIds.includes(station.id)).map(station => station.doctorId));
    const editableDoctorIds = doctorRows.flatMap(doctor => typeof doctor.id === 'string' &&
      (access.admin || linkedIds.has(doctor.id)) ? [doctor.id] : []);
    return NextResponse.json(parseDoctorDirectory({ doctors: doctorRows, cubicles: access.cubicles,
      canManageDirectory: access.admin, editableCubicleIds: access.editableIds, editableDoctorIds }), { headers: HEADERS });
  } catch {
    return NextResponse.json({ error: 'Unable to load doctor accounts and assignments. Please retry.' }, { status: 503, headers: HEADERS });
  }
}

/** @param value - External identifier. @returns Whether it is a physician UUID. */
function isDoctorId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** @param body - Form input. @returns Whitelisted profile fields or null for malformed input. */
function doctorFields(body: Record<string, unknown>) {
  if (typeof body.full_name !== 'string' || !body.full_name.trim() || body.full_name.trim().length > 150 ||
      !(body.specialty == null || (typeof body.specialty === 'string' && body.specialty.length <= 150)) ||
      typeof body.active !== 'boolean') return null;
  return { full_name: body.full_name.trim(), specialty: typeof body.specialty === 'string' ? body.specialty.trim() || null : null, active: body.active };
}

/** @param options - Whitelisted profile action. @returns Acknowledgement of the exact physician write. */
async function saveDoctor(options: { db: SupabaseClient; body: Record<string, unknown> }): Promise<boolean> {
  const { db, body } = options;
  if (body.action === 'active') {
    if (!isDoctorId(body.id) || typeof body.active !== 'boolean') return false;
    const { data, error } = await db.from('doctors').update({ active: body.active }).eq('id', body.id).select('id').maybeSingle();
    return !error && isDoctorRecord(data) && data.id === body.id;
  }
  const fields = doctorFields(body);
  if (!fields || (body.action === 'update' && !isDoctorId(body.id))) return false;
  const query = body.action === 'create' ? db.from('doctors').insert(fields) : db.from('doctors').update(fields).eq('id', body.id);
  const { data, error } = await query.select('id').maybeSingle();
  return !error && isDoctorRecord(data) && isDoctorId(data.id);
}

/** @param options - Scoped station assignment. @returns Acknowledged, concurrency-protected station change. */
async function assignDoctor(options: { db: SupabaseClient; body: Record<string, unknown> }): Promise<boolean> {
  const { db, body } = options;
  if (typeof body.cubicleId !== 'number' || !Number.isSafeInteger(body.cubicleId) || body.cubicleId < 1 ||
      !(body.doctorId === null || isDoctorId(body.doctorId)) || !(body.expectedDoctorId === null || isDoctorId(body.expectedDoctorId))) return false;
  if (body.doctorId !== null) {
    const doctor = await db.from('doctors').select('id').eq('id', body.doctorId).maybeSingle();
    if (doctor.error || !doctor.data) return false;
  }
  let query = db.from('cubicle').update({ doctorId: body.doctorId }).eq('id', body.cubicleId);
  query = body.expectedDoctorId === null ? query.is('doctorId', null) : query.eq('doctorId', body.expectedDoctorId);
  const { data, error } = await query.select('id,doctorId').maybeSingle();
  return !error && isDoctorRecord(data) && data.id === body.cubicleId && data.doctorId === body.doctorId;
}

/** @param options - Manual physician row. @returns Acknowledged deletion; account-linked physicians must be deactivated. */
async function deleteDoctor(options: { db: SupabaseClient; body: Record<string, unknown> }): Promise<boolean> {
  const { db, body } = options;
  if (!isDoctorId(body.id)) return false;
  const doctor = await db.from('doctors').select('id,auth_id').eq('id', body.id).maybeSingle();
  if (doctor.error || !isDoctorRecord(doctor.data) || doctor.data.auth_id != null) return false;
  const detached = await db.from('cubicle').update({ doctorId: null }).eq('doctorId', body.id);
  if (detached.error) return false;
  const { data, error } = await db.from('doctors').delete().eq('id', body.id).is('auth_id', null).select('id').maybeSingle();
  return !error && isDoctorRecord(data) && data.id === body.id;
}

/** @param request - Clinical form action. @returns Success only for an authorized, persisted action. */
export async function POST(request: Request) {
  try {
    const access = await authorize(request);
    if (!access.ok) return access.response;
    const body: unknown = await request.json();
    if (!isDoctorRecord(body) || !['create', 'update', 'active', 'assign', 'delete'].includes(String(body.action))) {
      return NextResponse.json({ error: 'Invalid doctor action.' }, { status: 400, headers: HEADERS });
    }
    const inScope = body.action === 'assign' ? access.editableIds.includes(Number(body.cubicleId))
      : access.cubicles.some(station => typeof station.id === 'number' && access.editableIds.includes(station.id) && station.doctorId === body.id);
    if (!access.admin && (access.role !== 'nurse' || ['create', 'delete'].includes(String(body.action)) || !inScope)) {
      return NextResponse.json({ error: 'You can edit doctors and assignments for your assigned Doctors Stations only.' }, { status: 403, headers: HEADERS });
    }
    const options = { db: access.db, body };
    const saved = body.action === 'assign' ? await assignDoctor(options)
      : body.action === 'delete' ? await deleteDoctor(options) : await saveDoctor(options);
    if (!saved) return NextResponse.json({ error: body.action === 'delete'
      ? 'This doctor could not be deleted. Account-linked doctors must be deactivated instead.'
      : 'The doctor or assignment was not saved. Refresh and retry.' }, { status: 409, headers: HEADERS });
    return NextResponse.json({ success: true }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ error: 'Unable to save doctor details. Please retry.' }, { status: 503, headers: HEADERS });
  }
}
