'use client';
import { useEffect } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { ROTATE_TIMEOUT_MS } from '../lib/constants';

const MANUAL_SERVICES = ['Consultation', 'OPD Screening'];

export function useAutoRotate(
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  fetchData: () => Promise<void>,
  busyRef: React.MutableRefObject<boolean>
) {
  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;

      const now = Date.now();

      const isTimedOut = (p: Patient, startField: string | null | undefined) => {
        if (!p.service || MANUAL_SERVICES.includes(p.service)) return false;
        if (!startField) return false;
        return now - new Date(startField).getTime() >= ROTATE_TIMEOUT_MS;
      };

      const timedOutOnProgress = onProgressPatients.filter(p =>
        isTimedOut(p, p.progress_started_at)
      );
      const assignedFlat = Object.values(assignedPatients).flat();
      const timedOutAssigned = assignedFlat.filter(p =>
        isTimedOut(p, p.called_at)
      );

      if (timedOutOnProgress.length === 0 && timedOutAssigned.length === 0) return;

      busyRef.current = true;
      try {
        const { data: maxRow } = await supabase
          .from('patients')
          .select('queue_position')
          .order('queue_position', { ascending: false })
          .limit(1)
          .single();

        let nextPosition = (maxRow?.queue_position ?? 0) + 1;

        const onProgressUpdates = timedOutOnProgress.map(p => ({
          id: p.id,
          queue_position: nextPosition++,
          status: 'Waiting',
          progress_started_at: null,
        }));

        const assignedUpdates = timedOutAssigned.map(p => ({
          id: p.id,
          queue_position: nextPosition++,
          status: 'Waiting',
          cubicleNum: null,
          called_at: null,
          progress_started_at: null,
        }));

        if (onProgressUpdates.length > 0) {
          await supabase.from('patients').upsert(onProgressUpdates, { onConflict: 'id' });
        }
        if (assignedUpdates.length > 0) {
          await supabase.from('patients').upsert(assignedUpdates, { onConflict: 'id' });
        }

        await fetchData();
      } catch (err) {
        console.error('Auto-rotate error:', err);
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onProgressPatients, assignedPatients, fetchData, busyRef]);
}