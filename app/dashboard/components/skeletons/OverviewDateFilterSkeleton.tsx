/**
 * @fileoverview Skeletal placeholder component for the Admin Dashboard date filter bar.
 *
 * Displays a non-interactive placeholder row mirroring OverviewDateFilter during initial load.
 *
 * @module app/dashboard/components/skeletons/OverviewDateFilterSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';

/**
 * Renders a skeletal placeholder for the timeframe filter bar.
 *
 * @returns JSX element representing the loading filter bar.
 */
export function OverviewDateFilterSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.dateFilter;

  return (
    <div className={S.root}>
      <div className={S.group}>
        <div className={S.label} />
        <div className={S.pill} />
        <div className={S.pill} />
        <div className={S.pill} />
        <div className={S.pill} />
      </div>
      <div className={S.badge} />
    </div>
  );
}

export default OverviewDateFilterSkeleton;
