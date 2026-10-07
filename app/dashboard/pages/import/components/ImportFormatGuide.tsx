/**
 * @fileoverview Documentation guide component explaining accepted file schemas and formats.
 *
 * Details the column layout requirements for official PHC Time and Motion Analysis workbooks
 * and generic tabular queue CSV datasets.
 *
 * @module app/dashboard/pages/import/components/ImportFormatGuide
 */

'use client';

import React from 'react';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';

/**
 * Format guide explanatory card component.
 *
 * @returns Rendered JSX element.
 */
export default function ImportFormatGuide(): React.ReactElement {
  const S = IMPORT_STYLES.guide;
  const T = IMPORT_TEXTS.formatGuide;

  return (
    <div className={S.card}>
      <h3 className={S.title}>
        <i className="bx bx-info-circle text-[#a8071a] dark:text-rose-400" />
        <span>{T.title}</span>
      </h3>
      <p className={S.subtitle}>{T.subtitle}</p>

      <div className={S.grid}>
        {/* PHC Time & Motion Format */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-file text-sm text-emerald-600 dark:text-emerald-400" />
            <span>{T.phcTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.phcDesc}</p>
          <div className={S.columnsTag}>
            <span className="font-bold text-slate-900 dark:text-[#f5f5f5]">Columns: </span>
            <span>{T.phcColumns}</span>
          </div>
        </div>

        {/* Tabular CSV Format */}
        <div className={S.formatBox}>
          <div className={S.formatTitle}>
            <i className="bx bx-table text-sm text-blue-600 dark:text-blue-400" />
            <span>{T.csvTitle}</span>
          </div>
          <p className={S.formatDesc}>{T.csvDesc}</p>
          <div className={S.columnsTag}>
            <span className="font-bold text-slate-900 dark:text-[#f5f5f5]">Columns: </span>
            <span>{T.csvColumns}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
