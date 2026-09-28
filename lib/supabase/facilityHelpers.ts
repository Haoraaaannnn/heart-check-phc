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

export function forSubcategory(query: any, subcategory: string | null) {
  return subcategory ? query.eq('subcategory', subcategory) : query.is('subcategory', null);
}

/**
 * Counts active patients currently assigned to any of the specified cubicles today.
 *
 * @remarks
 * Uses chained `.neq` calls for status exclusion because PostgREST does not parse
 * double-quoted string literals inside `in.("Done","...")` as expected, which previously
 * caused completed ('Done') and idle/removed patients to still be counted as active.
 *
 * @param cubicleNums - Array of cubicle identifier strings (e.g. ['ECG R1']).
 * @returns Promise resolving to the number of non-terminal active patients.
 */
export async function countActiveAtCubicles(cubicleNums: string[]): Promise<number> {
  if (cubicleNums.length === 0) return 0;
  const { data, count, error } = await supabaseAdmin
    .from('patients')
    .select('id, patientNum, status, cubicleNum, created_at', { count: 'exact' })
    .in('cubicleNum', cubicleNums)
    .neq('status', 'Done')
    .neq('status', 'Idle')
    .neq('status', 'Removed')
    .gte('created_at', startOfToday());

  if (error) {
    console.error('[countActiveAtCubicles ERROR]', error);
  }
  if (count && count > 0) {
    console.log('[countActiveAtCubicles FOUND ACTIVE PATIENTS]', { cubicleNums, count, patients: data });
  }
  return count ?? 0;
}

/**
 * Counts active patients currently being served at the specified registration counter today.
 *
 * @param counter - The counter integer identifier.
 * @returns Promise resolving to the number of active patients at the counter.
 */
export async function countActiveAtCounter(counter: number): Promise<number> {
  const { count } = await supabaseAdmin
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('counter', counter)
    .is('reg_end', null)
    .neq('status', 'Done')
    .neq('status', 'Idle')
    .neq('status', 'Removed')
    .neq('status', 'Assigned')
    .gte('created_at', startOfToday());
  return count ?? 0;
}

export async function cubicleNumExists(cubicleNum: string, excludeId?: number): Promise<boolean> {
  let q = supabaseAdmin.from('cubicle').select('id').eq('cubicleNum', cubicleNum);
  if (excludeId !== undefined) q = q.neq('id', excludeId);
  const { data } = await q.limit(1);
  return (data?.length ?? 0) > 0;
}

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

export async function removeCubicleDependencies(ids: number[]) {
  if (ids.length === 0) return;
  await supabaseAdmin.from('user_cubicles').delete().in('cubicle_id', ids);
  await supabaseAdmin.from('cubicle_selector_cubicle').delete().in('cubicle_id', ids);
}