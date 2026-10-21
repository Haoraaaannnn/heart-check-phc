/**
 * @fileoverview Floating notification banner for Click-to-Select patient transfer mode.
 *
 * Appears dynamically when a patient is actively selected for transfer (from the queue,
 * a cubicle, or a registration counter), providing unambiguous context instructions,
 * origin metadata, and an accessible cancellation action.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/SelectionBanner
 */

'use client';

import React from 'react';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';
import { transferTexts } from '@/constants/texts/transferTexts';
import { TransferStyle } from '@/app/transfer/constants/transfer';
import { selectionBannerStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link SelectionBanner}.
 */
export interface SelectionBannerProps {
  /** Currently selected patient awaiting target assignment, or null. */
  selectedPatient: SelectedTransferPatient | null;
  /** Callback to clear the active selection. */
  onCancel: () => void;
}

/**
 * Floating user guidance banner rendered during Click-to-Select interaction.
 *
 * @param props - Active selection state and cancellation handler.
 * @returns The rendered selection banner, or null if no patient is selected.
 */
export function SelectionBanner({ selectedPatient, onCancel }: SelectionBannerProps) {
  if (!selectedPatient) return null;

  const { patient, sourceType, sourceId } = selectedPatient;

  // Derive contextual instruction text based on origin
  let hintText: string;
  let originLabel: string;

  if (sourceType === 'queue') {
    hintText = transferTexts.selectedQueuePatientHint;
    originLabel = transferTexts.queueTabTitle;
  } else if (sourceType === 'cubicle') {
    hintText = transferTexts.selectedCubiclePatientHint;
    originLabel = `Cubicle ${sourceId}`;
  } else {
    hintText = transferTexts.selectedCounterPatientHint;
    originLabel = `${transferTexts.counterPrefix} ${sourceId}`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={TransferStyle.selectionBanner}
      className={selectionBannerStyles.banner}
    >
      {/* Patient Information & Instructions */}
      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={selectionBannerStyles.patientNumBadge}>
            {patient.patientNum}
          </span>
          <span className={selectionBannerStyles.originLabel}>
            ({originLabel})
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={selectionBannerStyles.hintText}>
            {hintText}
          </p>
          <p className={selectionBannerStyles.serviceText}>
            {patient.service}
            {patient.subcategory && ` · ${patient.subcategory}`}
          </p>
        </div>
      </div>

      {/* Cancel Action Button */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button
          type="button"
          onClick={onCancel}
          className={selectionBannerStyles.cancelBtn}
        >
          <span>{transferTexts.cancelSelection}</span>
          <kbd className={selectionBannerStyles.kbdKey}>
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
}

export default SelectionBanner;
