'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface QueuedPatient {
  id: number;
  ticket: string;
  joinedAtMs: number;
}

export interface ServiceQueueStats {
  waiting: number;
  serving: number;
  served: number;
  avgWaitMins: number | null;
  longestWaitMins: number;
  activeRooms: string[];
  waitingList: QueuedPatient[];
}

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

    // Debounced so a burst of realtime events (e.g. the seeder) causes one refetch
    const scheduleFetch = () => {
      clearTimeout(debounce);
      debounce = setTimeout(fetchData, 300);
    };

    fetchData();

    const channel = supabase
      .channel(`service-queue-${service}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, scheduleFetch)
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [service]);

  // Derived instead of reset inside the effect
  return {
    stats: service ? stats : EMPTY_STATS,
    hourlyTrend: service ? hourlyTrend : EMPTY_TREND,
  };
}