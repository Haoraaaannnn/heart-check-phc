/**
 * @fileoverview Registration Counters component formatted as a non-scrollable horizontal grid.
 *
 * Displays all assigned registration counters simultaneously in a space-efficient
 * horizontal row/grid without vertical scrolling. Supports:
 * - Direct pointer drag-and-drop between counter lanes (`data-counter`)
 * - Click-to-Select patient selection and counter reassignment
 * - Real-time elapsed timers and instant "Send to Queue" release triggers
 *
 * @module app/transfer/components/RegistrationCounterSection
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from './ElapsedTimer';
import { transferTexts } from '../constants/transferTexts';
import { TransferStyle } from '../constants/transfer';
import { SelectedTransferPatient } from '../types/transfer';
import { DragHandle } from './DragHandle';

/**
 * Props for {@link RegistrationCounterSection}.
 */
export interface RegistrationCounterSectionProps {
  /** All patients currently at registration counters. */
  patients: Patient[];
  /** Currently dragged patient, if any. */
  draggedPatient: Patient | null;
  /** Counter number currently being hovered over as a drop target. */
  dragOverCounter: number | null;
  /** Currently selected patient in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when user taps a counter patient for reassignment. */
  onSelectPatient?: (patient: Patient, counterNum: number) => void;
  /** Callback triggered when user taps a destination counter to move the selected patient. */
  onTargetCounterClick?: (counterNum: number) => void;
  /** Pointer down drag initiation handler. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse drag handler for backward compatibility. */
  onDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Callback to release the front patient from the counter to the queue. */
  onRelease: (patient: Patient) => void;
  /** Optional allowed counter numbers. */
  allowedCounters?: number[];
}

const DEFAULT_COUNTERS = [1, 2, 3, 4, 5];

/**
 * Registration Counters section presenting all counters in a non-scrollable compact layout.
 *
 * @param props - Counter patient data and interaction listeners.
 * @returns The rendered non-scrollable RegistrationCounterSection.
 */
export function RegistrationCounterSection({
  patients,
  draggedPatient,
  dragOverCounter,
  selectedPatient,
  onSelectPatient,
  onTargetCounterClick,
  onPointerDown,
  onDragStart,
  onRelease,
  allowedCounters,
}: RegistrationCounterSectionProps) {
  const counters = allowedCounters && allowedCounters.length > 0 ? allowedCounters : DEFAULT_COUNTERS;
  const safePatients = Array.isArray(patients) ? patients : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-2.5 sm:p-3 select-none shrink-0 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.registrationHeading}
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
            {safePatients.length}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          {transferTexts.dragCounterHint}
        </span>
      </div>

      {/* Non-scrollable Horizontal Counters Grid */}
      {counters.length === 0 ? (
        <p className="text-slate-400 text-xs py-2 text-center">
          {transferTexts.noCountersAssigned}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {counters.map(counterNum => {
            const counterPatients = safePatients
              .filter(p => p.counter === counterNum)
              .sort(
                (a, b) =>
                  new Date(a.counter_rejoin_at || a.created_at || 0).getTime() -
                  new Date(b.counter_rejoin_at || b.created_at || 0).getTime()
              );

            const isOver = dragOverCounter === counterNum;
            const topPatient = counterPatients[0];
            const waitingPatients = counterPatients.slice(1);

            // Check if this counter is an eligible target to receive selected counter patient
            const isTargetEligible =
              Boolean(selectedPatient) &&
              selectedPatient?.sourceType === 'counter' &&
              selectedPatient.sourceId !== counterNum;

            const handleCounterClick = () => {
              if (isTargetEligible && onTargetCounterClick) {
                onTargetCounterClick(counterNum);
              }
            };

            return (
              <div
                key={counterNum}
                data-counter={counterNum}
                onClick={handleCounterClick}
                style={isTargetEligible ? TransferStyle.assignTargetCard : undefined}
                className={`rounded-xl border p-2 flex flex-col justify-between transition-all select-none min-h-[76px] ${
                  isOver
                    ? 'border-blue-500 bg-blue-50/80 shadow-xs phc-dropzone'
                    : isTargetEligible
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 hover:bg-blue-50/70 cursor-pointer'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                {/* Counter Tile Header */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                      C{counterNum}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 truncate">
                      {transferTexts.counterPrefix} {counterNum}
                    </span>
                  </div>

                  {isTargetEligible ? (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                      {transferTexts.moveToCounterBtn}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {counterPatients.length} {counterPatients.length === 1 ? 'pt' : 'pts'}
                    </span>
                  )}
                </div>

                {/* Primary Patient at Counter Window */}
                {topPatient ? (
                  (() => {
                    const isTopSelected = selectedPatient?.patient.id === topPatient.id;

                    const handleTopPatientClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (onSelectPatient) {
                        onSelectPatient(topPatient, counterNum);
                      }
                    };

                    return (
                      <div
                        onPointerDown={e => onPointerDown?.(e, topPatient)}
                        onMouseDown={e => onDragStart?.(e, topPatient)}
                        onClick={handleTopPatientClick}
                        style={isTopSelected ? TransferStyle.selectedPatientRow : undefined}
                        className={`p-1.5 bg-white rounded-lg border transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer ${
                          draggedPatient?.id === topPatient.id
                            ? 'opacity-40'
                            : isTopSelected
                            ? 'border-[#cc3535] bg-red-50/80 ring-2 ring-[#cc3535]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {isTopSelected ? (
                            <span className="w-4 h-4 rounded bg-[#cc3535] text-white flex items-center justify-center shrink-0">
                              <i className="bx bx-check text-[10px] font-bold" aria-hidden="true" />
                            </span>
                          ) : (
                            <DragHandle title={transferTexts.tapToSelectHint} />
                          )}
                          <span className="font-black text-xs text-[#cc3535] shrink-0">
                            {topPatient.patientNum}
                          </span>
                          <ElapsedTimer startedAt={topPatient.counter_top_started_at ?? undefined} />
                        </div>

                        <button
                          type="button"
                          onPointerDown={e => e.stopPropagation()}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation();
                            onRelease(topPatient);
                          }}
                          title="Send patient to queue"
                          className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded transition-colors shadow-2xs shrink-0 cursor-pointer"
                        >
                          Queue →
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-2 text-center text-slate-400 text-[11px] italic">
                    {isTargetEligible ? transferTexts.counterSelectTargetHint : 'Available'}
                  </div>
                )}

                {/* Additional Waiting Queue in Lane */}
                {waitingPatients.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 overflow-hidden">
                    <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">
                      Next:
                    </span>
                    {waitingPatients.slice(0, 2).map(p => {
                      const isWaitingSelected = selectedPatient?.patient.id === p.id;
                      return (
                        <span
                          key={p.id}
                          onPointerDown={e => onPointerDown?.(e, p)}
                          onMouseDown={e => onDragStart?.(e, p)}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectPatient?.(p, counterNum);
                          }}
                          className={`text-[10px] font-semibold px-1 py-0.5 rounded border shadow-2xs cursor-pointer transition-colors ${
                            isWaitingSelected
                              ? 'bg-red-50 text-[#cc3535] border-[#cc3535] ring-1 ring-[#cc3535]'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {p.patientNum}
                        </span>
                      );
                    })}
                    {waitingPatients.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-medium shrink-0">
                        +{waitingPatients.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RegistrationCounterSection;