/** @fileoverview Public registration visibility differs from eligibility to receive another ticket. */
import type { OccupiedCounterInfo } from '@/lib/counters';
import type { Patient } from '@/types/Types';

/** Live database rows include the historical flag even though the legacy client Patient type omits it. */
type RegistrationSnapshot = Pick<Patient, 'counter' | 'status' | 'reg_end' | 'cubicleNum'> & { is_historical?: boolean | null };

/** @returns Live, unfinished intake tickets only; transferred, idle and historical records cannot keep a counter visible. */
export function isVisibleRegistrationPatient(patient: RegistrationSnapshot): boolean {
  return patient.counter != null && patient.is_historical === false && !patient.reg_end && !patient.cubicleNum
    && (patient.status === 'Waiting' || patient.status === 'On Progress');
}

/**
 * Keeps a staffed counter on screen while its existing intake queue drains during a break.
 * @param options - Current physical counter status and live ticket snapshot.
 * @returns Visible counter numbers; this function never grants assignment or transfer permission.
 */
export function visibleRegistrationCounters(options: {
  counters: Pick<OccupiedCounterInfo, 'counter_number' | 'active' | 'occupied' | 'on_break'>[];
  patients: RegistrationSnapshot[];
}): number[] {
  const occupiedQueues = new Set(options.patients.filter(isVisibleRegistrationPatient).map(patient => patient.counter));
  return options.counters.filter(counter => counter.active && counter.occupied && (!counter.on_break || occupiedQueues.has(counter.counter_number)))
    .map(counter => counter.counter_number).sort((first, second) => first - second);
}
