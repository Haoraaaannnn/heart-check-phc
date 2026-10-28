/** @fileoverview Authorized shift rollover without deleting or recalling active tickets. */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

/** @param request - Authenticated staff request. @returns Rollover acknowledgement or explicit error. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const { data: profile, error } = await supabaseAdmin.from('users').select('role').eq('auth_id', guard.user.id).maybeSingle();
  if (error || !profile || !['superadmin', 'admin', 'registration', 'nurse', 'staff', 'doctor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }
  const { error: resetError } = await supabaseAdmin.rpc('reset_queue_shift');
  if (resetError) return NextResponse.json({ error: 'Shift rollover is unavailable. Verify the shift queue migration has been applied.' }, { status: 503 });
  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
