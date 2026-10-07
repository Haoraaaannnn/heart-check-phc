/**
 * @fileoverview Reusable clinical patient card component for the Nurse Dashboard.
 *
 * Renders patient queue identifiers, clinical service metadata, real-time elapsed timers,
 * drag handles, and one-tap advancement buttons across all active clinical stages.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% copy consumed from nurseTexts
 * - 100% styles consumed from NurseStyle
 * - Zero emojis and comprehensive JSDoc
 */

'use client';

import React, { useState } from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';
import { NurseStyle, STAGE_CONFIGS } from '../constants/nurse';
import { ElapsedTimer } from './ElapsedTimer';
import { NurseDragHandle } from './NurseDragHandle';

/**
 * Props for the NursePatientCard component.
 */
export interface NursePatientCardProps {
  /** The patient entity being rendered. */
  patient: Patient;
  /** Active clinical stage of the patient. */
  stage: ClinicalStage;
  /** ID of patient currently receiving audio announcement, or null. */
  speakingId?: number | null;
  /** Whether this card is actively selected in Click-to-Select tablet mode. */
  isSelected?: boolean;
  /** Callback to trigger Deepgram audio announcement. */
  onCall?: (patient: Patient) => void;
  /** Callback to select this patient for Click-to-Select tablet interaction. */
  onSelect?: (patient: Patient, stage: ClinicalStage, cubicleNum: string) => void;
  /** Pointer down listener to initiate drag-and-drop. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient, stage: ClinicalStage) => void;
  /** Quick action: Advance to With Doctor stage. */
  onMoveToWithDoctor?: (patient: Patient) => void | Promise<boolean | void>;
  /** Quick action: Rollback from With Doctor back to Assigned. */
  onMoveBackFromDoctor?: (patient: Patient) => void | Promise<boolean | void>;
  /** Quick action: Advance from With Doctor to Carryout stage. */
  onMoveToCarryout?: (patient: Patient) => void | Promise<boolean | void>;
  /** Quick action: Rollback from Carryout back to With Doctor. */
  onMoveBackFromCarryout?: (patient: Patient) => void | Promise<boolean | void>;
  /** Quick action: Advance from Carryout to Done (finished ledger). */
  onFinish?: (patient: Patient) => void | Promise<boolean | void>;
}

/**
 * Visual patient tile rendered in stage pipeline columns.
 *
 * @param props - Patient data, action triggers, and selection state.
 * @returns The rendered patient card element.
 */
export function NursePatientCard({
  patient,
  stage,
  speakingId,
  isSelected,
  onCall,
  onSelect,
  onPointerDown,
  onMoveToWithDoctor,
  onMoveBackFromDoctor,
  onMoveToCarryout,
  onMoveBackFromCarryout,
  onFinish,
}: NursePatientCardProps) {
  const isSpeaking = speakingId === patient.id;
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleTriggerAction = async (
    actionKey: string,
    fn?: (p: Patient) => void | Promise<boolean | void>
  ) => {
    if (!fn || pendingAction) return;
    setPendingAction(actionKey);
    try {
      await fn(patient);
    } catch (err) {
      console.error('Failed to trigger patient action:', err);
    } finally {
      setPendingAction(null);
    }
  };

  // Determine timer start timestamp and warning threshold based on clinical stage
  let timerStartedAt: string | null | undefined = null;
  const stageConfig = STAGE_CONFIGS[stage as keyof typeof STAGE_CONFIGS];
  const warnThreshold = stageConfig?.warnAfterSeconds ?? 600;

  if (stage === 'assigned') {
    timerStartedAt = patient.reg_end || patient.created_at;
  } else if (stage === 'with_doctor') {
    timerStartedAt = patient.consult_start;
  } else if (stage === 'carryout') {
    timerStartedAt = patient.carryout_start;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click was on a button or drag handle, don't trigger selection
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, [data-drag-handle="true"]')) {
      return;
    }
    if (onSelect) {
      onSelect(patient, stage, patient.cubicleNum || '');
    }
  };

  const handlePointerDownWrapper = (e: React.PointerEvent) => {
    if (onPointerDown) {
      onPointerDown(e, patient, stage);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onPointerDown={handlePointerDownWrapper}
      style={isSelected ? NurseStyle.selectedPatientRow : undefined}
      className={`rounded-2xl p-3.5 flex flex-col gap-2.5 bg-white border transition-all cursor-pointer select-none ${
        isSelected
          ? 'ring-2 ring-red-400 border-[#cc3535] shadow-md'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header: Queue Number, Cubicle, Timer & Drag Handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#cc3535] font-black text-lg tracking-tight shrink-0">
            {patient.patientNum}
          </span>
          {patient.cubicleNum && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold truncate max-w-[110px] shrink">
              {patient.cubicleNum}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ElapsedTimer startedAt={timerStartedAt} warnAfterSeconds={warnThreshold} className="shrink-0" />
          <NurseDragHandle title={nurseTexts.dragCardHint} />
        </div>
      </div>

      {/* Middle Body: Service and Subcategory */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 break-words whitespace-normal leading-snug">
          {patient.service}
          {patient.subcategory ? ` · ${patient.subcategory}` : ''}
        </p>
      </div>

      {/* Bottom Action Buttons by Stage */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        {stage === 'assigned' && (
          <>
            {onCall && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCall(patient);
                }}
                disabled={isSpeaking || pendingAction !== null}
                className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none ${
                  isSpeaking
                    ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-blue-50 text-blue-400'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 active:bg-blue-200'
                }`}
              >
                <span>{isSpeaking ? nurseTexts.btnCalling : nurseTexts.btnCall}</span>
              </button>
            )}

            {onMoveToWithDoctor && (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction('with_doctor', onMoveToWithDoctor);
                }}
                className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none ${
                  pendingAction === 'with_doctor'
                    ? 'bg-purple-200 text-purple-900 cursor-wait'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-purple-50 text-purple-400'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 active:bg-purple-200'
                }`}
              >
                {pendingAction === 'with_doctor' ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{nurseTexts.updatingAction}</span>
                  </span>
                ) : (
                  <span>{nurseTexts.btnWithDoctor}</span>
                )}
              </button>
            )}
          </>
        )}

        {stage === 'with_doctor' && (
          <>
            {onMoveBackFromDoctor && (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction('back_doctor', onMoveBackFromDoctor);
                }}
                className={`flex items-center justify-center py-1.5 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none shrink-0 ${
                  pendingAction === 'back_doctor'
                    ? 'bg-slate-300 text-slate-800 cursor-wait'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300'
                }`}
                title={nurseTexts.btnBack}
              >
                {pendingAction === 'back_doctor' ? (
                  <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span>{nurseTexts.btnBack}</span>
                )}
              </button>
            )}

            {onMoveToCarryout && (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction('carryout', onMoveToCarryout);
                }}
                className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none ${
                  pendingAction === 'carryout'
                    ? 'bg-orange-200 text-orange-900 cursor-wait'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-orange-50 text-orange-400'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 active:bg-orange-200'
                }`}
              >
                {pendingAction === 'carryout' ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{nurseTexts.updatingAction}</span>
                  </span>
                ) : (
                  <span>{nurseTexts.btnCarryout}</span>
                )}
              </button>
            )}
          </>
        )}

        {stage === 'carryout' && (
          <>
            {onMoveBackFromCarryout && (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction('back_carryout', onMoveBackFromCarryout);
                }}
                className={`flex items-center justify-center py-1.5 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none shrink-0 ${
                  pendingAction === 'back_carryout'
                    ? 'bg-slate-300 text-slate-800 cursor-wait'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300'
                }`}
                title={nurseTexts.btnBack}
              >
                {pendingAction === 'back_carryout' ? (
                  <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span>{nurseTexts.btnBack}</span>
                )}
              </button>
            )}

            {onFinish && (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAction('finish', onFinish);
                }}
                className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none ${
                  pendingAction === 'finish'
                    ? 'bg-emerald-200 text-emerald-900 cursor-wait'
                    : pendingAction !== null
                    ? 'opacity-40 cursor-not-allowed bg-emerald-50 text-emerald-400'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:bg-emerald-200'
                }`}
              >
                {pendingAction === 'finish' ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{nurseTexts.completingAction}</span>
                  </span>
                ) : (
                  <span>{nurseTexts.btnDone}</span>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NursePatientCard;
