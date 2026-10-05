/**
 * @fileoverview Daily Drill-Down Detail panel component for the Analytics dashboard.
 *
 * Displays granular queue performance metrics for a selected date:
 * system status, KPI cards (patient count, average total journey time, peak arrival window,
 * primary bottleneck), and the 5-stage queue bottleneck breakdown table.
 *
 * @module app/dashboard/pages/analytics/components/DailyDrillDownDetail
 */

'use client';

import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import type { DailyDrilldownData } from '@/app/dashboard/pages/analytics/hooks/useDailyDrilldown';

interface DailyDrillDownDetailProps {
  /** Selected date in YYYY-MM-DD format. */
  date: string;
  /** Granular drilldown payload for the selected date. */
  drilldown: DailyDrilldownData | null;
  /** Network loading indicator. */
  loading: boolean;
  /** Network or server error message. */
  error: string | null;
  /** Callback to clear selection and return to overall range view. */
  onClose: () => void;
  /** Callback to retry network fetch. */
  onRetry: () => void;
  /** Optional fallback summary from dailySummary record while drilldown is loading. */
  fallbackSummary?: {
    total_patients?: number;
    avg_total_time?: number;
    avg_wait_registration?: number;
    avg_wait_consultation?: number;
  };
}

/** Formats YYYY-MM-DD into a readable full calendar string (e.g. Tuesday, November 4, 2025). */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Renders the interactive daily drill-down breakdown card.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function DailyDrillDownDetail({
  date,
  drilldown,
  loading,
  error,
  onClose,
  onRetry,
  fallbackSummary,
}: DailyDrillDownDetailProps) {
  const S = ANALYTICS_STYLES.drilldown;
  const T = ANALYTICS_TEXTS.drilldown;
  const tableStyles = ANALYTICS_STYLES.table;
  const badgeStyles = ANALYTICS_STYLES.levelBadge;

  const formattedDate = formatDisplayDate(date);
  const summary = drilldown?.summary;
  const stages = drilldown?.bottleneck_analysis?.stages || [];

  const totalPatients =
    summary?.total_patients ?? fallbackSummary?.total_patients ?? 0;
  const avgTotalTime =
    summary?.avg_total_time ?? fallbackSummary?.avg_total_time ?? null;
  const peakHour = summary?.peak_hour ?? '—';
  const bottleneckStage = summary?.bottleneck_stage ?? '—';
  const systemStatus = summary?.system_status || 'Normal';
  const systemReason =
    summary?.system_reason || drilldown?.bottleneck_analysis?.system_reason || '';

  const statusBadgeClass =
    badgeStyles[systemStatus as keyof typeof badgeStyles] || badgeStyles['No Data'];

  return (
    <div className={S.banner}>
      {/* Header Bar */}
      <div className={S.header}>
        <div className={S.titleBlock}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className={S.title}>
              <i className="bx bx-calendar-check text-[#a8071a] dark:text-[#f87171] text-2xl" />
              <span>{T.title}</span>
            </h3>
            <span className={S.dateBadge}>
              <i className="bx bx-target-lock text-sm" />
              <span>{date}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-[#242424] dark:text-[#f5f5f5] border border-slate-200 dark:border-[#2e2e2e]">
              {T.activeBadge}
            </span>
          </div>
          <p className={S.subtitle}>
            {T.subtitle} <span className="font-semibold text-content">{formattedDate}</span>
          </p>
        </div>

        <div className={S.headerActions}>
          <button
            type="button"
            onClick={onClose}
            className={S.resetBtn}
            aria-label={T.clearAria}
          >
            <i className="bx bx-arrow-back text-sm" />
            <span>{T.resetButton}</span>
          </button>
        </div>
      </div>

      {/* Loading state with fallback metrics */}
      {loading && !drilldown && (
        <div className={S.loadingNotice}>
          <span className={S.spinner} />
          <span>{T.loading} {formattedDate}...</span>
        </div>
      )}

      {/* Error state */}
      {error && !drilldown && (
        <div className={S.errorBanner}>
          <div className="flex items-center gap-2">
            <i className="bx bx-error-circle text-lg" />
            <span>{T.errorPrefix} {error}</span>
          </div>
          <button type="button" onClick={onRetry} className={S.retryBtn}>
            {T.retryButton}
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={S.kpiGrid}>
        {/* 1. Total Patients */}
        <div className={S.kpiCard}>
          <span className={S.kpiLabel}>{T.patientsSeen}</span>
          <span className={S.kpiValue}>
            {totalPatients}{' '}
            <span className="text-xs font-semibold text-content-muted">
              {T.patientsUnit}
            </span>
          </span>
          <span className={S.kpiSub}>{formattedDate}</span>
        </div>

        {/* 2. Avg Total Journey Time */}
        <div className={S.kpiCard}>
          <span className={S.kpiLabel}>{T.avgTotalTime}</span>
          <span className={`${S.kpiValue} font-mono`}>
            {avgTotalTime !== null ? formatMinutesToHMS(avgTotalTime) : '—'}
          </span>
          <span className={S.kpiSub}>{T.avgTotalTimeSub}</span>
        </div>

        {/* 3. Peak Arrival Hour */}
        <div className={S.kpiCard}>
          <span className={S.kpiLabel}>{T.peakHour}</span>
          <span className={S.kpiValue}>{peakHour}</span>
          <span className={S.kpiSub}>{T.peakHourSub}</span>
        </div>

        {/* 4. Primary Bottleneck Stage */}
        <div className={S.kpiCard}>
          <span className={S.kpiLabel}>{T.primaryBottleneck}</span>
          <span className="mt-1 text-base md:text-lg font-bold text-content break-words">
            {bottleneckStage}
          </span>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className={`${badgeStyles.base} ${statusBadgeClass}`}>
              {systemStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Reasoning Banner if present */}
      {systemReason && (
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-muted p-3.5 text-xs text-content-muted leading-relaxed">
          <i className="bx bx-info-circle text-slate-600 dark:text-[#a3a3a3] text-base shrink-0 mt-0.5" />
          <span>{systemReason}</span>
        </div>
      )}

      {/* Bottleneck Stages Breakdown Table for This Date */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-sm font-bold text-content flex items-center gap-2">
            <i className="bx bx-git-commit text-brand-accent text-base" />
            <span>{T.bottleneckSectionTitle}</span>
          </h4>
          <p className="text-xs text-content-muted">
            {T.bottleneckSectionSubtitle}
          </p>
        </div>

        {stages.length === 0 && !loading ? (
          <div className={S.emptyNotice}>
            <i className="bx bx-folder-open text-2xl text-content-subtle" />
            <span>{T.emptyForDate}</span>
          </div>
        ) : (
          <div className={tableStyles.wrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr className={tableStyles.headRow}>
                  <th className={tableStyles.th}>{T.headers.stage}</th>
                  <th className={tableStyles.th}>{T.headers.avgTime}</th>
                  <th className={tableStyles.th}>{T.headers.patients}</th>
                  <th className={tableStyles.th}>{T.headers.level}</th>
                  <th className={tableStyles.th}>{T.headers.reason}</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => {
                  const badgeStyle = badgeStyles[stage.level] || badgeStyles['No Data'];
                  return (
                    <tr key={stage.stage_key} className={tableStyles.row}>
                      <td className={`${tableStyles.td} whitespace-nowrap font-bold text-content`}>
                        {stage.stage_label}
                      </td>
                      <td className={`${tableStyles.td} whitespace-nowrap font-mono text-content`}>
                        {stage.level === 'No Data' ? '—' : formatMinutesToHMS(stage.avg_minutes)}
                      </td>
                      <td className={`${tableStyles.td} whitespace-nowrap font-semibold`}>
                        {stage.patient_count}
                      </td>
                      <td className={`${tableStyles.td} whitespace-nowrap`}>
                        <span className={`${badgeStyles.base} ${badgeStyle}`}>
                          {stage.level}
                        </span>
                      </td>
                      <td className={`${tableStyles.td} max-w-md leading-relaxed text-content-muted break-words`}>
                        {stage.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
