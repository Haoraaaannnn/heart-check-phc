/**
 * @fileoverview Export button component to download queue metrics as an Excel workbook.
 *
 * @module app/dashboard/pages/analytics/components/ExportExcelButton
 */

'use client';

import { useState } from 'react';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface ExportExcelButtonProps {
  /** Selected date range string parameter. */
  range: string;
  /** Optional service filter. */
  service?: string;
  /** Optional status filter. */
  status?: string;
}

/**
 * Excel export action button with loading and error indicators.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ExportExcelButton({
  range,
  service,
  status,
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const S = ANALYTICS_STYLES.exportButton;
  const T = ANALYTICS_TEXTS.export;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams({ range });
      if (service) params.set('service', service);
      if (status) params.set('status', status);

      const res = await fetch(`${baseUrl}/api/export-excel?${params.toString()}`);

      if (!res.ok) {
        throw new Error(T.defaultError);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phc_patients_export_${range}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : T.defaultError);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={S.root}
      >
        {isExporting ? (
          <IconLoader2 className={S.spinner} />
        ) : (
          <IconDownload className="h-4 w-4" />
        )}
        <span>{isExporting ? T.buttonLoading : T.buttonIdle}</span>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
