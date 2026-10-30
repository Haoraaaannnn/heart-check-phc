/**
 * @fileoverview Visual Progress Indicator displaying what stage a patient ticket number is in.
 *
 * Renders a 4-stage connected workflow progression:
 * 1. Registration (Counter)
 * 2. Waiting Queue
 * 3. In Service (Cubicle / Doctor)
 * 4. Completed (Done)
 *
 * Supports both compact horizontal bar mode (for list items) and full stepper mode
 * (for inspection modals).
 *
 * Adheres strictly to AGENTS.md:
 * - Enterprise solid surfaces with 1px crisp borders
 * - Zero emojis in icons or labels
 * - Natural text wrapping without truncate
 *
 * @module app/transfer/components/PatientStageProgress
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { getPatientStage, JOURNEY_STEPS, PatientStageInfo } from '@/app/transfer/types/history';

export interface PatientStageProgressProps {
  /** Patient record to evaluate. */
  patient: Patient;
  /** Precomputed stage info if available. */
  stageInfo?: PatientStageInfo;
  /** Whether to render compact mini stepper or detailed workflow timeline. */
  compact?: boolean;
}

/**
 * Visual progress stepper component displaying active patient journey stage.
 *
 * @param props - Patient data, optional precomputed stage, and compact flag.
 * @returns Progress indicator component.
 */
export function PatientStageProgress({
  patient,
  stageInfo: providedStageInfo,
  compact = false,
}: PatientStageProgressProps) {
  const stage = providedStageInfo ?? getPatientStage(patient);

  if (compact) {
    return <CompactProgress stage={stage} />;
  }

  return <DetailedProgress stage={stage} patient={patient} />;
}

/**
 * Compact horizontal mini-indicator for list rows and card summaries.
 */
function CompactProgress({ stage }: { stage: PatientStageInfo }) {
  if (stage.isException) {
    const isIdle = stage.stage === 'idle';
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isIdle ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span
          className={`text-[11px] font-bold ${
            isIdle
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {stage.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        <span>Stage {stage.stepIndex + 1} of 4:</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{stage.label}</span>
      </div>

      {/* 4-Segment Progress Bar */}
      <div className="grid grid-cols-4 gap-1 w-full">
        {JOURNEY_STEPS.map((step) => {
          const isDone = stage.stepIndex > step.step;
          const isCurrent = stage.stepIndex === step.step;

          let barBg = 'bg-slate-200 dark:bg-[#2b2b2b]';
          if (isDone) {
            barBg = 'bg-emerald-500 dark:bg-emerald-600';
          } else if (isCurrent) {
            barBg = stage.stage === 'done' ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500';
          }

          return (
            <div
              key={step.step}
              className={`h-1.5 rounded-full transition-all duration-300 ${barBg}`}
              title={`${step.label}: ${isDone ? 'Completed' : isCurrent ? 'Active' : 'Pending'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Detailed connected stepper with node circles, active state, and stage captions.
 */
function DetailedProgress({ stage, patient }: { stage: PatientStageInfo; patient: Patient }) {
  return (
    <div className="flex flex-col gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e]">
      {/* Current Status Header Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#2b2b2b] pb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-[#a3a3a3]">Current Stage:</span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              stage.stage === 'done'
                ? 'bg-emerald-500'
                : stage.stage === 'idle'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-blue-600 dark:bg-blue-400 animate-pulse'
            }`}
          />
          <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f5]">{stage.label}</span>
        </div>
      </div>

      {/* Connected 4-Step Track */}
      <div className="relative flex items-center justify-between w-full pt-2 pb-1">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 dark:bg-[#333333] -z-0" />

        {JOURNEY_STEPS.map((step) => {
          const isDone = !stage.isException && stage.stepIndex > step.step;
          const isCurrent = !stage.isException && stage.stepIndex === step.step;

          return (
            <div
              key={step.step}
              className="relative z-10 flex flex-col items-center flex-1 text-center"
            >
              {/* Step Circle Node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-600 dark:bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950/60 shadow-xs'
                    : 'bg-white dark:bg-[#222222] border-2 border-slate-300 dark:border-[#444444] text-slate-400 dark:text-[#777777]'
                }`}
              >
                {isDone ? (
                  <i className="bx bx-check text-base font-bold" aria-hidden="true" />
                ) : (
                  <span>{step.step + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-xs font-bold whitespace-nowrap ${
                  isDone
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : isCurrent
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-400 dark:text-[#666666]'
                }`}
              >
                {step.label}
              </span>

              {/* Auxiliary Sub-info */}
              {step.step === 0 && patient.counter && (
                <span className="text-[10px] text-slate-500 dark:text-[#888888] font-medium whitespace-nowrap mt-0.5">
                  Counter {patient.counter}
                </span>
              )}
              {step.step === 2 && patient.cubicleNum && (
                <span className="text-[10px] text-slate-500 dark:text-[#888888] font-medium whitespace-nowrap mt-0.5">
                  Cubicle {patient.cubicleNum}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Exception Banner for Idle or Removed */}
      {stage.isException && (
        <div
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
            stage.stage === 'idle'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <i
            className={`bx ${
              stage.stage === 'idle' ? 'bx-pause-circle text-amber-600' : 'bx-x-circle text-red-600'
            } text-base shrink-0`}
            aria-hidden="true"
          />
          <span>
            {stage.stage === 'idle'
              ? 'Patient missed station calls and is on hold in the idle list.'
              : 'Patient ticket has been removed from today’s operational queue.'}
          </span>
        </div>
      )}
    </div>
  );
}

export default PatientStageProgress;
