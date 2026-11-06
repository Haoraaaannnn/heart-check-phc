import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import {
  supabaseAdmin,
  forSubcategory,
  countActiveAtCubicles,
  generateCubicleNums,
  removeCubicleDependencies,
} from '@/lib/supabase/facilityHelpers';
import { invalidateFacilityMetadataCache } from '@/lib/cache/facilityMetadataCache';

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

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const safeRoom = escapeRegExp(String(room));
  const pattern = new RegExp(`(?<!\\d)R${safeRoom}(?!\\d)`);

  for (const row of rows as Array<{ id: number; cubicleNum: string }>) {
    const oldCubicleNum = row.cubicleNum;
    const newCubicleNum = pattern.test(oldCubicleNum)
      ? oldCubicleNum.replace(pattern, `R${newRoom}`)
      : oldCubicleNum;

    const { error } = await supabaseAdmin
      .from('cubicle')
      .update({ room: newRoom, cubicleNum: newCubicleNum })
      .eq('id', row.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (oldCubicleNum !== newCubicleNum) {
      await supabaseAdmin
        .from('patients')
        .update({ cubicleNum: newCubicleNum })
        .eq('cubicleNum', oldCubicleNum)
        .eq('is_historical', false);
    }
  }

  await forSubcategory(
    supabaseAdmin.from('user_rooms').update({ room: newRoom }).eq('service', category).eq('room', room),
    subcategory
  );

  // Synchronize room change into queue_prefix_map setting
  try {
    const { data: settingData } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'queue_prefix_map')
      .maybeSingle();

    if (settingData?.value) {
      const parsed: unknown = JSON.parse(settingData.value);
      if (Array.isArray(parsed)) {
        const updated = parsed.map((item: Record<string, unknown>) => {
          const matchSub = subcategory ? item.subcategory === subcategory : !item.subcategory;
          if (item.service === category && matchSub && Number(item.room) === room) {
            return { ...item, room: newRoom };
          }
          return item;
        });
        await supabaseAdmin
          .from('app_settings')
          .update({ value: JSON.stringify(updated) })
          .eq('key', 'queue_prefix_map');
      }
    }
  } catch (prefixErr) {
    console.warn('[ROOM RENAME PREFIX MAP SYNC ERROR]', prefixErr);
  }

  invalidateFacilityMetadataCache('cubicles');

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