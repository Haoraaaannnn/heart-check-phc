/**
 * @fileoverview Modal dialog displaying extracted sheet structure and sample records preview.
 *
 * Renders parsed summary metrics (total rows, valid records, dropped rows, date range,
 * sheets count) and a data table of the first 10 extracted rows for human review
 * before committing to PostgreSQL.
 *
 * @module app/dashboard/pages/import/components/FilePreviewModal
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';
import { StagedFile } from '@/app/dashboard/pages/import/types/importTypes';

/**
 * Properties for the {@link FilePreviewModal} component.
 */
export interface FilePreviewModalProps {
  /** The staged file whose preview data is currently open. */
  file: StagedFile | null;
  /** Callback fired to close the modal. */
  onClose: () => void;
  /** Callback fired to commit this file to the database. */
  onConfirm: (id: string) => void;
}

/**
 * Inspection preview modal dialog component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element or null.
 */
export default function FilePreviewModal({
  file,
  onClose,
  onConfirm,
}: FilePreviewModalProps): React.ReactElement | null {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const S = IMPORT_STYLES.modal;
  const T = IMPORT_TEXTS.previewModal;

  if (!file || !file.previewData) {
    return null;
  }

  const p = file.previewData;
  const dateRangeStr =
    p.date_range.start && p.date_range.end
      ? `${p.date_range.start} to ${p.date_range.end}`
      : 'N/A';

  const modalContent = (
    <div className={S.backdrop} role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
      <div className={S.container}>
        {/* Modal Header */}
        <div className={S.header}>
          <div className={S.titleBlock}>
            <h2 id="preview-modal-title" className={S.title}>
              {T.title} - {file.name}
            </h2>
            <p className={S.subtitle}>{T.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={S.closeButton}
            aria-label="Close dialog"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={S.body}>
          {/* KPI Metrics Summary Grid */}
          <div className={S.kpiGrid}>
            <div className={S.kpiCard}>
              <div className={S.kpiLabel}>{T.summaryCards.totalRows}</div>
              <div className={S.kpiValue}>{p.total_extracted.toLocaleString()}</div>
            </div>

            <div className={S.kpiCard}>
              <div className={S.kpiLabel}>{T.summaryCards.validRows}</div>
              <div className={`${S.kpiValue} text-emerald-600 dark:text-emerald-400`}>
                {p.valid_records.toLocaleString()}
              </div>
            </div>

            <div className={S.kpiCard}>
              <div className={S.kpiLabel}>{T.summaryCards.droppedRows}</div>
              <div className={`${S.kpiValue} ${p.dropped_records > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {p.dropped_records.toLocaleString()}
              </div>
            </div>

            <div className={S.kpiCard}>
              <div className={S.kpiLabel}>{T.summaryCards.sheetsProcessed}</div>
              <div className={S.kpiValue}>{p.sheets_processed.length}</div>
            </div>

            <div className={S.kpiCard}>
              <div className={S.kpiLabel}>{T.summaryCards.dateRange}</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#f5f5f5] mt-1">
                {dateRangeStr}
              </div>
            </div>
          </div>

          {/* Sample Records Table */}
          <div>
            <div className={S.tableTitle}>{T.previewTableTitle}</div>
            <div className={S.tableWrapper}>
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 dark:border-[#2e2e2e] dark:bg-[#242424] dark:text-[#f5f5f5]">
                  <tr>
                    <th className="px-3 py-2">{T.tableColumns.patientNum}</th>
                    <th className="px-3 py-2">{T.tableColumns.service}</th>
                    <th className="px-3 py-2">{T.tableColumns.queuingTime}</th>
                    <th className="px-3 py-2">{T.tableColumns.initialAssessment}</th>
                    <th className="px-3 py-2">{T.tableColumns.doctorSeen}</th>
                    <th className="px-3 py-2">{T.tableColumns.doctorCompleted}</th>
                    <th className="px-3 py-2">{T.tableColumns.carryOut}</th>
                    <th className="px-3 py-2">{T.tableColumns.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#2e2e2e] dark:bg-[#1a1a1a]">
                  {p.preview_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-[#242424]/60">
                      <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-[#f5f5f5]">
                        {row.patientNum || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-[#a3a3a3]">
                        {row.service || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-[#a3a3a3] font-mono text-[11px]">
                        {row.reg_start ? String(row.reg_start).slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-[#a3a3a3] font-mono text-[11px]">
                        {row.reg_end ? String(row.reg_end).slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-[#a3a3a3] font-mono text-[11px]">
                        {row.consult_start ? String(row.consult_start).slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-[#a3a3a3] font-mono text-[11px]">
                        {row.consult_end ? String(row.consult_end).slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-[#a3a3a3] font-mono text-[11px]">
                        {row.carryout_end ? String(row.carryout_end).slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {row.status || 'Done'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={S.footer}>
          <button type="button" onClick={onClose} className={S.cancelBtn}>
            {T.cancelButton}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(file.id)}
            className={S.confirmBtn}
          >
            <i className="bx bx-check text-base" />
            <span>{T.confirmButton}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
