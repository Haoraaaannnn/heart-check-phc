/** @fileoverview Queue timeout rotation respecting staff breaks and historical data guards. */
'use client';
import { useEffect, useRef } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { callRotateApi } from '@/app/transfer/lib/rotateApi';

const MANUAL_SERVICES: string[] = [];

/**
 * Rotates timed-out patients only at available stations.
 * @param onProgressPatients - Waiting queue patients.
 * @param assignedPatients - Patients grouped by cubicle.
 * @param fetchData - Refresh callback after applied rotations.
 * @param busyRef - In-flight mutation guard.
 * @param rotateTimeoutMs - Allowed response interval.
 * @param maxRotations - Timeout count before idle status.
 * @param pendingIdsRef - Patients awaiting assignment confirmation.
 * @param confirmingRef - Active confirmation guard.
 * @returns Nothing; installs the rotation interval.
 */
export function useAutoRotate(
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  fetchData: () => Promise<void>,
  busyRef: React.MutableRefObject<boolean>,
  rotateTimeoutMs: number,
  maxRotations: number,
  pendingIdsRef: React.MutableRefObject<Set<number>>,
  confirmingRef?: React.MutableRefObject<boolean>
) {
  const onProgressRef = useRef(onProgressPatients);
  const assignedRef = useRef(assignedPatients);

  useEffect(() => { onProgressRef.current = onProgressPatients; }, [onProgressPatients]);
  useEffect(() => { assignedRef.current = assignedPatients; }, [assignedPatients]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;

      if (confirmingRef?.current) return;
      const [cubicles, counters] = await Promise.all([
        supabase.from('cubicle').select('cubicleNum').eq('on_break', true),
        supabase.from('counters').select('counter_number').eq('on_break', true),
      ]);
      if (cubicles.error || counters.error) return;
      const heldCubicles = new Set((cubicles.data ?? []).map(c => c.cubicleNum));
      const heldCounters = new Set((counters.data ?? []).map(c => c.counter_number));
      const now = Date.now();
      const pendingIds = pendingIdsRef.current;

      const isTimedOut = (p: Patient, startField: string | null | undefined) => {
        if (!p.service || MANUAL_SERVICES.includes(p.service)) return false;

        if (pendingIds.has(p.id)) return false;
        if (!startField) return false;
        return now - new Date(startField).getTime() >= rotateTimeoutMs;
      };

      const timedOutOnProgress = onProgressRef.current.filter(p =>
        !(p.counter && !p.reg_end && heldCounters.has(p.counter)) && isTimedOut(p, p.progress_started_at)
      );

      const topPatientsPerCubicle = Object.values(assignedRef.current)
        .map(patients => patients.filter(p => !pendingIds.has(p.id))[0])
        .filter((p): p is Patient => !!p);
      const timedOutAssigned = topPatientsPerCubicle.filter(p =>
        !heldCubicles.has(p.cubicleNum) && isTimedOut(p, p.cubicle_top_started_at)
      );

      console.log('[rotate] check result', {
        timedOutOnProgress: timedOutOnProgress.map(p => p.patientNum),
        timedOutAssigned: timedOutAssigned.map(p => p.patientNum),
      });

      if (timedOutOnProgress.length === 0 && timedOutAssigned.length === 0) return;

      console.log('[rotate] FIRING — rotating', timedOutOnProgress.length + timedOutAssigned.length, 'patients');

      busyRef.current = true;
      try {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { data: maxRow } = await supabase
        .from('patients')
        .select('queue_position')
        .not('queue_position', 'is', null)
        .neq('status', 'Assigned')
        .gte('created_at', startOfDay.toISOString())
        .order('queue_position', { ascending: false })
        .limit(1)
        .maybeSingle();

        let nextPosition = (maxRow?.queue_position ?? 0) + 1;
        const nowIso = new Date().toISOString();

        const buildUpdate = (p: Patient, extra: Record<string, any>) => {
          const nextCount = (p.rotation_count ?? 0) + 1;

          if (nextCount >= maxRotations) { 
            return {
              id: p.id,
              status: 'Idle',
              rotation_count: nextCount,
              idle_at: nowIso,
              queue_position: null,
              cubicleNum: null,
              called_at: null,
              progress_started_at: null,
              cubicle_top_started_at: null,
            };
          }

          // Patients who completed registration desk intake return to 'On Progress' with cooldown
          const alreadyRegistered = Boolean(p.reg_start) || p.service === 'Consultation' || p.service === 'OPD Screening';

          if (alreadyRegistered) {
            return {
              id: p.id,
              status: 'On Progress',
              rotation_count: nextCount,
              queue_position: nextPosition++,
              progress_started_at: null,
              cooldown_until: new Date(Date.now() + 60 * 1000).toISOString(),
              ...extra,
            };
          }

          return {
            id: p.id,
            status: 'Waiting',
            rotation_count: nextCount,
            queue_position: nextPosition++,
            progress_started_at: null,
            ...extra,
          };
        };
        
        const withExpected = (p: Patient, update: Record<string, unknown>) => ({
          ...update,
          expected: { status: p.status, cubicleNum: p.cubicleNum ?? null },
        });
        const onProgressUpdates = timedOutOnProgress.map(p => withExpected(p, buildUpdate(p, {})));
        const assignedUpdates = timedOutAssigned.map(p => {
          const reorderedPreferred =
            p.cubicleNum && p.preferredCubicleNums
              ? [p.cubicleNum, ...p.preferredCubicleNums.filter(c => c !== p.cubicleNum)]
              : p.preferredCubicleNums;

          return buildUpdate(p, {
            cubicleNum: null,
            called_at: null,
            cubicle_top_started_at: null,
            ...(reorderedPreferred ? { preferredCubicleNums: reorderedPreferred } : {}),
          });
        });

        console.log('[rotate] DB updates to write:', { onProgressUpdates, assignedUpdates });

        if (onProgressUpdates.length > 0) {
          await callRotateApi(onProgressUpdates);
        }
        if (assignedUpdates.length > 0) {
          await callRotateApi(assignedUpdates);
        }

        await fetchData();
        console.log('[rotate] rotation complete');
      } catch (err) {
        console.error('[rotate] error:', err);
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData, busyRef, rotateTimeoutMs, maxRotations, pendingIdsRef, confirmingRef]);
}
