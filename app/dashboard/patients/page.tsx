'use client';

import { useEffect } from 'react';
import { usePatientsAnalyticsData } from '@/hooks/dashboard/usePatientsAnalyticsData';
import { usePatientData } from '@/hooks/dashboard/usePatientsData';
import PatientStatsGrid from '@/components/dashboard/patients/PatientStatGrid';
import ServiceDistributionChart from '@/components/dashboard/patients/ServiceDistributionChart';
import HourlyPatientFlowChart from '@/components/dashboard/patients/HourlyPatientFlowChart';
import RecentPatientsTable from '@/components/dashboard/patients/RecentPatientTable';

export default function PatientsPage() {
  const { stats, setStats, hourlyData, fetchAnalyticsData } = usePatientsAnalyticsData();
  const { allRecentPatients, serviceDistribution, error, fetchPatientData } =
    usePatientData(setStats);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAnalyticsData(), fetchPatientData()]);
    };
    loadData();
    const timer = setInterval(fetchPatientData, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Patient Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Patient statistics and queue management overview</p>
          {error && <p className="text-sm text-red-600 mt-2">⚠️ {error}</p>}
        </div>

        <PatientStatsGrid stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceDistributionChart data={serviceDistribution} />
          <HourlyPatientFlowChart data={hourlyData} />
        </div>

        <RecentPatientsTable patients={allRecentPatients} />
      </div>
    </div>
  );
}