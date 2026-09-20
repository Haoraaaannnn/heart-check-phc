'use client';
import { useEffect, useRef } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { callRotateApi } from '../lib/rotateApi';

const MANUAL_SERVICES: string[] = [];

export function useAutoRotate(
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  fetchData: () => Promise<void>,
  busyRef: React.MutableRefObject<boolean>,
  rotateTimeoutMs: number,
  maxRotations: number
) {
  const onProgressRef = useRef(onProgressPatients);
  const assignedRef = useRef(assignedPatients);

  useEffect(() => { onProgressRef.current = onProgressPatients; }, [onProgressPatients]);
  useEffect(() => { assignedRef.current = assignedPatients; }, [assignedPatients]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;
      const now = Date.now();

      const isTimedOut = (p: Patient, startField: string | null | undefined) => {
        if (!p.service || MANUAL_SERVICES.includes(p.service)) return false;
        if (!startField) return false;
        return now - new Date(startField).getTime() >= rotateTimeoutMs;
      };

      const timedOutOnProgress = onProgressRef.current.filter(p =>
        isTimedOut(p, p.progress_started_at)
      );
      const topPatientsPerCubicle = Object.values(assignedRef.current)
        .map(patients => patients[0])
        .filter((p): p is Patient => !!p);
      const timedOutAssigned = topPatientsPerCubicle.filter(p =>
        isTimedOut(p, p.cubicle_top_started_at)
      );

      console.log('[rotate] check result', {
        timedOutOnProgress: timedOutOnProgress.map(p => p.patientNum),
        timedOutAssigned: timedOutAssigned.map(p => p.patientNum),
      });

      if (timedOutOnProgress.length === 0 && timedOutAssigned.length === 0) return;

      console.log('[rotate] FIRING — rotating', timedOutOnProgress.length + timedOutAssigned.length, 'patients');

      busyRef.current = true;
      try {
        const { data: maxRow } = await supabase
          .from('patients')
          .select('queue_position')
          .order('queue_position', { ascending: false })
          .limit(1)
          .single();

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

          const alreadyRegistered = p.service === 'Consultation' || p.service === 'OPD Screening';

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

        const onProgressUpdates = timedOutOnProgress.map(p => buildUpdate(p, {}));
        const assignedUpdates = timedOutAssigned.map(p => buildUpdate(p, {
          cubicleNum: null,
          called_at: null,
          cubicle_top_started_at: null,
        }));

        console.log('[rotate] DB updates to write:', { onProgressUpdates, assignedUpdates });

        if (onProgressUpdates.length > 0) {
          await callRotateApi(onProgressUpdates);
        }
        if (assignedUpdates.length > 0) {
          await callRotateApi(assignedUpdates);
        }

        await fetchData();
        console.log('[rotate] rotation complete');
        await fetchData();
        console.log('[rotate] rotation complete');
      } catch (err) {
        console.error('[rotate] error:', err);
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData, busyRef, rotateTimeoutMs, maxRotations]);
}