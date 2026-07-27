'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  todayCount: number;
  onQueue: number;
  inService: number;
  served: number;
}

export interface PatientRecord {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  created_at: string;
  consult_start: string | null;
  consult_end: string | null;
}

export function useOverviewData() {
  const [stats, setStats] = useState<DashboardStats>({ todayCount: 0, onQueue: 0, inService: 0, served: 0 });
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [hourlyData, setHourlyData] = useState<{ time: string; patients: number }[]>([]);

  const fetchDashboardStats = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('patients')
      .select('id, status, created_at, consult_start, consult_end, patientNum, service')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (!error && data) {
      let queueCount = 0;
      let inServiceCount = 0;
      let servedCount = 0;
      const departments: Record<string, number> = {};

      const hourCounts: Record<string, number> = {};
      for (let i = 7; i <= 17; i++) {
        hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
      }

      data.forEach((patient) => {
        const currentStatus = patient.status ? patient.status.toLowerCase().trim() : '';
        const serviceName = patient.service || 'General';

        if (['pending', 'waiting', 'assigned'].includes(currentStatus)) {
          queueCount++;
          departments[serviceName] = (departments[serviceName] || 0) + 1;
        } else if (['on progress', 'serving', 'consulting'].includes(currentStatus)) {
          inServiceCount++;
          departments[serviceName] = (departments[serviceName] || 0) + 1;
        } else if (['completed', 'done', 'served'].includes(currentStatus)) {
          servedCount++;
        }

        const patientHour = new Date(patient.created_at).getHours();
        const hourLabel = `${patientHour.toString().padStart(2, '0')}:00`;
        if (hourCounts[hourLabel] !== undefined) {
          hourCounts[hourLabel]++;
        } else {
          hourCounts[hourLabel] = 1;
        }
      });

      const formattedHourlyData = Object.keys(hourCounts)
        .sort()
        .map((time) => ({ time, patients: hourCounts[time] }));

      setStats({ todayCount: data.length, onQueue: queueCount, inService: inServiceCount, served: servedCount });
      setPatientsList(data as PatientRecord[]);
      setDeptStats(departments);
      setHourlyData(formattedHourlyData);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const channel = supabase
      .channel('patients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchDashboardStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, patientsList, deptStats, hourlyData };
}