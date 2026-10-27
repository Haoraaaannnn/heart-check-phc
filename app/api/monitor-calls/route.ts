/**
 * @fileoverview Role-scoped manual call delivery to public monitors, never staff speakers.
 * @remarks Patient names, phone numbers, actor identifiers, and arbitrary client speech are never broadcast.
 */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';

const ROLES = new Set(['admin', 'superadmin', 'registration', 'nurse', 'staff', 'doctor']);
const HEADERS = { 'Cache-Control': 'no-store' };

/**
 * Validates staff scope and derives the monitor and speech from the current patient record.
 * @param request - Bearer-authenticated request containing only a patientId.
 * @returns Accepted delivery, cooldown, or authorization error.
 */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(body?.patientId) || body.patientId <= 0) {
    return NextResponse.json({ error: 'A valid patient number is required.' }, { status: 400 });
  }
  const { data: user } = await supabaseAdmin.from('users').select('id, role').eq('auth_id', guard.user.id).maybeSingle();
  if (!user || !ROLES.has(user.role)) return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });

  const dayStart = new Date(Date.now() + 8 * 60 * 60 * 1000);
  dayStart.setUTCHours(0, 0, 0, 0);
  const start = new Date(dayStart.getTime() - 8 * 60 * 60 * 1000);
  const { data: patient } = await supabaseAdmin.from('patients')
    .select('id, patientNum, service, subcategory, counter, cubicleNum, reg_end, status')
    .eq('id', body.patientId).eq('is_historical', false)
    .gte('created_at', start.toISOString()).lt('created_at', new Date(start.getTime() + 86400000).toISOString())
    .maybeSingle();
  if (!patient || !patient.service || ['Done', 'Idle', 'Removed'].includes(patient.status)) {
    return NextResponse.json({ error: 'This patient is no longer available to call.' }, { status: 409 });
  }

  const [services, counters, cubicles, doctors, rooms] = await Promise.all([
    supabaseAdmin.from('user_services').select('service').eq('user_id', user.id),
    supabaseAdmin.from('user_counters').select('counter').eq('user_id', user.id),
    supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
    supabaseAdmin.from('doctors').select('id').eq('auth_id', guard.user.id),
    supabaseAdmin.from('user_rooms').select('service, subcategory, room').eq('user_id', user.id),
  ]);
  if ([services, counters, cubicles, doctors, rooms].some(result => result.error)) {
    return NextResponse.json({ error: 'Unable to verify call permissions.' }, { status: 503 });
  }
  const { data: cubicle, error: cubicleError } = patient.cubicleNum
    ? await supabaseAdmin.from('cubicle').select('id, cubicleNum, category, subcategory, room, doctorId, on_break')
      .eq('cubicleNum', patient.cubicleNum).maybeSingle()
    : { data: null, error: null };
  const registration = !patient.cubicleNum && patient.counter != null && !patient.reg_end;
  const supervisor = user.role === 'admin' || user.role === 'superadmin';
  const scoped = supervisor || (services.data ?? []).some(link => link.service === patient.service) ||
    (registration && (counters.data ?? []).some(link => link.counter === patient.counter)) ||
    (cubicle && ((cubicles.data ?? []).some(link => link.cubicle_id === cubicle.id) ||
      (doctors.data ?? []).some(doctor => doctor.id === cubicle.doctorId) ||
      (rooms.data ?? []).some(room => room.service === cubicle.category && room.room === cubicle.room &&
        (room.subcategory == null || room.subcategory === cubicle.subcategory))));
  if (!scoped) return NextResponse.json({ error: 'This patient is outside your assigned stations.' }, { status: 403 });
  if (cubicleError || (patient.cubicleNum && (!cubicle || cubicle.on_break))) {
    return NextResponse.json({ error: 'The destination cubicle is unavailable or on break.' }, { status: 409 });
  }
  if (registration) {
    const { data: counter } = await supabaseAdmin.from('counters').select('active, on_break')
      .eq('counter_number', patient.counter).maybeSingle();
    if (!counter?.active || counter.on_break) return NextResponse.json({ error: 'The destination counter is unavailable or on break.' }, { status: 409 });
  }

  const ticket = formatTicketForSpeech(patient.patientNum);
  const destination = registration ? `Counter ${patient.counter}` : cubicle ? cubicle.cubicleNum : `the ${patient.service} area`;
  const { data, error } = await supabaseAdmin.rpc('enqueue_monitor_call', {
    p_patient_id: patient.id, p_actor_id: guard.user.id,
    p_service: registration ? 'Registration' : patient.service,
    p_subcategory: registration ? null : cubicle?.subcategory ?? patient.subcategory ?? null,
    p_counter: registration ? patient.counter : null, p_cubicle: cubicle?.cubicleNum ?? null,
    p_ticket: patient.patientNum, p_message: `Number ${ticket}, Number ${ticket}, please proceed to ${destination}`,
  });
  if (error) return NextResponse.json({ error: 'Unable to send the call to the monitor.' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Please wait a few seconds before calling again.' }, { status: 429 });
  return NextResponse.json({ success: true }, { status: 202 });
}

/**
 * Delivers short-lived, destination-filtered events to started public monitors.
 * @param request - Service, optional subcategory, and monotonically increasing cursor.
 * @returns Public ticket/message data only; stale and unavailable destinations are suppressed.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const service = params.get('service');
  const subcategory = params.get('subcategory');
  const after = params.get('after');
  if (!service || service.length > 1024 || (subcategory?.length ?? 0) > 128 ||
    (after !== null && (!/^\d+$/.test(after) || !Number.isSafeInteger(Number(after))))) {
    return NextResponse.json({ error: 'Invalid monitor destination.' }, { status: 400 });
  }
  const rawServices = service.split(',').map(s => s.trim()).filter(Boolean);
  if (rawServices.length === 0) {
    return NextResponse.json({ error: 'Invalid monitor destination.' }, { status: 400 });
  }

  const targetDestinations = rawServices.map(s => {
    const [base, sub] = s.includes('-') ? s.split('-') : [s, null];
    return {
      service: base.trim(),
      subcategory: sub ? sub.trim() : (subcategory || null)
    };
  });
  const baseServices = [...new Set(targetDestinations.map(t => t.service))];

  let query = supabaseAdmin.from('monitor_calls')
    .select('id, patient_id, service, subcategory, counter, cubicle, ticket, message, expires_at')
    .gt('expires_at', new Date().toISOString());

  if (baseServices.length === 1 && targetDestinations.length === 1) {
    query = query.eq('service', baseServices[0]);
    if (targetDestinations[0].subcategory) {
      query = query.eq('subcategory', targetDestinations[0].subcategory);
    }
  } else {
    query = query.in('service', baseServices);
  }

  if (after === null) {
    const { data, error } = await query.order('id', { ascending: false }).limit(1);
    if (error) return NextResponse.json({ error: 'Monitor calls unavailable.' }, { status: 503 });
    return NextResponse.json({ calls: [], cursor: data?.[0]?.id ?? 0 }, { headers: HEADERS });
  }
  const { data: events, error } = await query.gt('id', Number(after)).order('id').limit(50);
  if (error) return NextResponse.json({ error: 'Monitor calls unavailable.' }, { status: 503 });
  if (!events?.length) return NextResponse.json({ calls: [], cursor: Number(after) }, { headers: HEADERS });
  const [counters, cubicles, patients] = await Promise.all([
    supabaseAdmin.from('counters').select('counter_number').eq('active', true).eq('on_break', false),
    supabaseAdmin.from('cubicle').select('cubicleNum').eq('on_break', false),
    supabaseAdmin.from('patients').select('id, counter, cubicleNum, reg_end, status, service, subcategory')
      .in('id', events.map(event => event.patient_id)).eq('is_historical', false),
  ]);
  if ([counters, cubicles, patients].some(result => result.error)) {
    return NextResponse.json({ error: 'Station availability cannot be verified.' }, { status: 503 });
  }
  const openCounters = new Set((counters.data ?? []).map(counter => counter.counter_number));
  const openCubicles = new Set((cubicles.data ?? []).map(cubicle => cubicle.cubicleNum));
  const calls = events.filter(event => {
    const patient = patients.data?.find(patient => patient.id === event.patient_id);
    if (!patient || ['Done', 'Idle', 'Removed'].includes(patient.status)) return false;

    // Match destination service and subcategory (e.g. Consultation-Pedia vs Consultation-Adult)
    const targetMatch = targetDestinations.find(dest =>
      dest.service === event.service &&
      (!dest.subcategory || dest.subcategory === event.subcategory)
    );
    if (!targetMatch) return false;

    if (event.counter != null) {
      return targetMatch.service === 'Registration' &&
        openCounters.has(event.counter) &&
        patient.counter === event.counter &&
        !patient.reg_end &&
        !patient.cubicleNum;
    }

    if (patient.service !== event.service) return false;
    if (targetMatch.subcategory && (patient.subcategory ?? null) !== targetMatch.subcategory) return false;

    if (event.cubicle) return openCubicles.has(event.cubicle) && patient.cubicleNum === event.cubicle;
    return !patient.cubicleNum && (patient.subcategory ?? null) === event.subcategory &&
      (patient.counter == null || Boolean(patient.reg_end));
  }).map(({ id, ticket, message, counter, cubicle, expires_at }) => ({ id, ticket, message, counter, cubicle, expiresAt: expires_at }));
  return NextResponse.json({ calls, cursor: events[events.length - 1].id }, { headers: HEADERS });
}
