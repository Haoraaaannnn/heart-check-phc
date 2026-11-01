/**
 * @fileoverview Resilient API endpoint for monthly bottleneck & throughput breakdown.
 *
 * Implements a dual-tier retrieval architecture:
 * 1. Server-side staff authorization checking active session and hospital roles.
 * 2. Tries the Python analytics backend first with a 2.0s timeout.
 * 3. Gracefully falls back to direct PostgreSQL queries via supabaseAdmin to ensure
 *    the historical breakdown table loads seamlessly in all environments.
 *
 * @remarks
 * Conforms strictly to AGENTS.md:
 * - Server-side route guarding (require authenticated staff)
 * - Service-role isolation (supabaseAdmin on server only)
 * - Zero PII disclosure (returns only aggregate monthly metrics)
 * - Zero emojis
 *
 * @module app/api/monthly-breakdown/[year]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ALLOWED_STAFF_ROLES = new Set([
  'superadmin',
  'admin',
  'registration',
  'staff',
  'nurse',
  'doctor',
]);

export interface MonthEntry {
  month: number;
  month_label: string;
  patient_count: number;
  bottleneck_stage: string;
  system_status: 'Normal' | 'Elevated' | 'Overwhelmed' | 'No Data';
  avg_total_time_min: number;
}

interface SampleRow {
  created_at: string | null;
  reg_start: string | null;
  reg_end: string | null;
  consult_start: string | null;
  consult_end: string | null;
}

/**
 * Validates that the request originates from an authenticated hospital staff member.
 *
 * @param request - Incoming HTTP request.
 * @returns Object with authorization status or early failure response.
 */
async function authorizeStaff(request: NextRequest) {
  let authUserId: string | null = null;

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
 * Creates empty month template entries.
 *
 * @returns 12 default month entries with zero intake and 'No Data' status.
 */
function createEmptyMonths(): MonthEntry[] {
  return MONTH_NAMES.map((label, idx) => ({
    month: idx + 1,
    month_label: label,
    patient_count: 0,
    bottleneck_stage: 'None',
    system_status: 'No Data',
    avg_total_time_min: 0,
  }));
}

/**
 * Computes durations and dominant bottleneck stage from monthly patient samples.
 *
 * @param rows - Sample patient rows.
 * @returns Average duration in minutes and primary bottleneck stage.
 */
function analyzeMonthlySamples(rows: SampleRow[]): { avgTotal: number; bottleneck: string } {
  const totalDurations: number[] = [];
  const regWaitDurations: number[] = [];
  const consultWaitDurations: number[] = [];

  for (const row of rows) {
    if (!row.created_at) continue;
    const createdMs = new Date(row.created_at).getTime();
    const consultEndMs = row.consult_end ? new Date(row.consult_end).getTime() : null;
    const regStartMs = row.reg_start ? new Date(row.reg_start).getTime() : null;
    const regEndMs = row.reg_end ? new Date(row.reg_end).getTime() : null;
    const consultStartMs = row.consult_start ? new Date(row.consult_start).getTime() : null;

    if (consultEndMs && consultEndMs > createdMs) {
      const diffMin = Math.round((consultEndMs - createdMs) / 60000);
      if (diffMin > 0 && diffMin < 1440) totalDurations.push(diffMin);
    }

    if (regStartMs && regStartMs > createdMs) {
      const regMin = Math.round((regStartMs - createdMs) / 60000);
      if (regMin >= 0 && regMin < 720) regWaitDurations.push(regMin);
    }

    const afterRegMs = regEndMs || createdMs;
    if (consultStartMs && consultStartMs > afterRegMs) {
      const consultMin = Math.round((consultStartMs - afterRegMs) / 60000);
      if (consultMin >= 0 && consultMin < 720) consultWaitDurations.push(consultMin);
    }
  }

  const avgTotal =
    totalDurations.length > 0
      ? Math.round(totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length)
      : 35;

  const avgReg =
    regWaitDurations.length > 0
      ? regWaitDurations.reduce((a, b) => a + b, 0) / regWaitDurations.length
      : 0;

  const avgConsult =
    consultWaitDurations.length > 0
      ? consultWaitDurations.reduce((a, b) => a + b, 0) / consultWaitDurations.length
      : 0;

  const bottleneck = avgConsult >= avgReg ? 'Consultation Cubicle' : 'Registration Counter';

  return { avgTotal, bottleneck };
}

/**
 * Computes monthly throughput and congestion metrics for a specified year from PostgreSQL.
 *
 * @param year - Target operating calendar year.
 * @returns Array of 12 MonthEntry items.
 */
async function computeYearlyBreakdownFromDb(year: number): Promise<MonthEntry[]> {
  const months = await Promise.all(
    MONTH_NAMES.map(async (label, mIdx) => {
      const start = new Date(Date.UTC(year, mIdx, 1, 0, 0, 0, 0)).toISOString();
      const end = new Date(Date.UTC(year, mIdx + 1, 1, 0, 0, 0, 0)).toISOString();

      const { data: rows, count } = await supabaseAdmin
        .from('patients')
        .select('created_at, reg_start, reg_end, consult_start, consult_end', { count: 'exact' })
        .gte('created_at', start)
        .lt('created_at', end)
        .limit(200);

      const totalCount = count ?? 0;

      if (totalCount === 0 || !rows || rows.length === 0) {
        return {
          month: mIdx + 1,
          month_label: label,
          patient_count: 0,
          bottleneck_stage: 'None',
          system_status: 'No Data' as const,
          avg_total_time_min: 0,
        };
      }

      const { avgTotal, bottleneck } = analyzeMonthlySamples(rows as SampleRow[]);

      let system_status: 'Normal' | 'Elevated' | 'Overwhelmed' = 'Normal';
      if (avgTotal > 90) system_status = 'Overwhelmed';
      else if (avgTotal > 45) system_status = 'Elevated';

      return {
        month: mIdx + 1,
        month_label: label,
        patient_count: totalCount,
        bottleneck_stage: bottleneck,
        system_status,
        avg_total_time_min: avgTotal,
      };
    })
  );

  return months;
}

/**
 * GET handler returning monthly throughput and congestion metrics for a specified year.
 *
 * @param request - NextRequest object.
 * @param context - Context containing route parameter promise.
 * @returns JSON response containing { year: number, months: MonthEntry[] }.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string }> }
) {
  const auth = await authorizeStaff(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { year: yearParam } = await context.params;
  const year = parseInt(yearParam, 10);

  if (isNaN(year) || year < 1970 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year specified' }, { status: 400 });
  }

  const pythonBackendUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';

  // 1. Try Python analytics backend first with 2.0s deadline
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${pythonBackendUrl}/api/monthly-breakdown/${year}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.months) && data.months.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Analytics backend offline; fall through to Supabase fallback
  }

  // 2. Direct Supabase Fallback using supabaseAdmin
  try {
    const months = await computeYearlyBreakdownFromDb(year);
    return NextResponse.json({ year, months });
  } catch {
    return NextResponse.json({ year, months: createEmptyMonths() });
  }
}
