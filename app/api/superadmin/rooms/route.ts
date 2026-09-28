import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import {
  supabaseAdmin,
  forSubcategory,
  countActiveAtCubicles,
  generateCubicleNums,
  removeCubicleDependencies,
} from '@/lib/supabase/facilityHelpers';

const roomQuery = (category: string, subcategory: string | null, room: number, select: string, head = false) =>
  forSubcategory(
    supabaseAdmin
      .from('cubicle')
      .select(select, head ? { count: 'exact', head: true } : undefined)
      .eq('category', category)
      .eq('room', room),
    subcategory
  );

export async function POST(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { category, subcategory = null, room, cubicleCount = 1 } = await request.json();

  if (!category || !Number.isInteger(room) || room <= 0) {
    return NextResponse.json({ error: 'Service and a valid room number are required.' }, { status: 400 });
  }
  if (!Number.isInteger(cubicleCount) || cubicleCount < 1 || cubicleCount > 20) {
    return NextResponse.json({ error: 'Cubicle count must be between 1 and 20.' }, { status: 400 });
  }

  const { count } = await roomQuery(category, subcategory, room, 'id', true);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `Room ${room} already exists for this service.` }, { status: 409 });
  }

  const names = await generateCubicleNums(category, subcategory, room, cubicleCount);
  const { error } = await supabaseAdmin
    .from('cubicle')
    .insert(names.map(cubicleNum => ({ cubicleNum, category, subcategory, room })));

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, created: names }, { status: 201 });
}

export async function PUT(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { category, subcategory = null, room, newRoom } = await request.json();
  if (!category || !Number.isInteger(room) || !Number.isInteger(newRoom) || newRoom <= 0) {
    return NextResponse.json({ error: 'A valid new room number is required.' }, { status: 400 });
  }
  if (room === newRoom) return NextResponse.json({ success: true });

  const { data: rows } = await roomQuery(category, subcategory, room, 'id, "cubicleNum"');
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
  }

  const { count: clash } = await roomQuery(category, subcategory, newRoom, 'id', true);
  if ((clash ?? 0) > 0) {
    return NextResponse.json({ error: `Room ${newRoom} already exists for this service.` }, { status: 409 });
  }

  const cubicleNums = rows.map((r: any) => r.cubicleNum);
  const activeCount = await countActiveAtCubicles(cubicleNums);
  if (activeCount > 0) {
    const { data: blockingPatients } = await supabaseAdmin
      .from('patients')
      .select('patientNum, status, cubicleNum')
      .in('cubicleNum', cubicleNums)
      .neq('status', 'Done')
      .neq('status', 'Idle')
      .neq('status', 'Removed');

    const details = (blockingPatients ?? [])
      .map(p => `${p.patientNum} (${p.status})`)
      .join(', ');

    return NextResponse.json(
      {
        error: `Active patient(s) assigned to ${cubicleNums.join(', ')}: ${details || activeCount}. Complete or clear them before renumbering.`,
      },
      { status: 409 }
    );
  }
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const safeRoom = escapeRegExp(String(room));

const pattern = new RegExp(`(?<!\\d)R${safeRoom}(?!\\d)`);
  for (const row of rows as any[]) {
    const { error } = await supabaseAdmin
      .from('cubicle')
      .update({ room: newRoom, cubicleNum: row.cubicleNum.replace(pattern, `R${newRoom}`) })
      .eq('id', row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await forSubcategory(
    supabaseAdmin.from('user_rooms').update({ room: newRoom }).eq('service', category).eq('room', room),
    subcategory
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { category, subcategory = null, room } = await request.json();
  if (!category || !Number.isInteger(room)) {
    return NextResponse.json({ error: 'Service and room are required.' }, { status: 400 });
  }

  const { data: rows } = await roomQuery(category, subcategory, room, 'id, "cubicleNum"');
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
  }

  if ((await countActiveAtCubicles(rows.map((r: any) => r.cubicleNum))) > 0) {
    return NextResponse.json(
      { error: 'Patients are currently assigned to cubicles in this room. Move them first.' },
      { status: 409 }
    );
  }

  await removeCubicleDependencies(rows.map((r: any) => r.id));
  await forSubcategory(
    supabaseAdmin.from('user_rooms').delete().eq('service', category).eq('room', room),
    subcategory
  );

  const { error } = await forSubcategory(
    supabaseAdmin.from('cubicle').delete().eq('category', category).eq('room', room),
    subcategory
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}