'use client';

/**
 * @file useServiceQueue.ts
 * @description Stabilized real-time service queue data hook for the Dashboard service drill-down panel.
 *
 * Provides live waiting/serving/served counts, average and longest wait times, active room
 * identifiers, and hourly arrival trends for a single service category. Designed for
 * weak-signal resilience at the PHC.
 *
 * Implements dual-mode data synchronization:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    and triggers a debounced re-fetch. Zero polling overhead when the channel is healthy.
 * 2. Polling fallback (automatic): When the WebSocket channel drops, times out, or errors,
 *    the hook activates a 10-second polling interval so the service queue panel remains
 *    current without a live WebSocket.
 *
 * Weak-signal stabilization features (prevents queue teleporting/disappearing):
 * - Fetch sequence guard: discards stale responses that arrive after a newer fetch has started.
 * - Channel status hysteresis: delays polling activation by 2 seconds so brief channel flickers
 *   do not cause rapid poll start/stop cycles.
 * - Overlap guard: suppresses redundant concurrent fetches from realtime + poll collisions.
 *
 * @remarks
 * The service queue panel is a secondary drill-down view (not operationally critical like
 * nurse/transfer), so the polling interval is set to 10 seconds — less aggressive than the
 * 5-second cadence used by operationally critical workstations.
 *
 * @module app/dashboard/patients/hooks/useServiceQueue
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Represents a single queued patient entry in the waiting list.
 */
export interface QueuedPatient {
  /** Unique database record identifier. */
  id: number;
  /** Patient ticket number string (e.g. "C-101"). */
  ticket: string;
  /** Epoch milliseconds when the patient joined the queue. */
  joinedAtMs: number;
}

/**
 * Aggregated queue statistics for a single service category.
 */
export interface ServiceQueueStats {
  /** Number of patients currently waiting. */
  waiting: number;
  /** Number of patients currently being served / in consultation. */
  serving: number;
  /** Number of patients who have been served / completed today. */
  served: number;
  /** Average wait time in minutes across completed consultations, or null if no samples. */
  avgWaitMins: number | null;
  /** Longest current wait time in minutes among waiting patients. */
  longestWaitMins: number;
  /** List of cubicle identifiers with active consultations. */
  activeRooms: string[];
  /** Ordered list of currently waiting patients, sorted by join time ascending. */
  waitingList: QueuedPatient[];
}

/**
 * Single data point for the hourly patient arrival trend chart.
 */
export interface HourlyPoint {
  /** Hour label formatted as "HH:00" (e.g. "09:00"). */
  time: string;
  /** Count of patients who arrived during this hour. */
  patients: number;
}

/**
 * Empty baseline stats for when no service is selected.
 */
const EMPTY_STATS: ServiceQueueStats = {
  waiting: 0,
  serving: 0,
  served: 0,
  avgWaitMins: null,
  longestWaitMins: 0,
  activeRooms: [],
  waitingList: [],
};

/**
 * Empty baseline trend data for when no service is selected.
 */
const EMPTY_TREND: HourlyPoint[] = [];

/**
 * Polling interval in milliseconds for the service queue panel when the WebSocket
 * is degraded. 10 seconds: less aggressive than nurse/transfer (5s) since this
 * panel is a secondary drill-down view.
 */
const SERVICE_QUEUE_POLL_INTERVAL_MS = 10_000;

/**
 * Debounce window in milliseconds for coalescing burst realtime events into a
 * single fetch.
 */
const SERVICE_QUEUE_DEBOUNCE_MS = 300;

/**
 * Grace period in milliseconds before activating the polling fallback after
 * the channel status degrades. Prevents rapid start/stop cycling when the
 * channel flickers between SUBSCRIBED and TIMED_OUT on weak signal.
 */
const CHANNEL_DEGRADED_GRACE_MS = 2_000;

/**
 * Minimum interval in milliseconds between consecutive fetch executions.
 * Prevents overlapping concurrent fetches from realtime events and poll
 * ticks colliding during signal recovery bursts.
 */
const FETCH_THROTTLE_MS = 500;

/**
 * Provides live service queue statistics and hourly trends for a given service
 * category with dual-mode synchronization (realtime + polling fallback).
 *
 * @param service - The service category name to query (e.g. "Consultation"), or null for no data.
 * @returns An object containing `stats` and `hourlyTrend` for the selected service.
 */
export function useServiceQueue(service: string | null) {
  const [stats, setStats] = useState<ServiceQueueStats>(EMPTY_STATS);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyPoint[]>(EMPTY_TREND);

  useEffect(() => {
    if (!service) return;

    let cancelled = false;

    /** Monotonically increasing fetch sequence counter for stale response detection. */
    let fetchId = 0;

    /** Timestamp of last fetch execution start for overlap throttling. */
    let lastFetchAt = 0;

    /** Debounce timer for coalescing burst realtime events. */
    let debounce: ReturnType<typeof setTimeout>;

    /** Polling interval timer handle. */
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    /** Channel degradation grace period timer handle. */
    let degradeTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Fetches and derives all service queue metrics from Supabase.
     * Guarded by fetch sequence counter and overlap throttle.
     */
    const fetchData = async () => {
      const now = Date.now();
      if (now - lastFetchAt < FETCH_THROTTLE_MS) return;
      lastFetchAt = now;

      const myFetchId = ++fetchId;

      const currentDate = new Date();
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString();
      const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .select('id, status, created_at, consult_start, patientNum, cubicleNum')
        .ilike('service', service)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      // Discard stale responses and cancelled requests
      if (cancelled || error || !data) return;
      if (myFetchId !== fetchId) return;

      let waiting = 0;
      let serving = 0;
      let served = 0;
      let totalWaitMs = 0;
      let waitSamples = 0;

      const rooms = new Set<string>();
      const waitList: QueuedPatient[] = [];

      const hourCounts: Record<string, number> = {};
      for (let h = 7; h <= 17; h++) {
        hourCounts[`${h.toString().padStart(2, '0')}:00`] = 0;
      }

      data.forEach((p) => {
        const status = p.status ? p.status.toLowerCase().trim() : '';
        const joinedAtMs = new Date(p.created_at).getTime();

        if (['pending', 'waiting'].includes(status)) {
          waiting++;
          if (p.patientNum) {
            waitList.push({ id: p.id, ticket: p.patientNum, joinedAtMs });
          }
        } else if (['on progress', 'serving', 'consulting'].includes(status)) {
          serving++;
          if (p.cubicleNum) rooms.add(p.cubicleNum);
        } else if (['completed', 'done', 'served'].includes(status)) {
          served++;
          if (p.consult_start) {
            const diff = new Date(p.consult_start).getTime() - joinedAtMs;
            if (diff > 0) {
              totalWaitMs += diff;
              waitSamples++;
            }
          }
        }

        const hour = new Date(p.created_at).getHours();
        const label = `${hour.toString().padStart(2, '0')}:00`;
        hourCounts[label] = (hourCounts[label] ?? 0) + 1;
      });

      waitList.sort((a, b) => a.joinedAtMs - b.joinedAtMs);

      const longestWaitMins =
        waitList.length > 0
          ? Math.floor((Date.now() - waitList[0].joinedAtMs) / 60000)
          : 0;

      setStats({
        waiting,
        serving,
        served,
        avgWaitMins: waitSamples > 0 ? Math.round(totalWaitMs / waitSamples / 60000) : null,
        longestWaitMins,
        activeRooms: Array.from(rooms),
        waitingList: waitList,
      });

      setHourlyTrend(
        Object.keys(hourCounts)
          .sort()
          .map((time) => ({ time, patients: hourCounts[time] }))
      );
    };

    /**
     * Debounced event handler. Coalesces burst realtime events (e.g. from
     * reconnect replay or seeder) into a single fetch.
     */
    const scheduleFetch = () => {
      clearTimeout(debounce);
      debounce = setTimeout(fetchData, SERVICE_QUEUE_DEBOUNCE_MS);
    };

    /**
     * Activates the polling fallback if not already running.
     */
    const startPolling = () => {
      if (pollInterval) return;
      fetchData();
      pollInterval = setInterval(fetchData, SERVICE_QUEUE_POLL_INTERVAL_MS);
    };

    /**
     * Deactivates the polling fallback and cancels any pending degradation
     * grace timer.
     */
    const stopPolling = () => {
      if (degradeTimer) {
        clearTimeout(degradeTimer);
        degradeTimer = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Initial data load
    fetchData();

    const channel = supabase
      .channel(`service-queue-${service}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, scheduleFetch)
      .subscribe((rawStatus) => {
        if (cancelled) return;

        if (rawStatus === 'SUBSCRIBED') {
          stopPolling();
          // Reconcile on resubscription to catch missed events
          fetchData();
        } else {
          // Channel degraded: apply hysteresis grace period before activating polling
          if (!pollInterval && !degradeTimer) {
            degradeTimer = setTimeout(() => {
              degradeTimer = null;
              if (!cancelled) {
                startPolling();
              }
            }, CHANNEL_DEGRADED_GRACE_MS);
          }
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      stopPolling();
      supabase.removeChannel(channel);
    };
  }, [service]);

  // Derived instead of reset inside the effect
  return {
    stats: service ? stats : EMPTY_STATS,
    hourlyTrend: service ? hourlyTrend : EMPTY_TREND,
  };
}