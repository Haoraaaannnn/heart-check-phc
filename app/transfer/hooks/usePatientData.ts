'use client';
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

const getNextCounter = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data } = await supabase
    .from('patients')
    .select('counter')
    .in('service', ['Consultation', 'OPD Screening'])
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .not('counter', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  const lastCounter = data?.[0]?.counter ?? 0;
  return (lastCounter % 5) + 1;
};

export function usePatientData() {
  const [onProgressPatients, setOnProgressPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Record<string, Patient[]>>({});

  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++fetchIdRef.current;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .neq('status', 'Done')
      .neq('status', 'Idle')
      .neq('status', 'Removed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('queue_position', { ascending: true, nullsFirst: false });

    if (error || !data) return;

    const queue = data
      .filter(p => !p.cubicleNum && p.status !== "Assigned")
      .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));

    const processedQueue = [...queue];
    const onProgress = processedQueue.slice(0, 5);
    const waiting = processedQueue.slice(5);

    const reorderUpdates = queue
      .map((p, i) => ({ id: p.id, queue_position: i + 1, current: p.queue_position }))
      .filter(u => u.current !== u.queue_position)
      .map(({ id, queue_position }) => ({ id, queue_position }));

    if (reorderUpdates.length > 0) {
      await supabase.from('patients').upsert(reorderUpdates, { onConflict: 'id' });
    }

    const onProgressUpdates: any[] = [];
    for (const patient of onProgress) {
      const updates: any = { id: patient.id };
      let changed = false;

      if (patient.status !== "On Progress") {
        updates.status = "On Progress";
        changed = true;
      }
      if (!patient.progress_started_at) {
        updates.progress_started_at = new Date().toISOString();
        changed = true;
      }
      if (
        (patient.service === "Consultation" || patient.service === "OPD Screening") &&
        !patient.reg_start
      ) {
        updates.reg_start = new Date().toISOString();
        updates.counter = patient.counter ?? await getNextCounter();
        changed = true;
      }

      if (changed) {
        onProgressUpdates.push(updates);
        Object.assign(patient, updates);
      }
    }

    const waitingUpdates: any[] = [];
    for (const patient of waiting) {
      const updates: any = { id: patient.id };
      let changed = false;

      if (patient.status !== "Waiting") {
        updates.status = "Waiting";
        changed = true;
      }
      if (patient.progress_started_at) {
        updates.progress_started_at = null;
        changed = true;
      }

      if (changed) {
        waitingUpdates.push(updates);
        Object.assign(patient, updates);
      }
    }

    if (onProgressUpdates.length > 0) {
      await supabase.from('patients').upsert(onProgressUpdates, { onConflict: 'id' });
    }
    if (waitingUpdates.length > 0) {
      await supabase.from('patients').upsert(waitingUpdates, { onConflict: 'id' });
    }

    const assigned = data.filter((p: Patient) =>
      p.status === 'Assigned' && p.cubicleNum
    );

    assigned.sort((a, b) => {
      const aTime = a.called_at ? new Date(a.called_at).getTime() : 0;
      const bTime = b.called_at ? new Date(b.called_at).getTime() : 0;
      return aTime - bTime;
    });

    const grouped: Record<string, Patient[]> = {};
    assigned.forEach((p: Patient) => {
      if (p.cubicleNum) {
        if (!grouped[p.cubicleNum]) grouped[p.cubicleNum] = [];
        grouped[p.cubicleNum].push(p);
      }
    });

    for (const cubicleNum in grouped) {
      grouped[cubicleNum].sort((a, b) => {
        const aT = a.called_at ? new Date(a.called_at).getTime() : 0;
        const bT = b.called_at ? new Date(b.called_at).getTime() : 0;
        return aT - bT;
      });
    }

    const topStartUpdates: { id: number; cubicle_top_started_at: string }[] = [];
    const clearUpdates: { id: number; cubicle_top_started_at: null }[] = [];
    const now = new Date().toISOString();

    for (const cubicleNum in grouped) {
      const [top, ...rest] = grouped[cubicleNum];
      if (top && !top.cubicle_top_started_at) {
        topStartUpdates.push({ id: top.id, cubicle_top_started_at: now });
        top.cubicle_top_started_at = now;
      }
      for (const p of rest) {
        if (p.cubicle_top_started_at) {
          clearUpdates.push({ id: p.id, cubicle_top_started_at: null });
          p.cubicle_top_started_at = null;
        }
      }
    }

    if (topStartUpdates.length > 0) {
      await supabase.from('patients').upsert(topStartUpdates, { onConflict: 'id' });
    }
    if (clearUpdates.length > 0) {
      await supabase.from('patients').upsert(clearUpdates, { onConflict: 'id' });
    }

    if (requestId !== fetchIdRef.current) return;

    setOnProgressPatients(onProgress);
    setAssignedPatients(grouped);
  }, []);

  return { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData };
}