/**
 * @fileoverview Complete page-level skeletal loader for the SuperAdmin Portal.
 *
 * Assembles header banner, tab navigation, KPI metric cards, and staff accounts table
 * skeletons into the standardized 1680px layout container during auth checks and route loads.
 *
 * @remarks
 * Strictly conforms to AGENTS.md enterprise standards:
 * - High-contrast solid surfaces.
 * - Dual-theme compatibility.
 * - Comprehensive JSDoc documentation.
 * - Zero hardcoded text copy and zero emojis.
 *
 * @module app/superadmin/components/SuperAdminPageSkeleton
 */

import React from 'react';
import { SUPERADMIN_SKELETON_STYLES } from '../constants/superadminSkeletonStyles';
import { SUPERADMIN_SKELETON_TEXTS } from '../constants/superadminSkeletonTexts';
import { UserStatsCardsSkeleton } from './UserStatsCardsSkeleton';
import { UserTableSkeleton } from './UserTableSkeleton';

export interface SuperAdminPageSkeletonProps {
  /** Active view mode skeleton to render ('users' or 'settings'). Defaults to 'users'. */
  activeTab?: 'users' | 'settings';
}

/**
 * Renders the full-page skeletal loading surface for the SuperAdmin portal.
 *
 * @param props - Component options including active tab identifier.
 * @returns JSX element containing the full page skeleton.
 */
export function SuperAdminPageSkeleton({
  activeTab = 'users',
}: SuperAdminPageSkeletonProps): React.ReactElement {
  const S = SUPERADMIN_SKELETON_STYLES;

  return (
    <div
      className={S.root}
      role="status"
      aria-label={SUPERADMIN_SKELETON_TEXTS.aria.loadingSuperAdmin}
    >
      {/* 1. Header Banner Card Skeleton */}
      <div className={S.banner.root}>
        <div className={S.banner.titleSection}>
          <div className={S.banner.heading} />
          <div className={S.banner.subheading} />
        </div>
        <div className={S.banner.button} />
      </div>

      {/* 2. Tab Navigation Skeleton */}
      <div className={S.tabs.container}>
        <div className={S.tabs.tab} />
        <div className={S.tabs.tab} />
      </div>

      {/* 3. Tab Content Skeleton */}
      {activeTab === 'users' ? (
        <div className="space-y-6">
          <UserStatsCardsSkeleton />
          <UserTableSkeleton includeToolbar={true} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-md bg-slate-100 dark:bg-[#242424]" />
              <div className="h-4 w-80 rounded-md bg-slate-100 dark:bg-[#242424]" />
            </div>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-md bg-slate-100 dark:bg-[#242424]" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-28 rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e]" />
                  <div className="h-9 w-20 rounded-lg bg-slate-100 dark:bg-[#242424]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-44 rounded-md bg-slate-100 dark:bg-[#242424]" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-28 rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e]" />
                  <div className="h-9 w-20 rounded-lg bg-slate-100 dark:bg-[#242424]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminPageSkeleton;
