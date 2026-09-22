'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePatientsAnalyticsData } from '@/app/dashboard/patients/hooks/usePatientsAnalyticsData';
import { usePatientData } from '@/app/dashboard/patients/hooks/usePatientsData';
import { useHistoricalSummary } from '@/app/dashboard/context/HistoricalSummaryContext';
import PatientStatsGrid from '@/app/dashboard/patients/components/PatientStatGrid';
import ServiceDistributionChart from '@/app/dashboard/patients/components/ServiceDistributionChart';
import HourlyPatientFlowChart from '@/app/dashboard/patients/components/HourlyPatientFlowChart';
import RecentPatientsTable from '@/app/dashboard/patients/components/RecentPatientTable';
import ServiceFilterBar from '@/app/dashboard/patients/components/ServiceFilterBar';
import ServiceQueuePanel from '@/app/dashboard/patients/components/ServiceQueuePanel';

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

  // fetchPatientData is recreated whenever `service` changes, so switching chips
  // reloads the data and restarts the 30s refresh with the new filter
  useEffect(() => {
    fetchPatientData();
    const timer = setInterval(fetchPatientData, 30000);
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
    <div className="min-h-screen">
      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {service ?? 'Patient Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {service
              ? `Live queue and statistics for ${service}`
              : 'Patient statistics and queue management overview'}
          </p>
          {error && <p className="text-sm text-red-600 mt-2">⚠️ {error}</p>}
        </div>

        <ServiceFilterBar selected={service} onSelect={handleSelect} />

        <PatientStatsGrid stats={stats} />

        {service ? (
          <ServiceQueuePanel key={service} service={service} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServiceDistributionChart
              data={serviceDistribution}
              historicalFallback={historicalServiceMix}
            />
            <HourlyPatientFlowChart data={hourlyData} />
          </div>
        )}

        <RecentPatientsTable patients={allRecentPatients} />
      </div>
    </div>
  );
}

// Suspense is required: useSearchParams() fails `next build` without it in a client page
export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <PatientsContent />
    </Suspense>
  );
}