/**
 * @fileoverview Authenticated endpoint for claiming and persisting a 1-to-1 staff station assignment
 * (single Registration Counter or single Nurse/Doctor Cubicle) and associated multi-service subscriptions.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Server-side authentication and role-checking via requireUser
 * - Atomic database operations via supabaseAdmin
 * - Strict type-safety, guard clauses, and maximum 3 nesting levels
 * - Zero emojis in comments or logs
 *
 * @module app/api/workstation/station-claim/route
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { equallyDistributeCounterQueues } from '@/lib/supabase/queueDistribution';

/** Staff roles authorized to configure and claim operational stations. */
const AUTHORIZED_ROLES = new Set([
  'superadmin',
  'admin',
  'registration',
  'nurse',
  'doctor',
  'staff',
]);

/** Response headers disabling caching for live station status. */
const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/**
 * Shape of incoming station claim mutation request body.
 */
interface StationClaimRequestBody {
  workstation: 'registration' | 'nurse';
  counter?: number;
  cubicleId?: number;
  services: string[];
}

/**
 * Resolves the authenticated user from the database users table.
 *
 * @param authId - Supabase Auth UUID.
 * @returns User record or null.
 */
async function resolveStaffUser(authId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, role, username, email')
    .eq('auth_id', authId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data;
}

/**
 * GET handler: Retrieves current station configurations, available counters,
 * cubicles, services, and current staff occupancy.
 *
 * @param request - Authenticated Bearer request.
 * @returns JSON payload describing stations and caller's current setup.
 */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const staffUser = await resolveStaffUser(guard.user.id);
  if (!staffUser || !AUTHORIZED_ROLES.has(staffUser.role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }

  const [
    countersResult,
    cubiclesResult,
    servicesResult,
    userCountersResult,
    userCubiclesResult,
    userServicesResult,
    allOccupiedCountersResult,
    allOccupiedCubiclesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('counters')
      .select('counter_number, label, active, on_break')
      .eq('active', true)
      .order('counter_number', { ascending: true }),
    supabaseAdmin
      .from('cubicle')
      .select('id, cubicleNum, category, room, subcategory, doctorId, on_break')
      .order('room', { ascending: true })
      .order('cubicleNum', { ascending: true }),
    supabaseAdmin
      .from('services')
      .select('id, label_en, requires_nurse, requires_registration, display_order')
      .order('display_order', { ascending: true }),
    supabaseAdmin
      .from('user_counters')
      .select('counter')
      .eq('user_id', staffUser.id),
    supabaseAdmin
      .from('user_cubicles')
      .select('cubicle_id')
      .eq('user_id', staffUser.id),
    supabaseAdmin
      .from('user_services')
      .select('service')
      .eq('user_id', staffUser.id),
    supabaseAdmin
      .from('user_counters')
      .select('counter, user_id, users(id, username, auth_id)'),
    supabaseAdmin
      .from('user_cubicles')
      .select('cubicle_id, user_id, users(id, username, auth_id)'),
  ]);

  if (countersResult.error || cubiclesResult.error || servicesResult.error) {
    return NextResponse.json({ error: 'Unable to retrieve station metadata.' }, { status: 500 });
  }

  // Verify active status of occupants in user_counters and user_cubicles
  const nowEpoch = Date.now();
  const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours shift window

  // Load auth users to check active status and last_sign_in_at if listUsers is available
  const authUserMap = new Map<string, { lastSignInAt: number }>();
  if (typeof supabaseAdmin.auth?.admin?.listUsers === 'function') {
    try {
      const { data: authUsersResult } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
      for (const u of authUsersResult?.users ?? []) {
        const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
        authUserMap.set(u.id, { lastSignInAt: lastSignIn });
      }
    } catch {
      // Ignore auth user listing errors in restricted test environments
    }
  }

  const staleUserIds = new Set<number>();
  const isUserStale = (userId: number, authId?: string | null): boolean => {
    if (userId === staffUser.id) return false;
    if (authUserMap.size === 0) return false;
    if (!authId) return true;
    const authData = authUserMap.get(authId);
    if (!authData) return true;
    if (authData.lastSignInAt === 0) return true;
    if (nowEpoch - authData.lastSignInAt > MAX_SESSION_AGE_MS) return true;
    return false;
  };

  // Map counter occupancy by other users, omitting stale records
  const counterOccupancy: Record<number, { userId: number; username: string }> = {};
  for (const item of allOccupiedCountersResult.data ?? []) {
    const userObj = item.users as { id?: number; username?: string; auth_id?: string } | null;
    if (item.user_id !== staffUser.id && userObj?.username) {
      if (isUserStale(item.user_id, userObj.auth_id)) {
        staleUserIds.add(item.user_id);
        continue;
      }
      if (!counterOccupancy[item.counter]) {
        counterOccupancy[item.counter] = {
          userId: item.user_id,
          username: userObj.username,
        };
      }
    }
  }

  // Map cubicle occupancy by other users, omitting stale records
  const cubicleOccupancy: Record<number, { userId: number; username: string }> = {};
  for (const item of allOccupiedCubiclesResult.data ?? []) {
    const userObj = item.users as { id?: number; username?: string; auth_id?: string } | null;
    if (item.user_id !== staffUser.id && userObj?.username) {
      if (isUserStale(item.user_id, userObj.auth_id)) {
        staleUserIds.add(item.user_id);
        continue;
      }
      if (!cubicleOccupancy[item.cubicle_id]) {
        cubicleOccupancy[item.cubicle_id] = {
          userId: item.user_id,
          username: userObj.username,
        };
      }
    }
  }

  // Asynchronously purge stale claims from inactive sessions
  if (staleUserIds.size > 0) {
    const staleArray = Array.from(staleUserIds);
    void (async () => {
      try {
        const { data: staleUsers } = await supabaseAdmin
          .from('users')
          .select('auth_id')
          .in('id', staleArray);
        const staleAuthIds = (staleUsers ?? []).map((u) => u.auth_id).filter((id): id is string => typeof id === 'string');
        if (staleAuthIds.length > 0) {
          const { data: staleDoctors } = await supabaseAdmin
            .from('doctors')
            .select('id')
            .in('auth_id', staleAuthIds);
          const staleDoctorIds = (staleDoctors ?? []).map((d) => d.id).filter((id): id is string => typeof id === 'string');
          if (staleDoctorIds.length > 0) {
            await supabaseAdmin.from('cubicle').update({ doctorId: null }).in('doctorId', staleDoctorIds);
          }
        }
        await Promise.all([
          supabaseAdmin.from('user_counters').delete().in('user_id', staleArray),
          supabaseAdmin.from('user_cubicles').delete().in('user_id', staleArray),
        ]);
      } catch (staleErr) {
        console.warn('[STATION CLAIM] Error purging stale sessions:', staleErr);
      }
    })();
  }

  const savedCounters = (userCountersResult.data ?? []).map((c) => c.counter);
  const savedCubicles = (userCubiclesResult.data ?? []).map((c) => c.cubicle_id);
  const savedServices = (userServicesResult.data ?? []).map((s) => s.service);

  const rawConfig = guard.user.user_metadata?.station_config;
  const savedConfig = (rawConfig && typeof rawConfig === 'object' ? rawConfig : null) as {
    workstation?: string;
    counter?: number | null;
    cubicleId?: number | null;
    services?: string[];
  } | null;

  return NextResponse.json(
    {
      user: {
        id: staffUser.id,
        role: staffUser.role,
        username: staffUser.username,
      },
      currentAssignment: {
        counter: savedCounters[0] ?? null,
        cubicleId: savedCubicles[0] ?? null,
        services: savedServices,
      },
      savedConfiguration: savedConfig,
      counters: (countersResult.data ?? []).map((c) => ({
        counter_number: c.counter_number,
        label: c.label || `Counter ${c.counter_number}`,
        on_break: Boolean(c.on_break),
        occupiedBy: counterOccupancy[c.counter_number] ?? null,
      })),
      cubicles: (cubiclesResult.data ?? []).map((cub) => ({
        id: cub.id,
        cubicleNum: cub.cubicleNum,
        category: cub.category,
        room: cub.room,
        subcategory: cub.subcategory,
        doctorId: cub.doctorId,
        on_break: Boolean(cub.on_break),
        occupiedBy: cubicleOccupancy[cub.id] ?? null,
      })),
      services: (servicesResult.data ?? []).map((s) => ({
        id: s.id,
        label_en: s.label_en,
        requires_nurse: s.requires_nurse,
        requires_registration: s.requires_registration,
      })),
    },
    { headers: NO_CACHE_HEADERS }
  );
}

/**
 * POST handler: Atomically saves a single counter or cubicle claim and the selected multi-services.
 *
 * @param request - Request containing StationClaimRequestBody.
 * @returns JSON confirmation of saved station assignment.
 */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const staffUser = await resolveStaffUser(guard.user.id);
  if (!staffUser || !AUTHORIZED_ROLES.has(staffUser.role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Partial<StationClaimRequestBody> | null;
  if (!body || !body.workstation || !Array.isArray(body.services) || body.services.length === 0) {
    return NextResponse.json(
      { error: 'A workstation type and at least one active service are required.' },
      { status: 400 }
    );
  }

  const cleanServices = body.services
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim());

  if (cleanServices.length === 0) {
    return NextResponse.json({ error: 'At least one valid service must be selected.' }, { status: 400 });
  }

  // Verify workstation access permission
  const userAllowedWorkstations = guard.user.user_metadata?.allowed_workstations;
  if (Array.isArray(userAllowedWorkstations)) {
    const requiredKey = body.workstation === 'registration' ? 'transfer' : 'nurse';
    if (!userAllowedWorkstations.includes(requiredKey)) {
      return NextResponse.json(
        { error: `Account permissions do not allow claiming the ${body.workstation} workstation.` },
        { status: 403 }
      );
    }
  }

  if (body.workstation === 'registration') {
    if (!Number.isSafeInteger(body.counter) || (body.counter ?? 0) <= 0) {
      return NextResponse.json({ error: 'A valid registration counter number is required.' }, { status: 400 });
    }

    const counterNum = body.counter!;

    // Verify counter exists and is active
    const { data: counterRecord } = await supabaseAdmin
      .from('counters')
      .select('counter_number')
      .eq('counter_number', counterNum)
      .eq('active', true)
      .maybeSingle();

    if (!counterRecord) {
      return NextResponse.json({ error: 'Selected counter is not available or inactive.' }, { status: 400 });
    }

    // Verify counter is not actively occupied by another staff account
    const { data: existingCounterOccupant } = await supabaseAdmin
      .from('user_counters')
      .select('user_id, users(username)')
      .eq('counter', counterNum)
      .neq('user_id', staffUser.id)
      .maybeSingle();

    if (existingCounterOccupant) {
      const occupantObj = existingCounterOccupant.users as { username?: string } | null;
      const occupantName = occupantObj?.username || 'another staff account';
      return NextResponse.json(
        { error: `Counter ${counterNum} is currently in use by ${occupantName}. Other accounts cannot select this counter while occupied.` },
        { status: 409 }
      );
    }

    // Atomic station claim: Remove existing desk assignments for caller
    await Promise.all([
      supabaseAdmin.from('user_counters').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_cubicles').delete().eq('user_id', staffUser.id),
    ]);

    const { error: insertCounterErr } = await supabaseAdmin.from('user_counters').insert({
      user_id: staffUser.id,
      counter: counterNum,
    });

    if (insertCounterErr) {
      return NextResponse.json({ error: 'Failed to assign counter.' }, { status: 500 });
    }

    // Atomic services update
    await supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id);
    const serviceRows = cleanServices.map((service) => ({
      user_id: staffUser.id,
      service,
    }));
    await supabaseAdmin.from('user_services').insert(serviceRows);

    // Save configuration per account into user_metadata so it is remembered on next login
    try {
      const existingMeta = (guard.user.user_metadata ?? {}) as Record<string, unknown>;
      await supabaseAdmin.auth.admin.updateUserById(guard.user.id, {
        user_metadata: {
          ...existingMeta,
          station_config: {
            workstation: 'registration',
            counter: counterNum,
            cubicleId: null,
            services: cleanServices,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch (metaErr) {
      console.warn('[STATION CLAIM] Could not save station_config to user_metadata:', metaErr);
    }

    // Automatically trigger queue balance/equal distribution across open counters serving these services
    try {
      const distribution = await equallyDistributeCounterQueues({ actorAuthId: guard.user.id, targetServices: cleanServices });
      if (!distribution.ok) console.warn('Counter claimed; queue distribution needs a manual retry.');
    } catch {
      console.warn('Counter claimed; queue distribution needs a manual retry.');
    }

    return NextResponse.json({
      success: true,
      workstation: 'registration',
      counter: counterNum,
      services: cleanServices,
    });
  }

  if (body.workstation === 'nurse') {
    if (!Number.isSafeInteger(body.cubicleId) || (body.cubicleId ?? 0) <= 0) {
      return NextResponse.json({ error: 'A valid cubicle identifier is required.' }, { status: 400 });
    }

    const cubicleId = body.cubicleId!;

    // Verify cubicle exists
    const { data: cubicleRecord } = await supabaseAdmin
      .from('cubicle')
      .select('id, cubicleNum, room, category')
      .eq('id', cubicleId)
      .maybeSingle();

    if (!cubicleRecord) {
      return NextResponse.json({ error: 'Selected cubicle does not exist.' }, { status: 400 });
    }

    // Verify cubicle is not actively occupied by another staff account
    const { data: existingCubicleOccupant } = await supabaseAdmin
      .from('user_cubicles')
      .select('user_id, users(username)')
      .eq('cubicle_id', cubicleId)
      .neq('user_id', staffUser.id)
      .maybeSingle();

    if (existingCubicleOccupant) {
      const occupantObj = existingCubicleOccupant.users as { username?: string } | null;
      const occupantName = occupantObj?.username || 'another staff account';
      return NextResponse.json(
        { error: `${cubicleRecord.cubicleNum || `Cubicle ${cubicleId}`} is currently in use by ${occupantName}. Other accounts cannot select this cubicle while occupied.` },
        { status: 409 }
      );
    }

    // Verify cubicle is not actively occupied by another doctor account
    if (cubicleRecord.doctorId) {
      const { data: cubicleDoctor } = await supabaseAdmin
        .from('doctors')
        .select('id, full_name, auth_id')
        .eq('id', cubicleRecord.doctorId)
        .maybeSingle();

      if (cubicleDoctor?.auth_id && cubicleDoctor.auth_id !== guard.user.id) {
        const { data: docUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('auth_id', cubicleDoctor.auth_id)
          .maybeSingle();

        if (docUser?.id) {
          const { data: docOccupant } = await supabaseAdmin
            .from('user_cubicles')
            .select('cubicle_id')
            .eq('user_id', docUser.id)
            .eq('cubicle_id', cubicleId)
            .maybeSingle();

          if (docOccupant) {
            return NextResponse.json(
              { error: `${cubicleRecord.cubicleNum || `Cubicle ${cubicleId}`} is currently in use by Dr. ${cubicleDoctor.full_name}. Other accounts cannot select this cubicle while occupied.` },
              { status: 409 }
            );
          }
        }
      }
    }

    // Atomic station claim: Remove existing desk assignments for caller
    await Promise.all([
      supabaseAdmin.from('user_counters').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_cubicles').delete().eq('user_id', staffUser.id),
    ]);

    const { error: insertCubicleErr } = await supabaseAdmin.from('user_cubicles').insert({
      user_id: staffUser.id,
      cubicle_id: cubicleId,
    });

    if (insertCubicleErr) {
      return NextResponse.json({ error: 'Failed to assign cubicle.' }, { status: 500 });
    }

    // If caller is a physician, link this cubicle to doctor record and detach any previous cubicle
    let doctorIdToLink: string | null = null;
    const { data: doctorByAuth } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('auth_id', guard.user.id)
      .maybeSingle();

    if (doctorByAuth?.id) {
      doctorIdToLink = doctorByAuth.id;
    } else if (staffUser.username) {
      const { data: doctorByName } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .ilike('full_name', `%${staffUser.username.trim()}%`)
        .maybeSingle();
      if (doctorByName?.id) {
        doctorIdToLink = doctorByName.id;
        await supabaseAdmin.from('doctors').update({ auth_id: guard.user.id }).eq('id', doctorByName.id);
      }
    }

    if (doctorIdToLink) {
      await supabaseAdmin.from('cubicle').update({ doctorId: null }).eq('doctorId', doctorIdToLink);
      await supabaseAdmin.from('cubicle').update({ doctorId: doctorIdToLink }).eq('id', cubicleId);
    }

    // Atomic services update
    await supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id);
    const serviceRows = cleanServices.map((service) => ({
      user_id: staffUser.id,
      service,
    }));
    await supabaseAdmin.from('user_services').insert(serviceRows);

    // Save configuration per account into user_metadata so it is remembered on next login
    try {
      const existingMeta = (guard.user.user_metadata ?? {}) as Record<string, unknown>;
      await supabaseAdmin.auth.admin.updateUserById(guard.user.id, {
        user_metadata: {
          ...existingMeta,
          station_config: {
            workstation: 'nurse',
            counter: null,
            cubicleId,
            services: cleanServices,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch (metaErr) {
      console.warn('[STATION CLAIM] Could not save station_config to user_metadata:', metaErr);
    }

    return NextResponse.json({
      success: true,
      workstation: 'nurse',
      cubicleId,
      cubicleNum: cubicleRecord.cubicleNum,
      services: cleanServices,
    });
  }

  return NextResponse.json({ error: 'Invalid workstation type specified.' }, { status: 400 });
}

/**
 * DELETE handler: Removes the caller's claimed counter or cubicle and associated user_services,
 * reverting the account back to an unconfigured state and restoring supervisor/full view for admins.
 *
 * @param request - Request containing optional ?workstation query parameter.
 * @returns JSON confirmation of removed station configuration.
 */
export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const staffUser = await resolveStaffUser(guard.user.id);
  if (!staffUser || !AUTHORIZED_ROLES.has(staffUser.role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const workstation = searchParams.get('workstation');

  // Detach doctor assignment if caller has an active doctor directory record
  const { data: doctorRow } = await supabaseAdmin
    .from('doctors')
    .select('id')
    .eq('auth_id', guard.user.id)
    .maybeSingle();

  if (doctorRow?.id && (workstation === 'nurse' || !workstation)) {
    await supabaseAdmin.from('cubicle').update({ doctorId: null }).eq('doctorId', doctorRow.id);
  }

  if (workstation === 'registration') {
    await Promise.all([
      supabaseAdmin.from('user_counters').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id),
    ]);
    return NextResponse.json({ success: true, removed: 'registration' });
  }

  if (workstation === 'nurse') {
    await Promise.all([
      supabaseAdmin.from('user_cubicles').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id),
    ]);
    return NextResponse.json({ success: true, removed: 'nurse' });
  }

  // Clear all station claims for the caller
  await Promise.all([
    supabaseAdmin.from('user_counters').delete().eq('user_id', staffUser.id),
    supabaseAdmin.from('user_cubicles').delete().eq('user_id', staffUser.id),
    supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id),
  ]);

  return NextResponse.json({ success: true, removed: 'all' });
}

