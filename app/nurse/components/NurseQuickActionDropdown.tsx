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
import { ClinicalStage, SelectedNursePatient } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';

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

  // Determine stage pill text and color
  let currentStageBadge: string = nurseTexts.badgeQueue;
  let currentStageColor = 'bg-blue-100 text-blue-700 border-blue-200';
  if (currentStage === 'with_doctor') {
    currentStageBadge = nurseTexts.badgeDoctor;
    currentStageColor = 'bg-purple-100 text-purple-700 border-purple-200';
  } else if (currentStage === 'carryout') {
    currentStageBadge = nurseTexts.badgeCarryout;
    currentStageColor = 'bg-orange-100 text-orange-700 border-orange-200';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nurse-quick-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-[#cc3535] text-white font-black text-sm tracking-tight shadow-2xs shrink-0">
              {patient.patientNum}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2
                  id="nurse-quick-action-title"
                  className="text-sm font-bold text-slate-900 truncate"
                >
                  {nurseTexts.quickActionTitle}
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${currentStageColor}`}>
                  {currentStageBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {patient.service}
                {cubicleNum ? ` · ${cubicleNum}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loadingAction !== null}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40"
            aria-label={nurseTexts.closeDialog}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Options List */}
        <div className="p-3.5 space-y-2">
          {/* Assigned Stage Options */}
          {currentStage === 'assigned' && (
            <>
              {onMoveToWithDoctor && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('with_doctor', onMoveToWithDoctor)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'with_doctor'
                      ? 'border-purple-400 bg-purple-100/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-purple-100 bg-purple-50/30 opacity-40 cursor-not-allowed'
                      : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'with_doctor' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                        {nurseTexts.actionAdvanceToDoctor}
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-purple-700 transition-colors">
                        {nurseTexts.actionAdvanceToDoctorDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'with_doctor' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-700 animate-ping" />
                      {nurseTexts.updatingAction}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-800 shrink-0">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'call' || isSpeaking
                      ? 'border-blue-400 bg-blue-100/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-blue-100 bg-blue-50/30 opacity-40 cursor-not-allowed'
                      : 'border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'call' || isSpeaking ? (
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
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {isSpeaking || loadingAction === 'call' ? nurseTexts.actionCalling : nurseTexts.actionCallAudio}
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-blue-700 transition-colors">
                        {nurseTexts.actionCallAudioDesc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 shrink-0">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'carryout'
                      ? 'border-orange-400 bg-orange-100/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-orange-100 bg-orange-50/30 opacity-40 cursor-not-allowed'
                      : 'border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 hover:border-orange-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'carryout' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-orange-900 transition-colors">
                        {nurseTexts.actionAdvanceToCarryout}
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-orange-700 transition-colors">
                        {nurseTexts.actionAdvanceToCarryoutDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'carryout' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-200 text-orange-900 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-ping" />
                      {nurseTexts.updatingAction}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-200/80 text-orange-800 shrink-0">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'call' || isSpeaking
                      ? 'border-blue-400 bg-blue-100/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-blue-100 bg-blue-50/30 opacity-40 cursor-not-allowed'
                      : 'border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'call' || isSpeaking ? (
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
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {isSpeaking || loadingAction === 'call' ? nurseTexts.actionCalling : nurseTexts.actionCallAudio}
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-blue-700 transition-colors">
                        {nurseTexts.actionCallAudioDesc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 shrink-0">
                    {nurseTexts.badgeSpeaker}
                  </span>
                </button>
              )}

              {onMoveBackFromDoctor && (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('back_queue', onMoveBackFromDoctor)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'back_queue'
                      ? 'border-slate-400 bg-slate-200/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'back_queue' ? (
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
                      <div className="text-sm font-bold text-slate-800">
                        {nurseTexts.actionReturnToQueue}
                      </div>
                      <div className="text-xs text-slate-500">
                        {nurseTexts.actionReturnToQueueDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'back_queue' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-ping" />
                      {nurseTexts.returningAction}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 shrink-0">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'finish'
                      ? 'border-emerald-400 bg-emerald-100/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-emerald-100 bg-emerald-50/30 opacity-40 cursor-not-allowed'
                      : 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-400 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'finish' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                        {nurseTexts.actionMarkFinished}
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-emerald-700 transition-colors">
                        {nurseTexts.actionMarkFinishedDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'finish' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping" />
                      {nurseTexts.completingAction}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 shrink-0">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                    loadingAction === 'back_doctor'
                      ? 'border-slate-400 bg-slate-200/90 shadow-2xs cursor-wait'
                      : loadingAction !== null
                      ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 cursor-pointer active:scale-[0.99] group'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {loadingAction === 'back_doctor' ? (
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
                      <div className="text-sm font-bold text-slate-800">
                        {nurseTexts.actionReturnToDoctor}
                      </div>
                      <div className="text-xs text-slate-500">
                        {nurseTexts.actionReturnToDoctorDesc}
                      </div>
                    </div>
                  </div>
                  {loadingAction === 'back_doctor' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 flex items-center gap-1.5 shrink-0 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-ping" />
                      {nurseTexts.returningAction}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 shrink-0">
                      {nurseTexts.badgeReturn}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            {nurseTexts.dismissHint}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingAction !== null}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-40"
          >
            {nurseTexts.closeDialog}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NurseQuickActionDropdown;
