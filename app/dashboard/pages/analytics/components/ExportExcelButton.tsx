/**
 * @fileoverview Export button component that triggers the month-selection modal
 * to download queue metrics as a PHC-formatted Excel workbook.
 *
 * @module app/dashboard/pages/analytics/components/ExportExcelButton
 */

'use client';

import { useState } from 'react';
import {
  ANALYTICS_STYLES,
  ANALYTICS_ICONS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import ExportExcelModal from '@/app/dashboard/pages/analytics/components/ExportExcelModal';

/**
 * Properties for the ExportExcelButton component.
 */
interface ExportExcelButtonProps {
  /** Optional date range string parameter maintained for backwards compatibility. */
  range?: string;
  /** Optional service filter. */
  service?: string;
  /** Optional status filter. */
  status?: string;
}

/**
 * Excel export action button that triggers the date and month picker modal dialog.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ExportExcelButton({
  service,
}: ExportExcelButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const S = ANALYTICS_STYLES.exportButton;
  const T = ANALYTICS_TEXTS.export;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={S.root}
      >
        <i className={`bx ${ANALYTICS_ICONS.download} h-4 w-4 text-base`} aria-hidden="true" />
        <span>{T.buttonIdle}</span>
      </button>

      {isModalOpen && (
        <ExportExcelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultService={service}
        />
      )}
    </>
  );
}
