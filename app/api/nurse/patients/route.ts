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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_ROLES = ['nurse', 'staff', 'doctor', 'admin', 'superadmin'];

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

  const isSupervisor = user.role.toLowerCase() === 'superadmin' || user.role.toLowerCase() === 'admin';

  // Discover user assignments and facility metadata concurrently
  const [
    { data: links, error: linksError },
    { data: userServices, error: servicesError },
    { data: allServices, error: metadataError },
    { data: allCubicles, error: cubiclesError },
  ] = await Promise.all([
    supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
    supabaseAdmin.from('user_services').select('service').eq('user_id', user.id),
    supabaseAdmin.from('services').select('label_en, requires_nurse, requires_registration, display_order').order('display_order', { ascending: true }),
    supabaseAdmin.from('cubicle').select('id, cubicleNum, category, room, subcategory, doctorId').order('room').order('cubicleNum'),
  ]);

  if (linksError || servicesError || metadataError || cubiclesError) {
    return NextResponse.json({ error: 'Unable to load Doctors Station assignments. Please retry.' }, { status: 503 });
  }

  const assignedServiceNames = (userServices ?? []).map((s) => s.service).filter(Boolean);
  const cubicleIds = (links ?? []).map((l) => l.cubicle_id).filter(Boolean);
  const activeNurseServices = (allServices ?? [])
    .filter((s) => s.requires_nurse !== false)
    .map((s) => s.label_en)
    .filter(Boolean);

  const regRequiredServices = new Set(
    (allServices ?? [])
      .filter((s) => s.requires_registration !== false)
      .map((s) => s.label_en.trim().toLowerCase())
  );

  // Filter cubicles applicable to this nurse (strictly enforce 1-to-1 cubicle claim)
  const hasClaimedCubicle = cubicleIds.length > 0;
  const cubicles = (allCubicles ?? []).filter((c) => {
    if (hasClaimedCubicle) {
      return cubicleIds.includes(c.id);
    }
    return isSupervisor || assignedServiceNames.includes(c.category);
  });
  const cubicleNums = cubicles.map((c) => c.cubicleNum).filter(Boolean);
  const cubicleCategories = Array.from(new Set(cubicles.map((c) => c.category).filter(Boolean)));

  // Combine explicit user_services with categories of assigned cubicles
  const combinedServices = Array.from(
    new Set([
      ...assignedServiceNames,
      ...cubicleCategories,
      ...(isSupervisor && assignedServiceNames.length === 0 && cubicleIds.length === 0 ? activeNurseServices : []),
    ])
  );
  const effectiveServices = (isSupervisor && !hasClaimedCubicle) ? activeNurseServices : combinedServices;

  // Today in Manila time
  const { start: today, end: tomorrow } = manilaDayRange(Date.now());

  // Query active non-terminal patients that have been assigned to a cubicle
  const activeQueries = [];
  if (isSupervisor) {
    activeQueries.push(
      supabaseAdmin
        .from('patients')
        .select('*')
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
  if (isSupervisor) {
    finishedQueries.push(
      supabaseAdmin
        .from('patients')
        .select('*')
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
    effectiveServices,
  });
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
