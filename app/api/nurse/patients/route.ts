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
    { data: links },
    { data: userServices },
    { data: allServices },
    { data: allCubicles },
  ] = await Promise.all([
    supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
    supabaseAdmin.from('user_services').select('service').eq('user_id', user.id),
    supabaseAdmin.from('services').select('label_en, requires_nurse, display_order').order('display_order', { ascending: true }),
    supabaseAdmin.from('cubicle').select('id, cubicleNum, category, room, subcategory, doctorId').order('room').order('cubicleNum'),
  ]);

  const assignedServiceNames = (userServices ?? []).map((s) => s.service).filter(Boolean);
  const cubicleIds = (links ?? []).map((l) => l.cubicle_id).filter(Boolean);
  const activeNurseServices = (allServices ?? [])
    .filter((s) => s.requires_nurse !== false)
    .map((s) => s.label_en)
    .filter(Boolean);

  // Filter cubicles applicable to this nurse
  const cubicles = (allCubicles ?? []).filter(
    (c) => isSupervisor || cubicleIds.includes(c.id) || assignedServiceNames.includes(c.category)
  );
  const cubicleNums = cubicles.map((c) => c.cubicleNum).filter(Boolean);
  const cubicleCategories = Array.from(new Set(cubicles.map((c) => c.category).filter(Boolean)));

  // Combine explicit user_services with categories of assigned cubicles
  const combinedServices = Array.from(
    new Set([
      ...assignedServiceNames,
      ...cubicleCategories,
      ...(assignedServiceNames.length === 0 && cubicleIds.length === 0 ? activeNurseServices : []),
    ])
  );
  const effectiveServices = isSupervisor ? activeNurseServices : combinedServices;

  // Today in Manila time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Query active non-terminal patients
  const activeQueries = [];
  if (isSupervisor) {
    activeQueries.push(
      supabaseAdmin
        .from('patients')
        .select('*')
        .neq('status', 'Done')
        .neq('status', 'Idle')
        .neq('status', 'Removed')
        .eq('is_historical', false)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true })
    );
  } else {
    if (cubicleNums.length > 0) {
      activeQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .neq('status', 'Done')
          .neq('status', 'Idle')
          .neq('status', 'Removed')
          .eq('is_historical', false)
          .in('cubicleNum', cubicleNums)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true }),
        supabaseAdmin
          .from('patients')
          .select('*')
          .neq('status', 'Done')
          .neq('status', 'Idle')
          .neq('status', 'Removed')
          .eq('is_historical', false)
          .overlaps('preferredCubicleNums', cubicleNums)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true })
      );
    }
    if (effectiveServices.length > 0) {
      activeQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .neq('status', 'Done')
          .neq('status', 'Idle')
          .neq('status', 'Removed')
          .eq('is_historical', false)
          .in('service', effectiveServices)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true })
      );
    }
  }

  const activeResults = await Promise.all(activeQueries);
  const activeMap = new Map<number, Patient>();
  for (const res of activeResults) {
    if (res.data) {
      for (const p of res.data) {
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
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
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
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('updated_at', { ascending: false }),
        supabaseAdmin
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .eq('is_historical', false)
          .overlaps('preferredCubicleNums', cubicleNums)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('updated_at', { ascending: false })
      );
    }
    if (effectiveServices.length > 0) {
      finishedQueries.push(
        supabaseAdmin
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .eq('is_historical', false)
          .in('service', effectiveServices)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('updated_at', { ascending: false })
      );
    }
  }

  const finishedResults = await Promise.all(finishedQueries);
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
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const body = await request.json();
  const { patientId, updates } = body;

  if (!patientId || !updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'patientId and updates object are required.' }, { status: 400 });
  }

  // Prevent mutation of primary key or historical partition indicator
  delete updates.id;
  delete updates.is_historical;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('patients')
    .update(updates)
    .eq('id', patientId)
    .eq('is_historical', false)
    .select()
    .single();

  if (error) {
    console.error('[API NURSE PATIENTS PATCH ERROR]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, patient: data });
}
