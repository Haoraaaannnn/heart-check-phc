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

/**
 * Reassigns active waiting patients from a closed, deactivated, or deleted counter
 * to remaining active, occupied counters that handle their service. If no eligible
 * counters are open, unassigns the patients back to the general intake queue.
 *
 * @param counterNumber - The counter number being disabled, closed, or deleted.
 * @returns Object with counts of transferred and unassigned patients.
 */
export async function reassignCounterQueue(counterNumber: number): Promise<{
  transferredCount: number;
  unassignedCount: number;
  affectedPatientIds: number[];
}> {
  const { data: activePatients, error: patientErr } = await supabaseAdmin
    .from('patients')
    .select('id, service, counter, patientNum')
    .eq('counter', counterNumber)
    .is('reg_end', null)
    .neq('status', 'Done')
    .neq('status', 'Idle')
    .neq('status', 'Removed')
    .eq('is_historical', false)
    .gte('created_at', startOfToday())
    .order('created_at', { ascending: true });

  if (patientErr || !activePatients || activePatients.length === 0) {
    return { transferredCount: 0, unassignedCount: 0, affectedPatientIds: [] };
  }

  const [countersResult, userCountersResult, userServicesResult, servicesCatalogResult] = await Promise.all([
    supabaseAdmin
      .from('counters')
      .select('counter_number, label, active, on_break')
      .eq('active', true)
      .neq('counter_number', counterNumber)
      .eq('on_break', false)
      .order('counter_number', { ascending: true }),
    supabaseAdmin
      .from('user_counters')
      .select('counter, user_id'),
    supabaseAdmin
      .from('user_services')
      .select('user_id, service'),
    supabaseAdmin
      .from('services')
      .select('label_en, key'),
  ]);

  const userServicesMap = new Map<number, Set<string>>();
  for (const row of userServicesResult.data ?? []) {
    if (!userServicesMap.has(row.user_id)) {
      userServicesMap.set(row.user_id, new Set());
    }
    if (row.service && typeof row.service === 'string') {
      userServicesMap.get(row.user_id)!.add(row.service.trim());
    }
  }

  const remainingCounterMap = new Map<number, { isOccupied: boolean; services: Set<string> }>();
  for (const c of countersResult.data ?? []) {
    remainingCounterMap.set(c.counter_number, { isOccupied: false, services: new Set() });
  }

  for (const row of userCountersResult.data ?? []) {
    if (remainingCounterMap.has(row.counter)) {
      const station = remainingCounterMap.get(row.counter)!;
      station.isOccupied = true;
      const userSvcs = userServicesMap.get(row.user_id);
      if (userSvcs) {
        for (const s of userSvcs) {
          station.services.add(s);
        }
      }
    }
  }

  const availableServices = servicesCatalogResult.data ?? [];
  for (const c of countersResult.data ?? []) {
    const station = remainingCounterMap.get(c.counter_number);
    if (station && station.services.size === 0 && c.label) {
      const labelLower = c.label.toLowerCase();
      for (const s of availableServices) {
        if (s.label_en && labelLower.includes(s.label_en.toLowerCase())) {
          station.services.add(s.label_en);
        } else if (s.key && labelLower.includes(s.key.toLowerCase())) {
          station.services.add(s.label_en);
        }
      }
      if (station.services.size === 0) {
        if (labelLower.includes('opd') || labelLower.includes('screening')) {
          station.services.add('OPD Screening');
        } else if (labelLower.includes('consultation')) {
          station.services.add('Consultation');
        }
      }
    }
  }

  const { data: loadData } = await supabaseAdmin
    .from('patients')
    .select('counter')
    .not('counter', 'is', null)
    .neq('counter', counterNumber)
    .is('reg_end', null)
    .neq('status', 'Done')
    .neq('status', 'Idle')
    .neq('status', 'Removed')
    .gte('created_at', startOfToday());

  const counterLoad = new Map<number, number>();
  for (const c of countersResult.data ?? []) {
    counterLoad.set(c.counter_number, 0);
  }
  for (const row of loadData ?? []) {
    if (row.counter && counterLoad.has(row.counter)) {
      counterLoad.set(row.counter, (counterLoad.get(row.counter) ?? 0) + 1);
    }
  }

  const nowIso = new Date().toISOString();
  let transferredCount = 0;
  let unassignedCount = 0;
  const affectedPatientIds: number[] = [];

  for (const patient of activePatients) {
    affectedPatientIds.push(patient.id);
    const patientService = patient.service?.trim().toLowerCase() ?? '';

    const eligibleCounters: number[] = [];
    for (const [cNum, station] of remainingCounterMap.entries()) {
      if (!station.isOccupied) continue;
      const matches = Array.from(station.services).some(s => {
        const norm = s.trim().toLowerCase();
        if (norm === patientService) return true;
        if (norm === 'opd' && patientService.includes('opd')) return true;
        if (patientService === 'opd' && norm.includes('opd')) return true;
        if (norm === 'screening' && patientService.includes('screening')) return true;
        if (
          norm.length >= 4 &&
          patientService.length >= 4 &&
          (norm.includes(patientService) || patientService.includes(norm))
        ) {
          return true;
        }
        return false;
      });

      if (matches) {
        eligibleCounters.push(cNum);
      }
    }

    if (eligibleCounters.length > 0) {
      eligibleCounters.sort((a, b) => {
        const diff = (counterLoad.get(a) ?? 0) - (counterLoad.get(b) ?? 0);
        if (diff !== 0) return diff;
        return a - b;
      });

      const best = eligibleCounters[0];
      counterLoad.set(best, (counterLoad.get(best) ?? 0) + 1);

      await supabaseAdmin
        .from('patients')
        .update({ counter: best, reg_start: nowIso })
        .eq('id', patient.id)
        .eq('is_historical', false);

      transferredCount += 1;
    } else {
      await supabaseAdmin
        .from('patients')
        .update({ counter: null, reg_start: null })
        .eq('id', patient.id)
        .eq('is_historical', false);

      unassignedCount += 1;
    }
  }

  return { transferredCount, unassignedCount, affectedPatientIds };
}