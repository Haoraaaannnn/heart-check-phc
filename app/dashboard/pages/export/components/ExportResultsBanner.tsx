/**
 * @fileoverview Post-export completion telemetry banner component.
 *
 * Displays download confirmation, serialized filename, target scope metrics,
 * and direct deep links to Patient Flow & Records and Forecasting & Analytics.
 *
 * @remarks
 * Conforms strictly to AGENTS.md high-contrast solid surface and no text truncation rules.
 *
 * @module app/dashboard/pages/export/components/ExportResultsBanner
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';

/**
 * Properties for the {@link ExportResultsBanner} component.
 */
export interface ExportResultsBannerProps {
  /** Download confirmation result. */
  result: {
    filename: string;
    periodLabel: string;
    format: string;
    timestamp: string;
  } | null;
  /** Action handler to dismiss the banner. */
  onDismiss: () => void;
}

/**
 * Export results confirmation banner component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element or null.
 */
export default function ExportResultsBanner({
  result,
  onDismiss,
}: ExportResultsBannerProps): React.ReactElement | null {
  const S = EXPORT_STYLES.results;
  const T = EXPORT_TEXTS.resultsBanner;

  if (!result) return null;

  return (
    <div className={S.banner} role="status">
      <div className={S.header}>
        <div className={S.iconWrapper}>
          <i className="bx bx-check-circle text-2xl" aria-hidden="true" />
        </div>

        <div className={S.content}>
          <h3 className={S.title}>{T.successTitle}</h3>
          <p className={S.subtitle}>{T.successSubtitle}</p>

          <div className={S.metricsGrid}>
            <div className={S.metricBox}>
              <div className={S.metricLabel}>Generated File</div>
              <div className="font-mono text-xs font-bold text-emerald-950 dark:text-emerald-100 break-words mt-0.5">
                {result.filename}
              </div>
            </div>

            <div className={S.metricBox}>
              <div className={S.metricLabel}>Timeframe Scope</div>
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                {result.periodLabel}
              </div>
            </div>

            <div className={S.metricBox}>
              <div className={S.metricLabel}>Serialized Format & Time</div>
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                {result.format} &bull; {result.timestamp}
              </div>
            </div>
          </div>

          <div className={S.actionsRow}>
            <Link href="/dashboard/pages/patients" className={S.primaryLink}>
              <i className="bx bx-male-female text-sm" aria-hidden="true" />
              <span>{T.viewPatients}</span>
            </Link>

            <Link href="/dashboard/pages/analytics" className={S.secondaryLink}>
              <i className="bx bx-bar-chart-alt-2 text-sm" aria-hidden="true" />
              <span>{T.viewAnalytics}</span>
            </Link>

            <button
              type="button"
              onClick={onDismiss}
              className={S.secondaryLink}
            >
              <i className="bx bx-plus text-sm" aria-hidden="true" />
              <span>{T.exportAnother}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
