import { createClient } from '@supabase/supabase-js';
import { buildCubicleNum } from '@/lib/facilities';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/** Filters on subcategory, treating null as "no subcategory". */
export function forSubcategory(query: any, subcategory: string | null) {
  return subcategory ? query.eq('subcategory', subcategory) : query.is('subcategory', null);
}

/** Patients currently assigned to any of these cubicles today. */
export async function countActiveAtCubicles(cubicleNums: string[]): Promise<number> {
  if (cubicleNums.length === 0) return 0;
  const { count } = await supabaseAdmin
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .in('cubicleNum', cubicleNums)
    .not('status', 'in', '("Done","Idle","Removed")')
    .gte('created_at', startOfToday());
  return count ?? 0;
}

/** Patients currently sitting at a registration counter today. */
export async function countActiveAtCounter(counter: number): Promise<number> {
  const { count } = await supabaseAdmin
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('counter', counter)
    .is('reg_end', null)
    .not('status', 'in', '("Done","Idle","Removed","Assigned")')
    .gte('created_at', startOfToday());
  return count ?? 0;
}

export async function cubicleNumExists(cubicleNum: string, excludeId?: number): Promise<boolean> {
  let q = supabaseAdmin.from('cubicle').select('id').eq('cubicleNum', cubicleNum);
  if (excludeId !== undefined) q = q.neq('id', excludeId);
  const { data } = await q.limit(1);
  return (data?.length ?? 0) > 0;
}

/** Generates `count` globally unique cubicle numbers for a room. */
export async function generateCubicleNums(
  category: string,
  subcategory: string | null,
  room: number,
  count: number
): Promise<string[]> {
  const { data: all } = await supabaseAdmin.from('cubicle').select('cubicleNum');
  const taken = new Set((all ?? []).map(r => r.cubicleNum));

  const { count: inRoom } = await forSubcategory(
    supabaseAdmin
      .from('cubicle')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('room', room),
    subcategory
  );

  const result: string[] = [];
  let i = (inRoom ?? 0) + 1;
  while (result.length < count) {
    const name = buildCubicleNum(category, subcategory, room, i++);
    if (!taken.has(name)) {
      taken.add(name);
      result.push(name);
    }
  }
  return result;
}

/** Removes rows in other tables that point at these cubicles. */
export async function removeCubicleDependencies(ids: number[]) {
  if (ids.length === 0) return;
  await supabaseAdmin.from('user_cubicles').delete().in('cubicle_id', ids);
  await supabaseAdmin.from('cubicle_selector_cubicle').delete().in('cubicle_id', ids);
}