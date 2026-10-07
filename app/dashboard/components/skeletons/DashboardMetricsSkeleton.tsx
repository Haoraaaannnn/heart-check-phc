/**
 * @fileoverview Skeletal placeholder component for the Admin Dashboard 4-card metric row.
 *
 * Renders four executive KPI card skeletons matching DashboardMetrics proportions.
 *
 * @module app/dashboard/components/skeletons/DashboardMetricsSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

/** Keys for mapping 4 distinct skeleton cards */
const SKELETON_METRIC_KEYS = ['metric-1', 'metric-2', 'metric-3', 'metric-4'] as const;

/**
 * Renders four skeletal KPI cards matching the DashboardMetrics grid layout.
 *
 * @returns JSX element containing the 4-card skeleton grid.
 */
export function DashboardMetricsSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.metrics;

  return (
    <div
      className={S.grid}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingMetrics}
    >
      {SKELETON_METRIC_KEYS.map((key) => (
        <div key={key} className={S.card}>
          <div className={S.icon} />
          <div className={S.content}>
            <div className={S.label} />
            <div className={S.value} />
            <div className={S.subtitle} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardMetricsSkeleton;
