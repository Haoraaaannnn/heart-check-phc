'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOverviewData } from '@/app/dashboard/hooks/useOverviewData';
import { useHistoricalSummary } from '@/app/dashboard/context/HistoricalSummaryContext';
import { useIdleTimeout } from '@/app/dashboard/hooks/useIdleTimeout';
import { useMountedClock } from '@/app/dashboard/hooks/useMountedClock';
import { calcAvgWaitTime } from '@/utils/waitTime';
import WelcomeBanner from '@/app/dashboard/components/WelcomeBanner';
import DashboardMetrics from '@/app/dashboard/components/DashboardMetrics';
import HistoricalContextBanner from '@/app/dashboard/components/HistoricalContextBanner';
import ServiceQueueOverview from '@/app/dashboard/components/ServiceQueueOverview';
import TicketStatusBreakdown from '@/app/dashboard/components/TicketStatusBreakdown';
import QuickLinks from '@/app/dashboard/components/QuickLinks';
import LiveQueueTable from '@/app/dashboard/components/LiveQueueTable';
import HourlyArrivalsChart from '@/app/dashboard/components/HourlyArrivalChart';
import RecentActivity from '@/app/dashboard/components/RecentActivity';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Admin dashboard overview (/dashboard).
 *
 * Read-only: this page only displays queue/patient data - admins here are not
 * superadmin, so no ticket actions live on this page (see QuickLinks, which
 * only navigates elsewhere).
 *
 * Layout: welcome banner + metrics + (service overview | ticket breakdown) +
 * quick links in the main column; live queue, hourly chart and recent
 * activity in the right rail. Falls back to HistoricalContextBanner when
 * there's no activity today.
 */
export default function DashboardPage() {
  useIdleTimeout();
  const router = useRouter();
  const { isMounted, currentTime } = useMountedClock();

  const { stats, patientsList, deptStats, hourlyData, yesterdayCount } = useOverviewData();
  const { historicalData, historicalLoading } = useHistoricalSummary();

  // Session guard only - mount flag and clock now live in useMountedClock.
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();
  }, [router]);

  const avgWaitTime =
    isMounted && currentTime ? calcAvgWaitTime(patientsList, currentTime) : '--';
  const showHistoricalBanner = isMounted && stats.todayCount === 0;

  return (
    <div className={DASH.layout.page}>
      <WelcomeBanner currentTime={currentTime} isMounted={isMounted} />

      <DashboardMetrics
        stats={stats}
        avgWaitTime={avgWaitTime}
        yesterdayCount={yesterdayCount}
        isMounted={isMounted}
      />

      {showHistoricalBanner && (
        <HistoricalContextBanner
          historicalData={historicalData}
          historicalLoading={historicalLoading}
        />
      )}

      <div className={DASH.layout.grid}>
        {/* Main column */}
        <div className={DASH.layout.column}>
          <div className={DASH.layout.twoUp}>
            <ServiceQueueOverview deptStats={deptStats} isMounted={isMounted} />
            <TicketStatusBreakdown stats={stats} isMounted={isMounted} />
          </div>
          <QuickLinks />
        </div>

        {/* Right rail */}
        <div className={DASH.layout.column}>
          <LiveQueueTable
            patients={patientsList}
            currentTime={currentTime ?? new Date()}
            isMounted={isMounted}
          />
          <HourlyArrivalsChart hourlyData={hourlyData} isMounted={isMounted} />
          <RecentActivity patients={patientsList} isMounted={isMounted} />
        </div>
      </div>
    </div>
  );
}