/**
 * @fileoverview Custom React hook managing daily drill-down queries for specific calendar dates.
 *
 * Implements client-side in-memory caching, AbortController timeouts (10s),
 * rapid date switching protection, and graceful error handling in compliance with AGENTS.md.
 *
 * @module app/dashboard/pages/analytics/hooks/useDailyDrilldown
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface DrilldownStage {
  /** Unique stage identifier (e.g., kiosk_to_registration_wait). */
  stage_key: string;
  /** Human-readable stage title. */
  stage_label: string;
  /** Mean duration elapsed in minutes. */
  avg_minutes: number;
  /** Total qualifying patients who completed or reached this stage. */
  patient_count: number;
  /** Clinical severity classification. */
  level: 'Normal' | 'Elevated' | 'Overwhelmed' | 'No Data';
  /** Plain-language explanation for this stage's performance. */
  reason: string;
}

export interface DrilldownHourlyPoint {
  /** Hour index (0-23). */
  hour: number;
  /** Patient intake during this hour. */
  avg_patients: number;
  /** Formatted time interval label (e.g. 08:00–09:00). */
  time_label: string;
  /** Average registration wait for patients arriving this hour. */
  avg_wait_registration?: number;
  /** Average registration duration for patients arriving this hour. */
  avg_service_registration?: number;
  /** Average consultation wait for patients arriving this hour. */
  avg_wait_consultation?: number;
  /** Average consultation duration for patients arriving this hour. */
  avg_service_consultation?: number;
  /** Average carryout duration for patients arriving this hour. */
  avg_service_carryout?: number;
}

export interface DrilldownSummary {
  /** Total registered patients on this date. */
  total_patients: number;
  /** Mean journey duration in minutes. */
  avg_total_time: number | null;
  /** Mean registration wait in minutes. */
  avg_wait_registration: number | null;
  /** Mean consultation wait in minutes. */
  avg_wait_consultation: number | null;
  /** Overall operational system status. */
  system_status: 'Normal' | 'Elevated' | 'Overwhelmed' | 'No Data' | string;
  /** Primary queue bottleneck stage label. */
  bottleneck_stage: string;
  /** Plain-language reason for system status. */
  system_reason?: string;
  /** Time interval with peak arrivals (e.g. 08:00–09:00). */
  peak_hour?: string | null;
}

export interface DailyDrilldownData {
  /** Selected calendar date in YYYY-MM-DD format. */
  date: string;
  /** Total patients recorded on this date. */
  total_patients: number;
  /** Hourly arrival distribution points for this date. */
  hourly_pattern: DrilldownHourlyPoint[];
  /** Queue bottleneck stage breakdown for this date. */
  bottleneck_analysis: {
    stages: DrilldownStage[];
    bottleneck_stage: string;
    system_status: string;
    system_reason?: string;
  };
  /** Summary KPI metrics for this date. */
  summary: DrilldownSummary;
}

/**
 * Manages daily drill-down state, caching, and network queries.
 *
 * @param initialDate - Optional initial date string to load.
 * @returns State and controls for daily drilldown inspection.
 */
export function useDailyDrilldown(initialDate: string | null = null) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [drilldownData, setDrilldownData] = useState<DailyDrilldownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Record<string, DailyDrilldownData>>({});
  const activeControllerRef = useRef<AbortController | null>(null);

  const fetchDrilldown = useCallback((dateStr: string) => {
    // 1. Check local cache
    if (cacheRef.current[dateStr]) {
      setDrilldownData(cacheRef.current[dateStr]);
      setLoading(false);
      setError(null);
      return;
    }

    // 2. Abort previous pending query
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10_000); // 10-second resilient timeout

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    fetch(`${baseUrl}/api/daily-drilldown?date=${encodeURIComponent(dateStr)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return res.json() as Promise<DailyDrilldownData>;
      })
      .then((json) => {
        cacheRef.current[dateStr] = json;
        setDrilldownData(json);
        setLoading(false);
        setError(null);
        activeControllerRef.current = null;
      })
      .catch((err: any) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          // Ignore cancelled requests due to date switching
          return;
        }
        setError(err.message || 'Failed to load drill-down metrics');
        setLoading(false);
        activeControllerRef.current = null;
      });
  }, []);

  const selectDate = useCallback(
    (dateStr: string | null) => {
      if (!dateStr || dateStr === selectedDate) {
        if (dateStr === selectedDate) {
          // Toggle off if clicking the already selected date
          setSelectedDate(null);
          setDrilldownData(null);
          setError(null);
          setLoading(false);
          if (activeControllerRef.current) {
            activeControllerRef.current.abort();
            activeControllerRef.current = null;
          }
          return;
        }
        setSelectedDate(null);
        setDrilldownData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setSelectedDate(dateStr);
      fetchDrilldown(dateStr);
    },
    [selectedDate, fetchDrilldown],
  );

  const clearSelectedDate = useCallback(() => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setSelectedDate(null);
    setDrilldownData(null);
    setError(null);
    setLoading(false);
  }, []);

  const retry = useCallback(() => {
    if (selectedDate) {
      fetchDrilldown(selectedDate);
    }
  }, [selectedDate, fetchDrilldown]);

  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  return {
    selectedDate,
    drilldownData,
    loading,
    error,
    selectDate,
    clearSelectedDate,
    retry,
  };
}
