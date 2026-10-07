/**
 * @fileoverview Header banner component for the Admin Dashboard Export Data page.
 *
 * Displays domain title, operational subtitle, breadcrumb navigation, and
 * quick-navigation links to Import Data, Patient Flow, and main Overview.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: pure assembly and rendering, no emojis, full JSDoc.
 *
 * @module app/dashboard/pages/export/components/ExportHeader
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';

/**
 * Properties for the {@link ExportHeader} component.
 */
export interface ExportHeaderProps {
  /** Whether date availability is actively refreshing. */
  isRefreshing?: boolean;
  /** Action handler to trigger fresh availability polling. */
  onRefresh?: () => void;
}

/**
 * Top header component for the Export Data page.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportHeader({
  isRefreshing = false,
  onRefresh,
}: ExportHeaderProps): React.ReactElement {
  const S = EXPORT_STYLES.header;
  const T = EXPORT_TEXTS.header;

  return (
    <div className={S.root}>
      <div className={S.topRow}>
        <div className={S.titleBlock}>
          <div className={S.breadcrumb}>{T.breadcrumb}</div>
          <h1 className={S.title}>{T.title}</h1>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>

        <div className={S.actionButtons}>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={S.refreshButton}
              title="Poll the database for newly registered or imported patient dates"
            >
              <i
                className={`bx bx-refresh text-base ${isRefreshing ? 'animate-spin text-[#a8071a]' : ''}`}
                aria-hidden="true"
              />
              <span>{T.refreshDatesButton}</span>
            </button>
          )}

          <Link href="/dashboard/pages/import" className={S.navLink}>
            <i className="bx bx-cloud-upload text-base text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{T.importDataLink}</span>
          </Link>

          <Link href="/dashboard" className={S.navLink}>
            <i className="bx bx-arrow-back text-base" aria-hidden="true" />
            <span>{T.backToDashboard}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
