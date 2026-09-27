/**
 * @fileoverview Custom React hook for fetching patient analytics data and hourly pattern trends.
 *
 * @module app/dashboard/pages/patients/hooks/usePatientsAnalyticsData
 */

import { useCallback, useState } from 'react';
import { PatientStats, AnalyticsData } from '@/types/Types';
import { DEFAULT_HOURLY_DATA } from '@/app/dashboard/pages/patients/constants/patients';

/**
 * Manages stats and hourly trend data derived from the FastAPI backend.
 *
 * @returns State and updater functions for summary stats and hourly patterns.
 */
export function usePatientsAnalyticsData() {
  const [stats, setStats] = useState<PatientStats>({
    totalToday: 0,
    inQueue: 0,
    inService: 0,
    servedToday: 0,
    avgWaitTime: 0,
  });
  const [hourlyData, setHourlyData] = useState<{ hour: string; patients: number }[]>(
    DEFAULT_HOURLY_DATA.map((item) => ({ ...item }))
  );

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/dashboard-data`);
      if (!response.ok) throw new Error(`Analytics API error: ${response.status}`);
      const analyticsData: AnalyticsData = await response.json();

      if (analyticsData.hourly_pattern?.length) {
        setHourlyData(
          analyticsData.hourly_pattern.map((item) => ({
            hour: item.time_label.split('–')[0],
            patients: item.avg_patients || 0,
          }))
        );
      } else {
        setHourlyData(DEFAULT_HOURLY_DATA.map((item) => ({ ...item })));
      }
    } catch (err) {
      console.warn('Analytics API not available, using fallback data:', err);
      setHourlyData(DEFAULT_HOURLY_DATA.map((item) => ({ ...item })));
    }
  }, []);

  return { stats, setStats, hourlyData, fetchAnalyticsData };
}
