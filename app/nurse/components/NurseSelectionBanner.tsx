/**
 * @fileoverview Floating context banner component for Click-to-Select tablet mode.
 *
 * Appears dynamically when a patient is selected, providing unambiguous visual feedback,
 * patient identity, destination instructions, and a 1-tap cancel action.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { SelectedNursePatient } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';
import { NurseStyle } from '../constants/nurse';

/**
 * Props for the NurseSelectionBanner component.
 */
export interface NurseSelectionBannerProps {
  /** The actively selected patient awaiting stage transition, or null if idle. */
  selectedPatient: SelectedNursePatient | null;
  /** Callback to cancel and clear the active selection. */
  onCancel: () => void;
}

/**
 * Floating user guidance banner rendered during Click-to-Select tablet interactions.
 *
 * @param props - Selected patient model and cancellation callback.
 * @returns The rendered banner element or null if no patient is selected.
 */
export function NurseSelectionBanner({
  selectedPatient,
  onCancel,
}: NurseSelectionBannerProps) {
  if (!selectedPatient) return null;

  const { patient, currentStage, cubicleNum } = selectedPatient;

  // Determine stage-specific hint text
  let hintText = nurseTexts.tapStageToMove;
  let originLabel = '';

  if (currentStage === 'assigned') {
    hintText = nurseTexts.selectedHintAssigned;
    originLabel = nurseTexts.stageAssignedHeading;
  } else if (currentStage === 'with_doctor') {
    hintText = nurseTexts.selectedHintWithDoctor;
    originLabel = nurseTexts.stageWithDoctorHeading;
  } else if (currentStage === 'carryout') {
    hintText = nurseTexts.selectedHintCarryout;
    originLabel = nurseTexts.stageCarryoutHeading;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={NurseStyle.selectionBanner}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl p-3.5 px-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Patient Information & Guidance */}
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
            ({originLabel} {cubicleNum ? `· ${cubicleNum}` : ''})
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600/60 transition-all cursor-pointer min-h-[36px]"
        >
          <i className="bx bx-x text-base" aria-hidden="true" />
          <span>{nurseTexts.cancelSelection}</span>
          <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
}

export default NurseSelectionBanner;
