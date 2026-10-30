/** @fileoverview Guarded soft removal for live tickets that have completed four rotations. */
import { Patient } from '@/types/Types';
import { callRotateApi } from './rotateApi';

/** @param patient - Current ticket. @returns Whether four rotations allow manual removal. */
export function canRemoveRotatedPatient(patient: Patient): boolean {
  return Number.isSafeInteger(patient.rotation_count) && (patient.rotation_count ?? 0) >= 4 &&
    ['Waiting', 'On Progress', 'Assigned'].includes(patient.status ?? '');
}

/**
 * Removes an eligible ticket from active lanes while retaining the reporting row.
 * @param patient - Ticket snapshot for optimistic concurrency checks.
 * @returns Completion only after the server acknowledges removal.
 */
export async function removeRotatedPatient(patient: Patient): Promise<void> {
  if (!canRemoveRotatedPatient(patient)) throw new Error('Removal is available after four rotations for waiting tickets only.');
  await callRotateApi([{ id: patient.id, status: 'Removed', removed_at: new Date().toISOString(),
    counter: null, cubicleNum: null, called_at: null, counter_top_started_at: null,
    counter_paused_at: null, progress_started_at: null, cubicle_top_started_at: null,
    cooldown_until: null, expected: { status: patient.status ?? null, rotation_count: patient.rotation_count ?? null,
      counter: patient.counter ?? null, cubicleNum: patient.cubicleNum ?? null } }]);
}
