/**
 * @fileoverview Post-ingestion completion banner component for the Admin Dashboard.
 *
 * Displays aggregated success metrics (total records inserted, rows skipped, date range)
 * and deep-linking buttons navigating directly to the Patients queue table or Analytics forecasting.
 *
 * @module app/dashboard/pages/import/components/ImportResultsBanner
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';

/**
 * Properties for the {@link ImportResultsBanner} component.
 */
export interface ImportResultsBannerProps {
  /** Aggregated results across all finished files. */
  summary: {
    totalFiles: number;
    successfulFiles: number;
    totalInserted: number;
    totalDropped: number;
    dateRange: { start: string | null; end: string | null };
  } | null;
  /** Callback to dismiss banner or import more files. */
  onDismiss: () => void;
}

/**
 * Completion telemetry banner component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element or null.
 */
export default function ImportResultsBanner({
  summary,
  onDismiss,
}: ImportResultsBannerProps): React.ReactElement | null {
  const S = IMPORT_STYLES.results;
  const T = IMPORT_TEXTS.results;

  if (!summary || summary.totalFiles === 0) {
    return null;
  }

  const dateSpanStr =
    summary.dateRange.start && summary.dateRange.end
      ? `${summary.dateRange.start} to ${summary.dateRange.end}`
      : 'Recorded Dates';

  return (
    <div className={S.banner} role="status">
      <div className={S.header}>
        <div className={S.iconWrapper}>
          <i className="bx bx-check-circle text-2xl" />
        </div>
        <div className={S.content}>
          <h3 className={S.title}>{T.successTitle}</h3>
          <p className={S.subtitle}>{T.successSubtitle}</p>

          <div className={S.metricsGrid}>
            <div className={S.metricBox}>
              <div className={S.metricLabel}>{T.metrics.inserted}</div>
              <div className={S.metricVal}>{summary.totalInserted.toLocaleString()}</div>
            </div>

            <div className={S.metricBox}>
              <div className={S.metricLabel}>{T.metrics.dropped}</div>
              <div className={S.metricVal}>{summary.totalDropped.toLocaleString()}</div>
            </div>

            <div className={S.metricBox}>
              <div className={S.metricLabel}>{T.metrics.sheets}</div>
              <div className={S.metricVal}>{summary.successfulFiles} of {summary.totalFiles} files</div>
            </div>

            <div className={S.metricBox}>
              <div className={S.metricLabel}>{T.metrics.dateSpan}</div>
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 mt-1">{dateSpanStr}</div>
            </div>
          </div>

          <div className={S.actionsRow}>
            <Link href="/dashboard/pages/patients" className={S.primaryLink}>
              <i className="bx bx-male-female text-sm" />
              <span>{T.viewPatientsButton}</span>
            </Link>

            <Link
              href={
                summary.dateRange.start
                  ? `/dashboard/pages/analytics?range=${summary.dateRange.start.slice(0, 4)}`
                  : '/dashboard/pages/analytics?range=all'
              }
              className={S.secondaryLink}
            >
              <i className="bx bx-bar-chart-alt-2 text-sm" />
              <span>{T.viewAnalyticsButton}</span>
            </Link>

            <button
              type="button"
              onClick={onDismiss}
              className={S.secondaryLink}
            >
              <i className="bx bx-plus text-sm" />
              <span>{T.importMoreButton}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
