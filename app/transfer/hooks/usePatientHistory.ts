/**
 * @fileoverview Hook for discovering and monitoring today's full patient journey history.
 *
 * Queries all patient records registered for today (regardless of whether active, in cubicle,
 * idle, or completed), enriches each record with calculated stage progression, and maintains
 * real-time synchronization via Supabase Realtime channel.
 *
 * Adheres strictly to AGENTS.md:
 * - Deterministic pure core logic separated from side-effects
 * - Strict type-safety, zero any, guard clauses, and maximum 3 nesting levels
 * - Zero emojis in logs, labels, or comments
 *
 * @module app/transfer/hooks/usePatientHistory
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { EnrichedHistoryPatient, getPatientStage, PatientJourneyStage } from '@/app/transfer/types/history';
import { formatManilaTime } from '@/utils/formatDateTime';

export type HistoryStageFilter = 'all' | PatientJourneyStage;

export interface HistoryCounts {
  total: number;
  done: number;
  inService: number;
  queued: number;
  registration: number;
  idle: number;
}

export interface UsePatientHistoryReturn {
  patients: EnrichedHistoryPatient[];
  filteredPatients: EnrichedHistoryPatient[];
  counts: HistoryCounts;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  stageFilter: HistoryStageFilter;
  setStageFilter: (filter: HistoryStageFilter) => void;
  refresh: () => Promise<void>;
}

/**
 * Returns today's UTC boundaries for PostgreSQL filtering.
 */
function getTodayDateRange(): { startIso: string; endIso: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/**
 * Calculates elapsed duration in minutes from creation timestamp to completion or current time.
 */
function calculateElapsedMinutes(patient: Patient): number {
  const startMs = patient.created_at ? new Date(patient.created_at).getTime() : Date.now();
  const endTimestamp = patient.consult_end || patient.carryout_end;
  const endMs = endTimestamp ? new Date(endTimestamp).getTime() : Date.now();
  const diffMs = Math.max(0, endMs - startMs);
  return Math.round(diffMs / 60_000);
}

/**
 * Hook providing live patient journey history and stage metrics for today.
 */
export function usePatientHistory(): UsePatientHistoryReturn {
  const [rawPatients, setRawPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<HistoryStageFilter>('all');
  const mountedRef = useRef<boolean>(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { startIso, endIso } = getTodayDateRange();

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_historical', false)
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return;
      }

      if (mountedRef.current) {
        setRawPatients(data as Patient[]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchHistory();

    const channel = supabase
      .channel('transfer-patient-history-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          void fetchHistory();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [fetchHistory]);

  const enrichedPatients = useMemo<EnrichedHistoryPatient[]>(() => {
    return rawPatients.map((p) => {
      const stageInfo = getPatientStage(p);
      const registeredTimeFormatted = p.created_at
        ? formatManilaTime(new Date(p.created_at))
        : '--:--';
      const elapsedWaitMinutes = calculateElapsedMinutes(p);

      return {
        patient: p,
        stageInfo,
        registeredTimeFormatted,
        elapsedWaitMinutes,
      };
    });
  }, [rawPatients]);

  const counts = useMemo<HistoryCounts>(() => {
    const res: HistoryCounts = {
      total: enrichedPatients.length,
      done: 0,
      inService: 0,
      queued: 0,
      registration: 0,
      idle: 0,
    };

    for (const item of enrichedPatients) {
      const s = item.stageInfo.stage;
      if (s === 'done') res.done += 1;
      else if (s === 'in_service') res.inService += 1;
      else if (s === 'queued') res.queued += 1;
      else if (s === 'registration') res.registration += 1;
      else if (s === 'idle') res.idle += 1;
    }

    return res;
  }, [enrichedPatients]);

  const filteredPatients = useMemo<EnrichedHistoryPatient[]>(() => {
    const query = searchTerm.trim().toLowerCase();

    return enrichedPatients.filter((item) => {
      // Stage filter
      if (stageFilter !== 'all' && item.stageInfo.stage !== stageFilter) {
        return false;
      }

      // Search term filter
      if (query.length > 0) {
        const numMatch = item.patient.patientNum.toLowerCase().includes(query);
        const svcMatch = item.patient.service?.toLowerCase().includes(query) ?? false;
        const subMatch = item.patient.subcategory?.toLowerCase().includes(query) ?? false;
        const locMatch = item.stageInfo.currentLocation?.toLowerCase().includes(query) ?? false;
        return numMatch || svcMatch || subMatch || locMatch;
      }

      return true;
    });
  }, [enrichedPatients, searchTerm, stageFilter]);

  return {
    patients: enrichedPatients,
    filteredPatients,
    counts,
    loading,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    refresh: fetchHistory,
  };
}

export default usePatientHistory;
