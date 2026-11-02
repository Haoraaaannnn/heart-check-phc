/**
 * @fileoverview Staff Authentication Logout endpoint (/api/auth/logout).
 *
 * Terminates authenticated sessions across Philippine Heart Center workstations,
 * invalidating Supabase tokens and destroying session cookies with zero-lifetime flags.
 *
 * @remarks
 * Conforms strictly to AGENTS.md secure coding standards:
 * - Destroys all Supabase session cookies (`sb-*`) by explicitly setting `maxAge: 0`.
 * - Employs `Cache-Control: no-store` to prevent caching of auth state.
 * - Zero emojis in code and documentation.
 *
 * @module app/api/auth/logout/route
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

/**
 * Releases active workstation desks and doctor cubicle assignments on logout,
 * while saving the user's configuration into user_metadata so their setup is remembered.
 *
 * @param authId - Supabase Auth UUID.
 */
async function releaseActiveWorkstationOnLogout(authId: string): Promise<void> {
  try {
    const { data: staffUser, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, role, auth_id, username')
      .eq('auth_id', authId)
      .maybeSingle();

    if (staffError || !staffUser) return;

    // Resolve doctor directory record if caller is a physician
    let doctorIdToRelease: string | null = null;
    const { data: doctorRow } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (doctorRow?.id) {
      doctorIdToRelease = doctorRow.id;
    } else if (staffUser.username) {
      const { data: doctorByName } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .ilike('full_name', `%${staffUser.username.trim()}%`)
        .maybeSingle();
      if (doctorByName?.id) {
        doctorIdToRelease = doctorByName.id;
        await supabaseAdmin.from('doctors').update({ auth_id: authId }).eq('id', doctorByName.id);
      }
    }

    // 1. Read current active assignments to preserve in user_metadata before deletion
    const [counterRes, cubicleRes, serviceRes] = await Promise.all([
      supabaseAdmin.from('user_counters').select('counter').eq('user_id', staffUser.id),
      supabaseAdmin.from('user_cubicles').select('cubicle_id').eq('user_id', staffUser.id),
      supabaseAdmin.from('user_services').select('service').eq('user_id', staffUser.id),
    ]);

    const activeCounters = (counterRes.data ?? []).map((r) => r.counter);
    const activeCubicles = (cubicleRes.data ?? []).map((r) => r.cubicle_id);
    const activeServices = (serviceRes.data ?? []).map((r) => r.service);

    // If activeCubicles was empty, preserve direct cubicle.doctorId assignment into saved configuration
    if (activeCubicles.length === 0 && doctorIdToRelease) {
      const { data: assignedCub } = await supabaseAdmin
        .from('cubicle')
        .select('id')
        .eq('doctorId', doctorIdToRelease)
        .maybeSingle();
      if (assignedCub?.id && typeof assignedCub.id === 'number') {
        activeCubicles.push(assignedCub.id);
      }
    }

    if (activeCounters.length > 0 || activeCubicles.length > 0 || activeServices.length > 0) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authId);
        const existingMeta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
        const existingConfig = (existingMeta.station_config ?? {}) as Record<string, unknown>;

        await supabaseAdmin.auth.admin.updateUserById(authId, {
          user_metadata: {
            ...existingMeta,
            station_config: {
              ...existingConfig,
              counter: activeCounters[0] ?? existingConfig.counter ?? null,
              cubicleId: activeCubicles[0] ?? existingConfig.cubicleId ?? null,
              services: activeServices.length > 0 ? activeServices : (existingConfig.services ?? []),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } catch (metaErr) {
        console.warn('[LOGOUT] Could not update station_config metadata:', metaErr);
      }
    }

    // 2. Clear live desk occupancy so other staff on duty can immediately use the counter/cubicle
    await Promise.all([
      supabaseAdmin.from('user_counters').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_cubicles').delete().eq('user_id', staffUser.id),
      supabaseAdmin.from('user_services').delete().eq('user_id', staffUser.id),
    ]);

    // 3. For Doctors: detach cubicle assignment so the cubicle becomes Unassigned
    if (doctorIdToRelease) {
      await supabaseAdmin
        .from('cubicle')
        .update({ doctorId: null })
        .eq('doctorId', doctorIdToRelease);
    }
  } catch (err) {
    console.error('[LOGOUT] Error releasing workstation assignments:', err);
  }
}

/**
 * Handles POST requests to terminate the active session and revoke cookies.
 *
 * @param request - Next.js Request object used to inspect protocol security.
 * @returns JSON response indicating successful sign-out.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  const proto = request.headers.get('x-forwarded-proto');
  const isSecure =
    proto === 'https' ||
    new URL(request.url).protocol === 'https:' ||
    request.headers.get('referer')?.startsWith('https:') ||
    request.headers.get('origin')?.startsWith('https:') ||
    false;

  try {
    cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore?.getAll() ?? [];
          },
          setAll(cookiesToSet) {
            if (!cookieStore) return;
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore?.set(name, value, options)
            );
          },
        },
      }
    );

    // Resolve user auth id from Bearer token or SSR session before signing out
    try {
      let authId: string | null = null;
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token) {
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          if (userData?.user?.id) {
            authId = userData.user.id;
          }
        }
      }

      if (!authId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          authId = userData.user.id;
        }
      }

      if (authId) {
        await releaseActiveWorkstationOnLogout(authId);
      }
    } catch (workstationErr) {
      console.warn('[LOGOUT] Workstation release non-fatal warning:', workstationErr);
    }

    // Revoke Supabase auth session
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (signOutErr) {
      console.warn('[LOGOUT] Local signOut non-fatal warning:', signOutErr);
    }

    // Explicitly destroy all session cookies matching Supabase prefix
    if (cookieStore) {
      const allCookies = cookieStore.getAll();
      allCookies.forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          cookieStore?.set(cookie.name, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            sameSite: 'lax',
            secure: isSecure,
          });
        }
      });
    }

    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error);
    console.error('[LOGOUT SERVER ERROR]:', message);

    // Emergency cookie eviction fallback even if unexpected runtime failure occurs
    if (cookieStore) {
      try {
        const allCookies = cookieStore.getAll();
        allCookies.forEach((cookie) => {
          if (cookie.name.startsWith('sb-')) {
            cookieStore?.set(cookie.name, '', {
              path: '/',
              maxAge: 0,
              expires: new Date(0),
              sameSite: 'lax',
              secure: isSecure,
            });
          }
        });
      } catch (evictErr) {
        console.error('[LOGOUT] Fallback eviction error:', evictErr);
      }
    }

    const response = NextResponse.json({ success: true, warning: 'Session ended with warnings.' });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
}
