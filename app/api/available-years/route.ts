/**
 * @fileoverview Resilient API endpoint for retrieving distinct historical operational years.
 *
 * Implements a dual-tier retrieval architecture:
 * 1. Server-side staff authentication verifying active session and authorized clinical roles.
 * 2. Tries the Python analytics backend first with a 1.5s timeout.
 * 3. Falls back to direct PostgreSQL queries via supabaseAdmin to ensure the dashboard
 *    historical breakdown never fails to load even when analytics services are offline.
 *
 * @remarks
 * Conforms strictly to AGENTS.md:
 * - Server-side route guarding (require authenticated staff)
 * - Service-role isolation (supabaseAdmin on server only)
 * - Zero PII disclosure (returns only distinct calendar years)
 * - Zero emojis
 *
 * @module app/api/available-years/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

export const dynamic = 'force-dynamic';

const ALLOWED_STAFF_ROLES = new Set([
  'superadmin',
  'admin',
  'registration',
  'staff',
  'nurse',
  'doctor',
]);

/**
 * Validates that the request originates from an authenticated hospital staff member.
 *
 * @param request - Incoming HTTP request.
 * @returns Object with authorization status or early failure response.
 */
async function authorizeStaff(request: NextRequest) {
  let authUserId: string | null = null;

  // 1. Inspect Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        authUserId = data.user.id;
      }
    }
  }

  // 2. Fall back to Supabase SSR session cookie
  if (!authUserId) {
    const cookieClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data, error } = await cookieClient.auth.getUser();
    if (!error && data?.user) {
      authUserId = data.user.id;
    }
  }

  if (!authUserId) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  // 3. Verify user's staff role in PostgreSQL users table
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('auth_id', authUserId)
    .maybeSingle();

  const role = typeof profile?.role === 'string' ? profile.role.toLowerCase().trim() : '';

  if (profileErr || !profile || !ALLOWED_STAFF_ROLES.has(role)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Staff authorization required' }, { status: 403 }),
    };
  }

  return { authorized: true as const, userId: authUserId, role };
}

/**
 * Resolves distinct operational years from PostgreSQL via supabaseAdmin.
 *
 * @returns Array of integer years in descending order.
 */
async function computeYearsFromDatabase(): Promise<number[]> {
  const [earliestRes, latestRes] = await Promise.all([
    supabaseAdmin
      .from('patients')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('patients')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const currentYear = new Date().getFullYear();

  if (!earliestRes.data?.created_at || !latestRes.data?.created_at) {
    return [currentYear];
  }

  const startYear = new Date(earliestRes.data.created_at).getFullYear();
  const endYear = new Date(latestRes.data.created_at).getFullYear();

  if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
    return [currentYear];
  }

  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }

  if (!years.includes(currentYear)) {
    years.unshift(currentYear);
  }

  return years;
}

/**
 * GET handler returning available operating years for historical throughput breakdown.
 *
 * @param request - NextRequest object.
 * @returns JSON response containing { years: number[] }.
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const pythonBackendUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';

  // 1. Try Python analytics backend first with a 1.5s deadline
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${pythonBackendUrl}/api/available-years`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.years) && data.years.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Analytics backend offline or timed out; fall through to Supabase fallback
  }

  // 2. Direct Supabase Fallback
  try {
    const years = await computeYearsFromDatabase();
    return NextResponse.json({ years });
  } catch {
    const fallbackYear = new Date().getFullYear();
    return NextResponse.json({ years: [fallbackYear] });
  }
}
