/**
 * @fileoverview Header banner component for the Admin Dashboard Import Data page.
 *
 * Displays domain title, operational subtitle, breadcrumb navigation, and
 * a return link back to the main dashboard overview surface.
 *
 * @module app/dashboard/pages/import/components/ImportHeader
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';

/**
 * Top header component for the Import Data page.
 *
 * @returns Rendered JSX element.
 */
export default function ImportHeader(): React.ReactElement {
  const S = IMPORT_STYLES.header;
  const T = IMPORT_TEXTS.header;

  return (
    <div className={S.root}>
      <div className={S.topRow}>
        <div className={S.titleBlock}>
          <div className={S.breadcrumb}>{T.breadcrumb}</div>
          <h1 className={S.title}>{T.title}</h1>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>
        <div>
          <Link href="/dashboard" className={S.backLink}>
            <i className="bx bx-arrow-back text-base" />
            <span>{T.backToDashboard}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
