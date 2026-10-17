/**
 * @fileoverview Complete page-level skeletal loader for the Admin Dashboard Overview.
 *
 * Assembles modular widget skeletons into the canonical 1680px two-column dashboard layout.
 * Used during route-level transitions (via loading.tsx) and initial Supabase data hydration,
 * preventing flash of unstyled metrics (FOUM) and eliminating layout shift.
 *
 * @remarks
 * Conforms strictly to AGENTS.md standards:
 * - High-contrast solid surfaces (bg-surface, bg-surface-muted, border-line).
 * - Full dual-theme compatibility.
 * - Comprehensive JSDoc documentation.
 * - Zero hardcoded text copy and zero emojis.
 *
 * @module app/dashboard/components/DashboardOverviewSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';
import { WelcomeBannerSkeleton } from '@/app/dashboard/components/skeletons/WelcomeBannerSkeleton';
import { OverviewDateFilterSkeleton } from '@/app/dashboard/components/skeletons/OverviewDateFilterSkeleton';
import { DashboardMetricsSkeleton } from '@/app/dashboard/components/skeletons/DashboardMetricsSkeleton';
import { ServiceQueueSkeleton } from '@/app/dashboard/components/skeletons/ServiceQueueSkeleton';
import { TicketBreakdownSkeleton } from '@/app/dashboard/components/skeletons/TicketBreakdownSkeleton';
import { QuickLinksSkeleton } from '@/app/dashboard/components/skeletons/QuickLinksSkeleton';
import { LiveQueueTableSkeleton } from '@/app/dashboard/components/skeletons/LiveQueueTableSkeleton';
import { HourlyArrivalsSkeleton } from '@/app/dashboard/components/skeletons/HourlyArrivalsSkeleton';
import { RecentActivitySkeleton } from '@/app/dashboard/components/skeletons/RecentActivitySkeleton';

/**
 * Renders the full-page skeletal loading surface for the Admin Dashboard overview.
 *
 * @returns JSX element containing the complete page skeleton.
 */
export function DashboardOverviewSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingDashboard}
    >
      {/* 1. Welcome Banner Skeleton */}
      <WelcomeBannerSkeleton />

      {/* 2. Date Filter Bar Skeleton */}
      <OverviewDateFilterSkeleton />

      {/* 3. Executive KPI Metric Cards Skeleton */}
      <DashboardMetricsSkeleton />

      {/* 4. Historical Intelligence Trigger Skeleton */}
      <div className={S.historical.card}>
        <div className={S.historical.text} />
        <div className={S.historical.badge} />
      </div>

      {/* 5. Main 2-Column Dashboard Grid */}
      <div className={S.layout.grid}>
        {/* Left Column: Department stats, ticket breakdown, quick actions */}
        <div className={S.layout.column}>
          <div className={S.layout.twoUp}>
            <ServiceQueueSkeleton />
            <TicketBreakdownSkeleton />
          </div>
          <QuickLinksSkeleton />
        </div>

        {/* Right Rail: Live queue table, arrivals chart, recent activity */}
        <div className={S.layout.column}>
          <LiveQueueTableSkeleton />
          <HourlyArrivalsSkeleton />
          <RecentActivitySkeleton />
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewSkeleton;
