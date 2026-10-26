/** @fileoverview Authenticated session policy reads and Superadmin-only validated updates. */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { parseSessionMinutes, SESSION_POLICY } from '@/lib/sessionPolicy';

/** @returns The configured inactivity limit, or the existing twenty-minute default. */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const { data, error } = await supabaseAdmin.from('app_settings').select('value').eq('key', SESSION_POLICY.key).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load the session policy.' }, { status: 503 });
  return NextResponse.json({ minutes: parseSessionMinutes(data?.value) ?? SESSION_POLICY.defaultMinutes }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Persists the staff inactivity limit after verified Superadmin authorization.
 * @param request - Bearer-authenticated request containing whole minutes.
 * @returns The saved policy or an authorization/validation error.
 */
export async function POST(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;
  const body = await request.json().catch(() => null);
  const minutes = parseSessionMinutes(body?.minutes);
  if (minutes === null) return NextResponse.json({ error: 'Enter a whole number from 5 to 720 minutes.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('app_settings').upsert({
    key: SESSION_POLICY.key, value: String(minutes), updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: 'Unable to save the session policy.' }, { status: 503 });
  return NextResponse.json({ minutes }, { headers: { 'Cache-Control': 'no-store' } });
}
