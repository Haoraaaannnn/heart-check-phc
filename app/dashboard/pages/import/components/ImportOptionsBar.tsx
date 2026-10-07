/**
 * @fileoverview Ingestion configuration options toolbar component.
 *
 * Provides interactive controls to configure target clinic department assignment,
 * research baseline historical immutability (`is_historical`), and batch transaction size.
 *
 * @module app/dashboard/pages/import/components/ImportOptionsBar
 */

'use client';

import React from 'react';
import {
  BATCH_SIZE_OPTIONS,
  IMPORT_SERVICE_OPTIONS,
} from '@/app/dashboard/pages/import/constants/import';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';
import { ImportOptions } from '@/app/dashboard/pages/import/types/importTypes';

/**
 * Properties for the {@link ImportOptionsBar} component.
 */
export interface ImportOptionsBarProps {
  /** Active ingestion configuration options. */
  options: ImportOptions;
  /** Callback fired to update option settings. */
  onOptionsChange: React.Dispatch<React.SetStateAction<ImportOptions>>;
  /** Whether processing is actively underway (disables inputs). */
  disabled?: boolean;
}

/**
 * Ingestion parameters bar component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ImportOptionsBar({
  options,
  onOptionsChange,
  disabled = false,
}: ImportOptionsBarProps): React.ReactElement {
  const S = IMPORT_STYLES.options;
  const T = IMPORT_TEXTS.options;

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onOptionsChange((prev) => ({ ...prev, service: val }));
  };

  const handleBatchSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    onOptionsChange((prev) => ({ ...prev, batchSize: val }));
  };

  const handleHistoricalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onOptionsChange((prev) => ({ ...prev, isHistorical: checked }));
  };

  return (
    <div className={S.card}>
      <div className={S.header}>
        <h3 className={S.title}>{T.title}</h3>
        <p className={S.subtitle}>{T.subtitle}</p>
      </div>

      <div className={S.grid}>
        {/* Target Clinical Service */}
        <div className={S.field}>
          <label htmlFor="import-service-select" className={S.label}>
            <span>{T.serviceLabel}</span>
          </label>
          <select
            id="import-service-select"
            value={options.service}
            onChange={handleServiceChange}
            disabled={disabled}
            className={S.select}
          >
            {IMPORT_SERVICE_OPTIONS.map((svc) => (
              <option key={svc} value={svc} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Insert Size */}
        <div className={S.field}>
          <label htmlFor="import-batch-select" className={S.label}>
            <span>{T.batchSizeLabel}</span>
          </label>
          <select
            id="import-batch-select"
            value={options.batchSize}
            onChange={handleBatchSizeChange}
            disabled={disabled}
            className={S.select}
          >
            {BATCH_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
                {size} records / batch
              </option>
            ))}
          </select>
        </div>

        {/* Historical Research Baseline Flag */}
        <div className={S.toggleCard}>
          <input
            id="import-historical-toggle"
            type="checkbox"
            checked={options.isHistorical}
            onChange={handleHistoricalToggle}
            disabled={disabled}
            className={S.checkbox}
          />
          <div className={S.toggleTextBlock}>
            <label htmlFor="import-historical-toggle" className={S.toggleTitle}>
              {T.historicalToggleLabel}
            </label>
            <p className={S.toggleHelp}>{T.historicalToggleDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
