/**
 * @fileoverview Header controls toolbar for the Cubicles Heatmap section.
 *
 * Renders the view mode segmented control (Speed, Idle, Dual), the operational date selector,
 * clinic hours indicator, and live synchronization status badge.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapHeaderControls
 */

'use client';

import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { HeatmapViewMode } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface HeatmapHeaderControlsProps {
  /** Current active perspective mode. */
  viewMode: HeatmapViewMode;
  /** Callback to change perspective mode. */
  onViewModeChange: (mode: HeatmapViewMode) => void;
  /** Currently selected operational date (YYYY-MM-DD). */
  selectedDate: string;
  /** Callback when date is changed. */
  onDateChange: (date: string) => void;
  /** List of dates containing recorded patient consultations. */
  availableDates: string[];
  /** Whether the selected date is today's live queue. */
  isLive: boolean;
  /** Callback to manually trigger a data refresh. */
  onRefresh: () => void;
  /** Loading state indicator. */
  isLoading: boolean;
}

/**
 * Top control bar for filtering heatmap dates and toggling between speed and idle perspectives.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HeatmapHeaderControls({
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
  availableDates,
  isLive,
  onRefresh,
  isLoading,
}: HeatmapHeaderControlsProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap;

  const modeButtons: { key: HeatmapViewMode; label: string; icon: string }[] = [
    { key: 'speed', label: T.modes.speed, icon: 'bx-tachometer' },
    { key: 'idle', label: T.modes.idle, icon: 'bx-time-five' },
    { key: 'dual', label: T.modes.dual, icon: 'bx-columns' },
  ];

  return (
    <div className={S.headerActions}>
      <div className={S.controlsGroup}>
        {/* Perspective view mode switch */}
        <div className={S.viewModeTabs}>
          {modeButtons.map((btn) => {
            const isActive = viewMode === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => onViewModeChange(btn.key)}
                className={`${S.viewModeButton} ${
                  isActive ? S.viewModeButtonActive : S.viewModeButtonInactive
                }`}
              >
                <i className={`bx ${btn.icon}`} />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Operational hours indicator */}
        <span className={S.operationalHoursPill}>
          <i className="bx bx-calendar" />
          <span>{T.date.operatingHoursLabel}</span>
        </span>
      </div>

      <div className={S.controlsGroup}>
        {/* Live sync indicator */}
        {isLive && (
          <span className={S.liveBadge}>
            <span className={S.liveDot} />
            <span>{T.date.liveIndicator}</span>
          </span>
        )}

        {/* Operational date selector */}
        <div className={S.dateSelectorWrap}>
          <span className={S.dateLabel}>
            <i className="bx bx-calendar-event text-rose-500" />
            <span>{T.date.label}</span>
          </span>

          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={S.dateSelect}
          >
            {availableDates.map((dateStr) => {
              const [y, m, d] = dateStr.split('-');
              const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
              const displayStr = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const isToday =
                new Date().toISOString().slice(0, 10) === dateStr;

              return (
                <option key={dateStr} value={dateStr} className="bg-surface text-content">
                  {displayStr} {isToday ? `(${T.date.today})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Manual refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title={T.date.refresh}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-content-muted hover:text-content hover:bg-surface-subtle transition disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <i className={`bx bx-refresh text-lg ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
