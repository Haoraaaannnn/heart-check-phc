/**
 * @fileoverview Interactive date and timeframe selection browser component.
 *
 * Renders year selectors, month availability grids, recorded clinic days chips,
 * and rolling range presets. Disables unrecorded dates to prevent empty export requests.
 *
 * @remarks
 * Conforms strictly to AGENTS.md high-contrast solid surfaces and no text truncation rules.
 *
 * @module app/dashboard/pages/export/components/ExportDateBrowser
 */

'use client';

import React from 'react';
import { MONTHS_CONFIG, RANGE_OPTIONS } from '../constants/export';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import { AvailableExportDatesResponse, ExportOptions } from '../types/exportTypes';

/**
 * Properties for the {@link ExportDateBrowser} component.
 */
export interface ExportDateBrowserProps {
  /** Active export options. */
  options: ExportOptions;
  /** Dispatcher function to update options. */
  onOptionsChange: React.Dispatch<React.SetStateAction<ExportOptions>>;
  /** Available dates dataset returned by the backend. */
  availableDates: AvailableExportDatesResponse;
  /** Filtered list of calendar days based on current search text and year. */
  filteredDays: string[];
  /** Search input text. */
  searchQuery: string;
  /** Search query updater. */
  onSearchChange: (query: string) => void;
  /** Whether date availability is actively loading. */
  isLoading?: boolean;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into display strings.
 *
 * @param dateStr - ISO date string.
 * @returns Object containing formatted day of week and long date.
 */
function formatDateDetails(dateStr: string): { dayOfWeek: string; formatted: string } {
  try {
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const monthName = dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    return {
      dayOfWeek,
      formatted: `${monthName} ${String(d).padStart(2, '0')}, ${y}`,
    };
  } catch {
    return { dayOfWeek: '', formatted: dateStr };
  }
}

/**
 * Interactive calendar date and timeframe browser component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportDateBrowser({
  options,
  onOptionsChange,
  availableDates,
  filteredDays,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: ExportDateBrowserProps): React.ReactElement {
  const S = EXPORT_STYLES.dateBrowser;
  const T = EXPORT_TEXTS.dateBrowser;

  const currentYear = options.selectedYear;
  const yearsList = availableDates.years.length > 0 ? availableDates.years : [currentYear];
  const monthsForYear = availableDates.dates[String(currentYear)] || [];

  const handleYearSelect = (year: number) => {
    onOptionsChange((prev) => {
      const next = { ...prev, selectedYear: year };
      const months = availableDates.dates[String(year)] || [];
      if (months.length > 0 && !months.includes(next.selectedMonth)) {
        next.selectedMonth = months[0];
      }
      return next;
    });
  };

  const handleMonthSelect = (monthVal: number) => {
    onOptionsChange((prev) => ({ ...prev, selectedMonth: monthVal }));
  };

  const handleDateSelect = (dateStr: string) => {
    onOptionsChange((prev) => ({ ...prev, selectedDate: dateStr }));
  };

  const handleRangeSelect = (rangeVal: string) => {
    onOptionsChange((prev) => ({ ...prev, selectedRange: rangeVal }));
  };

  return (
    <div className={S.card}>
      <div className={S.header}>
        <div>
          <h2 className={S.title}>{T.title}</h2>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>

        {/* Search filter for single date mode */}
        {options.mode === 'specific' && (
          <div className={S.searchBox}>
            <i className={`bx bx-search ${S.searchIcon}`} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={T.filterInputPlaceholder}
              className={S.searchInput}
            />
          </div>
        )}
      </div>

      {/* Year Selection Row (for Specific and Month modes) */}
      {(options.mode === 'specific' || options.mode === 'month') && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-[#f5f5f5]">
              {T.yearLabel}
            </span>
            <div className={S.yearSelectorRow}>
              {yearsList.map((y) => {
                const isActive = y === currentYear;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearSelect(y)}
                    className={isActive ? S.yearBtn.active : S.yearBtn.idle}
                  >
                    <span>{y}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 1: Specific Single Day */}
      {options.mode === 'specific' && (
        <div>
          <p className="text-xs text-slate-600 dark:text-[#a3a3a3] mb-3">
            {T.selectDateHint}
          </p>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500 dark:text-[#737373]">
              Loading available recorded dates...
            </div>
          ) : filteredDays.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500 dark:text-[#737373] rounded-lg border border-dashed border-slate-200 dark:border-[#2e2e2e]">
              {T.noDatesFound}
            </div>
          ) : (
            <div className={S.daysGrid}>
              {filteredDays.map((d) => {
                const isActive = options.selectedDate === d;
                const { dayOfWeek, formatted } = formatDateDetails(d);

                return (
                  <div
                    key={d}
                    onClick={() => handleDateSelect(d)}
                    className={isActive ? S.dayChip.active : S.dayChip.idle}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-[#737373]">
                        {dayOfWeek}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold text-[#a8071a] dark:text-[#f87171]">
                          {T.activeDayBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-[#f5f5f5]">
                      {formatted}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-[#737373] mt-0.5">
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Calendar Month */}
      {options.mode === 'month' && (
        <div>
          <p className="text-xs text-slate-600 dark:text-[#a3a3a3] mb-3">
            {T.selectMonthHint}
          </p>

          <div className={S.monthsGrid}>
            {MONTHS_CONFIG.map((m) => {
              const hasData = monthsForYear.includes(m.value);
              const isActive = hasData && options.selectedMonth === m.value;

              let cardStyle: string = S.monthCard.disabled;
              if (isActive) cardStyle = S.monthCard.active;
              else if (hasData) cardStyle = S.monthCard.available;

              return (
                <div
                  key={m.value}
                  onClick={() => hasData && handleMonthSelect(m.value)}
                  className={cardStyle}
                  role="button"
                  tabIndex={hasData ? 0 : -1}
                >
                  <div className="text-sm font-bold">{m.name}</div>
                  <div className="text-[10px] mt-1 font-semibold">
                    {hasData ? T.hasDataBadge : T.noDataBadge}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: Rolling Range & All Dates */}
      {options.mode === 'range' && (
        <div>
          <p className="text-xs text-slate-600 dark:text-[#a3a3a3] mb-3">
            {T.selectRangeHint}
          </p>

          <div className={S.rangesGrid}>
            {RANGE_OPTIONS.map((r) => {
              const isActive = options.selectedRange === r.value;

              return (
                <div
                  key={r.value}
                  onClick={() => handleRangeSelect(r.value)}
                  className={isActive ? S.rangeCard.active : S.rangeCard.idle}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">
                      {r.label}
                    </span>
                    {isActive && (
                      <i className="bx bx-check-circle text-base text-[#a8071a] dark:text-[#f87171]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#737373] leading-normal">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
