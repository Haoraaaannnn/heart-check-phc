/**
 * @fileoverview Date range selector component for filtering analytics timeframe.
 *
 * @module app/dashboard/pages/analytics/components/DateRangeSelector
 */

'use client';

import {
  ANALYTICS_PRESETS,
  ANALYTICS_STYLES,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import type { AnalyticsRange } from '@/app/dashboard/pages/analytics/hooks/useAnalyticsData';

interface DateRangeSelectorProps {
  /** The currently active date range value. */
  value: AnalyticsRange;
  /** Callback fired when a range pill is selected. */
  onChange: (range: AnalyticsRange) => void;
  /** Whether analytics data is currently loading. */
  isLoading?: boolean;
}

/**
 * Filter pills for toggling analytical historical time windows.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function DateRangeSelector({
  value,
  onChange,
  isLoading,
}: DateRangeSelectorProps) {
  const S = ANALYTICS_STYLES.rangeSelector;

  return (
    <div className={S.wrap}>
      {ANALYTICS_PRESETS.map((preset) => {
        const isActive = value === preset.value;
        const isActiveLoading = isLoading && isActive;

        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value as AnalyticsRange)}
            disabled={isLoading}
            className={`${S.pillBase} ${isActive ? S.pillActive : S.pillIdle} ${
              isLoading ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {isActiveLoading && (
              <svg className={S.spinner} viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
