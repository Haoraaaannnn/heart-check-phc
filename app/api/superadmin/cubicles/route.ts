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

  // Fetch active services to identify and auto-delete cubicles for unavailable services
  const { data: activeServices } = await supabaseAdmin
    .from('services')
    .select('label_en');

  const activeServiceSet = new Set(
    (activeServices || []).map((s: any) => (s.label_en || '').trim().toLowerCase())
  );

  const validCubicles: typeof cubicles = [];
  const orphanedIds: number[] = [];

  for (const c of cubicles || []) {
    if (activeServiceSet.size === 0 || activeServiceSet.has((c.category || '').trim().toLowerCase())) {
      validCubicles.push(c);
    } else {
      orphanedIds.push(c.id);
    }
  }

  // Automatically delete orphaned cubicles and user assignments for deleted services
  if (orphanedIds.length > 0) {
    await supabaseAdmin.from('user_cubicles').delete().in('cubicle_id', orphanedIds);
    await supabaseAdmin.from('cubicle').delete().in('id', orphanedIds);
  }

  let assignedCubicleIds: number[] = [];

  if (authId) {
    const { data: user } = await supabaseAdmin
      .from('users').select('id').eq('auth_id', authId).single();

    if (user) {
      const { data: assignments } = await supabaseAdmin
        .from('user_cubicles').select('cubicle_id').eq('user_id', user.id);
      assignedCubicleIds = (assignments ?? []).map(a => a.cubicle_id);
    }
  }

  return NextResponse.json({ cubicles: validCubicles, assignedCubicleIds });
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