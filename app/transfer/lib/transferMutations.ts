/** @fileoverview Validated transfer destinations and checked patient updates. */
import { supabase } from '@/lib/supabase';
import { Patient, Cubicle } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from './constants';
import { enqueueMutation } from '@/lib/offlineQueue';

/** @returns Matching visible stations with capacity, honoring explicit patient station preferences. */
export function assignmentCandidates(options: {
  patient: Patient; cubicles: Cubicle[]; assigned: Record<string, Patient[]>;
}): Cubicle[] {
  const { patient, cubicles, assigned } = options;
  const preferred = patient.preferredCubicleNums ?? [];
  return cubicles.filter(cubicle => cubicle.category === patient.service
    && (!patient.subcategory || cubicle.subcategory === patient.subcategory)
    && (preferred.length === 0 || preferred.includes(cubicle.cubicleNum))
    && (assigned[cubicle.cubicleNum]?.length ?? 0) < MAX_PATIENTS_PER_CUBICLE);
}

/** @returns Fields that restore intake eligibility and reset timers when returning from a cubicle. */
export function returnToQueueFields(patient: Patient, nowMs: number) {
  const registered = Boolean(patient.reg_start || patient.counter);
  return {
    cubicleNum: null, status: 'On Progress', called_at: null,
    progress_started_at: null, cubicle_top_started_at: null,
    cooldown_until: new Date(nowMs + 60_000).toISOString(),
    ...(registered ? { reg_end: null, counter_rejoin_at: new Date(nowMs).toISOString(),
      counter_top_started_at: null, counter_paused_at: null } : {}),
  };
}

/**
 * Updates an existing live patient and treats denied or unmatched writes as failures.
 * @param options - Patient identity, changed fields, and optional source cubicle for conflict protection.
 * @returns Resolves only after one live row acknowledges the change.
 */
export async function updateLiveTransferPatient(options: {
  id: number; fields: Record<string, unknown>; sourceCubicle?: string;
}): Promise<void> {
  let query = supabase.from('patients').update(options.fields)
    .eq('id', options.id).eq('is_historical', false);
  if (options.sourceCubicle) {
    query = query.eq('cubicleNum', options.sourceCubicle).eq('status', 'Assigned');
  } else query = query.in('status', ['Waiting', 'On Progress', 'Assigned']);
  const { data, error } = await query.select('id,cubicleNum,status,reg_end').maybeSingle();
  if (error) throw new Error('The patient could not be moved. Refresh the station and try again.');
  if (!data) throw new Error('The patient has changed or is no longer available. Refresh the station and try again.');
  const row: unknown = data;
  if (typeof row !== 'object' || row === null) throw new Error('The station did not acknowledge the patient move.');
  for (const field of ['cubicleNum', 'status', 'reg_end']) {
    if (field in options.fields && (!(field in row) || Reflect.get(row, field) !== options.fields[field])) {
      throw new Error('The station did not accept this destination. The pending patient has been kept; please retry.');
    }
  }
}

/**
 * Saves live assignment updates or durably queues each filtered update while offline.
 * @param updates - Existing patient identifiers and assignment fields; never inserted as new patients.
 * @returns Whether the database acknowledged every assignment immediately.
 */
export async function saveTransferAssignments(updates: Array<{ id: number } & Record<string, unknown>>): Promise<boolean> {
  const online = typeof navigator === 'undefined' || navigator.onLine;
  for (const { id, ...fields } of updates) {
    if (online) {
      await updateLiveTransferPatient({ id, fields });
      continue;
    }
    await enqueueMutation({ table: 'patients', type: 'update', payload: fields,
      matchKey: 'id', matchValue: id, clientTimestamp: new Date().toISOString(),
      description: 'Transfer assignment awaiting connection' });
  }
  return online;
}
