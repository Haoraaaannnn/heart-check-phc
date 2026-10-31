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

import { useMemo } from 'react';
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
 * Filter pill bar for toggling between live queue metrics, specific clinic dates, and historical reporting windows.
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

  const isSpecificDate =
    selectedRange.startsWith('date:') || /^\d{4}-\d{2}-\d{2}$/.test(selectedRange);
  const selectedDateVal = isSpecificDate ? selectedRange.replace('date:', '') : '';

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

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

        <span className="hidden sm:inline-block h-4 w-[1px] bg-line mx-1" aria-hidden="true" />

        {/* Specific Date Picker Control */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition ${
            isSpecificDate
              ? 'border-[#a8071a] bg-[#a8071a]/10 text-[#a8071a] dark:text-[#f87171]'
              : 'border-line bg-surface-muted text-content-muted hover:border-slate-400'
          }`}
        >
          <i className="bx bx-calendar text-sm" />
          <span className="text-[11px] font-bold whitespace-nowrap">Specific Date:</span>
          <input
            type="date"
            value={selectedDateVal}
            max={todayStr}
            onChange={(e) => {
              if (e.target.value) {
                onRangeChange(`date:${e.target.value}` as OverviewDateRange);
              }
            }}
            className="bg-transparent text-xs font-semibold text-content outline-none cursor-pointer"
            aria-label="Filter by specific clinic date"
          />
          {isSpecificDate && (
            <button
              type="button"
              onClick={() => onRangeChange('today')}
              className="text-content-subtle hover:text-content text-sm cursor-pointer ml-1"
              title="Reset to today"
              aria-label="Reset to today"
            >
              <i className="bx bx-x" />
            </button>
          )}
        </div>
      </div>

      {/* Right Stream / Historical Indicator Badge */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedRange === 'today' ? (
          <span className={S.badgeLive} title="Continuous Supabase Realtime WebSocket feed">
            <span className={S.badgeLiveDot} />
            <span>{T.liveBadge}</span>
          </span>
        ) : isSpecificDate ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 select-none whitespace-nowrap">
            <i className="bx bx-calendar-check" />
            <span>Clinic Date: {selectedDateVal}</span>
          </span>
        ) : (
          <span className={S.badgeHistorical} title="Static snapshot query">
            <i className={`bx ${I.history} ${S.badgeHistoricalIcon}`} />
            <span>{T.historicalBadge}</span>
          </span>
        )}
      </div>
    </div>
  );
}
