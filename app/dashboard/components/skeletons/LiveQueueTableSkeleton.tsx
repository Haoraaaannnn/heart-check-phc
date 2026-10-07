/**
 * @fileoverview Skeletal placeholder component for the LiveQueueTable widget.
 *
 * Renders table header columns and row placeholders mirroring LiveQueueTable during initial load.
 *
 * @module app/dashboard/components/skeletons/LiveQueueTableSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

const SKELETON_ROWS = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'] as const;

/**
 * Renders the live queue table skeleton card.
 *
 * @returns JSX element containing the table skeleton.
 */
export function LiveQueueTableSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const T = DASHBOARD_SKELETON_STYLES.tableCard;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingLiveQueue}
    >
      <div className={S.header}>
        <div className={S.headerLeft}>
          <div className={S.iconBadge} />
          <div className={S.headerTextGroup}>
            <div className={S.title} />
            <div className={S.subtitle} />
          </div>
        </div>
        <div className={S.headerAction} />
      </div>

      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.headRow}>
              <th className={T.th}><div className={`${T.thBar} w-14`} /></th>
              <th className={T.th}><div className={`${T.thBar} w-20`} /></th>
              <th className={T.th}><div className={`${T.thBar} w-16`} /></th>
              <th className={T.th}><div className={`${T.thBar} w-16`} /></th>
              <th className={T.th}><div className={`${T.thBar} w-16`} /></th>
            </tr>
          </thead>
          <tbody>
            {SKELETON_ROWS.map((key) => (
              <tr key={key} className={T.row}>
                <td className={T.td}><div className={T.ticketBadge} /></td>
                <td className={T.td}><div className={`${T.cellBar} w-24`} /></td>
                <td className={T.td}><div className={`${T.cellBar} w-14`} /></td>
                <td className={T.td}><div className={`${T.cellBar} w-12`} /></td>
                <td className={T.td}><div className={T.statusBadge} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={S.footerLink}>
        <div className={S.footerLinkBar} />
      </div>
    </div>
  );
}

export default LiveQueueTableSkeleton;
