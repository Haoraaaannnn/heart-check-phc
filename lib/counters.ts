/** @fileoverview Registration counter discovery respecting staff occupancy, breaks, and service scopes. */
import { supabase } from '@/lib/supabase';

/** Live registration counter occupancy and assigned clinical services. */
export interface OccupiedCounterInfo {
  counter_number: number;
  label: string | null;
  active: boolean;
  on_break: boolean;
  occupied: boolean;
  services: string[];
}

/**
 * Determines whether a counter's specified services match a patient's requested service department.
 * Case-insensitive, supporting common clinical abbreviations (e.g. 'OPD' <-> 'OPD Screening').
 *
 * @param counterServices - Array of service department labels assigned to the counter.
 * @param patientService - Target patient's requested service name.
 * @returns True if the counter is authorized to serve this patient.
 */
export function matchesCounterService(counterServices: string[], patientService?: string | null): boolean {
  if (!patientService) return false;
  if (!counterServices || counterServices.length === 0) return false;

  const normalizedPatient = patientService.trim().toLowerCase();

  return counterServices.some(s => {
    const normalizedCounter = s.trim().toLowerCase();
    if (normalizedCounter === normalizedPatient) return true;

    // Handle common abbreviations / aliases: e.g. "opd" matching "opd screening"
    if (normalizedCounter === 'opd' && normalizedPatient.includes('opd')) return true;
    if (normalizedPatient === 'opd' && normalizedCounter.includes('opd')) return true;
    if (normalizedCounter === 'screening' && normalizedPatient.includes('screening')) return true;

    // Handle clinical department name variations (e.g. "Dental Clinic" vs "Dental", length >= 4)
    if (
      normalizedCounter.length >= 4 &&
      normalizedPatient.length >= 4 &&
      (normalizedCounter.includes(normalizedPatient) || normalizedPatient.includes(normalizedCounter))
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Filters a list of counters down to those currently active, not on break, occupied by staff,
 * and explicitly configured to serve the given service.
 *
 * @param counters - List of counter status records.
 * @param patientService - Requested patient service.
 * @returns Array of eligible counters ready to accept this patient.
 */
export function filterEligibleCounters(
  counters: OccupiedCounterInfo[],
  patientService?: string | null
): OccupiedCounterInfo[] {
  if (!patientService) return [];
  return counters.filter(
    c => c.active && !c.on_break && c.occupied && matchesCounterService(c.services, patientService)
  );
}

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

/**
 * Fetches registration counters alongside their real-time staff occupancy and designated service scopes.
 *
 * @param fallbackServicesByCounter - Optional local mapping of counter numbers to services.
 * @returns Promise resolving to an array of counter status records.
 */
export async function fetchOccupiedCounters(
  fallbackServicesByCounter?: Record<number, string[]>
): Promise<OccupiedCounterInfo[]> {
  try {
    const res = await fetch('/api/workstation/occupied-counters', {
      headers: { 'Cache-Control': 'no-store' },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.counters)) {
        return json.counters;
      }
    }
  } catch {
    // Non-fatal network fallback to direct Supabase query
  }

  // Fallback: Query counters table directly
  const { data: counters, error } = await supabase
    .from('counters')
    .select('counter_number, label, active, on_break')
    .eq('active', true)
    .order('counter_number', { ascending: true });

  if (error || !counters) return [];

  return counters.map(c => {
    const fallbackServices = fallbackServicesByCounter?.[c.counter_number] ?? [];
    const isOccupied = fallbackServices.length > 0;
    return {
      counter_number: c.counter_number,
      label: c.label || `Counter ${c.counter_number}`,
      active: Boolean(c.active),
      on_break: Boolean(c.on_break),
      occupied: isOccupied,
      services: fallbackServices,
    };
  });
}
