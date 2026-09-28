import { supabase } from '@/lib/supabase';
import { DEFAULT_COUNTERS } from '@/lib/facilities';

export async function fetchActiveCounters(): Promise<number[]> {
  const { data, error } = await supabase
    .from('counters')
    .select('counter_number')
    .eq('active', true)
    .order('counter_number', { ascending: true });

  if (error || !data) return DEFAULT_COUNTERS;
  return data.map(c => c.counter_number);
}