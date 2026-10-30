/** @fileoverview Acknowledged one-click registration completion and matching cubicle assignment. */
import { supabase } from '@/lib/supabase';
import { enqueueMutation } from '@/lib/offlineQueue';
import { Patient, Cubicle } from '@/types/Types';
import { assignmentCandidates } from './transferMutations';

/**
 * Finishes intake and assigns a matching available destination in one patient update.
 * @param options - Source ticket, available stations, current occupancy, and injected clock.
 * @returns Updated ticket and whether the database acknowledged it immediately.
 * @remarks Full stations leave a registered ticket waiting; rejected updates preserve the counter.
 */
export async function releaseCounterPatient(options: {
  patient: Patient; cubicles: Cubicle[]; assigned: Record<string, Patient[]>; nowMs: number;
}): Promise<{ patient: Patient; online: boolean }> {
  const { patient, assigned } = options;
  if (!patient.counter || patient.reg_end || !['Waiting', 'On Progress'].includes(patient.status ?? '')) {
    throw new Error('This ticket is no longer waiting at the counter. Refresh and retry.');
  }
  const destination = assignmentCandidates(options).reduce<Cubicle | null>((best, candidate) =>
    !best || (assigned[candidate.cubicleNum]?.length ?? 0) < (assigned[best.cubicleNum]?.length ?? 0)
      ? candidate : best, null);
  const nowIso = new Date(options.nowMs).toISOString();
  const fields = {
    reg_end: nowIso, status: destination ? 'Assigned' : 'On Progress',
    cubicleNum: destination?.cubicleNum ?? null, called_at: destination ? nowIso : null,
    counter_top_started_at: null, counter_paused_at: null, cooldown_until: null,
    progress_started_at: destination ? null : nowIso, cubicle_top_started_at: null,
    ...(destination ? { queue_position: 9999 } : {}),
  };
  const online = typeof navigator === 'undefined' || navigator.onLine;
  if (!online) {
    await enqueueMutation({ table: 'patients', type: 'update', payload: fields, matchKey: 'id',
      matchValue: patient.id, clientTimestamp: nowIso, description: 'Counter release awaiting connection' });
    return { patient: { ...patient, ...fields }, online: false };
  }
  const { data, error } = await supabase.from('patients').update(fields).eq('id', patient.id)
    .eq('is_historical', false).eq('status', patient.status).eq('counter', patient.counter)
    .is('reg_end', null).select('id,status,cubicleNum,reg_end').maybeSingle();
  const row: unknown = data;
  if (error || typeof row !== 'object' || row === null || !('id' in row) || row.id !== patient.id ||
      !('status' in row) || row.status !== fields.status || !('cubicleNum' in row) || row.cubicleNum !== fields.cubicleNum ||
      !('reg_end' in row) || typeof row.reg_end !== 'string' || Date.parse(row.reg_end) !== Date.parse(fields.reg_end)) {
    throw new Error('The counter release was not accepted. The ticket has been kept; refresh and retry.');
  }
  return { patient: { ...patient, ...fields }, online: true };
}
