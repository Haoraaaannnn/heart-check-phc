/**
 * @file useOverviewData.ts
 * @description Real-time and historical data hook for the Admin Dashboard overview metrics and live queue.
 *
 * Implements a dual-layer data architecture with timeframe filtering:
 * 1. Timeframe range selection (Today, Yesterday, Last 7 Days, Month-to-Date):
 *    - Allows administrative leaders to evaluate executive KPIs across historical ranges
 *      in addition to today's live streaming queue.
 *    - Manages session-scoped caching across historical ranges for 0ms re-selection latency.
 *    - Preserves today's live streaming queue for the Live Queue Table regardless of the
 *      executive metrics timeframe selected.
 * 2. Zero-latency Supabase Realtime streaming:
 *    - Subscribes to `postgres_changes` events on the `patients` table.
 *    - On INSERT/UPDATE/DELETE events, instantaneously updates in-memory React state
 *      (patient list, today count, queue status breakdown, department stats, and hourly trends)
 *      with 0ms delay for immediate visual response across KPI cards.
 *    - Schedules a debounced background reconciliation fetch (300ms) to ensure state
 *      consistency with Postgres without query storms.
 * 3. Automatic polling fallback (30s):
 *    - Detects channel health (`SUBSCRIBED`, `TIMED_OUT`, `CHANNEL_ERROR`, `CLOSED`).
 *    - Activates a 30-second interval polling fallback only when the WebSocket connection
 *      is degraded or lost, seamlessly maintaining freshness during network anomalies.
 *    - Suspends polling completely when the Realtime WebSocket is healthy.
 * 4. Network connectivity lifecycle:
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
import {
  DASHBOARD_REALTIME,
  METRIC_RANGE_CONFIG,
  SERVICE_OVERVIEW,
  type OverviewDateRange,
} from '@/app/dashboard/constants/content';

/**
 * Counts displayed in the dashboard metric cards and ticket breakdown.
 */
export interface DashboardStats {
  /** All tickets created within the selected timeframe. */
  todayCount: number;
  /** Tickets waiting (pending / waiting / assigned). */
  onQueue: number;
  /** Tickets currently being served (on progress / with doctor / ...). */
  inService: number;
  /** Tickets completed within the timeframe. */
  served: number;
  /** Tickets in the idle state within the timeframe. */
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
  /** Active queue tickets for the selected timeframe, sorted newest first */
  patientsList: PatientRecord[];
  /** Today's active queue tickets (guaranteed to reflect today even during historical inspection) */
  livePatientsList: PatientRecord[];
  /** Service name mapping to count of active tickets (waiting or serving) */
  deptStats: Record<string, number>;
  /** Hourly arrival counts formatted for Recharts (07:00 to 17:00) */
  hourlyData: { time: string; patients: number }[];
  /** Tickets created yesterday up to the current time of day, or null while loading */
  yesterdayCount: number | null;
  /** Preceding period comparison baseline count for the active timeframe */
  comparisonCount: number | null;
  /** Period comparison text label (e.g. 'vs. yesterday', 'vs. prior 7d') */
  comparisonLabel: string;
  /** Currently selected timeframe range */
  range: OverviewDateRange;
  /** Function to switch between Today, Yesterday, Last 7 Days, and Month-to-Date */
  setRange: (range: OverviewDateRange) => void;
  /** Flag indicating whether historical timeframe switch is currently loading */
  isRangeLoading: boolean;
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
 * Cached data payload for a historical timeframe.
 */
interface HistoricalCachePayload {
  patients: PatientRecord[];
  stats: DashboardStats;
  deptStats: Record<string, number>;
  hourlyData: { time: string; patients: number }[];
  comparisonCount: number | null;
  fetchedAt: number;
}

/**
 * Duration in milliseconds before a cached historical range is considered stale (1 minute).
 */
const CACHE_TTL_MS = 60_000;

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
 * @param patients - Array of patient records.
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
 * Computes ISO timestamp boundaries for a given timeframe range and its comparison baseline.
 *
 * @param range - The requested timeframe range.
 * @param now - Current reference timestamp.
 * @returns Query boundaries for primary and comparison ranges.
 */
function getDateBoundaries(
  range: OverviewDateRange,
  now: Date = new Date()
): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
} {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  if (range === 'today') {
    const start = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth, currentDate + 1, 0, 0, 0, 0);

    const prevStart = new Date(currentYear, currentMonth, currentDate - 1, 0, 0, 0, 0);
    // Fair comparison: compare up to the current hour/minute yesterday
    const prevEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      prevStartDate: prevStart.toISOString(),
      prevEndDate: prevEnd.toISOString(),
    };
  }

  if (range === 'yesterday') {
    const start = new Date(currentYear, currentMonth, currentDate - 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);

    const prevStart = new Date(currentYear, currentMonth, currentDate - 2, 0, 0, 0, 0);
    const prevEnd = new Date(currentYear, currentMonth, currentDate - 1, 0, 0, 0, 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      prevStartDate: prevStart.toISOString(),
      prevEndDate: prevEnd.toISOString(),
    };
  }

  if (range === '7d') {
    // Last 7 full operational days (inclusive of today)
    const start = new Date(currentYear, currentMonth, currentDate - 6, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth, currentDate + 1, 0, 0, 0, 0);

    // Prior 7-day period for trend comparison
    const prevStart = new Date(currentYear, currentMonth, currentDate - 13, 0, 0, 0, 0);
    const prevEnd = new Date(currentYear, currentMonth, currentDate - 6, 0, 0, 0, 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      prevStartDate: prevStart.toISOString(),
      prevEndDate: prevEnd.toISOString(),
    };
  }

  // Month-to-date ('mtd')
  const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
  const end = new Date(currentYear, currentMonth, currentDate + 1, 0, 0, 0, 0);

  // Prior month up to the equivalent day of the month
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
  const prevMonthEnd = new Date(currentYear, currentMonth - 1, currentDate + 1, 0, 0, 0, 0);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    prevStartDate: prevMonthStart.toISOString(),
    prevEndDate: prevMonthEnd.toISOString(),
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
 * Loads overview queue data for the admin overview with timeframe filtering, zero-latency
 * Supabase Realtime subscriptions for live data, and automatic 30-second polling fallback.
 *
 * @returns See {@link UseOverviewDataResult}.
 */
export function useOverviewData(): UseOverviewDataResult {
  const [range, setRangeState] = useState<OverviewDateRange>('today');
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [livePatientsList, setLivePatientsList] = useState<PatientRecord[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [hourlyData, setHourlyData] = useState<{ time: string; patients: number }[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState<number | null>(null);
  const [comparisonCount, setComparisonCount] = useState<number | null>(null);
  const [comparisonLabel, setComparisonLabel] = useState<string>(METRIC_RANGE_CONFIG.today.trendLabel);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRangeLoading, setIsRangeLoading] = useState<boolean>(false);

  const rangeRef = useRef<OverviewDateRange>('today');
  const livePatientsRef = useRef<PatientRecord[]>([]);
  const cacheRef = useRef<Partial<Record<OverviewDateRange, HistoricalCachePayload>>>({});
  const activeFetchIdRef = useRef<number>(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Monotonically increasing counter for today-stats fetches.
   * Each fetch increments this before querying; stale responses whose
   * captured ID no longer matches the current value are silently discarded.
   * Prevents queue teleporting when slow responses overwrite newer data.
   */
  const todayFetchIdRef = useRef<number>(0);

  /**
   * Timestamp of the last reconciliation fetch start. Used by the throttle
   * guard to suppress overlapping concurrent reconciliations from realtime
   * events colliding with poll ticks during weak-signal recovery bursts.
   */
  const lastReconcileAtRef = useRef<number>(0);

  /**
   * Timer handle for the channel degradation grace period. Delays polling
   * activation so brief channel status flickers do not cause start/stop storms.
   */
  const degradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isOnline, channelStatus, isFullyConnected, setChannelStatus } = useConnectionStatus();

  /**
   * Fetches today's live patient records and derives all real-time overview metrics.
   */
  const fetchTodayStats = useCallback(async () => {
    const myFetchId = ++todayFetchIdRef.current;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).toISOString();

    const { data, error } = await supabase
      .from('patients')
      .select('id, status, created_at, updated_at, consult_start, consult_end, patientNum, service, cubicleNum')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    // Stale response guard: discard if a newer fetch was started while this one was in flight
    if (myFetchId !== todayFetchIdRef.current) return;

    const list = data as PatientRecord[];
    livePatientsRef.current = list;
    setLivePatientsList(list);

    // If currently viewing 'today', update display state
    if (rangeRef.current === 'today') {
      const derived = calculateOverviewMetrics(list);
      setPatientsList(list);
      setStats(derived.stats);
      setDeptStats(derived.deptStats);
      setHourlyData(derived.hourlyData);
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches yesterday's ticket count created up to the same hour/minute of the day.
   */
  const fetchYesterday = useCallback(async () => {
    const now = new Date();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const sameTimeYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', sameTimeYesterday.toISOString());

    if (!error && count !== null) {
      setYesterdayCount(count);
      if (rangeRef.current === 'today') {
        setComparisonCount(count);
      }
    }
  }, []);

  /**
   * Fetches historical patient data for a specified non-today timeframe range.
   *
   * @param targetRange - The historical range to query.
   */
  const fetchHistoricalRange = useCallback(async (targetRange: OverviewDateRange) => {
    const fetchId = ++activeFetchIdRef.current;
    setIsRangeLoading(true);

    const boundaries = getDateBoundaries(targetRange);

    // 1. Fetch patient records within timeframe
    const { data, error } = await supabase
      .from('patients')
      .select('id, status, created_at, updated_at, consult_start, consult_end, patientNum, service, cubicleNum')
      .gte('created_at', boundaries.startDate)
      .lt('created_at', boundaries.endDate)
      .order('created_at', { ascending: false });

    // 2. Fetch baseline count for the preceding comparison timeframe
    const { count: prevCount } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', boundaries.prevStartDate)
      .lt('created_at', boundaries.prevEndDate);

    if (fetchId !== activeFetchIdRef.current) return;

    if (error || !data) {
      setIsRangeLoading(false);
      return;
    }

    const list = data as PatientRecord[];
    const derived = calculateOverviewMetrics(list);
    const comparisonBaseline = prevCount ?? null;

    // Cache the retrieved dataset
    cacheRef.current[targetRange] = {
      patients: list,
      stats: derived.stats,
      deptStats: derived.deptStats,
      hourlyData: derived.hourlyData,
      comparisonCount: comparisonBaseline,
      fetchedAt: Date.now(),
    };

    if (rangeRef.current === targetRange) {
      setPatientsList(list);
      setStats(derived.stats);
      setDeptStats(derived.deptStats);
      setHourlyData(derived.hourlyData);
      setComparisonCount(comparisonBaseline);
      setComparisonLabel(METRIC_RANGE_CONFIG[targetRange].trendLabel);
      setIsRangeLoading(false);
    }
  }, []);

  /**
   * Timeframe selection handler that swaps state between live queue and historical snapshots.
   */
  const setRange = useCallback(
    (newRange: OverviewDateRange) => {
      rangeRef.current = newRange;
      setRangeState(newRange);

      if (newRange === 'today') {
        const liveList = livePatientsRef.current;
        const derived = calculateOverviewMetrics(liveList);
        setPatientsList(liveList);
        setStats(derived.stats);
        setDeptStats(derived.deptStats);
        setHourlyData(derived.hourlyData);
        setComparisonCount(yesterdayCount);
        setComparisonLabel(METRIC_RANGE_CONFIG.today.trendLabel);
        setIsRangeLoading(false);
        return;
      }

      // Check session cache for fresh data
      const cached = cacheRef.current[newRange];
      const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

      if (cached && isFresh) {
        setPatientsList(cached.patients);
        setStats(cached.stats);
        setDeptStats(cached.deptStats);
        setHourlyData(cached.hourlyData);
        setComparisonCount(cached.comparisonCount);
        setComparisonLabel(METRIC_RANGE_CONFIG[newRange].trendLabel);
        setIsRangeLoading(false);
      } else {
        void fetchHistoricalRange(newRange);
      }
    },
    [fetchHistoricalRange, yesterdayCount]
  );

  /**
   * Schedules a debounced server-side query to reconcile client state with PostgreSQL.
   */
  /**
   * Minimum interval in milliseconds between consecutive reconciliation fetches.
   * Prevents overlapping concurrent fetches from realtime events and poll ticks
   * colliding during signal recovery bursts.
   */
  const RECONCILE_THROTTLE_MS = 500;

  const scheduleReconciliation = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastReconcileAtRef.current < RECONCILE_THROTTLE_MS) {
        return;
      }
      lastReconcileAtRef.current = now;
      void fetchTodayStats();
    }, DASHBOARD_REALTIME.debounceMs);
  }, [fetchTodayStats]);

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

          setLivePatientsList((prev) => {
            const filtered = prev.filter((p) => p.id !== newPatient.id);
            const updated = [newPatient, ...filtered].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            livePatientsRef.current = updated;

            if (rangeRef.current === 'today') {
              const derived = calculateOverviewMetrics(updated);
              setPatientsList(updated);
              setStats(derived.stats);
              setDeptStats(derived.deptStats);
              setHourlyData(derived.hourlyData);
            }
            return updated;
          });
        }
      } else if (eventType === 'UPDATE') {
        const raw = payload.new as Partial<PatientRecord>;
        const targetId = Number(raw.id);

        setLivePatientsList((prev) => {
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

          livePatientsRef.current = updated;

          if (rangeRef.current === 'today') {
            const derived = calculateOverviewMetrics(updated);
            setPatientsList(updated);
            setStats(derived.stats);
            setDeptStats(derived.deptStats);
            setHourlyData(derived.hourlyData);
          }
          return updated;
        });
      } else if (eventType === 'DELETE') {
        const targetId = Number(payload.old?.id);
        if (!isNaN(targetId)) {
          setLivePatientsList((prev) => {
            const updated = prev.filter((p) => p.id !== targetId);
            if (updated.length === prev.length) return prev;
            livePatientsRef.current = updated;

            if (rangeRef.current === 'today') {
              const derived = calculateOverviewMetrics(updated);
              setPatientsList(updated);
              setStats(derived.stats);
              setDeptStats(derived.deptStats);
              setHourlyData(derived.hourlyData);
            }
            return updated;
          });
        }
      }

      scheduleReconciliation();
    },
    [scheduleReconciliation]
  );

  /**
   * Grace period in milliseconds before activating the polling fallback after
   * the channel status degrades. Prevents rapid start/stop cycling when the
   * channel flickers between SUBSCRIBED and TIMED_OUT on weak signal.
   */
  const CHANNEL_DEGRADED_GRACE_MS = 2_000;

  // Keep callback refs stable so the subscription effect does not re-run
  // when these functions change identity — that was causing channel teardown
  // loops on weak signal.
  const fetchTodayStatsRef = useRef(fetchTodayStats);
  const fetchYesterdayRef = useRef(fetchYesterday);
  const handleRealtimePayloadRef = useRef(handleRealtimePayload);

  useEffect(() => {
    fetchTodayStatsRef.current = fetchTodayStats;
    fetchYesterdayRef.current = fetchYesterday;
    handleRealtimePayloadRef.current = handleRealtimePayload;
  }, [fetchTodayStats, fetchYesterday, handleRealtimePayload]);

  // Primary Realtime subscription lifecycle with fallback polling and hysteresis
  useEffect(() => {
    let disposed = false;

    /**
     * Activates fallback periodic polling (every 30 seconds) when the WebSocket
     * channel remains degraded beyond the grace period.
     */
    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        void fetchTodayStatsRef.current();
      }, DASHBOARD_REALTIME.fallbackPollIntervalMs);
    };

    /**
     * Suspends fallback periodic polling and cancels any pending degradation
     * grace timer when the WebSocket channel is fully subscribed and healthy.
     */
    const stopPolling = () => {
      if (degradeTimerRef.current) {
        clearTimeout(degradeTimerRef.current);
        degradeTimerRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    void fetchTodayStatsRef.current();
    void fetchYesterdayRef.current();

    const channel = supabase
      .channel(DASHBOARD_REALTIME.channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          if (!disposed) {
            handleRealtimePayloadRef.current(payload as unknown as RealtimeRowChange);
          }
        }
      )
      .subscribe((rawStatus) => {
        if (disposed) return;
        const status = rawStatus as ChannelStatus;
        setChannelStatus(status);

        if (status === 'SUBSCRIBED') {
          stopPolling();
          // Reconcile immediately on resubscription to catch any events
          // missed while the channel was degraded
          void fetchTodayStatsRef.current();
        } else {
          // Channel degraded: apply hysteresis grace period before activating polling
          if (!pollRef.current && !degradeTimerRef.current) {
            degradeTimerRef.current = setTimeout(() => {
              degradeTimerRef.current = null;
              if (!disposed) {
                startPolling();
              }
            }, CHANNEL_DEGRADED_GRACE_MS);
          }
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
  // Stable dependency: setChannelStatus identity never changes (from useCallback([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setChannelStatus]);

  // Network recovery: refetch immediately when browser regains online connectivity
  useEffect(() => {
    const handleOnline = () => {
      void fetchTodayStats();
      void fetchYesterday();
      if (rangeRef.current !== 'today') {
        void fetchHistoricalRange(rangeRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchTodayStats, fetchYesterday, fetchHistoricalRange]);

  /**
   * Imperative refresh method to re-synchronize active timeframe data.
   */
  const handleRefresh = useCallback(async () => {
    if (rangeRef.current === 'today') {
      await fetchTodayStats();
      await fetchYesterday();
    } else {
      await fetchHistoricalRange(rangeRef.current);
    }
  }, [fetchTodayStats, fetchYesterday, fetchHistoricalRange]);

  return {
    stats,
    patientsList,
    livePatientsList,
    deptStats,
    hourlyData,
    yesterdayCount,
    comparisonCount,
    comparisonLabel,
    range,
    setRange,
    isRangeLoading,
    isLoading,
    isOnline,
    channelStatus,
    isFullyConnected,
    refresh: handleRefresh,
  };
}