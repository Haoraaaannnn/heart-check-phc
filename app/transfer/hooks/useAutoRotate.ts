'use client';
import { useEffect, useRef } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { ROTATE_TIMEOUT_MS } from '../lib/constants';

const MANUAL_SERVICES = ['Consultation', 'OPD Screening'];

export function useAutoRotate(
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  fetchData: () => Promise<void>
) {
  const rotating = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (rotating.current) return;

      const now = Date.now();

      const isTimedOut = (p: Patient, startField: string | null) => {
        if (!p.service || MANUAL_SERVICES.includes(p.service)) return false;
        if (!startField) return false;
        return now - new Date(startField).getTime() >= ROTATE_TIMEOUT_MS;
      };

      const timedOutOnProgress = onProgressPatients.filter(p =>
        isTimedOut(p, p.progress_started_at ?? null)
      );

      const assignedFlat = Object.values(assignedPatients).flat();
      const timedOutAssigned = assignedFlat.filter(p =>
        isTimedOut(p, p.called_at ?? null)
      );

      if (timedOutOnProgress.length === 0 && timedOutAssigned.length === 0) return;

      rotating.current = true;
      try {
        const { data: maxRow } = await supabase
          .from('patients')
          .select('queue_position')
          .order('queue_position', { ascending: false })
          .limit(1)
          .single();

        let nextPosition = (maxRow?.queue_position ?? 0) + 1;

        for (const patient of timedOutOnProgress) {
          await supabase
            .from('patients')
            .update({
              queue_position: nextPosition++,
              status: 'Waiting',
              progress_started_at: null,
            })
            .eq('id', patient.id);
        }

        for (const patient of timedOutAssigned) {
          await supabase
            .from('patients')
            .update({
              queue_position: nextPosition++,
              status: 'Waiting',
              cubicleNum: null,
              called_at: null,
              progress_started_at: null,
            })
            .eq('id', patient.id);
        }

        await fetchData();
      } catch (err) {
        console.error('Auto-rotate error:', err);
      } finally {
        rotating.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onProgressPatients, assignedPatients, fetchData]);
}