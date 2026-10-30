/** @fileoverview Today's idle ledger with acknowledged, historically guarded recovery and removal. */
'use client';
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { manilaDayRange } from '@/utils/manilaDayRange';

/** Explicit mutation result, including rejected or stale idle actions. */
type IdleActionResult = { ok: true } | { ok: false; error: string };

/** @param value - Untrusted database row. @returns Whether the idle list may render it safely. */
function isIdlePatient(value: unknown): value is Patient {
  if (typeof value !== 'object' || value === null || !('id' in value) || !('patientNum' in value) || !('status' in value)) return false;
  return typeof value.id === 'number' && Number.isSafeInteger(value.id) && value.id > 0 &&
    typeof value.patientNum === 'string' && value.status === 'Idle' &&
    (!('service' in value) || value.service === undefined || typeof value.service === 'string') &&
    (!('subcategory' in value) || value.subcategory == null || typeof value.subcategory === 'string') &&
    (!('rotation_count' in value) || value.rotation_count == null || typeof value.rotation_count === 'number');
}

/** @returns Today's idle tickets, operation feedback, and durable guarded actions. */
export function useIdlePatients() {
  const [idlePatients, setIdlePatients] = useState<Patient[]>([]);
  const [idleError, setIdleError] = useState('');
  const [busyPatientId, setBusyPatientId] = useState<number | null>(null);
  const busyRef = useRef(false);

  /** @param failOnError - Reject initial loading failures. @returns Completion of the current-day read. */
  const fetchIdlePatients = useCallback(async (failOnError = false) => {
    const { start, end } = manilaDayRange(Date.now());
    const { data, error } = await supabase.from('patients').select('*')
      .eq('status', 'Idle').eq('is_historical', false)
      .gte('created_at', start).lt('created_at', end).order('idle_at', { ascending: false });
    const rows: unknown = data;
    if (error || !Array.isArray(rows) || !rows.every(isIdlePatient)) {
      if (failOnError) throw new Error('Unable to load idle tickets. Please retry.');
      setIdleError('Unable to refresh idle tickets. Please retry.');
      return;
    }
    setIdlePatients(rows);
  }, []);

  /** @param options - Idle ticket and intended fields. @returns Acknowledged change or safe failure. */
  const saveIdleAction = useCallback(async (options: {
    patient: Patient; fields: Record<string, unknown>;
  }): Promise<IdleActionResult> => {
    const { data, error } = await supabase.from('patients').update(options.fields)
      .eq('id', options.patient.id).eq('status', 'Idle').eq('is_historical', false).select('id').maybeSingle();
    const id: unknown = data?.id;
    if (error || id !== options.patient.id) return { ok: false, error: 'The idle ticket was not updated. Refresh and try again.' };
    setIdlePatients(previous => previous.filter(patient => patient.id !== options.patient.id));
    return { ok: true };
  }, []);

  /** @param options - Ticket and chosen action. @returns A guarded, explicit action result. */
  const performAction = useCallback(async (options: {
    patient: Patient; activate: boolean;
  }): Promise<IdleActionResult> => {
    if (busyRef.current) return { ok: false, error: 'An idle ticket is already being updated.' };
    busyRef.current = true;
    setBusyPatientId(options.patient.id);
    setIdleError('');
    try {
      let fields: Record<string, unknown> = { status: 'Removed', removed_at: new Date().toISOString() };
      if (options.activate) {
        const { start, end } = manilaDayRange(Date.now());
        const { data, error } = await supabase.from('patients').select('queue_position')
          .eq('is_historical', false).gte('created_at', start).lt('created_at', end)
          .not('queue_position', 'is', null).order('queue_position', { ascending: false }).limit(1).maybeSingle();
        const position: unknown = data?.queue_position;
        if (error || (position != null && (typeof position !== 'number' || !Number.isSafeInteger(position)))) throw new Error('Queue position unavailable.');
        fields = { status: 'Waiting', queue_position: (typeof position === 'number' ? position : 0) + 1,
          rotation_count: 0, cubicleNum: null, counter: null, reg_start: null, reg_end: null,
          called_at: null, progress_started_at: null, cubicle_top_started_at: null,
          counter_top_started_at: null, counter_rejoin_at: null, counter_paused_at: null,
          cooldown_until: null, idle_at: null, removed_at: null };
      }
      const result = await saveIdleAction({ patient: options.patient, fields });
      if (!result.ok) setIdleError(result.error);
      return result;
    } catch {
      const error = 'Unable to update this idle ticket. Check the connection and retry.';
      setIdleError(error);
      return { ok: false, error };
    } finally { busyRef.current = false; setBusyPatientId(null); }
  }, [saveIdleAction]);

  /** @param patient - Idle ticket. @returns Recovery result; failed writes keep the ticket visible. */
  const activatePatient = useCallback((patient: Patient) => performAction({ patient, activate: true }), [performAction]);
  /** @param patient - Idle ticket. @returns Soft-removal result, retaining the reporting record. */
  const removePatient = useCallback((patient: Patient) => performAction({ patient, activate: false }), [performAction]);
  return { idlePatients, idleError, busyPatientId, fetchIdlePatients, activatePatient, removePatient };
}
