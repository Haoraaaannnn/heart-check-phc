/**
 * @fileoverview Patients management and queue inspection page (/dashboard/pages/patients).
 *
 * Provides real-time and 30-day historical views of patient flows, department
 * distributions, active waiting lines, and consultation statuses.
 *
 * @module app/dashboard/pages/patients/page
 */

'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePatientsAnalyticsData } from '@/app/dashboard/pages/patients/hooks/usePatientsAnalyticsData';
import { usePatientData } from '@/app/dashboard/pages/patients/hooks/usePatientsData';
import { useHistoricalSummary } from '@/app/dashboard/context/HistoricalSummaryContext';
import { PATIENTS_STYLES, PATIENT_REFRESH_INTERVAL_MS } from '@/app/dashboard/pages/patients/constants/patients';
import PatientsHeader from '@/app/dashboard/pages/patients/components/PatientsHeader';
import ServiceFilterBar from '@/app/dashboard/pages/patients/components/ServiceFilterBar';
import PatientStatGrid from '@/app/dashboard/pages/patients/components/PatientStatGrid';
import ServiceDistributionChart from '@/app/dashboard/pages/patients/components/ServiceDistributionChart';
import HourlyPatientFlowChart from '@/app/dashboard/pages/patients/components/HourlyPatientFlowChart';
import RecentPatientsTable from '@/app/dashboard/pages/patients/components/RecentPatientTable';
import ServiceQueuePanel from '@/app/dashboard/pages/patients/components/ServiceQueuePanel';

/**
 * Inner patient content component consuming URL search parameters.
 */
function PatientsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const service = searchParams.get('service'); // null = All Services

  const { stats, setStats, hourlyData, fetchAnalyticsData } = usePatientsAnalyticsData();
  const { allRecentPatients, serviceDistribution, error, fetchPatientData } =
    usePatientData(setStats, service);
  const { historicalData } = useHistoricalSummary();

  // Hourly pattern comes from the FastAPI report and isn't per-service, so load it once
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Refetches when service filter changes and sets up recurring refresh
  useEffect(() => {
    fetchPatientData();
    const timer = setInterval(fetchPatientData, PATIENT_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchPatientData]);

  const handleSelect = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('service', next);
    else params.delete('service');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const historicalServiceMix = (historicalData?.service_distribution ?? []).map(
    (row: { service: string; total_patients: number }) => ({
      name: row.service,
      value: row.total_patients,
    })
  );

  return (
    <div className={PATIENTS_STYLES.page}>
      <PatientsHeader service={service} error={error} />

      <ServiceFilterBar selected={service} onSelect={handleSelect} />

      <PatientStatGrid stats={stats} />

      {service ? (
        <ServiceQueuePanel key={service} service={service} />
      ) : (
        <div className={PATIENTS_STYLES.chartsGrid}>
          <ServiceDistributionChart
            data={serviceDistribution}
            historicalFallback={historicalServiceMix}
          />
          <HourlyPatientFlowChart data={hourlyData} />
        </div>
      )}

      <RecentPatientsTable patients={allRecentPatients} />
    </div>
  );
}

/**
 * Root patient dashboard page wrapped in Suspense for safe client-side navigation.
 *
 * @returns JSX element.
 */
export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <PatientsContent />
    </Suspense>
  );
}
