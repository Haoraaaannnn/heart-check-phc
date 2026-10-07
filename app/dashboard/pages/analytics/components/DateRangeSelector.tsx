/**
 * @fileoverview Date range selector component for filtering analytics timeframe.
 *
 * @module app/dashboard/pages/analytics/components/DateRangeSelector
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  ANALYTICS_PRESETS,
  ANALYTICS_STYLES,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
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
 * Filter pills for toggling analytical historical time windows and specific calendar years.
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
  const T = ANALYTICS_TEXTS.presets;
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    let isCancelled = false;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    fetch(`${baseUrl}/api/available-years`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load years');
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        if (Array.isArray(data.years) && data.years.length > 0) {
          const sorted = [...data.years].sort((a, b) => b - a);
          setAvailableYears(sorted);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

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

      {availableYears.length > 0 && (
        <>
          <span className={S.divider} aria-hidden="true" />
          {availableYears.map((year) => {
            const yrStr = String(year);
            const isActive = value === yrStr;
            const isActiveLoading = isLoading && isActive;

            return (
              <button
                key={year}
                type="button"
                onClick={() => onChange(yrStr)}
                disabled={isLoading}
                title={T.yearFilterTitle ? T.yearFilterTitle(year) : yrStr}
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
                {year}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

