'use client';
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { fetchActiveCounters } from '@/lib/counters';

const REGISTERED_SERVICES = ['Consultation', 'OPD Screening'];
const calledAtMs = (p: Patient) => (p.called_at ? new Date(p.called_at).getTime() : 0);

/** Returns the counter number most recently handed out today. */
const getLastCounter = async (): Promise<number> => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 1);
  const { data } = await supabase
    .from('patients').select('counter')
    .in('service', REGISTERED_SERVICES)
    .gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
    .not('counter', 'is', null)
    .order('created_at', { ascending: false }).limit(1);
  return data?.[0]?.counter ?? 0;
};

interface DerivedWrites {
  nowIso: string;
  progressIds: number[];
  statusIds: number[];
  registration: { id: number; counter: number }[];
  topIds: number[];
  clearTopIds: number[];
}

/**
 * Persists timestamps and counters that fetchData derived locally.
 *
 * @remarks
 * Every statement is guarded (IS NULL / NEQ). If another client already wrote the value,
 * the statement matches zero rows and Postgres emits no realtime event, so a sync
 * never triggers another sync.
 */
async function persistDerivedFields(w: DerivedWrites): Promise<void> {
  const jobs: PromiseLike<unknown>[] = [];
  const table = () => supabase.from('patients');

  if (w.progressIds.length)
    jobs.push(table().update({ progress_started_at: w.nowIso }).in('id', w.progressIds).is('progress_started_at', null));
  if (w.statusIds.length)
    jobs.push(table().update({ status: 'On Progress' }).in('id', w.statusIds).is('cubicleNum', null).neq('status', 'Assigned').neq('status', 'On Progress'));
  for (const r of w.registration)
    jobs.push(table().update({ reg_start: w.nowIso, counter: r.counter }).eq('id', r.id).is('reg_start', null));
  if (w.topIds.length)
    jobs.push(table().update({ cubicle_top_started_at: w.nowIso }).in('id', w.topIds).is('cubicle_top_started_at', null));
  if (w.clearTopIds.length)
    jobs.push(table().update({ cubicle_top_started_at: null }).in('id', w.clearTopIds).not('cubicle_top_started_at', 'is', null));

  await Promise.allSettled(jobs);
}

/**
 * Loads today's queue and cubicle assignments.
 *
 * @param pendingRef - Ref holding unconfirmed local assignments; overlaid so a sync never undoes them.
 */
export function usePatientData(pendingRef?: React.MutableRefObject<Patient[]>) {
  const [onProgressPatients, setOnProgressPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Record<string, Patient[]>>({});
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++fetchIdRef.current;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);

    const { data, error } = await supabase
      .from('patients').select('*')
      .neq('status', 'Done').neq('status', 'Idle').neq('status', 'Removed')
      .gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
      .order('queue_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) return;

    const rows = data as Patient[];
    let queue = rows.filter(p => !p.cubicleNum && p.status !== 'Assigned');
    let assigned = rows.filter(p => p.status === 'Assigned' && p.cubicleNum);

    // Overlay unconfirmed local moves so they do not flicker back to the server state.
    for (const pending of pendingRef?.current ?? []) {
      queue = queue.filter(p => p.id !== pending.id);
      assigned = assigned.filter(p => p.id !== pending.id);
      if (pending.status === 'Assigned' && pending.cubicleNum) assigned.push({ ...pending });
      else queue.push({ ...pending });
    }

    const nowIso = new Date().toISOString();
    const writes: DerivedWrites = { nowIso, progressIds: [], statusIds: [], registration: [], topIds: [], clearTopIds: [] };

    // Queue: derive timers and counters locally.
    const needsReg = queue.filter(p => REGISTERED_SERVICES.includes(p.service ?? '') && !p.reg_start);
    let counters: number[] = [];
    let cursor = 0;
    if (needsReg.length > 0) [counters, cursor] = await Promise.all([fetchActiveCounters(), getLastCounter()]);

    for (const p of queue) {
      if (!p.progress_started_at) { p.progress_started_at = nowIso; writes.progressIds.push(p.id); }
      if (p.status !== 'On Progress') { p.status = 'On Progress'; writes.statusIds.push(p.id); }
    }
    for (const p of needsReg) {
      let counter = p.counter;
      if (counter == null) {
        counter = counters.find(c => c > cursor) ?? counters[0] ?? 1;
        cursor = counter;
      }
      p.reg_start = nowIso;
      p.counter = counter;
      writes.registration.push({ id: p.id, counter });
    }

    // Cubicles: group, sort, and derive the top-of-cubicle timer.
    const grouped: Record<string, Patient[]> = {};
    for (const p of assigned) (grouped[p.cubicleNum!] ??= []).push(p);
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => calledAtMs(a) - calledAtMs(b));
      const [top, ...rest] = list;
      if (top && !top.cubicle_top_started_at) { top.cubicle_top_started_at = nowIso; writes.topIds.push(top.id); }
      for (const p of rest) {
        if (p.cubicle_top_started_at) { p.cubicle_top_started_at = null; writes.clearTopIds.push(p.id); }
      }
    }

    if (requestId !== fetchIdRef.current) return;
    setOnProgressPatients(queue);
    setAssignedPatients(grouped);
    void persistDerivedFields(writes);
  }, [pendingRef]);

  return { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData };
}