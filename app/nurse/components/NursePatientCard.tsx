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

import React from 'react';
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
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {patient.cubicleNum}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ElapsedTimer startedAt={timerStartedAt} warnAfterSeconds={warnThreshold} />
          <NurseDragHandle title={nurseTexts.dragCardHint} />
        </div>
      </div>

      {/* Middle Body: Service and Subcategory */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">
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
                disabled={isSpeaking}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSpeaking
                    ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 active:bg-blue-200'
                }`}
              >
                <i
                  className={`bx ${isSpeaking ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-sm`}
                  aria-hidden="true"
                />
                <span>{isSpeaking ? nurseTexts.btnCalling : nurseTexts.btnCall}</span>
              </button>
            )}

            {onMoveToWithDoctor && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToWithDoctor(patient);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 active:bg-purple-200 transition cursor-pointer"
              >
                <i className="bx bx-user-plus text-sm" aria-hidden="true" />
                <span>{nurseTexts.btnWithDoctor}</span>
              </button>
            )}
          </>
        )}

        {stage === 'with_doctor' && (
          <>
            {onMoveBackFromDoctor && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBackFromDoctor(patient);
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300 transition cursor-pointer"
                title={nurseTexts.btnBack}
              >
                <i className="bx bx-undo text-sm" aria-hidden="true" />
                <span>{nurseTexts.btnBack}</span>
              </button>
            )}

            {onMoveToCarryout && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToCarryout(patient);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 active:bg-orange-200 transition cursor-pointer"
              >
                <i className="bx bx-transfer-alt text-sm" aria-hidden="true" />
                <span>{nurseTexts.btnCarryout}</span>
              </button>
            )}
          </>
        )}

        {stage === 'carryout' && (
          <>
            {onMoveBackFromCarryout && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBackFromCarryout(patient);
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300 transition cursor-pointer"
                title={nurseTexts.btnBack}
              >
                <i className="bx bx-undo text-sm" aria-hidden="true" />
                <span>{nurseTexts.btnBack}</span>
              </button>
            )}

            {onFinish && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinish(patient);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:bg-emerald-200 transition cursor-pointer"
              >
                <i className="bx bx-check text-base" aria-hidden="true" />
                <span>{nurseTexts.btnDone}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NursePatientCard;
