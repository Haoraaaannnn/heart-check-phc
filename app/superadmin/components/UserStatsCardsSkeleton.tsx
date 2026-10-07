/**
 * @fileoverview Skeletal placeholder component for the SuperAdmin UserStatsCards widget.
 *
 * Renders 4 high-level KPI card skeletons mirroring user registration totals,
 * clinical medical staff, registration officers, and administrators.
 *
 * @module app/superadmin/components/UserStatsCardsSkeleton
 */

import React from 'react';
import { SUPERADMIN_SKELETON_STYLES } from '../constants/superadminSkeletonStyles';
import { SUPERADMIN_SKELETON_TEXTS } from '../constants/superadminSkeletonTexts';
import { SUPERADMIN_TONES, SuperadminToneKey } from '../constants/superadminStyles';

interface SkeletonTileConfig {
  key: string;
  tone: SuperadminToneKey;
}

const SKELETON_TILES: SkeletonTileConfig[] = [
  { key: 'total', tone: 'rose' },
  { key: 'clinical', tone: 'emerald' },
  { key: 'registration', tone: 'slate' },
  { key: 'admins', tone: 'purple' },
];

/**
 * Renders executive KPI card skeletons for user management overview.
 *
 * @returns JSX element containing the 4-card metric skeleton grid.
 */
export function UserStatsCardsSkeleton(): React.ReactElement {
  const S = SUPERADMIN_SKELETON_STYLES.metrics;

  return (
    <div
      className={S.grid}
      role="status"
      aria-label={SUPERADMIN_SKELETON_TEXTS.aria.loadingStats}
    >
      {SKELETON_TILES.map((tile) => {
        const toneStyle = SUPERADMIN_TONES[tile.tone];
        return (
          <div key={tile.key} className={`${S.card} ${toneStyle.tile}`}>
            <div className={`${S.iconWrap} ${toneStyle.icon}`} />
            <div className={S.content}>
              <div className={S.label} />
              <div className={S.value} />
              <div className={S.subtitle} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UserStatsCardsSkeleton;
