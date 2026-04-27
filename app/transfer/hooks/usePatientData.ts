'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';
import { Patient } from '../types';

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
      .order('created_at', { ascending: true });

    if (!error && data) {
      const allWaiting = data.filter((p: Patient) =>
        (p.status === 'On Progress' || p.status === 'Waiting') && !p.cubicleNum
      );

      const processedQueue = [...allWaiting];

      for (let index = 0; index < processedQueue.length; index++) {
        const patient = processedQueue[index];
        const newStatus = index < 5 ? 'On Progress' : 'Waiting';

        if ((patient.service === 'Consultation' || patient.service === 'OPD Screening')) {
          if (patient.status !== 'On Progress' || !patient.reg_start) {
            const now = new Date().toISOString();
            const counter = patient.counter ?? await getNextCounter();

            const { error: updateError } = await supabase
              .from('patients')
              .update({
                status: newStatus,
                reg_start: now,
                counter,
              })
              .eq('id', patient.id);

            if (!updateError) {
              patient.status = newStatus;
              patient.reg_start = now;
              patient.counter = counter;
            }
          }
        } else if (patient.status !== newStatus) {
          const { error: updateError } = await supabase
            .from('patients')
            .update({ status: newStatus })
            .eq('id', patient.id);

          if (!updateError) {
            patient.status = newStatus;
          }
        }
      }

      const assigned = data.filter((p: Patient) =>
        p.status === 'Assigned' && p.cubicleNum
      );

      setOnProgressPatients(processedQueue);

      const grouped: Record<string, Patient[]> = {};
      assigned.forEach((p: Patient) => {
        if (p.cubicleNum) {
          if (!grouped[p.cubicleNum]) grouped[p.cubicleNum] = [];
          grouped[p.cubicleNum].push(p);
        }
      });
      setAssignedPatients(grouped);
    }
  }, []);

  return { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData };
}