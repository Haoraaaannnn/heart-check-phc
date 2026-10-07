/**
 * @fileoverview Skeletal placeholder component for the RecentActivity widget.
 *
 * Renders activity timeline item skeletons matching RecentActivity.
 *
 * @module app/dashboard/components/skeletons/RecentActivitySkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

const ACTIVITY_KEYS = ['act-1', 'act-2', 'act-3', 'act-4', 'act-5'] as const;

/**
 * Renders the recent activity stream skeleton card.
 *
 * @returns JSX element containing the activity feed skeleton.
 */
export function RecentActivitySkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const A = DASHBOARD_SKELETON_STYLES.activityCard;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingRecentActivity}
    >
      <div className={S.header}>
        <div className={S.headerLeft}>
          <div className={S.iconBadge} />
          <div className={S.headerTextGroup}>
            <div className={S.title} />
            <div className={S.subtitle} />
          </div>
        </div>
      </div>

      <div className={A.list}>
        {ACTIVITY_KEYS.map((key) => (
          <div key={key} className={A.item}>
            <div className={A.dot} />
            <div className={A.textGroup}>
              <div className={A.linePrimary} />
              <div className={A.lineSecondary} />
            </div>
            <div className={A.time} />
          </div>
        ))}
      </div>

      <div className={S.footerLink}>
        <div className={S.footerLinkBar} />
      </div>
    </div>
  );
}

export default RecentActivitySkeleton;
