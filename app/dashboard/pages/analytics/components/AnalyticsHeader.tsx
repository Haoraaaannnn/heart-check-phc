/**
 * @fileoverview Header banner component for the Analytics dashboard page.
 *
 * Integrates the page title, subtitle, date range selector, live refreshing indicator,
 * and Excel export trigger within the dashboard visual design system.
 *
 * @module app/dashboard/pages/analytics/components/AnalyticsHeader
 */

'use client';

import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import type { AnalyticsRange } from '@/app/dashboard/pages/analytics/hooks/useAnalyticsData';
import DateRangeSelector from '@/app/dashboard/pages/analytics/components/DateRangeSelector';
import ExportExcelButton from '@/app/dashboard/pages/analytics/components/ExportExcelButton';

interface AnalyticsHeaderProps {
  /** The selected analytics date range. */
  range: AnalyticsRange;
  /** Callback fired when a date range is chosen. */
  setRange: (range: AnalyticsRange) => void;
  /** Whether the initial query or a range switch is loading. */
  loading: boolean;
  /** Whether a background refresh is actively occurring. */
  isRefreshing: boolean;
}

/**
 * Top banner and filter bar for the Analytics page.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function AnalyticsHeader({
  range,
  setRange,
  loading,
  isRefreshing,
}: AnalyticsHeaderProps) {
  const S = ANALYTICS_STYLES.header;
  const T = ANALYTICS_TEXTS.header;

  return (
    <div className={S.root}>
      <div className={S.titleBlock}>
        <h1 className={S.title}>{T.title}</h1>
        <p className={S.subtitle}>{T.subtitle}</p>
      </div>

      <div className={S.actions}>
        <DateRangeSelector value={range} onChange={setRange} isLoading={loading} />

        {isRefreshing && (
          <span className={S.refreshPill}>
            <span className={S.refreshDot} />
            {T.refreshing}
          </span>
        )}

        <ExportExcelButton range={range} />
      </div>
    </div>
  );
}
