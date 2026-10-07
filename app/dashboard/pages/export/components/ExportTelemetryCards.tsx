/**
 * @fileoverview Dataset telemetry KPI summary cards for the Export Data page.
 *
 * Displays aggregated dataset statistics: total distinct recorded clinic days,
 * date span range (earliest to latest), calendar year volume, and the PHC protocol standard.
 *
 * @remarks
 * Adheres strictly to AGENTS.md high-contrast solid surface standards. No emojis, no ellipsis.
 *
 * @module app/dashboard/pages/export/components/ExportTelemetryCards
 */

'use client';

import React from 'react';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import { ExportTelemetrySummary } from '../types/exportTypes';

/**
 * Properties for the {@link ExportTelemetryCards} component.
 */
export interface ExportTelemetryCardsProps {
  /** Aggregated telemetry data derived from backend dates response. */
  telemetry: ExportTelemetrySummary;
  /** Whether date availability is actively loading. */
  isLoading?: boolean;
}

/**
 * Dataset telemetry KPI cards component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportTelemetryCards({
  telemetry,
  isLoading = false,
}: ExportTelemetryCardsProps): React.ReactElement {
  const S = EXPORT_STYLES.telemetry;
  const T = EXPORT_TEXTS.telemetry;

  const dateSpanText =
    telemetry.earliestDate && telemetry.latestDate
      ? `${telemetry.earliestDate} to ${telemetry.latestDate}`
      : '--';

  const yearsText =
    telemetry.yearsWithData.length > 0
      ? telemetry.yearsWithData.join(', ')
      : '--';

  return (
    <div className={S.grid}>
      {/* Total Recorded Days */}
      <div className={S.card}>
        <div className={S.cardHeader}>
          <span className={S.label}>{T.availableDaysLabel}</span>
          <div className={S.iconWrapper}>
            <i className="bx bx-calendar-check text-lg" aria-hidden="true" />
          </div>
        </div>
        <div className={S.value}>
          {isLoading ? '...' : telemetry.totalDaysWithData}
        </div>
        <div className={S.help}>{T.availableDaysHelp}</div>
      </div>

      {/* Recorded Date Span */}
      <div className={S.card}>
        <div className={S.cardHeader}>
          <span className={S.label}>{T.dateSpanLabel}</span>
          <div className={S.iconWrapper}>
            <i className="bx bx-time text-lg" aria-hidden="true" />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words">
          {isLoading ? '...' : dateSpanText}
        </div>
        <div className={S.help}>{T.dateSpanHelp}</div>
      </div>

      {/* Active Calendar Years */}
      <div className={S.card}>
        <div className={S.cardHeader}>
          <span className={S.label}>{T.calendarYearsLabel}</span>
          <div className={S.iconWrapper}>
            <i className="bx bx-history text-lg" aria-hidden="true" />
          </div>
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {isLoading ? '...' : yearsText}
        </div>
        <div className={S.help}>{T.calendarYearsHelp}</div>
      </div>

      {/* Audit Protocol Standard */}
      <div className={S.card}>
        <div className={S.cardHeader}>
          <span className={S.label}>{T.protocolLabel}</span>
          <div className={S.iconWrapper}>
            <i className="bx bx-shield-quarter text-lg text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
        </div>
        <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-snug">
          {T.protocolValue}
        </div>
        <div className={S.help}>{T.protocolHelp}</div>
      </div>
    </div>
  );
}
