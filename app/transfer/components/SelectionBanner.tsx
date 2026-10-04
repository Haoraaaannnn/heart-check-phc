/**
 * @fileoverview Floating notification banner for Click-to-Select patient transfer mode.
 *
 * Appears dynamically when a patient is actively selected for transfer (from the queue,
 * a cubicle, or a registration counter), providing unambiguous context instructions,
 * origin metadata, and an accessible cancellation action.
 *
 * @module app/transfer/components/SelectionBanner
 */

'use client';

import React from 'react';
import { SelectedTransferPatient } from '../types/transfer';
import { transferTexts } from '../constants/transferTexts';
import { TransferStyle } from '../constants/transfer';

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl p-3.5 px-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Patient Information & Instructions */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-[#cc3535] text-white font-black text-xs shadow-xs">
            {patient.patientNum}
          </span>
          <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
            ({originLabel})
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-emerald-400 truncate">
            {hintText}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {patient.service}
            {patient.subcategory && ` · ${patient.subcategory}`}
          </p>
        </div>
      </div>

      {/* Cancel Action Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600/60 transition-all cursor-pointer min-h-[40px]"
        >
          <i className="bx bx-x text-base" aria-hidden="true" />
          <span>{transferTexts.cancelSelection}</span>
          <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
}

export default SelectionBanner;
