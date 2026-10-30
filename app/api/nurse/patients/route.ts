/**
 * @fileoverview Server-side API Route Handler managing patient queue retrieval
 * and stage transitions for the Nurse Station.
 *
 * Implements:
 * - Server-side authentication and role-checking via requireUser
 * - Service-role execution via supabaseAdmin to safely resolve patient queues
 *   across assigned services and cubicles without RLS drops on null cubicle numbers
 * - Strict historical data immutability enforcement (is_historical = false)
 * - Manila-day UTC range scoping
 * - Parameterized update mutations for clinical stage progression
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 *
 * @module app/api/nurse/patients/route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';
import { Patient } from '@/types/Types';
import { handleNurseTransition } from './transition';
import { manilaDayRange } from '@/utils/manilaDayRange';
import { isOpdScreeningService } from '@/app/nurse/lib/stationView';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_ROLES = ['nurse', 'staff', 'doctor', 'admin', 'superadmin'];
/** Shared OPD Screening viewing exposes operational numbers and timings, excluding names and contact details. */
const QUEUE_VIEW_FIELDS = 'id,patientNum,status,cubicleNum,service,subcategory,created_at,updated_at,reg_start,reg_end,consult_start,consult_end,carryout_start,carryout_end,called_at,queue_position,progress_started_at,cubicle_top_started_at,is_historical';

/**
 * GET: Retrieves today's active and completed patients for the authenticated nurse.
 *
 * @param request - Incoming Next.js HTTP request with Bearer authorization header.
 * @returns JSON response containing patient datasets and assigned scope.
 */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  // Resolve user profile by auth_id first, then fallback to email
  let user: { id: number | string; role?: string; email?: string } | null = null;
  const { data: userByAuth } = await supabaseAdmin
    .from('users')
    .select('id, role, email')
    .eq('auth_id', guard.user.id)
    .maybeSingle();

  if (userByAuth) {
    user = userByAuth;
  } else if (guard.user.email) {
    const { data: userByEmail } = await supabaseAdmin
      .from('users')
      .select('id, role, email')
      .ilike('email', guard.user.email)
      .maybeSingle();

    if (userByEmail) {
      user = userByEmail;
      await supabaseAdmin
        .from('users')
        .update({ auth_id: guard.user.id })
        .eq('id', user.id);
    }
  }

  if (!user || !user.role || !ALLOWED_ROLES.includes(user.role.toLowerCase())) {
    return NextResponse.json({ error: 'Access denied: clinical nurse workstation role required.' }, { status: 403 });
  }

  const requestedScope = new URL(request.url).searchParams.get('scope');
  if (requestedScope && requestedScope !== 'opd-screening') {
    return NextResponse.json({ error: 'Only owned cubicles or the OPD Screening service view are supported.' }, { status: 400 });
  }
  const showAllScreening = requestedScope === 'opd-screening';

  // Discover user assignments and facility metadata concurrently
  const [
    { data: links, error: linksError },
    { data: allServices, error: metadataError },
    { data: allCubicles, error: cubiclesError },
    { data: doctors, error: doctorsError },
  ] = await Promise.all([
    supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
    supabaseAdmin.from('services').select('label_en, requires_nurse, requires_registration, display_order').order('display_order', { ascending: true }),
    supabaseAdmin.from('cubicle').select('id, cubicleNum, category, room, subcategory, doctorId').order('room').order('cubicleNum'),
    supabaseAdmin.from('doctors').select('id,full_name,auth_id'),
  ]);

  if (linksError || metadataError || cubiclesError || doctorsError) {
    return NextResponse.json({ error: 'Unable to load Doctors Station assignments. Please retry.' }, { status: 503 });
  }

  const cubicleIds = (links ?? []).map((l) => l.cubicle_id).filter(Boolean);
  const ownedDoctorIds = new Set((doctors ?? []).filter(doctor => doctor.auth_id === guard.user.id).map(doctor => doctor.id));
  const doctorNames = new Map((doctors ?? []).map(doctor => [doctor.id, doctor.full_name]));
  const stationDirectory = (allCubicles ?? []).map(station => {
    const name: unknown = doctorNames.get(station.doctorId);
    return { ...station, doctorName: typeof name === 'string' ? name : null };
  });

  const regRequiredServices = new Set(
    (allServices ?? [])
      .filter((s) => s.requires_registration !== false)
      .map((s) => s.label_en.trim().toLowerCase())
  );

  // Supervisory permissions do not implicitly turn an owned-station view into a global view.
  const cubicles = stationDirectory.filter(station => cubicleIds.includes(station.id) || ownedDoctorIds.has(station.doctorId));
  const screeningServices = [...new Set(cubicles.filter(station => isOpdScreeningService(station.category)).map(station => station.category))];
  if (showAllScreening && screeningServices.length === 0) {
    return NextResponse.json({ error: 'The shared patient view is available only for assigned OPD Screening stations.' }, { status: 403 });
  }
  const hasClaimedCubicle = cubicles.length > 0;
  const cubicleNums = cubicles.map((c) => c.cubicleNum).filter(Boolean);
  const cubicleCategories = Array.from(new Set(cubicles.map((c) => c.category).filter(Boolean)));

  const effectiveServices = cubicleCategories;

  // Today in Manila time
  const { start: today, end: tomorrow } = manilaDayRange(Date.now());

  // Query active non-terminal patients that have been assigned to a cubicle
  const activeQueries = [];
  if (showAllScreening) {
    activeQueries.push(
      supabaseAdmin
        .from('patients')
        .select(QUEUE_VIEW_FIELDS)
        .in('service', screeningServices)
        .in('status', ['Assigned', 'With Doctor', 'Carryout'])
        .not('cubicleNum', 'is', null)
        .eq('is_historical', false)
        .gte('created_at', today)
        .lt('created_at', tomorrow)
        .order('created_at', { ascending: true })
    );
  } else {
    if (cubicleNums.length > 0) {
      activeQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .in('status', ['Assigned', 'With Doctor', 'Carryout'])
          .not('cubicleNum', 'is', null)
          .eq('is_historical', false)
          .in('cubicleNum', cubicleNums)
          .gte('created_at', today)
          .lt('created_at', tomorrow)
          .order('created_at', { ascending: true })
      );
    }
    if (!hasClaimedCubicle && effectiveServices.length > 0) {
      activeQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .in('status', ['Assigned', 'With Doctor', 'Carryout'])
          .not('cubicleNum', 'is', null)
          .eq('is_historical', false)
          .in('service', effectiveServices)
          .gte('created_at', today)
          .lt('created_at', tomorrow)
          .order('created_at', { ascending: true })
      );
    }
  }

  const activeResults = await Promise.all(activeQueries);
  if (activeResults.some((result) => result.error)) {
    return NextResponse.json({ error: 'Unable to load active patients. Please retry.' }, { status: 503 });
  }
  const activeMap = new Map<number, Patient>();
  for (const res of activeResults) {
    if (res.data) {
      for (const p of res.data) {
        if (!p.cubicleNum) continue;
        const svc = p.service?.trim().toLowerCase() || '';
        // If this service requires registration, do not show until registration is completed
        if (regRequiredServices.has(svc) && !p.reg_end) continue;
        activeMap.set(p.id, p as Patient);
      }
    }
  }
  const rawActive = Array.from(activeMap.values()).sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  // Query completed patients today
  const finishedQueries = [];
  if (showAllScreening) {
    finishedQueries.push(
      supabaseAdmin
        .from('patients')
        .select(QUEUE_VIEW_FIELDS)
        .in('service', screeningServices)
        .eq('status', 'Done')
        .eq('is_historical', false)
        .gte('created_at', today)
        .lt('created_at', tomorrow)
        .order('updated_at', { ascending: false })
    );
  } else {
    if (cubicleNums.length > 0) {
      finishedQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .eq('is_historical', false)
          .in('cubicleNum', cubicleNums)
          .gte('created_at', today)
          .lt('created_at', tomorrow)
          .order('updated_at', { ascending: false }),
        supabaseAdmin
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .eq('is_historical', false)
          .overlaps('preferredCubicleNums', cubicleNums)
          .gte('created_at', today)
          .lt('created_at', tomorrow)
          .order('updated_at', { ascending: false })
      );
    }
    if (!hasClaimedCubicle && effectiveServices.length > 0) {
      finishedQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .eq('is_historical', false)
          .in('service', effectiveServices)
          .gte('created_at', today)
          .lt('created_at', tomorrow)
          .order('updated_at', { ascending: false })
      );
    }
  }

  const finishedResults = await Promise.all(finishedQueries);
  if (finishedResults.some((result) => result.error)) {
    return NextResponse.json({ error: 'Unable to load completed patients. Please retry.' }, { status: 503 });
  }
  const finishedMap = new Map<number, Patient>();
  for (const res of finishedResults) {
    if (res.data) {
      for (const p of res.data) {
        if (!showAllScreening && !cubicleNums.includes(p.cubicleNum)) continue;
        finishedMap.set(p.id, p as Patient);
      }
    }
  }
  const rawFinished = Array.from(finishedMap.values()).sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at || 0).getTime() -
      new Date(a.updated_at || a.created_at || 0).getTime()
  );

  return NextResponse.json({
    patients: rawActive,
    finishedPatients: rawFinished,
    cubicles,
    viewCubicles: showAllScreening ? stationDirectory.filter(station => screeningServices.includes(station.category)) : cubicles,
    effectiveServices,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * PATCH: Updates patient progression stage or clinical timestamps.
 *
 * @param request - Incoming Next.js HTTP request containing patientId and updates payload.
 * @returns JSON response confirming mutation status.
 */
export async function PATCH(request: Request) {
  return handleNurseTransition(request, supabaseAdmin);
}
