'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from './ElapsedTimer';
import { transferTexts } from '../constants/transferTexts';
import { DragHandle } from './DragHandle';
import { ScrollArea } from '@/components/reusables/ScrollArea';

/**
 * Props for `RegistrationCounterSection`.
 */
export interface RegistrationCounterSectionProps {
  /** All patients currently at registration counters. */
  patients: Patient[];
  /** Currently dragged patient, if any. */
  draggedPatient: Patient | null;
  /** Counter number currently being hovered over as a drop target. */
  dragOverCounter: number | null;
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
 * Registration Counters component formatted as a vertical lane list.
 *
 * @remarks
 * **List Layout Transformation:**
 * Transformed from cramped horizontal multi-column grids into a streamlined vertical list of counter lanes.
 * Each lane clearly presents:
 * - Counter identifier and active patient tally badge
 * - Primary patient currently at the counter window with elapsed timer and release button
 * - Subsequent waiting line for that counter
 * - Interactive pointer drop target (`data-counter`) for smooth reassignments
 *
 * @param props - Counter patient data and pointer drag listeners.
 * @returns The rendered vertical list RegistrationCounterSection.
 */
export function RegistrationCounterSection({
  patients,
  draggedPatient,
  dragOverCounter,
  onPointerDown,
  onDragStart,
  onRelease,
  allowedCounters,
}: RegistrationCounterSectionProps) {
  const counters = allowedCounters !== undefined ? allowedCounters : DEFAULT_COUNTERS;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 mb-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.registrationHeading}
          </h2>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {patients.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {transferTexts.dragCounterHint}
        </span>
      </div>

      {counters.length === 0 ? (
        <p className="text-slate-400 text-xs py-4 text-center">
          {transferTexts.noCountersAssigned}
        </p>
      ) : (
        <ScrollArea className="max-h-[460px] pr-1 space-y-2.5">
          {counters.map(counterNum => {
            const counterPatients = patients
              .filter(p => p.counter === counterNum)
              .sort(
                (a, b) =>
                  new Date(a.counter_rejoin_at || a.created_at || 0).getTime() -
                  new Date(b.counter_rejoin_at || b.created_at || 0).getTime()
              );

            const isOver = dragOverCounter === counterNum;
            const topPatient = counterPatients[0];
            const waitingPatients = counterPatients.slice(1);

            return (
              <div
                key={counterNum}
                data-counter={counterNum}
                className={`rounded-xl border transition-all p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isOver
                    ? 'border-blue-500 bg-blue-50/80 shadow-sm phc-dropzone'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {/* Counter Identity Badge */}
                <div className="flex items-center gap-2.5 shrink-0 min-w-[120px]">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    C{counterNum}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      {transferTexts.counterPrefix} {counterNum}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {counterPatients.length} {counterPatients.length === 1 ? 'patient' : 'patients'}
                    </span>
                  </div>
                </div>

                {/* Primary Patient at Window */}
                <div className="flex-1 min-w-0">
                  {topPatient ? (
                    <div
                      onPointerDown={e => onPointerDown?.(e, topPatient)}
                      onMouseDown={e => onDragStart?.(e, topPatient)}
                      className={`flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-xs cursor-grab active:cursor-grabbing ${
                        draggedPatient?.id === topPatient.id ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DragHandle title="Drag to move between counters" />
                        <span className="font-black text-sm text-[#cc3535]">
                          {topPatient.patientNum}
                        </span>
                        <span className="text-slate-600 text-xs font-medium truncate">
                          {topPatient.service}
                          {topPatient.subcategory && ` · ${topPatient.subcategory}`}
                        </span>
                        <ElapsedTimer startedAt={topPatient.counter_top_started_at ?? undefined} />
                      </div>

                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => onRelease(topPatient)}
                        className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                      >
                        {transferTexts.sendToQueueBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 px-3 text-slate-300 text-xs italic text-center md:text-left">
                      {transferTexts.noPatientsAtCounter}
                    </div>
                  )}
                </div>

                {/* Additional Waiting Queue in Lane */}
                {waitingPatients.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Next:
                    </span>
                    {waitingPatients.slice(0, 4).map(p => (
                      <span
                        key={p.id}
                        onPointerDown={e => onPointerDown?.(e, p)}
                        onMouseDown={e => onDragStart?.(e, p)}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-xs cursor-grab"
                      >
                        {p.patientNum}
                      </span>
                    ))}
                    {waitingPatients.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        +{waitingPatients.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}

export default RegistrationCounterSection;