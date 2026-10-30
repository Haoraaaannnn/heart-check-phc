/** @fileoverview Compatibility acknowledgement for older tabs after restoring idle numbers. */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/authGuard';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

/** @param request - Authenticated staff request. @returns Acknowledgement without resetting rotations. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;
  const { data: profile, error } = await supabaseAdmin.from('users').select('role').eq('auth_id', guard.user.id).maybeSingle();
  if (error || !profile || !['superadmin', 'admin', 'registration', 'nurse', 'staff', 'doctor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
  }
  return NextResponse.json({ success: true, mode: 'idle' }, { headers: { 'Cache-Control': 'no-store' } });
}
