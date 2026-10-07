/**
 * @fileoverview Documentation guide component detailing PHC hospital export standards.
 *
 * Details the official Out-Patient Division time and motion workbook layout,
 * 10-column milestone architecture, bottom 4-row compliance summary formula derivations,
 * and Asia/Manila (UTC+8) timezone normalization rules.
 *
 * @remarks
 * Strictly conforms to AGENTS.md high-contrast solid surface standards and zero emojis.
 *
 * @module app/dashboard/pages/export/components/ExportFormatGuide
 */

'use client';

import React from 'react';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';

/**
 * Hospital export format guideline card component.
 *
 * @returns Rendered JSX element.
 */
export default function ExportFormatGuide(): React.ReactElement {
  const S = EXPORT_STYLES.guide;
  const T = EXPORT_TEXTS.formatGuide;

  return (
    <div className={S.card}>
      <h2 className={S.title}>
        <i className="bx bx-info-circle text-[#a8071a] dark:text-rose-400 text-lg" aria-hidden="true" />
        <span>{T.title}</span>
      </h2>
      <p className={S.subtitle}>{T.subtitle}</p>

      <div className={S.grid}>
        {/* Multi-Sheet Workbook Layout */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-file text-sm text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{T.workbookTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.workbookDesc}</p>
        </div>

        {/* 10-Column Data Architecture */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-grid-alt text-sm text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>{T.columnsTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.columnsDesc}</p>
        </div>

        {/* 4-Row Compliance Summary */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-calculator text-sm text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>{T.summaryTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.summaryDesc}</p>
        </div>

        {/* Timezone Normalization */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-time text-sm text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{T.timezoneTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.timezoneDesc}</p>
        </div>
      </div>
    </div>
  );
}
