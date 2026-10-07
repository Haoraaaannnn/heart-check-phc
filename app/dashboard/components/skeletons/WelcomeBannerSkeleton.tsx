/**
 * @fileoverview Skeletal placeholder component for the Admin Dashboard welcome banner.
 *
 * Replicates the visual dimensions of WelcomeBanner during initial data loading
 * and hydration, preserving solid surface integrity with zero layout shift.
 *
 * @module app/dashboard/components/skeletons/WelcomeBannerSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';

/**
 * Renders a skeletal placeholder for the Admin Dashboard welcome banner.
 *
 * @returns JSX element representing the loading welcome banner.
 */
export function WelcomeBannerSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.banner;

  return (
    <div className={S.card}>
      <div className={S.eyebrow} />
      <div className={S.title} />
      <div className={S.subtitle} />
    </div>
  );
}

export default WelcomeBannerSkeleton;
