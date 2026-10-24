/** @fileoverview Registration counter discovery respecting staff and administrative availability. */
import { supabase } from '@/lib/supabase';

/**
 * Lists active counters, excluding breaks unless staff need controls to resume them.
 * @param includeOnBreak - Includes temporarily closed desks in staff navigation.
 * @returns Counter numbers, or an empty list when availability cannot be verified.
 */
export async function fetchActiveCounters(includeOnBreak = false): Promise<number[]> {
  const { data, error } = await supabase
    .from('counters')
    .select('counter_number, on_break')
    .eq('active', true)
    .order('counter_number', { ascending: true });

  if (error || !data) return [];
  return data.filter(c => includeOnBreak || !c.on_break).map(c => c.counter_number);
}
