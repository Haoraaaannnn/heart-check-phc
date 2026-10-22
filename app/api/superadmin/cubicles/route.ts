import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import {
  supabaseAdmin,
  forSubcategory,
  countActiveAtCubicles,
  cubicleNumExists,
  generateCubicleNums,
  removeCubicleDependencies,
} from '@/lib/supabase/facilityHelpers';

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { searchParams } = new URL(request.url);
  const authId = searchParams.get('authId');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

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

  let user: { id: number | string; email?: string; auth_id?: string } | null = null;

  if (userId) {
    const { data: userById } = await supabaseAdmin
      .from('users').select('id, email, auth_id').eq('id', userId).maybeSingle();
    if (userById) user = userById;
  }

  if (!user && authId) {
    const { data: userByAuth } = await supabaseAdmin
      .from('users').select('id, email, auth_id').eq('auth_id', authId).maybeSingle();
    if (userByAuth) user = userByAuth;
  }

  if (!user && email) {
    const { data: userByEmail } = await supabaseAdmin
      .from('users').select('id, email, auth_id').ilike('email', email).maybeSingle();
    if (userByEmail) user = userByEmail;
  }

  if (!user && authId) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authId);
    if (authUser?.user?.email) {
      const { data: userByAuthEmail } = await supabaseAdmin
        .from('users').select('id, email, auth_id').ilike('email', authUser.user.email).maybeSingle();
      if (userByAuthEmail) {
        user = userByAuthEmail;
      }
    }
  }

  if (user && authId && !user.auth_id) {
    await supabaseAdmin.from('users').update({ auth_id: authId }).eq('id', user.id);
  }

  if (user) {
    const { data: assignments } = await supabaseAdmin
      .from('user_cubicles').select('cubicle_id').eq('user_id', user.id);
    assignedCubicleIds = (assignments ?? []).map(a => a.cubicle_id);
  }

  return NextResponse.json({ cubicles: cubicles || [], assignedCubicleIds });
}

export async function POST(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { category, subcategory = null, room, cubicleNum } = await request.json();

  if (!category || !Number.isInteger(room) || room <= 0) {
    return NextResponse.json({ error: 'Service and a valid room number are required.' }, { status: 400 });
  }

  let name: string = cubicleNum?.trim();
  if (name) {
    if (await cubicleNumExists(name)) {
      return NextResponse.json({ error: `"${name}" already exists.` }, { status: 409 });
    }
  } else {
    [name] = await generateCubicleNums(category, subcategory, room, 1);
  }

  const { data, error } = await supabaseAdmin
    .from('cubicle')
    .insert({ cubicleNum: name, category, subcategory, room })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, cubicle: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { id, cubicleNum } = await request.json();
  const name = cubicleNum?.trim();
  if (!id || !name) {
    return NextResponse.json({ error: 'Cubicle id and name are required.' }, { status: 400 });
  }

  const { data: current } = await supabaseAdmin
    .from('cubicle').select('"cubicleNum"').eq('id', id).single();
  if (!current) return NextResponse.json({ error: 'Cubicle not found.' }, { status: 404 });

  if (current.cubicleNum !== name) {
    if (await cubicleNumExists(name, id)) {
      return NextResponse.json({ error: `"${name}" already exists.` }, { status: 409 });
    }
    if ((await countActiveAtCubicles([current.cubicleNum])) > 0) {
      return NextResponse.json(
        { error: 'Patients are currently assigned to this cubicle. Rename it once it is empty.' },
        { status: 409 }
      );
    }
  }

  const { error } = await supabaseAdmin.from('cubicle').update({ cubicleNum: name }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Cubicle id is required.' }, { status: 400 });

  const { data: cubicle } = await supabaseAdmin
    .from('cubicle').select('"cubicleNum"').eq('id', id).single();
  if (!cubicle) return NextResponse.json({ error: 'Cubicle not found.' }, { status: 404 });

  if ((await countActiveAtCubicles([cubicle.cubicleNum])) > 0) {
    return NextResponse.json(
      { error: 'Patients are currently assigned to this cubicle. Move them first.' },
      { status: 409 }
    );
  }

  await removeCubicleDependencies([id]);
  const { error } = await supabaseAdmin.from('cubicle').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}