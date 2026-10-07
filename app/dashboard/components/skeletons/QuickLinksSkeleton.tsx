/**
 * @fileoverview Skeletal placeholder component for the QuickLinks widget.
 *
 * Renders 3 shortcut button skeletons replicating QuickLinks.
 *
 * @module app/dashboard/components/skeletons/QuickLinksSkeleton
 */

import React from 'react';
import { DASHBOARD_SKELETON_STYLES } from '@/app/dashboard/constants/skeletonStyles';
import { DASHBOARD_SKELETON_TEXTS } from '@/app/dashboard/constants/skeletonTexts';

const LINK_KEYS = ['link-1', 'link-2', 'link-3'] as const;

/**
 * Renders the quick links skeleton card.
 *
 * @returns JSX element containing the quick actions skeleton.
 */
export function QuickLinksSkeleton(): React.ReactElement {
  const S = DASHBOARD_SKELETON_STYLES.card;
  const Q = DASHBOARD_SKELETON_STYLES.quickLinks;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={DASHBOARD_SKELETON_TEXTS.aria.loadingQuickLinks}
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

      <div className={Q.grid}>
        {LINK_KEYS.map((key) => (
          <div key={key} className={Q.button}>
            <div className={Q.buttonIcon} />
            <div className={Q.buttonText} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickLinksSkeleton;
