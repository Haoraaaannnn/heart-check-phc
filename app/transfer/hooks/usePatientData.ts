'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '../types';

export function usePatientData() {
  const [onProgressPatients, setOnProgressPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Record<string, Patient[]>>({});

  const fetchData = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const { data, error } = await supabase.from('patients').select('*')
      .neq('status', 'Done').gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()).order('created_at', { ascending: true });
    
    if (!error && data) {
      const inQueue = data.filter((p: Patient) => 
        p.status === 'On Progress' && !p.cubicleNum
      );
      
      const assigned = data.filter((p: Patient) => 
        p.status === 'Assigned' && p.cubicleNum
      );
      
      setOnProgressPatients(inQueue);
      
      const grouped: Record<string, Patient[]> = {};
      assigned.forEach((p: Patient) => {
        if (p.cubicleNum) {
          if (!grouped[p.cubicleNum]) grouped[p.cubicleNum] = [];
          grouped[p.cubicleNum].push(p);
        }
      });
      setAssignedPatients(grouped);
    }
  };

  return { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData };
}