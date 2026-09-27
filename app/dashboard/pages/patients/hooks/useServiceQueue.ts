/**
 * @fileoverview Custom React hook for live real-time queue subscriptions and statistics
 * per medical service.
 *
 * @module app/dashboard/pages/patients/hooks/useServiceQueue
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Represents a waiting patient ticket in the live queue. */
export interface QueuedPatient {
  id: number;
  ticket: string;
  joinedAtMs: number;
}

/** Aggregate queue statistics for a specific service. */
export interface ServiceQueueStats {
  waiting: number;
  serving: number;
  served: number;
  avgWaitMins: number | null;
  longestWaitMins: number;
  activeRooms: string[];
  waitingList: QueuedPatient[];
}

/** Single data point on an hourly intake curve. */
export interface HourlyPoint {
  time: string;
  patients: number;
}

const EMPTY_STATS: ServiceQueueStats = {
  waiting: 0,
  serving: 0,
  served: 0,
  avgWaitMins: null,
  longestWaitMins: 0,
  activeRooms: [],
  waitingList: [],
};

const EMPTY_TREND: HourlyPoint[] = [];

/**
 * Subscribes to real-time database changes for patients belonging to `service`.
 * Calculates active rooms, average and maximum wait duration, and hourly trends.
 *
 * @param service - Name of the medical service (e.g. 'Consultation') or null.
 * @returns Object with calculated stats and hourly intake trend.
 */
export function useServiceQueue(service: string | null) {
  const [stats, setStats] = useState<ServiceQueueStats>(EMPTY_STATS);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyPoint[]>(EMPTY_TREND);

  useEffect(() => {
    if (!service) return;

    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .select('id, status, created_at, consult_start, patientNum, cubicleNum')
        .ilike('service', service)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (cancelled || error || !data) return;

      let waiting = 0;
      let serving = 0;
      let served = 0;
      let totalWaitMs = 0;
      let waitSamples = 0;

      const rooms = new Set<string>();
      const waitList: QueuedPatient[] = [];
      const hourlyCounts: Record<number, number> = {};

      const nowMs = Date.now();

      for (const p of data) {
        const status = (p.status || '').toLowerCase();
        const createdMs = p.created_at ? new Date(p.created_at).getTime() : nowMs;

        const hour = new Date(createdMs).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;

        if (p.cubicleNum && (status === 'serving' || status === 'in service' || status === 'on progress')) {
          rooms.add(p.cubicleNum);
        }

        if (status === 'serving' || status === 'in service' || status === 'on progress') {
          serving++;
          if (p.consult_start) {
            totalWaitMs += new Date(p.consult_start).getTime() - createdMs;
            waitSamples++;
          }
        } else if (status === 'completed' || status === 'done' || status === 'served') {
          served++;
          if (p.consult_start) {
            totalWaitMs += new Date(p.consult_start).getTime() - createdMs;
            waitSamples++;
          }
        } else if (['waiting', 'in queue', 'pending', 'assigned'].includes(status)) {
          waiting++;
          waitList.push({
            id: p.id,
            ticket: p.patientNum || `#${p.id}`,
            joinedAtMs: createdMs,
          });
        }
      }

      waitList.sort((a, b) => a.joinedAtMs - b.joinedAtMs);

      const longestWaitMins =
        waitList.length > 0
          ? Math.max(0, Math.floor((nowMs - waitList[0].joinedAtMs) / 60000))
          : 0;

      const avgWaitMins =
        waitSamples > 0 ? Math.round(totalWaitMs / waitSamples / 60000) : null;

      const trend: HourlyPoint[] = [];
      for (let h = 8; h <= 17; h++) {
        trend.push({
          time: `${String(h).padStart(2, '0')}:00`,
          patients: hourlyCounts[h] || 0,
        });
      }

      if (!cancelled) {
        setStats({
          waiting,
          serving,
          served,
          avgWaitMins,
          longestWaitMins,
          activeRooms: Array.from(rooms).sort(),
          waitingList: waitList,
        });
        setHourlyTrend(trend);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`service-queue-${service}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
        },
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(fetchData, 800);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [service]);

  return { stats, hourlyTrend };
}
