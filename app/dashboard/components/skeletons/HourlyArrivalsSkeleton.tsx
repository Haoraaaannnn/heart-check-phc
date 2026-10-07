/**
 * @fileoverview Skeletal placeholder component for the HourlyArrivalsChart widget.
 *
 * Renders vertical bar skeletons of varying heights representing hourly distribution.
 *
 * @module app/dashboard/components/skeletons/HourlyArrivalsSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

/** Array of varying bar heights simulating hourly patient volume */
const BARS = [
  { key: 'h-07', height: 'h-10' },
  { key: 'h-08', height: 'h-24' },
  { key: 'h-09', height: 'h-36' },
  { key: 'h-10', height: 'h-32' },
  { key: 'h-11', height: 'h-28' },
  { key: 'h-12', height: 'h-16' },
  { key: 'h-13', height: 'h-20' },
  { key: 'h-14', height: 'h-32' },
  { key: 'h-15', height: 'h-24' },
  { key: 'h-16', height: 'h-16' },
  { key: 'h-17', height: 'h-8' },
] as const;

/**
 * Renders the hourly patient arrivals bar chart skeleton card.
 *
 * @returns JSX element containing the bar chart skeleton.
 */
export function HourlyArrivalsSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const C = DASHBOARD_SKELETON_STYLES.chartCard;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingHourlyChart}
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

      <div className={C.chartArea}>
        {BARS.map((bar) => (
          <div key={bar.key} className={C.barWrapper}>
            <div className={`${C.bar} ${bar.height}`} />
          </div>
        ))}
      </div>

      <div className={C.xAxisRow}>
        {BARS.map((bar) => (
          <div key={bar.key} className={C.axisLabel} />
        ))}
      </div>
    </div>
  );
}

export default HourlyArrivalsSkeleton;
