/**
 * @fileoverview Date filter pill bar for switching executive overview timeframes.
 *
 * Provides single-click filtering across Today, Yesterday, Last 7 Days, and Month-to-Date
 * with real-time streaming indicator and historical snapshot status badges adhering to
 * the enterprise solid surfaces standard.
 *
 * @remarks
 * Adheres strictly to AGENTS.md guidelines: pure assembly and rendering, complete JSDoc,
 * separation of concerns, and zero emojis.
 *
 * @module app/dashboard/components/OverviewDateFilter
 */

'use client';

import {
  OVERVIEW_DATE_FILTER_ICONS,
  OVERVIEW_DATE_FILTER_TEXTS,
  OVERVIEW_DATE_PRESETS,
  type OverviewDateRange,
} from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Properties for the {@link OverviewDateFilter} component.
 */
export interface OverviewDateFilterProps {
  /** The currently selected timeframe range identifier */
  selectedRange: OverviewDateRange;
  /** Callback fired when a timeframe preset is clicked */
  onRangeChange: (range: OverviewDateRange) => void;
  /** Flag indicating whether the timeframe data query is actively loading */
  isLoading?: boolean;
  /** Flag indicating whether component has completed client hydration */
  isMounted: boolean;
}

/**
 * Filter pill bar for toggling between live queue metrics and historical reporting windows.
 *
 * @param props - Component properties.
 * @returns Rendered JSX element.
 */
export default function OverviewDateFilter({
  selectedRange,
  onRangeChange,
  isLoading = false,
  isMounted,
}: OverviewDateFilterProps) {
  const S = DASH.dateFilter;
  const T = OVERVIEW_DATE_FILTER_TEXTS;
  const I = OVERVIEW_DATE_FILTER_ICONS;

  const isToday = selectedRange === 'today';

  return (
    <div className={S.root}>
      {/* Timeframe Presets */}
      <div className={S.group}>
        <span className={S.labelWrap}>
          <i className={`bx ${I.filter} ${S.labelIcon}`} />
          <span>{T.label}</span>
        </span>

        {OVERVIEW_DATE_PRESETS.map((preset) => {
          const isActive = selectedRange === preset.id;
          const isActiveLoading = isLoading && isActive;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRangeChange(preset.id)}
              disabled={isLoading && !isActive}
              aria-pressed={isActive}
              aria-label={preset.description}
              className={`${S.pill} ${isActive ? S.pillActive : S.pillIdle} ${
                isLoading && !isActive ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              <i className={`bx ${preset.icon}`} />
              <span>{preset.label}</span>

              {isActiveLoading && (
                <svg
                  className={S.spinner}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-label={T.loadingAria}
                >
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Real-time Streaming vs Historical Snapshot Indicator */}
      {isMounted && (
        <div>
          {isToday ? (
            <span className={S.badgeLive}>
              <span className={S.badgeLiveDot} />
              <span>{T.liveBadge}</span>
            </span>
          ) : (
            <span className={S.badgeHistorical}>
              <i className={`bx ${I.history} ${S.badgeHistoricalIcon}`} />
              <span>{T.historicalBadge}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
