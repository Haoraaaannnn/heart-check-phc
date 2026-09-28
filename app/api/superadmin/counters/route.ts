import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import { supabaseAdmin, countActiveAtCounter } from '@/lib/supabase/facilityHelpers';

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { data, error } = await supabaseAdmin
    .from('counters').select('*').order('counter_number');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const counters = await Promise.all(
    (data ?? []).map(async c => ({ ...c, inUse: await countActiveAtCounter(c.counter_number) }))
  );
  return NextResponse.json({ counters });
}

export async function POST(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { counter_number, label } = await request.json();

  let number = counter_number;
  if (number === undefined || number === null || number === '') {
    const { data: max } = await supabaseAdmin
      .from('counters').select('counter_number')
      .order('counter_number', { ascending: false }).limit(1).maybeSingle();
    number = (max?.counter_number ?? 0) + 1;
  }
  if (!Number.isInteger(number) || number <= 0) {
    return NextResponse.json({ error: 'Counter number must be a positive whole number.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('counters').select('counter_number').eq('counter_number', number).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Counter ${number} already exists.` }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .from('counters').insert({ counter_number: number, label: label?.trim() || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PUT(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { counter_number, label, active } = await request.json();
  if (!Number.isInteger(counter_number)) {
    return NextResponse.json({ error: 'Counter number is required.' }, { status: 400 });
  }

  if (active === false && (await countActiveAtCounter(counter_number)) > 0) {
    return NextResponse.json(
      { error: 'Patients are currently at this counter. Deactivate it once it is empty.' },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from('counters')
    .update({ label: label?.trim() || null, ...(active !== undefined ? { active } : {}) })
    .eq('counter_number', counter_number);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { counter_number } = await request.json();
  if (!Number.isInteger(counter_number)) {
    return NextResponse.json({ error: 'Counter number is required.' }, { status: 400 });
  }

  if ((await countActiveAtCounter(counter_number)) > 0) {
    return NextResponse.json(
      { error: 'Patients are currently at this counter. Move them first.' },
      { status: 409 }
    );
  }

  await supabaseAdmin.from('user_counters').delete().eq('counter', counter_number);
  const { error } = await supabaseAdmin.from('counters').delete().eq('counter_number', counter_number);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}