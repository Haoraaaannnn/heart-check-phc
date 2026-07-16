'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .neq('status', 'Done')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('queue_position', {
      ascending: true,
      nullsFirst: false,
    });

    if (!error && data) {
      const queue = data
        .filter(
          p =>
            !p.cubicleNum &&
            p.status !== "Assigned"
        )
        .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));

      const processedQueue = [...queue];

      const onProgress = processedQueue.slice(0, 5);
      const waiting = processedQueue.slice(5);

      for (const patient of onProgress) {
        const updates: any = {};

        if (patient.status !== "On Progress") {
          updates.status = "On Progress";
        }

        if (!patient.progress_started_at) {
          updates.progress_started_at = new Date().toISOString();
        }

        if (
          (patient.service === "Consultation" ||
            patient.service === "OPD Screening") &&
          !patient.reg_start
        ) {
          updates.reg_start = new Date().toISOString();
          updates.counter = patient.counter ?? await getNextCounter();
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("patients").update(updates).eq("id", patient.id);
          Object.assign(patient, updates);
        }
      }

      for (const patient of waiting) {
        const updates: any = {};

        if (patient.status !== "Waiting") {
          updates.status = "Waiting";
        }
        if (patient.progress_started_at) {
          updates.progress_started_at = null;
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("patients").update(updates).eq("id", patient.id);
          Object.assign(patient, updates);
        }
      }

          const assigned = data.filter((p: Patient) =>
            p.status === 'Assigned' && p.cubicleNum
          );

          assigned.sort((a, b) => {
          return (a.queue_position ?? 0) - (b.queue_position ?? 0);
          });

          const grouped: Record<string, Patient[]> = {};

          assigned.forEach((p: Patient) => {
            if (p.cubicleNum) {
              if (!grouped[p.cubicleNum]) grouped[p.cubicleNum] = [];
              grouped[p.cubicleNum].push(p);
            }
          });

    setOnProgressPatients(onProgress);
    setAssignedPatients(grouped);
        }
  }, []);

  return { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData };
}