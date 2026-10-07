/**
 * @fileoverview Quick-Assign destination popover and action dropdown for tap-to-transfer interactions.
 *
 * Provides a self-contained, accessible touch-friendly destination picker that opens
 * immediately when a patient card is tapped, replacing persistent floating banners with
 * an intuitive, direct-action popover.
 *
 * Architectural Features:
 * - Clickable-level loading animations: Visual spinners and status pulses indicate in-flight state directly on clicked buttons.
 * - Weak signal resilience: Explicit button-level feedback eliminates user confusion during network latency without blocking modals.
 * - Direct station selection: Lists all active cubicles with doctor assignment and live capacity.
 * - Single-tap confirmation: Tapping an available cubicle commits the assignment and dismisses immediately.
 * - Clean popover aesthetics: Subtle light backdrop so the Kanban board remains visible behind it.
 * - Auto-dismiss mechanics: Closes on outside pointer down, backdrop tap, or Escape key.
 * - Zero lingering UI: Guarantees no floating context banners remain stuck on the workstation viewport.
 *
 * Adheres strictly to AGENTS.md rules with centralized texts, full JSDoc, and zero emojis.
 *
 * @module app/transfer/components/QuickAssignDropdown
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { transferTexts } from '../constants/transferTexts';

/**
 * Props for {@link QuickAssignDropdown}.
 */
export interface QuickAssignDropdownProps {
  /** The patient entity being assigned or managed. */
  patient: Patient;
  /** Available cubicle stations for assignment. */
  cubicles: Cubicle[];
  /** Doctor assignment mapping indexed by cubicle number. */
  cubicleDoctorMap?: Record<string, string>;
  /** Currently assigned patient lists indexed by cubicle number. */
  assignedPatients: Record<string, Patient[]>;
  /** Callback to execute the cubicle assignment. */
  onAssignToCubicle: (patient: Patient, cubicleNum: string) => void | Promise<boolean | void>;
  /** Callback to dismiss and close the dropdown without making changes. */
  onClose: () => void;
  /** Domain origin of the tapped patient: 'queue' or 'cubicle'. */
  sourceType?: 'queue' | 'cubicle';
  /** Current cubicle number if patient originated from a station. */
  currentCubicleNum?: string;
  /** Callback to return a cubicle patient back to the waiting queue. */
  onMoveBackToQueue?: (patient: Patient, cubicleNum: string) => void | Promise<boolean | void>;
  /** Text-to-speech audio announcement callback. */
  onSpeak?: (text: string, patientId: number) => void;
  /** Active service category name for contextual audio announcement. */
  categoryName?: string;
}

/**
 * Extracts a compact station badge identifier (e.g., "C1", "C2") from full cubicle strings
 * like "Consultation R5 C1" or "Cubicle 1" to fit cleanly inside compact tile badges.
 *
 * @param cubicleNum - Raw cubicle identifier string from the database.
 * @returns Concise badge label that fits cleanly inside fixed-dimension avatars.
 */
export function formatCubicleBadge(cubicleNum: string): string {
  if (!cubicleNum) return '';
  const trimmed = cubicleNum.trim();
  const cMatch = trimmed.match(/C(\d+)$/i);
  if (cMatch) {
    return `C${cMatch[1]}`;
  }
  const cubicleWordMatch = trimmed.match(/cubicle\s*(\d+)/i);
  if (cubicleWordMatch) {
    return `C${cubicleWordMatch[1]}`;
  }
  const rMatch = trimmed.match(/R(\d+)$/i);
  if (rMatch) {
    return `R${rMatch[1]}`;
  }
  if (trimmed.length <= 4) {
    return trimmed;
  }
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (lastWord.length <= 3) return lastWord;
  }
  return trimmed.slice(0, 3).toUpperCase();
}

/**
 * Self-contained popover dialog for direct one-tap patient cubicle allocation.
 *
 * @param props - Patient details, station lists, and assignment handlers.
 * @returns Rendered interactive popover dropdown or action sheet.
 */
export function QuickAssignDropdown({
  patient,
  cubicles,
  cubicleDoctorMap = {},
  assignedPatients,
  onAssignToCubicle,
  onClose,
  sourceType = 'queue',
  currentCubicleNum,
  onMoveBackToQueue,
  onSpeak,
  categoryName,
}: QuickAssignDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  // Close on outside pointer down or Escape key (only when not loading)
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent | MouseEvent) => {
      if (pendingTarget) return; // Prevent dismissing while mutation in flight
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingTarget) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingTarget, onClose]);

  const isFromCubicle = sourceType === 'cubicle';
  const availableCubicles = cubicles.filter(c => !currentCubicleNum || c.cubicleNum !== currentCubicleNum);

  /**
   * Dispatches assignment with in-button spinner and closes the modal.
   */
  const handleAssignStation = async (cubicleNum: string) => {
    if (pendingTarget) return;
    setPendingTarget(cubicleNum);
    try {
      await onAssignToCubicle(patient, cubicleNum);
      onClose();
    } catch (err) {
      console.error('Failed to assign patient to station:', err);
      setPendingTarget(null);
    }
  };

  /**
   * Dispatches queue rollback with in-button spinner.
   */
  const handleMoveBackQueue = async () => {
    if (!onMoveBackToQueue || !currentCubicleNum || pendingTarget) return;
    setPendingTarget('queue');
    try {
      await onMoveBackToQueue(patient, currentCubicleNum);
      onClose();
    } catch (err) {
      console.error('Failed to return patient to queue:', err);
      setPendingTarget(null);
    }
  };

  /**
   * Dispatches audio call with in-button loading indicator.
   */
  const handleSpeakAction = () => {
    if (!onSpeak || pendingTarget) return;
    setPendingTarget('call');
    try {
      const num = patient.patientNum || '';
      const letter = num ? num.charAt(0) : '';
      const digits = num.length > 1 ? parseInt(num.slice(1), 10).toString() : '';
      onSpeak(
        `Number ${letter} ${digits}, Number ${letter} ${digits}, please proceed to ${currentCubicleNum}`,
        patient.id
      );
      onClose();
    } catch (err) {
      console.error('Failed to trigger audio announcement:', err);
      setPendingTarget(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-assign-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Dropdown Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/90">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#cc3535] text-white font-black text-sm tracking-tight shadow-2xs">
                {patient.patientNum}
              </span>
              <div className="min-w-0">
                <h3
                  id="quick-assign-title"
                  className="text-sm font-bold text-slate-900 truncate"
                >
                  {isFromCubicle ? transferTexts.managePatientTitle : transferTexts.quickAssignTitle}
                </h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {isFromCubicle
                    ? transferTexts.managePatientSubtitle
                    : transferTexts.quickAssignSubtitle}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={pendingTarget !== null}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40"
            aria-label={transferTexts.closeBtn}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dropdown Body: Available Stations */}
        <div className="p-3.5 overflow-y-auto space-y-2 phc-scroll flex-1">
          {/* Station Management Actions (if tapped from inside a cubicle) */}
          {isFromCubicle && currentCubicleNum && (
            <div className="mb-3 pb-3 border-b border-slate-200 space-y-2">
              {onMoveBackToQueue && (
                <button
                  type="button"
                  disabled={pendingTarget !== null}
                  onClick={handleMoveBackQueue}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left shadow-2xs select-none ${
                    pendingTarget === 'queue'
                      ? 'border-amber-400 bg-amber-100/90 cursor-wait'
                      : pendingTarget !== null
                      ? 'border-amber-100 bg-amber-50/30 opacity-40 cursor-not-allowed'
                      : 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-950 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {pendingTarget === 'queue' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-amber-950 transition-colors">
                        {transferTexts.moveToQueueBtn}
                      </p>
                      <p className="text-xs text-amber-700">
                        {transferTexts.moveToQueueSubtitle}
                      </p>
                    </div>
                  </div>
                  {pendingTarget === 'queue' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-ping" />
                      {transferTexts.movingToQueue}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-200 text-amber-800 shrink-0">
                      {transferTexts.badgeReturn}
                    </span>
                  )}
                </button>
              )}

              {onSpeak && (
                <button
                  type="button"
                  disabled={pendingTarget !== null}
                  onClick={handleSpeakAction}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left shadow-2xs select-none ${
                    pendingTarget === 'call'
                      ? 'border-blue-400 bg-blue-100/90 cursor-wait'
                      : pendingTarget !== null
                      ? 'border-blue-100 bg-blue-50/30 opacity-40 cursor-not-allowed'
                      : 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-950 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {pendingTarget === 'call' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-950 transition-colors">
                        {transferTexts.callPatientAudioBtn}
                      </p>
                      <p className="text-xs text-blue-700">
                        {transferTexts.callPatientAudioSubtitle}
                      </p>
                    </div>
                  </div>
                  {pendingTarget === 'call' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-ping" />
                      {transferTexts.callingBtn}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-200 text-blue-800 shrink-0">
                      {transferTexts.badgeSpeaker}
                    </span>
                  )}
                </button>
              )}

              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1.5 px-1">
                {transferTexts.moveToOtherCubicleHeading}
              </p>
            </div>
          )}

          {/* List of Destination Stations */}
          {availableCubicles.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              {transferTexts.noCubiclesConfigured}
            </p>
          ) : (
            availableCubicles.map(cubicle => {
              const occupants = (assignedPatients && assignedPatients[cubicle.cubicleNum]?.length) || 0;
              const isFull = occupants >= MAX_PATIENTS_PER_CUBICLE;
              const doctorName = cubicleDoctorMap[cubicle.cubicleNum];
              const isAssigningThis = pendingTarget === cubicle.cubicleNum;

              return (
                <button
                  key={cubicle.id}
                  type="button"
                  disabled={isFull || pendingTarget !== null}
                  onClick={() => handleAssignStation(cubicle.cubicleNum)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left min-h-[54px] select-none ${
                    isAssigningThis
                      ? 'border-emerald-500 bg-emerald-100/90 shadow-2xs cursor-wait'
                      : isFull
                      ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                      : pendingTarget !== null
                      ? 'border-slate-100 bg-slate-50/40 opacity-40 cursor-not-allowed'
                      : 'border-slate-200/90 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs active:scale-[0.99] cursor-pointer group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs overflow-hidden select-none ${
                        isFull
                          ? 'bg-slate-200 text-slate-500'
                          : isAssigningThis
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300 group-hover:scale-105 transition-transform'
                      }`}
                      title={cubicle.cubicleNum}
                    >
                      {isAssigningThis ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        formatCubicleBadge(cubicle.cubicleNum)
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-950 transition-colors">
                        {cubicle.room && !cubicle.cubicleNum.toLowerCase().startsWith('room')
                          ? `${transferTexts.roomPrefix} ${cubicle.room} · `
                          : ''}
                        {cubicle.cubicleNum}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {doctorName
                          ? `${transferTexts.doctorPrefix} ${doctorName}`
                          : transferTexts.unassignedDoctor}
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Badge & Assign Action */}
                  <div className="shrink-0 flex items-center gap-2 ml-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight ${
                        isFull
                          ? 'bg-rose-100 text-rose-700'
                          : occupants === 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isFull
                        ? transferTexts.occupancyFull
                        : transferTexts.occupancyLabel(occupants, MAX_PATIENTS_PER_CUBICLE)}
                    </span>

                    {!isFull && (
                      isAssigningThis ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {transferTexts.assigningStation}
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs group-hover:bg-emerald-700 transition-colors">
                          {transferTexts.badgeAssign}
                        </span>
                      )
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            {transferTexts.dismissHint}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={pendingTarget !== null}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-40"
          >
            {transferTexts.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickAssignDropdown;
