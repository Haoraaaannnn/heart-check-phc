/**
 * @fileoverview Export specification and sheet architecture preview card component.
 *
 * Displays predicted file metadata, workbook worksheet layout, the authoritative 10-column
 * milestone structure (Columns A through J), and the hospital 4-row compliance summary block.
 * Features the primary action button to trigger file generation and download.
 *
 * @remarks
 * Conforms strictly to AGENTS.md high-contrast solid surface and no text truncation rules.
 *
 * @module app/dashboard/pages/export/components/ExportPreviewCard
 */

'use client';

import React from 'react';
import {
  COMPLIANCE_FORMULAS_INFO,
  EXPORT_COLUMNS_INFO,
} from '../constants/export';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import { ExportOptions } from '../types/exportTypes';

/**
 * Properties for the {@link ExportPreviewCard} component.
 */
export interface ExportPreviewCardProps {
  /** Active export options. */
  options: ExportOptions;
  /** Human-readable period scope string. */
  targetPeriodLabel: string;
  /** Predicted filename. */
  predictedFilename: string;
  /** Whether export is actively generating. */
  isExporting: boolean;
  /** Whether current parameters permit exporting. */
  canExport: boolean;
  /** Action handler to generate and download file. */
  onExport: () => void;
  /** Optional error message to display. */
  error?: string | null;
}

/**
 * Export specification and preview card component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportPreviewCard({
  options,
  targetPeriodLabel,
  predictedFilename,
  isExporting,
  canExport,
  onExport,
  error,
}: ExportPreviewCardProps): React.ReactElement {
  const S = EXPORT_STYLES.preview;
  const T = EXPORT_TEXTS.preview;

  const serviceLabel =
    options.selectedService === 'all'
      ? T.allServicesTag
      : options.selectedService;

  const layoutDescription =
    options.format === 'csv'
      ? T.flatCsvStructure
      : options.mode === 'specific'
      ? T.singleSheetStructure
      : T.multiSheetStructure;

  return (
    <div className={S.card}>
      <div className={S.header}>
        <div>
          <h2 className={S.title}>{T.title}</h2>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>
      </div>

      {/* Specification Attributes Grid */}
      <div className={S.specGrid}>
        {/* Target Scope */}
        <div className={S.specBox}>
          <span className={S.specLabel}>{T.targetPeriodLabel}</span>
          <div className={S.specValue}>{targetPeriodLabel}</div>
          <span className={S.specHelp}>Timeframe scope</span>
        </div>

        {/* Clinical Service */}
        <div className={S.specBox}>
          <span className={S.specLabel}>{T.serviceFilterLabel}</span>
          <div className={S.specValue}>{serviceLabel}</div>
          <span className={S.specHelp}>Departmental filter</span>
        </div>

        {/* Output Filename */}
        <div className={S.specBox}>
          <span className={S.specLabel}>{T.outputFilenameLabel}</span>
          <div className="font-mono text-xs font-bold text-[#a8071a] dark:text-rose-400 break-words">
            {predictedFilename}
          </div>
          <span className={S.specHelp}>Serialized format</span>
        </div>

        {/* Layout Structure */}
        <div className={S.specBox}>
          <span className={S.specLabel}>{T.sheetStructureLabel}</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {options.format === 'csv' ? 'Tabular CSV' : 'PHC Multi-Sheet'}
          </div>
          <span className={S.specHelp}>{layoutDescription}</span>
        </div>
      </div>

      {/* Milestone Columns Included (Columns A to J) */}
      {options.format === 'xlsx' && (
        <div className={S.milestonesContainer}>
          <h3 className={S.milestonesTitle}>{T.milestonesTitle}</h3>
          <div className={S.milestonesGrid}>
            {EXPORT_COLUMNS_INFO.map((col) => (
              <div key={col.col} className={S.milestoneChip} title={col.description}>
                <div className={S.milestoneCol}>Column {col.col}</div>
                <div className={S.milestoneName}>
                  {col.header1} {col.header2}
                </div>
                <div className={S.milestoneField}>({col.field})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4-Row Compliance Summary Formulas */}
      {options.format === 'xlsx' && options.includeSummaryBlock && (
        <div className={S.formulasContainer}>
          <div className={S.formulasHeader}>{T.complianceSummaryTitle}</div>
          <div className={S.formulasGrid}>
            {COMPLIANCE_FORMULAS_INFO.map((item) => (
              <div key={item.row} className={S.formulaItem}>
                <div className={S.formulaIndicator}>{item.indicator}</div>
                <div className={S.formulaTarget}>Target Standard: {item.target}</div>
                <div className={S.formulaCode}>Formula: {item.formula}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert if any */}
      {error && (
        <div
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <i className="bx bx-error-circle text-base" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Generation and Download Action Row */}
      <div className={S.actionRow}>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Ready to export patient records matching the selected parameters.
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={!canExport || isExporting}
          className={S.downloadButton}
        >
          {isExporting ? (
            <>
              <i className="bx bx-loader-alt text-base animate-spin" aria-hidden="true" />
              <span>{T.downloadButtonLoading}</span>
            </>
          ) : (
            <>
              <i className="bx bx-download text-base" aria-hidden="true" />
              <span>{T.downloadButtonIdle}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
