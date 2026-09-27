/**
 * @fileoverview Live Cubicle Queue Dashboard page (/dashboard/pages/cubicles).
 *
 * Provides real-time visibility into consultation rooms, occupancy, patient assignments,
 * and estimated consultation finish times.
 *
 * @module app/dashboard/pages/cubicles/page
 */

'use client';

import { useCubiclesData } from '@/app/dashboard/pages/cubicles/hooks/useCubiclesData';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import CubiclesHeader from '@/app/dashboard/pages/cubicles/components/CubiclesHeader';
import CubiclesStatsGrid from '@/app/dashboard/pages/cubicles/components/CubiclesStatsGrid';
import CubiclesGrid from '@/app/dashboard/pages/cubicles/components/CubiclesGrid';
import CubiclesLegend from '@/app/dashboard/pages/cubicles/components/CubiclesLegend';

/**
 * Root Cubicles Dashboard page component.
 *
 * @returns JSX element.
 */
export default function CubiclesPage() {
  const { cubicles, stats, currentTime, loading, error } = useCubiclesData();
  const T = CUBICLES_TEXTS.header;

  if (loading && cubicles.length === 0) {
    return (
      <div className={CUBICLES_STYLES.page}>
        <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-surface p-12 text-center text-sm font-semibold text-content-muted shadow-card">
          <div className="flex flex-col items-center gap-3">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
            <p>{T.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && cubicles.length === 0) {
    return (
      <div className={CUBICLES_STYLES.page}>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center font-bold text-rose-600 dark:text-rose-400">
          {T.errorPrefix} {error}
        </div>
      </div>
    );
  }

  return (
    <div className={CUBICLES_STYLES.page}>
      <CubiclesHeader currentTime={currentTime} />

      <CubiclesStatsGrid stats={stats} />

      <CubiclesGrid cubicles={cubicles} currentTime={currentTime} />

      <CubiclesLegend />
    </div>
  );
}
