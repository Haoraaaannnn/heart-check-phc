import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);

  if (!guard.authorized) {
    return guard.response;
  }

  const authId = new URL(request.url).searchParams.get('authId');

  const { data: cubicles, error: cubicleError } = await supabaseAdmin
    .from('cubicle')
    .select('id, "cubicleNum", category, room, subcategory')
    .order('category')
    .order('room')
    .order('cubicleNum');

  if (cubicleError) {
    return NextResponse.json({ error: cubicleError.message }, { status: 400 });
  }

  let assignedCubicleIds: number[] = [];

  if (authId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (user) {
      const { data: assignments } = await supabaseAdmin
        .from('user_cubicles')
        .select('cubicle_id')
        .eq('user_id', user.id);

      assignedCubicleIds = (assignments ?? []).map(
        (assignment) => assignment.cubicle_id
      );
    }
  }

  return NextResponse.json({ cubicles, assignedCubicleIds });
}