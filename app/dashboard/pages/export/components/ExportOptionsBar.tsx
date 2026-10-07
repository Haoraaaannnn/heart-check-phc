/**
 * @fileoverview Export parameters and configuration toolbar component.
 *
 * Provides interactive mode selection tabs (Single Day, Calendar Month, Rolling Range),
 * clinical department filtering, file format cards (.xlsx vs .csv), and compliance summary toggles.
 *
 * @remarks
 * Conforms strictly to AGENTS.md separation of concerns, solid surfaces, and zero emojis.
 *
 * @module app/dashboard/pages/export/components/ExportOptionsBar
 */

'use client';

import React from 'react';
import {
  EXPORT_DATE_MODES,
  EXPORT_SERVICE_OPTIONS,
} from '../constants/export';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import { ExportDateMode, ExportFileFormat, ExportOptions } from '../types/exportTypes';

/**
 * Properties for the {@link ExportOptionsBar} component.
 */
export interface ExportOptionsBarProps {
  /** Active export options. */
  options: ExportOptions;
  /** Dispatcher function to update options. */
  onOptionsChange: React.Dispatch<React.SetStateAction<ExportOptions>>;
  /** Whether an export request is actively in progress. */
  disabled?: boolean;
}

/**
 * Export configuration toolbar component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportOptionsBar({
  options,
  onOptionsChange,
  disabled = false,
}: ExportOptionsBarProps): React.ReactElement {
  const S = EXPORT_STYLES.options;
  const T = EXPORT_TEXTS.options;

  const handleModeChange = (mode: ExportDateMode) => {
    onOptionsChange((prev) => ({ ...prev, mode }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onOptionsChange((prev) => ({ ...prev, selectedService: val }));
  };

  const handleFormatChange = (format: ExportFileFormat) => {
    onOptionsChange((prev) => ({ ...prev, format }));
  };

  const handleSummaryToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onOptionsChange((prev) => ({ ...prev, includeSummaryBlock: checked }));
  };

  return (
    <div className={S.card}>
      <div className={S.header}>
        <h2 className={S.title}>{T.title}</h2>
        <p className={S.subtitle}>{T.subtitle}</p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="mb-6">
        <label className={S.fieldLabel}>
          <span>{T.modeLabel}</span>
        </label>
        <div className={S.modeTabs}>
          {EXPORT_DATE_MODES.map((m) => {
            const isActive = options.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                disabled={disabled}
                className={isActive ? S.modeTab.active : S.modeTab.idle}
              >
                <i className={`bx ${m.icon} text-base`} aria-hidden="true" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={S.grid}>
        {/* Clinical Service Filter */}
        <div className={S.field}>
          <label htmlFor="export-service-select" className={S.fieldLabel}>
            <span>{T.serviceLabel}</span>
          </label>
          <select
            id="export-service-select"
            value={options.selectedService}
            onChange={handleServiceChange}
            disabled={disabled}
            className={S.select}
          >
            {EXPORT_SERVICE_OPTIONS.map((svc) => (
              <option
                key={svc.value}
                value={svc.value}
                className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]"
              >
                {svc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Serialization File Format */}
        <div className={S.field}>
          <label className={S.fieldLabel}>
            <span>{T.formatLabel}</span>
          </label>
          <div className={S.formatCardsGrid}>
            {/* Excel Option */}
            <div
              onClick={() => !disabled && handleFormatChange('xlsx')}
              className={options.format === 'xlsx' ? S.formatCard.active : S.formatCard.idle}
              role="radio"
              aria-checked={options.format === 'xlsx'}
              tabIndex={0}
            >
              <div className={S.formatTitle}>
                <i className="bx bxs-file-export text-emerald-600 dark:text-emerald-400" />
                <span>{T.formatOptions.xlsxTitle}</span>
              </div>
              <p className={S.formatDesc}>{T.formatOptions.xlsxDesc}</p>
            </div>

            {/* CSV Option */}
            <div
              onClick={() => !disabled && handleFormatChange('csv')}
              className={options.format === 'csv' ? S.formatCard.active : S.formatCard.idle}
              role="radio"
              aria-checked={options.format === 'csv'}
              tabIndex={0}
            >
              <div className={S.formatTitle}>
                <i className="bx bx-table text-blue-600 dark:text-blue-400" />
                <span>{T.formatOptions.csvTitle}</span>
              </div>
              <p className={S.formatDesc}>{T.formatOptions.csvDesc}</p>
            </div>
          </div>
        </div>

        {/* Summary Compliance Block Toggle */}
        <div className={S.field}>
          <label className={S.fieldLabel}>
            <span>Compliance Audit Formulas</span>
          </label>
          <div className={S.toggleCard}>
            <input
              id="export-summary-toggle"
              type="checkbox"
              checked={options.includeSummaryBlock}
              onChange={handleSummaryToggle}
              disabled={disabled || options.format === 'csv'}
              className={S.checkbox}
            />
            <div className={S.toggleTextBlock}>
              <label htmlFor="export-summary-toggle" className={S.toggleTitle}>
                {T.summaryToggleLabel}
              </label>
              <p className={S.toggleHelp}>{T.summaryToggleDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
