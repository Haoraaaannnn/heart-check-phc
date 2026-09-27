'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatusGroup } from '@/constants/queueStatus';

/** Counts shown in the dashboard metric cards and ticket breakdown. */
export interface DashboardStats {
  /** All tickets created today. */
  todayCount: number;
  /** Tickets waiting (pending / waiting / assigned). */
  onQueue: number;
  /** Tickets currently being served (on progress / with doctor / ...). */
  inService: number;
  /** Tickets completed today. */
  served: number;
  /** Tickets in the idle state today. */
  idle: number;
}

/** One `patients` row as needed by the overview widgets. */
export interface PatientRecord {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  cubicleNum: string | null;
  consult_start: string | null;
  consult_end: string | null;
}

const EMPTY_STATS: DashboardStats = { todayCount: 0, onQueue: 0, inService: 0, served: 0, idle: 0 };

/** Fallback label for tickets with no service (must match SERVICE_OVERVIEW.fallbackService). */
const FALLBACK_SERVICE = 'General';

/**
 * Loads today's queue data for the admin overview and keeps it live via
 * Supabase Realtime (any change on `patients` triggers a refetch).
 *
 * @returns
 *  - stats: counters for the metric cards / ticket breakdown
 *  - patientsList: today's tickets, newest first
 *  - deptStats: service name -> patients waiting or being served
 *  - hourlyData: arrivals per hour (07:00-17:00, extended if needed)
 *  - yesterdayCount: tickets created yesterday up to this time of day, or null while loading
 */
export function useOverviewData() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [hourlyData, setHourlyData] = useState<{ time: string; patients: number }[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState<number | null>(null);

  const fetchDashboardStats = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('patients')
      .select('id, status, created_at, updated_at, consult_start, consult_end, patientNum, service, cubicleNum')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    let queueCount = 0;
    let inServiceCount = 0;
    let servedCount = 0;
    let idleCount = 0;
    const departments: Record<string, number> = {};

    const hourCounts: Record<string, number> = {};
    for (let i = 7; i <= 17; i++) {
      hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
    }

    data.forEach((patient) => {
      const group = getStatusGroup(patient.status);
      const serviceName = patient.service || FALLBACK_SERVICE;

      if (group === 'waiting') {
        queueCount++;
        departments[serviceName] = (departments[serviceName] || 0) + 1;
      } else if (group === 'serving') {
        inServiceCount++;
        departments[serviceName] = (departments[serviceName] || 0) + 1;
      } else if (group === 'done') {
        servedCount++;
      } else if (group === 'idle') {
        idleCount++;
      }

      const patientHour = new Date(patient.created_at).getHours();
      const hourLabel = `${patientHour.toString().padStart(2, '0')}:00`;
      hourCounts[hourLabel] = (hourCounts[hourLabel] ?? 0) + 1;
    });

    const formattedHourlyData = Object.keys(hourCounts)
      .sort()
      .map((time) => ({ time, patients: hourCounts[time] }));

    setStats({
      todayCount: data.length,
      onQueue: queueCount,
      inService: inServiceCount,
      served: servedCount,
      idle: idleCount,
    });
    setPatientsList(data as PatientRecord[]);
    setDeptStats(departments);
    setHourlyData(formattedHourlyData);
  };

  // Live data: initial fetch + refetch on any change to `patients`.
  useEffect(() => {
    fetchDashboardStats();

    const channel = supabase
      .channel('patients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchDashboardStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Yesterday's count, fetched once. Compared "up to this time of day" so the
  // trend isn't misleadingly negative early in the day. Not refreshed live.
  useEffect(() => {
    const fetchYesterday = async () => {
      const now = new Date();
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const sameTimeYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { count, error } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfYesterday.toISOString())
        .lt('created_at', sameTimeYesterday.toISOString());

      if (!error && count !== null) setYesterdayCount(count);
    };

    fetchYesterday();
  }, []);

  return { stats, patientsList, deptStats, hourlyData, yesterdayCount };
}