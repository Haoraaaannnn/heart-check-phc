/** @fileoverview Queue timeout rotation respecting staff breaks and historical data guards. */
'use client';
import { useEffect, useRef } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { callRotateApi, RotationConflictError } from '@/app/transfer/lib/rotateApi';
import { nextIdleRotation, idlePatientFields } from '@/lib/idleRotationPolicy';

const MANUAL_SERVICES: string[] = [];

/** Inputs for cumulative timeout rotation into the idle pool. */
interface AutoRotateOptions {
  onProgressPatients: Patient[];
  assignedPatients: Record<string, Patient[]>;
  fetchData: () => Promise<void>;
  busyRef: React.MutableRefObject<boolean>;
  rotateTimeoutMs: number;
  maxRotations: number;
  pendingIdsRef: React.MutableRefObject<Set<number>>;
  confirmingRef?: React.MutableRefObject<boolean>;
}

/**
 * Rotates timed-out patients only at available stations.
 * @param options - Queue snapshot, timeout interval and mutation guards.
 * @returns Nothing; installs the rotation interval.
 */
export function useAutoRotate({ onProgressPatients, assignedPatients, fetchData, busyRef,
  rotateTimeoutMs, maxRotations, pendingIdsRef, confirmingRef }: AutoRotateOptions) {
  const onProgressRef = useRef(onProgressPatients);
  const assignedRef = useRef(assignedPatients);

  useEffect(() => { onProgressRef.current = onProgressPatients; }, [onProgressPatients]);
  useEffect(() => { assignedRef.current = assignedPatients; }, [assignedPatients]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;

      if (confirmingRef?.current) return;
      busyRef.current = true;
      try {
        const cubicles = await supabase.from('cubicle').select('cubicleNum').eq('on_break', true);
        if (cubicles.error) return;
        const heldCubicles = new Set((cubicles.data ?? []).map(c => c.cubicleNum));
        const now = Date.now();
        const pendingIds = pendingIdsRef.current;

        const isTimedOut = (p: Patient, startField: string | null | undefined) => {
          if (!p.service || MANUAL_SERVICES.includes(p.service)) return false;

          if (pendingIds.has(p.id)) return false;
          if (!startField) return false;
          return now - new Date(startField).getTime() >= rotateTimeoutMs;
        };

        const timedOutOnProgress = onProgressRef.current.filter(p =>
          !(p.counter && !p.reg_end) && isTimedOut(p, p.progress_started_at)
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

        const buildUpdate = (p: Patient, extra: Record<string, unknown>) => {
          const rotation = nextIdleRotation({ rotationCount: p.rotation_count, maxRotations });
          const nextCount = rotation.rotationCount;

          if (rotation.idle) {
            return {
              id: p.id,
              ...idlePatientFields(nowIso),
              rotation_count: nextCount,
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
          id: p.id,
          expected: { status: p.status, cubicleNum: p.cubicleNum ?? null, rotation_count: p.rotation_count ?? null },
        });
        const onProgressUpdates = timedOutOnProgress.map(p => withExpected(p, buildUpdate(p, {})));
        const assignedUpdates = timedOutAssigned.map(p => {
          const reorderedPreferred =
            p.cubicleNum && p.preferredCubicleNums
              ? [p.cubicleNum, ...p.preferredCubicleNums.filter(c => c !== p.cubicleNum)]
              : p.preferredCubicleNums;

          return withExpected(p, buildUpdate(p, {
            cubicleNum: null,
            called_at: null,
            cubicle_top_started_at: null,
            ...(reorderedPreferred ? { preferredCubicleNums: reorderedPreferred } : {}),
          }));
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
      } catch (err: unknown) {
        await fetchData().catch(() => console.error('[rotate] Unable to refresh the queue after a changed ticket.'));
        if (!(err instanceof RotationConflictError)) {
          console.error('[rotate] Update failed:', err instanceof Error ? err.message : 'Queue update unavailable.');
        }
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData, busyRef, rotateTimeoutMs, maxRotations, pendingIdsRef, confirmingRef]);
}
