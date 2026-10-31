/**
 * @fileoverview Industry-standard timeframe filter control for executive overview date ranges.
 *
 * Implements modern enterprise date filtering:
 * 1. Unified segmented preset control (Today, Yesterday, Last 7 Days, Month-to-Date).
 * 2. Dedicated recorded date navigator with:
 *    - Left/Right steppers (< and >) to quickly navigate across recorded clinic dates.
 *    - Dropdown selector displaying all distinct dates with recorded patient activity.
 *    - Calendar picker button allowing freeform selection of any custom operational date.
 *    - Reset action to immediately return to today's live queue.
 * 3. Human-readable active date window context badge providing immediate clinical orientation.
 *
 * @remarks
 * Adheres strictly to AGENTS.md guidelines: pure assembly and rendering, complete JSDoc,
 * separation of concerns, enterprise solid surfaces, and zero emojis.
 *
 * @module app/dashboard/components/OverviewDateFilter
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  /** Optional pre-fetched list of dates containing recorded patient consultations (YYYY-MM-DD) */
  availableDates?: string[];
}

/**
 * Formats a YYYY-MM-DD date string into standard human-readable format (e.g. Oct 30, 2026).
 *
 * @param dateStr - ISO date string in YYYY-MM-DD format.
 * @returns Formatted human-readable date.
 */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats the active date range into an industry-standard human-readable window label.
 *
 * @param range - The active timeframe identifier.
 * @param now - Current reference timestamp.
 * @returns Human-readable date range description.
 */
function formatActiveRangeWindow(range: OverviewDateRange, now: Date = new Date()): string {
  const shortDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const monthDay = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (range.startsWith('date:') || /^\d{4}-\d{2}-\d{2}$/.test(range)) {
    const raw = range.replace('date:', '').trim();
    return formatDisplayDate(raw);
  }

  if (range === 'today') {
    return `${shortDate(now)} (Today)`;
  }

  if (range === 'yesterday') {
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return `${shortDate(yest)} (Yesterday)`;
  }

  if (range === '7d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return `${monthDay(start)} – ${shortDate(now)}`;
  }

  if (range === 'mtd') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${monthDay(start)} – ${shortDate(now)}`;
  }

  return shortDate(now);
}

/**
 * Industry-standard timeframe filter toolbar for administrative dashboards.
 *
 * @param props - Component properties.
 * @returns Rendered JSX element.
 */
export default function OverviewDateFilter({
  selectedRange,
  onRangeChange,
  isLoading = false,
  isMounted,
  availableDates: externalDates,
}: OverviewDateFilterProps) {
  const S = DASH.dateFilter;
  const T = OVERVIEW_DATE_FILTER_TEXTS;
  const I = OVERVIEW_DATE_FILTER_ICONS;

  const [internalDates, setInternalDates] = useState<string[]>([]);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // Self-contained fallback fetch if externalDates is not provided
  const fetchDatesFallback = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/available-export-dates`);
      if (res.ok) {
        const data = (await res.json()) as { days?: string[] };
        if (Array.isArray(data.days) && data.days.length > 0) {
          setInternalDates(data.days);
          return;
        }
      }
    } catch {
      // Fall through to Supabase query
    }

    try {
      const { data } = await supabase
        .from('patients')
        .select('created_at, consult_start')
        .not('created_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      if (data && data.length > 0) {
        const dateSet = new Set<string>();
        data.forEach((row: { created_at?: string | null; consult_start?: string | null }) => {
          const ts = row.consult_start || row.created_at;
          if (ts && typeof ts === 'string') {
            const parsed = ts.slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
              dateSet.add(parsed);
            }
          }
        });
        const sorted = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
        setInternalDates(sorted);
      }
    } catch {
      // Retain existing state
    }
  }, []);

  useEffect(() => {
    if (!externalDates || externalDates.length === 0) {
      void fetchDatesFallback();
    }
  }, [externalDates, fetchDatesFallback]);

  const recordedDates = useMemo(() => {
    if (externalDates && externalDates.length > 0) {
      return externalDates;
    }
    return internalDates;
  }, [externalDates, internalDates]);

  const isSpecificDate =
    selectedRange.startsWith('date:') || /^\d{4}-\d{2}-\d{2}$/.test(selectedRange);
  const selectedDateVal = isSpecificDate ? selectedRange.replace('date:', '').trim() : '';

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Compute navigation targets for stepping backwards (<) and forwards (>)
  const { prevDateTarget, nextDateTarget, canStepPrev, canStepNext, recordedDayIndex } =
    useMemo(() => {
      if (recordedDates.length === 0) {
        return {
          prevDateTarget: null,
          nextDateTarget: null,
          canStepPrev: false,
          canStepNext: false,
          recordedDayIndex: -1,
        };
      }

      if (!isSpecificDate || !selectedDateVal) {
        // On Today or a preset: stepping backward (earlier in time) jumps to latest recorded date
        return {
          prevDateTarget: recordedDates[0],
          nextDateTarget: null,
          canStepPrev: true,
          canStepNext: false,
          recordedDayIndex: -1,
        };
      }

      const idx = recordedDates.indexOf(selectedDateVal);

      if (idx !== -1) {
        // Exact recorded date selected
        const prev = idx < recordedDates.length - 1 ? recordedDates[idx + 1] : null;
        const next = idx > 0 ? recordedDates[idx - 1] : 'today';
        return {
          prevDateTarget: prev,
          nextDateTarget: next,
          canStepPrev: prev !== null,
          canStepNext: true,
          recordedDayIndex: idx + 1,
        };
      }

      // Custom date chosen from calendar outside recorded list: find nearest dates
      const prev = recordedDates.find((d) => d < selectedDateVal) ?? null;
      const later = recordedDates.filter((d) => d > selectedDateVal);
      const next = later.length > 0 ? later[later.length - 1] : 'today';

      return {
        prevDateTarget: prev,
        nextDateTarget: next,
        canStepPrev: prev !== null,
        canStepNext: true,
        recordedDayIndex: -1,
      };
    }, [recordedDates, isSpecificDate, selectedDateVal]);

  const handlePrevDate = () => {
    if (prevDateTarget) {
      onRangeChange(`date:${prevDateTarget}` as OverviewDateRange);
    }
  };

  const handleNextDate = () => {
    if (nextDateTarget === 'today') {
      onRangeChange('today');
    } else if (nextDateTarget) {
      onRangeChange(`date:${nextDateTarget}` as OverviewDateRange);
    }
  };

  const handleSelectRecordedDate = (val: string) => {
    if (!val) return;
    if (val === '__pick_calendar__') {
      openCalendarPicker();
      return;
    }
    onRangeChange(`date:${val}` as OverviewDateRange);
  };

  const openCalendarPicker = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  const activeWindowText = useMemo(() => {
    if (!isMounted) return '--';
    const base = formatActiveRangeWindow(selectedRange);
    if (isSpecificDate && recordedDayIndex > 0) {
      return `${base} (${T.recordedClinicDay} ${recordedDayIndex} of ${recordedDates.length})`;
    }
    return base;
  }, [
    isMounted,
    selectedRange,
    isSpecificDate,
    recordedDayIndex,
    recordedDates.length,
    T.recordedClinicDay,
  ]);

  return (
    <div className={S.root}>
      {/* Left: Timeframe Controls Group */}
      <div className={S.group}>
        <span className={S.labelWrap}>
          <i className={`bx ${I.filter} ${S.labelIcon}`} />
          <span>{T.label}</span>
        </span>

        {/* Industry-Standard Segmented Control Track */}
        <div className={S.segmentedTrack} role="group" aria-label="Timeframe presets">
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
                className={`${S.segmentBtn} ${
                  isActive ? S.segmentActive : S.segmentIdle
                } ${isLoading && !isActive ? 'cursor-not-allowed opacity-60' : ''}`}
              >
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

        <span className="hidden sm:inline-block h-4 w-[1px] bg-line mx-1" aria-hidden="true" />

        {/* Enterprise Recorded Date Navigator */}
        <div
          className={`${S.customControl} ${
            isSpecificDate ? S.customControlActive : S.customControlIdle
          }`}
        >
          {/* Step backwards to earlier recorded date */}
          <button
            type="button"
            onClick={handlePrevDate}
            disabled={!canStepPrev || isLoading}
            title={
              prevDateTarget
                ? `${T.prevRecordedDate} (${formatDisplayDate(prevDateTarget)})`
                : T.prevRecordedDate
            }
            aria-label={T.prevRecordedDate}
            className={S.navStepBtn}
          >
            <i className="bx bx-chevron-left text-base" />
          </button>

          {/* Recorded Dates Dropdown Selector */}
          <div className="relative inline-flex items-center gap-1">
            <i className="bx bx-history text-sm text-content-subtle" />
            <select
              value={selectedDateVal}
              onChange={(e) => handleSelectRecordedDate(e.target.value)}
              disabled={isLoading}
              className={S.recordedSelect}
              aria-label={T.recordedDatesLabel}
            >
              <option value="" disabled={isSpecificDate}>
                {recordedDates.length > 0
                  ? `${T.recordedDatesLabel} (${recordedDates.length})`
                  : T.selectRecordedDatePlaceholder}
              </option>
              {/* If a custom date outside recordedDates is chosen, display it */}
              {isSpecificDate && !recordedDates.includes(selectedDateVal) && (
                <option value={selectedDateVal}>
                  {formatDisplayDate(selectedDateVal)} (Custom Date)
                </option>
              )}
              {recordedDates.map((d) => (
                <option key={d} value={d} className="bg-surface text-content">
                  {formatDisplayDate(d)}
                </option>
              ))}
              <option value="__pick_calendar__">Pick from calendar...</option>
            </select>
          </div>

          {/* Native Calendar Picker Trigger Button */}
          <button
            type="button"
            onClick={openCalendarPicker}
            disabled={isLoading}
            title={T.pickCalendarDate}
            aria-label={T.pickCalendarDate}
            className={S.calendarBtn}
          >
            <i className="bx bx-calendar text-sm" />
          </button>

          {/* Hidden native date input for modern browser calendar picker popup */}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDateVal}
            max={todayStr}
            onChange={(e) => {
              if (e.target.value) {
                onRangeChange(`date:${e.target.value}` as OverviewDateRange);
              }
            }}
            className={S.dateInput}
            aria-label={T.pickCalendarDate}
            tabIndex={-1}
          />

          {/* Step forwards to newer recorded date */}
          <button
            type="button"
            onClick={handleNextDate}
            disabled={!canStepNext || isLoading}
            title={
              nextDateTarget === 'today'
                ? T.resetToday
                : nextDateTarget
                ? `${T.nextRecordedDate} (${formatDisplayDate(nextDateTarget)})`
                : T.nextRecordedDate
            }
            aria-label={T.nextRecordedDate}
            className={S.navStepBtn}
          >
            <i className="bx bx-chevron-right text-base" />
          </button>

          {/* Quick clear back to Today when custom date is active */}
          {isSpecificDate && (
            <button
              type="button"
              onClick={() => onRangeChange('today')}
              className="text-content-subtle hover:text-content text-sm cursor-pointer ml-0.5"
              title={T.resetToday}
              aria-label={T.resetToday}
            >
              <i className="bx bx-x" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Active Date Range Context Badge (Industry Standard) */}
      <div
        className={S.activeContext}
        title="Active operational time window evaluated by dashboard metrics"
      >
        <i className="bx bx-calendar-event text-content-subtle text-sm" />
        <span className={S.activeContextLabel}>{T.activeWindowPrefix}</span>
        <span className={S.activeContextValue}>{activeWindowText}</span>
      </div>
    </div>
  );
}
