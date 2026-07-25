import { useState } from 'react';
import { PatientStats, AnalyticsData } from '@/types/Types';
import { DEFAULT_HOURLY_DATA } from '@/app/dashboard/patients/constants/patients';

export function usePatientsAnalyticsData() {
  const [stats, setStats] = useState<PatientStats>({
    totalToday: 0,
    inQueue: 0,
    inService: 0,
    servedToday: 0,
    avgWaitTime: 0,
  });
  const [hourlyData, setHourlyData] = useState(DEFAULT_HOURLY_DATA);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/dashboard-data');
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
        setHourlyData(DEFAULT_HOURLY_DATA);
      }
    } catch (err) {
      console.warn('Analytics API not available, using fallback data:', err);
      setHourlyData(DEFAULT_HOURLY_DATA);
    }
  };

  return { stats, setStats, hourlyData, fetchAnalyticsData };
}