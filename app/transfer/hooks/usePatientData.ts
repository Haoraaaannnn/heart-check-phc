'use client';
/**
 * @fileoverview Hook managing patient queue data, cubicle assignments, and in-flight
 * mutation pinning for the Patient Transfer Dashboard.
 *
 * Weak-Signal Stabilization Features:
 * - In-flight confirmed pinning: Prevents confirmed patient assignments from flickering
 *   back to the waiting queue when server responses are delayed by weak network conditions.
 * - Derived write throttling: Prevents rapid background syncs from flooding Supabase with
 *   timestamp updates, breaking the self-perpetuating Realtime WebSocket echo loop.
 * - Monotonic sequence guard: Discards stale out-of-order network responses.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 *
 * @module app/transfer/hooks/usePatientData
 */

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
 * In-flight confirmed assignment pin metadata protecting patient state from lagging network echoes.
 */
export interface ConfirmedPin {
  cubicleNum: string;
  status: string;
  expiresAt: number;
  matchedAt?: number;
}

/** Timestamp lock to prevent derived writes from flooding Supabase and triggering Realtime echo loops. */
let lastDerivedWriteAt = 0;

/**
 * Persists timestamps and counters that fetchData derived locally.
 * Throttled to at most once every 4 seconds to eliminate WebSocket echo storms on weak WiFi.
 */
async function persistDerivedFields(w: DerivedWrites): Promise<void> {
  const hasWrites =
    w.progressIds.length > 0 ||
    w.statusIds.length > 0 ||
    w.registration.length > 0 ||
    w.topIds.length > 0 ||
    w.clearTopIds.length > 0;

  if (!hasWrites) return;

  const now = Date.now();
  if (now - lastDerivedWriteAt < 4_000) {
    return;
  }
  lastDerivedWriteAt = now;

  const jobs: PromiseLike<unknown>[] = [];
  const table = () => supabase.from('patients');

  if (w.progressIds.length)
    jobs.push(table().update({ progress_started_at: w.nowIso }).in('id', w.progressIds).eq('is_historical', false).is('progress_started_at', null));
  if (w.statusIds.length)
    jobs.push(table().update({ status: 'On Progress' }).in('id', w.statusIds).eq('is_historical', false).is('cubicleNum', null).neq('status', 'Assigned').neq('status', 'On Progress'));
  for (const r of w.registration)
    jobs.push(table().update({ reg_start: w.nowIso, counter: r.counter }).eq('id', r.id).eq('is_historical', false).is('reg_start', null));
  if (w.topIds.length)
    jobs.push(table().update({ cubicle_top_started_at: w.nowIso }).in('id', w.topIds).eq('is_historical', false).is('cubicle_top_started_at', null));
  if (w.clearTopIds.length)
    jobs.push(table().update({ cubicle_top_started_at: null }).in('id', w.clearTopIds).eq('is_historical', false).not('cubicle_top_started_at', 'is', null));

  await Promise.allSettled(jobs);
}

/**
 * Loads today's queue and cubicle assignments with in-flight mutation protection.
 *
 * @param pendingRef - Ref holding unconfirmed local assignments; overlaid so a sync never undoes them.
 */
export function usePatientData(pendingRef?: React.MutableRefObject<Patient[]>) {
  const [onProgressPatients, setOnProgressPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Record<string, Patient[]>>({});
  const fetchIdRef = useRef(0);
  const assignedRef = useRef(assignedPatients);
  const onProgressRef = useRef(onProgressPatients);

  useEffect(() => {
    assignedRef.current = assignedPatients;
    onProgressRef.current = onProgressPatients;
  }, [assignedPatients, onProgressPatients]);

  // In-flight confirmed assignment pins protecting recently confirmed moves
  const inFlightConfirmedRef = useRef<Map<number, ConfirmedPin>>(new Map());

  /**
   * Pins a patient assignment in local state so lagging background fetches and
   * delayed Realtime WebSocket echoes do not revert the patient to unassigned.
   *
   * @param patientId - Unique ID of the patient.
   * @param cubicleNum - Target cubicle designation string.
   * @param status - Target status string (defaults to 'Assigned').
   */
  const pinConfirmedPatient = useCallback((patientId: number, cubicleNum: string, status: string = 'Assigned') => {
    inFlightConfirmedRef.current.set(patientId, {
      cubicleNum,
      status,
      expiresAt: Date.now() + 8_000,
    });
  }, []);

  /**
   * Unpins a patient upon confirmed error or manual cancellation.
   *
   * @param patientId - Unique ID of the patient.
   */
  const unpinConfirmedPatient = useCallback((patientId: number) => {
    inFlightConfirmedRef.current.delete(patientId);
  }, []);

  /**
   * Retrieves an active confirmed pin for a patient, or undefined if expired or absent.
   *
   * @param patientId - Unique ID of the patient.
   * @returns Active confirmed pin record or undefined.
   */
  const getConfirmedPin = useCallback((patientId: number): ConfirmedPin | undefined => {
    const pin = inFlightConfirmedRef.current.get(patientId);
    if (!pin) return undefined;
    if (Date.now() > pin.expiresAt) {
      inFlightConfirmedRef.current.delete(patientId);
      return undefined;
    }
    return pin;
  }, []);

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

    // Discard stale out-of-order response
    if (requestId !== fetchIdRef.current) return;

    const rows = [...(data as Patient[])];

    // Clean expired confirmed pins and enforce active ones onto server rows
    const now = Date.now();
    for (const [id, pin] of inFlightConfirmedRef.current.entries()) {
      if (now > pin.expiresAt) {
        inFlightConfirmedRef.current.delete(id);
      } else {
        const target = rows.find(p => p.id === id);
        if (target) {
          if (target.status === pin.status && String(target.cubicleNum) === String(pin.cubicleNum)) {
            // Keep pin active for a 2.5s grace window after first match to absorb delayed echo packets
            if (!pin.matchedAt) {
              pin.matchedAt = now;
            } else if (now - pin.matchedAt > 2_500) {
              inFlightConfirmedRef.current.delete(id);
            }
          } else {
            target.status = pin.status;
            target.cubicleNum = pin.cubicleNum;
          }
        }
      }
    }

    // Retain any pinned patients that may be temporarily omitted from the server response
    for (const [id, pin] of inFlightConfirmedRef.current.entries()) {
      if (now <= pin.expiresAt && !rows.some(p => p.id === id)) {
        const existing =
          Object.values(assignedRef.current).flat().find(p => p.id === id) ||
          onProgressRef.current.find(p => p.id === id);
        if (existing) {
          rows.push({
            ...existing,
            cubicleNum: pin.cubicleNum,
            status: pin.status,
          });
        }
      }
    }

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

  return {
    onProgressPatients,
    assignedPatients,
    setOnProgressPatients,
    setAssignedPatients,
    fetchData,
    pinConfirmedPatient,
    unpinConfirmedPatient,
    getConfirmedPin,
  };
}