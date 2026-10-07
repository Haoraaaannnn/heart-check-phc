/**
 * @fileoverview Skeletal placeholder component for the ServiceQueueOverview widget.
 *
 * Renders a circular donut placeholder and horizontal progress bar skeletons
 * replicating department distribution while data queries are in-flight.
 *
 * @module app/dashboard/components/skeletons/ServiceQueueSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

const ROW_KEYS = ['dept-1', 'dept-2', 'dept-3', 'dept-4'] as const;

/**
 * Renders the service queue distribution skeleton card.
 *
 * @returns JSX element containing the donut + progress rows skeleton.
 */
export function ServiceQueueSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const D = DASHBOARD_SKELETON_STYLES.donutCard;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingServiceQueue}
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
          {ROW_KEYS.map((key) => (
            <div key={key} className={D.row}>
              <div className={D.dot} />
              <div className={D.rowLabel} />
              <div className={D.barTrack} />
              <div className={D.count} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServiceQueueSkeleton;
