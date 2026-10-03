/**
 * @file useOverviewData.ts
 * @description Real-time data hook for the Admin Dashboard overview metrics and live queue.
 *
 * Implements a dual-layer data architecture:
 * 1. Zero-latency Supabase Realtime streaming:
 *    - Subscribes to `postgres_changes` events on the `patients` table.
 *    - On INSERT/UPDATE/DELETE events, instantaneously updates in-memory React state
 *      (patient list, today count, queue status breakdown, department stats, and hourly trends)
 *      with 0ms delay for immediate visual response across KPI cards.
 *    - Schedules a debounced background reconciliation fetch (300ms) to ensure state
 *      consistency with Postgres without query storms.
 * 2. Automatic polling fallback (30s):
 *    - Detects channel health (`SUBSCRIBED`, `TIMED_OUT`, `CHANNEL_ERROR`, `CLOSED`).
 *    - Activates a 30-second interval polling fallback only when the WebSocket connection
 *      is degraded or lost, seamlessly maintaining freshness during network anomalies.
 *    - Suspends polling completely when the Realtime WebSocket is healthy.
 * 3. Network connectivity lifecycle:
 *    - Integrates with `useConnectionStatus` to report channel status and browser online state.
 *    - Reacts to `window.online` events to immediately re-synchronize state.
 *
 * @remarks
 * Conforms strictly to AGENTS.md standards: full JSDoc, strict separation of concerns,
 * and zero emojis.
 *
 * @module app/dashboard/hooks/useOverviewData
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatusGroup } from '@/constants/queueStatus';
import { useConnectionStatus, type ChannelStatus } from '@/hooks/useConnectionStatus';
import { DASHBOARD_REALTIME, SERVICE_OVERVIEW } from '@/app/dashboard/constants/content';

/**
 * Counts displayed in the dashboard metric cards and ticket breakdown.
 */
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

/**
 * One `patients` row as consumed by the overview widgets and live queue table.
 */
export interface PatientRecord {
  /** Unique primary key ID */
  id: number;
  /** Hospital patient ticket number (e.g. C-101) */
  patientNum: string;
  /** Clinical department or service name */
  service: string;
  /** Operational workflow status */
  status: string;
  /** Record creation timestamp in ISO 8601 format */
  created_at: string;
  /** Record last updated timestamp in ISO 8601 format, or null */
  updated_at: string | null;
  /** Assigned cubicle identifier (e.g. Cubicle 1) */
  cubicleNum: string | null;
  /** Consultation start timestamp, or null */
  consult_start: string | null;
  /** Consultation completion timestamp, or null */
  consult_end: string | null;
}

/**
 * Return signature of the {@link useOverviewData} hook.
 */
export interface UseOverviewDataResult {
  /** Aggregated operational counters for metric cards and ticket status breakdown */
  stats: DashboardStats;
  /** Today's active queue tickets, sorted newest first */
  patientsList: PatientRecord[];
  /** Service name mapping to count of active tickets (waiting or serving) */
  deptStats: Record<string, number>;
  /** Hourly arrival counts formatted for Recharts (07:00 to 17:00) */
  hourlyData: { time: string; patients: number }[];
  /** Tickets created yesterday up to the current time of day, or null while loading */
  yesterdayCount: number | null;
  /** Flag indicating initial data loading state */
  isLoading: boolean;
  /** Whether the browser reports active internet connectivity */
  isOnline: boolean;
  /** Live Supabase Realtime channel status */
  channelStatus: ChannelStatus;
  /** True when browser is online and Realtime channel is SUBSCRIBED */
  isFullyConnected: boolean;
  /** Imperative refresh handler to manually re-synchronize data */
  refresh: () => Promise<void>;
}

/**
 * Empty baseline counters before data has loaded.
 */
const EMPTY_STATS: DashboardStats = {
  todayCount: 0,
  onQueue: 0,
  inService: 0,
  served: 0,
  idle: 0,
};

/**
 * Verifies if an ISO timestamp string falls within the local calendar day.
 *
 * @param dateStr - ISO timestamp string.
 * @returns True if date falls within today.
 */
function isDateToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

/**
 * Pure calculation function deriving dashboard counters, department distributions,
 * and hourly arrival histogram from an array of patient records.
 *
 * @param patients - Array of today's patient records.
 * @returns Derived operational stats, deptStats map, and hourlyData array.
 */
function calculateOverviewMetrics(patients: PatientRecord[]): {
  stats: DashboardStats;
  deptStats: Record<string, number>;
  hourlyData: { time: string; patients: number }[];
} {
  let queueCount = 0;
  let inServiceCount = 0;
  let servedCount = 0;
  let idleCount = 0;
  const departments: Record<string, number> = {};

  const hourCounts: Record<string, number> = {};
  for (let i = 7; i <= 17; i++) {
    hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
  }

  patients.forEach((patient) => {
    const group = getStatusGroup(patient.status);
    const serviceName = patient.service || SERVICE_OVERVIEW.fallbackService;

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

  return {
    stats: {
      todayCount: patients.length,
      onQueue: queueCount,
      inService: inServiceCount,
      served: servedCount,
      idle: idleCount,
    },
    deptStats: departments,
    hourlyData: formattedHourlyData,
  };
}

/**
 * Shape of real-time Postgres change events emitted by Supabase.
 */
interface RealtimeRowChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

/**
 * Loads today's queue data for the admin overview with zero-latency Supabase Realtime
 * subscriptions and automatic 30-second polling fallback during connection degradation.
 *
 * @returns See {@link UseOverviewDataResult}.
 */
export function useOverviewData(): UseOverviewDataResult {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [hourlyData, setHourlyData] = useState<{ time: string; patients: number }[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isOnline, channelStatus, isFullyConnected, setChannelStatus } = useConnectionStatus();

  /**
   * Fetches today's complete patient records from Supabase and derives all metrics.
   */
  const fetchDashboardStats = useCallback(async () => {
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

    const list = data as PatientRecord[];
    const derived = calculateOverviewMetrics(list);

    setPatientsList(list);
    setStats(derived.stats);
    setDeptStats(derived.deptStats);
    setHourlyData(derived.hourlyData);
    setIsLoading(false);
  }, []);

  /**
   * Fetches yesterday's ticket count created up to the same hour/minute of the day.
   */
  const fetchYesterday = useCallback(async () => {
    const now = new Date();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const sameTimeYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', sameTimeYesterday.toISOString());

    if (!error && count !== null) {
      setYesterdayCount(count);
    }
  }, []);

  /**
   * Schedules a debounced server-side query to reconcile client state with PostgreSQL.
   */
  const scheduleReconciliation = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchDashboardStats();
    }, DASHBOARD_REALTIME.debounceMs);
  }, [fetchDashboardStats]);

  /**
   * Processes incoming Supabase Realtime payloads with instantaneous in-memory updates
   * to provide zero-latency KPI adjustments, then schedules a background reconciliation.
   */
  const handleRealtimePayload = useCallback(
    (payload: RealtimeRowChange) => {
      const { eventType } = payload;

      if (eventType === 'INSERT') {
        const raw = payload.new as Partial<PatientRecord>;
        if (isDateToday(raw.created_at)) {
          const newPatient: PatientRecord = {
            id: Number(raw.id),
            patientNum: String(raw.patientNum ?? ''),
            service: String(raw.service ?? SERVICE_OVERVIEW.fallbackService),
            status: String(raw.status ?? ''),
            created_at: String(raw.created_at ?? new Date().toISOString()),
            updated_at: raw.updated_at ? String(raw.updated_at) : null,
            cubicleNum: raw.cubicleNum ? String(raw.cubicleNum) : null,
            consult_start: raw.consult_start ? String(raw.consult_start) : null,
            consult_end: raw.consult_end ? String(raw.consult_end) : null,
          };

          setPatientsList((prev) => {
            const filtered = prev.filter((p) => p.id !== newPatient.id);
            const updated = [newPatient, ...filtered].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const derived = calculateOverviewMetrics(updated);
            setStats(derived.stats);
            setDeptStats(derived.deptStats);
            setHourlyData(derived.hourlyData);
            return updated;
          });
        }
      } else if (eventType === 'UPDATE') {
        const raw = payload.new as Partial<PatientRecord>;
        const targetId = Number(raw.id);

        setPatientsList((prev) => {
          const index = prev.findIndex((p) => p.id === targetId);
          let updated: PatientRecord[];

          if (index !== -1) {
            const merged: PatientRecord = {
              ...prev[index],
              ...raw,
              id: targetId,
              service: String(raw.service ?? prev[index].service ?? SERVICE_OVERVIEW.fallbackService),
              status: String(raw.status ?? prev[index].status ?? ''),
            };
            updated = [...prev];
            updated[index] = merged;
          } else if (isDateToday(raw.created_at)) {
            const newPatient: PatientRecord = {
              id: targetId,
              patientNum: String(raw.patientNum ?? ''),
              service: String(raw.service ?? SERVICE_OVERVIEW.fallbackService),
              status: String(raw.status ?? ''),
              created_at: String(raw.created_at ?? new Date().toISOString()),
              updated_at: raw.updated_at ? String(raw.updated_at) : null,
              cubicleNum: raw.cubicleNum ? String(raw.cubicleNum) : null,
              consult_start: raw.consult_start ? String(raw.consult_start) : null,
              consult_end: raw.consult_end ? String(raw.consult_end) : null,
            };
            updated = [newPatient, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          } else {
            return prev;
          }

          const derived = calculateOverviewMetrics(updated);
          setStats(derived.stats);
          setDeptStats(derived.deptStats);
          setHourlyData(derived.hourlyData);
          return updated;
        });
      } else if (eventType === 'DELETE') {
        const targetId = Number(payload.old?.id);
        if (!isNaN(targetId)) {
          setPatientsList((prev) => {
            const updated = prev.filter((p) => p.id !== targetId);
            if (updated.length === prev.length) return prev;
            const derived = calculateOverviewMetrics(updated);
            setStats(derived.stats);
            setDeptStats(derived.deptStats);
            setHourlyData(derived.hourlyData);
            return updated;
          });
        }
      }

      scheduleReconciliation();
    },
    [scheduleReconciliation]
  );

  /**
   * Activates fallback periodic polling (every 30 seconds) when the WebSocket channel is degraded.
   */
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      void fetchDashboardStats();
    }, DASHBOARD_REALTIME.fallbackPollIntervalMs);
  }, [fetchDashboardStats]);

  /**
   * Suspends fallback periodic polling when the WebSocket channel is fully subscribed and healthy.
   */
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Primary Realtime subscription lifecycle with fallback polling
  useEffect(() => {
    let disposed = false;

    void fetchDashboardStats();
    void fetchYesterday();

    const channel = supabase
      .channel(DASHBOARD_REALTIME.channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          if (!disposed) {
            handleRealtimePayload(payload as unknown as RealtimeRowChange);
          }
        }
      )
      .subscribe((rawStatus) => {
        if (disposed) return;
        const status = rawStatus as ChannelStatus;
        setChannelStatus(status);

        if (status === 'SUBSCRIBED') {
          stopPolling();
        } else {
          startPolling();
        }
      });

    return () => {
      disposed = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      stopPolling();
      void supabase.removeChannel(channel);
    };
  }, [
    fetchDashboardStats,
    fetchYesterday,
    handleRealtimePayload,
    setChannelStatus,
    startPolling,
    stopPolling,
  ]);

  // Network recovery: refetch immediately when browser regains online connectivity
  useEffect(() => {
    const handleOnline = () => {
      void fetchDashboardStats();
      void fetchYesterday();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchDashboardStats, fetchYesterday]);

  return {
    stats,
    patientsList,
    deptStats,
    hourlyData,
    yesterdayCount,
    isLoading,
    isOnline,
    channelStatus,
    isFullyConnected,
    refresh: fetchDashboardStats,
  };
}