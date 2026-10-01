// app/api/rotate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RotateUpdate = { id: number; expected?: Record<string, string | number | null> } & Record<string, unknown>;

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  const { updates } = await request.json();
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const results = await Promise.all(
    (updates as RotateUpdate[]).map(async ({ id, expected, ...changes }) => {
      let query = supabaseAdmin.from('patients').update(changes).eq('id', id);
      for (const [column, value] of Object.entries(expected ?? {})) {
        query = value === null ? query.is(column, null) : query.eq(column, value);
      }
      const { data, error } = await query.select('id');
      return { id, applied: !error && (data?.length ?? 0) > 0, error: error?.message };
    })
  );

  return NextResponse.json({ success: true, results });
}