/**
 * @fileoverview Skeletal placeholder component for the TicketStatusBreakdown widget.
 *
 * Renders a circular donut placeholder and status legend rows skeleton
 * matching TicketStatusBreakdown proportions.
 *
 * @module app/dashboard/components/skeletons/TicketBreakdownSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

const STATUS_KEYS = ['status-1', 'status-2', 'status-3', 'status-4'] as const;

/**
 * Renders the ticket status breakdown skeleton card.
 *
 * @returns JSX element containing the donut + status list skeleton.
 */
export function TicketBreakdownSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const D = DASHBOARD_SKELETON_STYLES.donutCard;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingTicketBreakdown}
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

      <div className={D.split}>
        <div className={D.circleWrapper}>
          <div className={D.circle}>
            <div className={D.circleInner} />
          </div>
        </div>

        <div className={D.list}>
          {STATUS_KEYS.map((key) => (
            <div key={key} className={D.row}>
              <div className={D.dot} />
              <div className={D.rowLabel} />
              <div className="flex-1" />
              <div className={D.count} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TicketBreakdownSkeleton;
