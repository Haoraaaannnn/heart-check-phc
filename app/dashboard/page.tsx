'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { useOverviewData } from '@/hooks/dashboard/useOverviewData';
import { calcAvgWaitTime } from '@/utils/waitTime';
import DashboardMetrics from '@/components/dashboard/overview/DashboardMetrics';
import LiveQueueTable from '@/components/dashboard/overview/LiveQueueTable';
import ServiceStats from '@/components/dashboard/overview/ServiceStats';
import HourlyArrivalsChart from '@/components/dashboard/overview/HourlyArrivalChart';

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const { stats, patientsList, deptStats, hourlyData } = useOverviewData();

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();

    // Ticks every minute to keep wait times dynamic
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  const avgWaitTime =
    isMounted && currentTime ? calcAvgWaitTime(patientsList, currentTime) : '--';

  return (
    <div className="min-h-screen w-full">
      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">

        <DashboardMetrics
          stats={stats}
          avgWaitTime={avgWaitTime}
          isMounted={isMounted}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LiveQueueTable
            patients={patientsList}
            currentTime={currentTime ?? new Date()}
            isMounted={isMounted}
          />
          <ServiceStats
            deptStats={deptStats}
            stats={stats}
            isMounted={isMounted}
          />
        </div>

        <HourlyArrivalsChart
          hourlyData={hourlyData}
          isMounted={isMounted}
        />

      </div>
    </div>
  );
}