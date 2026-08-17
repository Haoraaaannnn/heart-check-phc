'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useNurseData() {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [carryoutPatients, setCarryoutPatients] = useState<Patient[]>([]);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .neq('status', 'Done')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAssignedPatients(
        data.filter(
          (patient: Patient) =>
            patient.status === 'Assigned' && patient.cubicleNum
        )
      );

      setWithDoctorPatients(
        data.filter((patient: Patient) => patient.status === 'With Doctor')
      );

      setCarryoutPatients(
        data.filter((patient: Patient) => patient.status === 'Carryout')
      );
    }
  };

  const fetchFinished = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('status', 'Done')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('updated_at', { ascending: false });

    if (!error && data) setFinishedPatients(data);
  };

  return {
    assignedPatients,
    withDoctorPatients,
    carryoutPatients,
    finishedPatients,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchData,
    fetchFinished,
  };
}