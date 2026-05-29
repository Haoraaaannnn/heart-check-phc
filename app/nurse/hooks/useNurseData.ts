'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useNurseData() {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);

  const fetchData = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const { data, error } = await supabase.from('patients').select('*')
      .neq('status', 'Done').gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()).order('created_at', { ascending: true });
    
    if (!error && data) {
      const assigned = data.filter((p: Patient) => 
        p.status === 'Assigned' && p.cubicleNum
      );
      const withDoctor = data.filter((p: Patient) => p.status === 'With Doctor');
      
      setAssignedPatients(assigned);
      setWithDoctorPatients(withDoctor);
    }
  };

  const fetchFinished = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const { data, error } = await supabase.from('patients').select('*')
      .eq('status', 'Done').gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()).order('updated_at', { ascending: false });
    if (!error && data) setFinishedPatients(data);
  };

  return { assignedPatients, withDoctorPatients, finishedPatients, setAssignedPatients, setWithDoctorPatients, fetchData, fetchFinished };
}