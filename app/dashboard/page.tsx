/**
 * @fileoverview Admin Dashboard Overview Page (/dashboard).
 *
 * Implements an executive monitoring surface featuring:
 * 1. Timeframe filtering across Today, Yesterday, Last 7 Days, and Month-to-Date via {@link OverviewDateFilter}.
 * 2. Executive KPI summary cards with period-aware labels and percentage change trends via {@link DashboardMetrics}.
 * 3. Zero-latency Supabase Realtime streaming with fallback polling via {@link useOverviewData}.
 * 4. Continuous live streaming queue monitoring via {@link LiveQueueTable} and {@link RecentActivity}.
 * 5. Department distribution and ticket status breakdowns via {@link ServiceQueueOverview} and {@link TicketStatusBreakdown}.
 * 6. Redesigned historical performance breakdown and archive baseline via {@link HistoricalContextBanner}.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise navigation and solid surfaces standards:
 * pure assembly and rendering, strict separation of concerns, and zero emojis.
 *
 * @module app/dashboard/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOverviewData } from '@/app/dashboard/hooks/useOverviewData';
import { useHistoricalSummary } from '@/app/dashboard/context/HistoricalSummaryContext';
import { useIdleTimeout } from '@/app/dashboard/hooks/useIdleTimeout';
import { useMountedClock } from '@/app/dashboard/hooks/useMountedClock';
import { calcAvgWaitTime } from '@/utils/waitTime';
import { ConnectionStatusBanner } from '@/components/reusables/ConnectionStatusBanner';
import WelcomeBanner from '@/app/dashboard/components/WelcomeBanner';
import OverviewDateFilter from '@/app/dashboard/components/OverviewDateFilter';
import DashboardMetrics from '@/app/dashboard/components/DashboardMetrics';
import HistoricalContextBanner from '@/app/dashboard/components/HistoricalContextBanner';
import HistoricalContextTrigger from '@/app/dashboard/components/HistoricalContextTrigger';
import ServiceQueueOverview from '@/app/dashboard/components/ServiceQueueOverview';
import TicketStatusBreakdown from '@/app/dashboard/components/TicketStatusBreakdown';
import QuickLinks from '@/app/dashboard/components/QuickLinks';
import LiveQueueTable from '@/app/dashboard/components/LiveQueueTable';
import HourlyArrivalsChart from '@/app/dashboard/components/HourlyArrivalChart';
import RecentActivity from '@/app/dashboard/components/RecentActivity';
import DashboardOverviewSkeleton from '@/app/dashboard/components/DashboardOverviewSkeleton';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Admin dashboard overview canonical page component.
 *
 * @returns Rendered JSX element.
 */
export default function DashboardPage() {
  useIdleTimeout();
  const router = useRouter();
  const { isMounted, currentTime } = useMountedClock();
  const [isHistoricalExpanded, setIsHistoricalExpanded] = useState<boolean>(false);

  const {
    stats,
    patientsList,
    livePatientsList,
    deptStats,
    hourlyData,
    yesterdayCount,
    comparisonCount,
    comparisonLabel,
    range,
    setRange,
    isRangeLoading,
    isLoading,
    isOnline,
    channelStatus,
    isFullyConnected,
  } = useOverviewData();
  const { historicalData, historicalLoading } = useHistoricalSummary();

  // Session guard: redirect unauthenticated sessions to login
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();
  }, [router]);

  // Initial load skeletal fallback
  if (isLoading || !isMounted) {
    return <DashboardOverviewSkeleton />;
  }

  const avgWaitTime =
    currentTime ? calcAvgWaitTime(patientsList, currentTime) : '--';
  const isTodayIdle = stats.todayCount === 0 && range === 'today';
  const shouldRenderHistorical = isTodayIdle || isHistoricalExpanded;

  return (
    <div className={DASH.layout.page}>
      <ConnectionStatusBanner
        isOnline={isOnline}
        channelStatus={channelStatus}
        isFullyConnected={isFullyConnected}
        showIcon={false}
      />

      <WelcomeBanner currentTime={currentTime} isMounted={isMounted} />

      <OverviewDateFilter
        selectedRange={range}
        onRangeChange={setRange}
        isLoading={isRangeLoading}
        isMounted={isMounted}
      />

      <DashboardMetrics
        stats={stats}
        avgWaitTime={avgWaitTime}
        comparisonCount={comparisonCount}
        yesterdayCount={yesterdayCount}
        comparisonLabel={comparisonLabel}
        range={range}
        isMounted={isMounted}
        isLoading={isRangeLoading}
      />

      {/* Historical Performance Breakdown & Archive Intelligence */}
      {shouldRenderHistorical ? (
        <HistoricalContextBanner
          historicalData={historicalData}
          historicalLoading={historicalLoading}
          isTodayEmpty={isTodayIdle}
          onClose={isTodayIdle ? undefined : () => setIsHistoricalExpanded(false)}
        />
      ) : (
        <HistoricalContextTrigger onOpen={() => setIsHistoricalExpanded(true)} />
      )}

      <div className={DASH.layout.grid}>
        {/* Main column */}
        <div className={DASH.layout.column}>
          <div className={DASH.layout.twoUp}>
            <ServiceQueueOverview
              deptStats={deptStats}
              isMounted={isMounted}
              isLoading={isRangeLoading}
            />
            <TicketStatusBreakdown
              stats={stats}
              isMounted={isMounted}
              isLoading={isRangeLoading}
            />
          </div>
          <QuickLinks />
        </div>

        {/* Right rail */}
        <div className={DASH.layout.column}>
          <LiveQueueTable
            patients={livePatientsList}
            currentTime={currentTime ?? new Date()}
            isMounted={isMounted}
          />
          <HourlyArrivalsChart hourlyData={hourlyData} isMounted={isMounted} />
          <RecentActivity patients={livePatientsList} isMounted={isMounted} />
        </div>
      </div>
    </div>
  );
}