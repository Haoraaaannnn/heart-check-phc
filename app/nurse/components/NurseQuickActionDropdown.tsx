/**
 * @fileoverview Quick Action dropdown and contextual popover for tap interactions on the Nurse Station.
 *
 * Appears immediately when a patient card is tapped, presenting clean, self-explanatory options
 * to advance the patient through clinical stages (With Doctor, Carryout, Mark as Done)
 * or trigger automated voice audio calls, without leaving persistent floating banners on the screen.
 *
 * Architectural Features:
 * - Clickable-level loading animations: Visual spinners and status pulses indicate in-flight state directly on clicked buttons.
 * - Weak signal resilience: Explicit button-level feedback eliminates user confusion during network latency without blocking modals.
 * - Double-action prevention: Disables sibling buttons during an active mutation.
 * - Direct single-tap stage progression: Immediately triggers clinical transition and auto-dismisses.
 * - Stage-aware action menu: Conditionally exposes actions matching clinical workflow rules.
 * - Clean popover aesthetics: Subtle light backdrop so the Kanban board remains visible behind it.
 * - Resilient dismissal: Automatically closes on outside pointer tap, backdrop click, or Escape key.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% text copy sourced from nurseTexts
 * - Full file-level and symbol-level JSDoc
 * - Zero emojis in code, comments, or UI
 *
 * @module app/nurse/components/NurseQuickActionDropdown
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage, SelectedNursePatient } from '@/app/nurse/types/nurse';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { STAGE_CONFIGS, nurseQuickActionStyles } from '@/app/nurse/constants/nurse';

/**
 * Props for the NurseQuickActionDropdown component.
 */
export interface NurseQuickActionDropdownProps {
  /** The actively selected patient and origin metadata. */
  selectedPatient: SelectedNursePatient | null;
  /** ID of patient currently receiving audio announcement, or null. */
  speakingId?: number | null;
  /** Callback to advance patient to Doctor Consultation stage. */
  onMoveToWithDoctor?: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to rollback patient from Doctor Consultation back to Queue. */
  onMoveBackFromDoctor?: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to advance patient from Doctor Consultation to Carryout. */
  onMoveToCarryout?: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to rollback patient from Carryout back to Doctor Consultation. */
  onMoveBackFromCarryout?: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to finalize and archive patient to Completed Ledger. */
  onFinish?: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to trigger Deepgram TTS audio announcement. */
  onCall?: (patient: Patient) => void;
  /** Callback to dismiss and close the action dropdown. */
  onClose: () => void;
}

/**
 * Self-contained quick action dropdown dialog for nurse patient card tap events.
 *
 * @param props - Selected patient, transition callbacks, and dismissal handler.
 * @returns The rendered dropdown dialog or null if no patient is selected.
 */
export function NurseQuickActionDropdown({
  selectedPatient,
  speakingId,
  onMoveToWithDoctor,
  onMoveBackFromDoctor,
  onMoveToCarryout,
  onMoveBackFromCarryout,
  onFinish,
  onCall,
  onClose,
}: NurseQuickActionDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Auto-dismiss on click outside or Escape key (only when not loading)
  useEffect(() => {
    if (!selectedPatient) return;

    const handlePointerDownOutside = (e: PointerEvent | MouseEvent) => {
      if (loadingAction) return; // Prevent dismissing while mutation in flight
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (loadingAction) return;
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
  }, [selectedPatient, loadingAction, onClose]);

  if (!selectedPatient) return null;

  const { patient, currentStage, cubicleNum } = selectedPatient;
  const isSpeaking = speakingId === patient.id;

  /**
   * Dispatches an action with in-button loading animation and closes the dropdown upon resolution.
   */
  const handleAction = async (
    actionKey: string,
    actionFn?: (p: Patient) => void | Promise<boolean | void>
  ) => {
    if (!actionFn || loadingAction) return;
    setLoadingAction(actionKey);
    try {
      await actionFn(patient);
      onClose();
    } catch (err) {
      console.error('Failed to dispatch clinical transition:', err);
      setLoadingAction(null);
    }
  };

  /**
   * Dispatches audio call with button animation and closes the dropdown.
   */
  const handleCallAction = () => {
    if (!onCall || loadingAction) return;
    setLoadingAction('call');
    try {
      onCall(patient);
      onClose();
    } catch (err) {
      console.error('Failed to trigger audio announcement:', err);
      setLoadingAction(null);
    }
  };

  /**
   * Safely dismisses the quick action dialog unless a state mutation is in flight.
   */
  const handleClose = (e?: React.SyntheticEvent | Event) => {
    if (e) {
      e.stopPropagation();
    }
    if (loadingAction) return;
    onClose();
  };

  // Determine stage pill text and color
  let currentStageBadge: string = nurseTexts.badgeQueue;
  let currentStageClasses =
    'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
  if (currentStage === 'with_doctor') {
    currentStageBadge = nurseTexts.badgeDoctor;
    currentStageClasses =
      'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
  } else if (currentStage === 'carryout') {
    currentStageBadge = nurseTexts.badgeCarryout;
    currentStageClasses =
      'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nurse-quick-action-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e);
        }
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e);
        }
      }}
      className={nurseQuickActionStyles.backdrop}
    >
      <div ref={panelRef} className={nurseQuickActionStyles.panel}>
        {/* Header Bar */}
        <div className={nurseQuickActionStyles.header}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={nurseQuickActionStyles.ticketNumber}>
              {patient.patientNum}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2
                  id="nurse-quick-action-title"
                  className={nurseQuickActionStyles.title}
                >
                  {nurseTexts.quickActionTitle}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${currentStageClasses}`}>
                  {currentStageBadge}
                </span>
              </div>
              <p className={nurseQuickActionStyles.subtitle}>
                {patient.service}
                {cubicleNum ? ` · ${cubicleNum}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            onPointerDown={handleClose}
            disabled={loadingAction !== null}
            className={nurseQuickActionStyles.closeHeaderBtn}
            aria-label={nurseTexts.closeDialog}
          >
            <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Options List */}
        <div className={nurseQuickActionStyles.body}>
          {/* Assigned Stage Options */}
          {currentStage === 'assigned' && (
            <>
              {onMoveToWithDoctor && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('with_doctor', onMoveToWithDoctor)}
                  className={
                    loadingAction === 'with_doctor'
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-purple-500 bg-purple-100 dark:bg-purple-950/70 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'with_doctor' ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {nurseTexts.actionAdvanceToDoctor}
                      </div>
                      <div className="text-xs text-content-muted transition-colors">
                        {nurseTexts.actionAdvanceToDoctorDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'with_doctor' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 flex items-center gap-1.5 shrink-0 animate-pulse border border-purple-300 dark:border-purple-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-700 animate-ping" />
                      {nurseTexts.updatingAction}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                      {nurseTexts.badgeNextStep}
                    </span>
                  )}
                </button>
              )}

              {onCall && (
                <button
                  type="button"
                  disabled={loadingAction !== null || isSpeaking}
                  onClick={handleCallAction}
                  className={
                    loadingAction === 'call' || isSpeaking
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-blue-500 bg-blue-100 dark:bg-blue-950/70 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'call' || isSpeaking ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {isSpeaking || loadingAction === 'call' ? nurseTexts.actionCalling : nurseTexts.actionCallAudio}
                      </div>
                      <div className="text-xs text-content-muted transition-colors">
                        {nurseTexts.actionCallAudioDesc}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    {nurseTexts.badgeSpeaker}
                  </span>
                </button>
              )}
            </>
          )}

          {/* With Doctor Stage Options */}
          {currentStage === 'with_doctor' && (
            <>
              {onMoveToCarryout && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('carryout', onMoveToCarryout)}
                  className={
                    loadingAction === 'carryout'
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-amber-500 bg-amber-100 dark:bg-amber-950/70 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'carryout' ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {nurseTexts.actionAdvanceToCarryout}
                      </div>
                      <div className="text-xs text-content-muted transition-colors">
                        {nurseTexts.actionAdvanceToCarryoutDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'carryout' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center gap-1.5 shrink-0 animate-pulse border border-amber-300 dark:border-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-ping" />
                      {nurseTexts.updatingAction}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                      {nurseTexts.badgeNextStep}
                    </span>
                  )}
                </button>
              )}

              {onCall && (
                <button
                  type="button"
                  disabled={loadingAction !== null || isSpeaking}
                  onClick={handleCallAction}
                  className={
                    loadingAction === 'call' || isSpeaking
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-blue-500 bg-blue-100 dark:bg-blue-950/70 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'call' || isSpeaking ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {isSpeaking || loadingAction === 'call' ? nurseTexts.actionCalling : nurseTexts.actionCallAudio}
                      </div>
                      <div className="text-xs text-content-muted transition-colors">
                        {nurseTexts.actionCallAudioDesc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    {nurseTexts.badgeSpeaker}
                  </span>
                </button>
              )}

              {onMoveBackFromDoctor && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('back_queue', onMoveBackFromDoctor)}
                  className={
                    loadingAction === 'back_queue'
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-slate-400 bg-slate-200 dark:bg-slate-800 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'back_queue' ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content">
                        {nurseTexts.actionReturnToQueue}
                      </div>
                      <div className="text-xs text-content-muted">
                        {nurseTexts.actionReturnToQueueDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'back_queue' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#2e2e2e] text-slate-800 dark:text-[#f5f5f5] flex items-center gap-1.5 shrink-0 animate-pulse border border-slate-300 dark:border-[#383838]">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-ping" />
                      {nurseTexts.returningAction}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {nurseTexts.badgeReturn}
                    </span>
                  )}
                </button>
              )}
            </>
          )}

          {/* Carryout Stage Options */}
          {currentStage === 'carryout' && (
            <>
              {onFinish && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('finish', onFinish)}
                  className={
                    loadingAction === 'finish'
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-emerald-500 bg-emerald-100 dark:bg-emerald-950/70 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'finish' ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {nurseTexts.actionMarkFinished}
                      </div>
                      <div className="text-xs text-content-muted transition-colors">
                        {nurseTexts.actionMarkFinishedDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'finish' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5 shrink-0 animate-pulse border border-emerald-300 dark:border-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping" />
                      {nurseTexts.completingAction}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {nurseTexts.badgeFinish}
                    </span>
                  )}
                </button>
              )}

              {onMoveBackFromCarryout && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('back_doctor', onMoveBackFromCarryout)}
                  className={
                    loadingAction === 'back_doctor'
                      ? 'w-full flex items-center justify-between p-3 rounded-xl border border-slate-400 bg-slate-200 dark:bg-slate-800 shadow-2xs cursor-wait text-left select-none'
                      : loadingAction !== null
                      ? nurseQuickActionStyles.actionBtnDisabled
                      : nurseQuickActionStyles.actionBtnIdle
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'back_doctor' ? (
                        <svg className="w-5 h-5 animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content">
                        {nurseTexts.actionReturnToDoctor}
                      </div>
                      <div className="text-xs text-content-muted">
                        {nurseTexts.actionReturnToDoctorDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'back_doctor' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#2e2e2e] text-slate-800 dark:text-[#f5f5f5] flex items-center gap-1.5 shrink-0 animate-pulse border border-slate-300 dark:border-[#383838]">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-ping" />
                      {nurseTexts.returningAction}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {nurseTexts.badgeReturn}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={nurseQuickActionStyles.footer}>
          <span className={nurseQuickActionStyles.footerHint}>
            {nurseTexts.dismissHint}
          </span>
          <button
            type="button"
            onClick={handleClose}
            onPointerDown={handleClose}
            disabled={loadingAction !== null}
            className={nurseQuickActionStyles.closeFooterBtn}
          >
            {nurseTexts.closeDialog}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NurseQuickActionDropdown;
