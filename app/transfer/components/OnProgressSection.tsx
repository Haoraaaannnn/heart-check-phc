'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from './ElapsedTimer';
import { transferTexts } from '../constants/transferTexts';
import { ScrollArea } from '@/components/reusables/ScrollArea';
import { DragHandle } from './DragHandle';

/**
 * Props for `OnProgressSection`.
 */
export interface OnProgressSectionProps {
  /** Array of active queue patients sorted by queue priority. */
  patients: Patient[];
  /** Whether drag-and-drop assignment is permitted. */
  isDraggable: boolean;
  /** Currently selected service category name. */
  selectedCategory: string | null;
  /** ID of patient currently being dragged, if any. */
  draggedPatientId?: number;
  /** Pointer down handler to initiate drag. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Backward compatible mouse drag starter. */
  onDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Text-to-speech announcement callback. */
  onSpeak: (text: string, patientId: number) => void;
  /** Instant assignment callback. */
  onAssignNow?: (patient: Patient) => void;
  /** ID of patient whose name/number is currently speaking. */
  speakingId?: number | null;
  /** Seconds before elapsed timer flags a rotation warning. */
  warnAfterSeconds?: number;
  /** Compact card presentation toggle. */
  compact?: boolean;
}

/**
 * Queue component with strict queue stack discipline.
 *
 * @remarks
 * **Queue Locking Principle:**
 * In accordance with hospital protocol, queue patients are locked on their stack in FIFO order.
 * - The patient at `index === 0` (top of stack) is unlocked ("Serving Next") and can be dragged or assigned.
 * - All downstream patients (`index > 0`) remain locked (`cursor-not-allowed`) until the front patient
 *   is assigned, times out, or is moved to Idle.
 *
 * @param props - Queue data, drag handlers, and action triggers.
 * @returns The rendered OnProgressSection component.
 */
export function OnProgressSection({
  patients,
  isDraggable,
  selectedCategory,
  draggedPatientId,
  onPointerDown,
  onDragStart,
  onSpeak,
  onAssignNow,
  speakingId,
  warnAfterSeconds,
  compact = false,
}: OnProgressSectionProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-xs transition-all ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.onProgressHeading}
          </h2>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {patients.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {isDraggable
            ? transferTexts.dragToCubiclesHint
            : transferTexts.autoAssigningHint}
        </span>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          {transferTexts.noPatientsInQueue}
        </div>
      ) : (
        <ScrollArea className="max-h-[380px] pr-1 space-y-2">
          {patients.map((p, index) => {
            // Stack discipline: Only the top patient (index === 0) is unlocked
            const isTop = index === 0;
            const isLocked = !isTop;
            const isBeingDragged = draggedPatientId === p.id;

            const handlePointerStart = (e: React.PointerEvent) => {
              if (!isDraggable || isLocked) return;
              if (onPointerDown) {
                onPointerDown(e, p);
              }
            };

            const handleMouseStart = (e: React.MouseEvent) => {
              if (!isDraggable || isLocked) return;
              if (onDragStart) {
                onDragStart(e, p);
              }
            };

            return (
              <div
                key={p.id}
                onPointerDown={handlePointerStart}
                onMouseDown={handleMouseStart}
                className={`relative flex items-center justify-between border rounded-xl p-2.5 transition-all select-none ${
                  isBeingDragged
                    ? 'opacity-30 border-[#cc3535] bg-red-50'
                    : isTop
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs cursor-grab active:cursor-grabbing hover:border-emerald-400'
                    : 'border-slate-200 bg-slate-50/60 opacity-80 cursor-not-allowed'
                }`}
              >
                {/* Left Patient Details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Grip or Lock Icon */}
                  {isDraggable && (
                    isTop ? (
                      <DragHandle title="Drag patient to cubicle" />
                    ) : (
                      <span
                        title={transferTexts.lockedInStack}
                        className="inline-flex items-center justify-center w-7 h-7 text-slate-400"
                      >
                        <i className="bx bx-lock-alt text-base" aria-hidden="true" />
                      </span>
                    )
                  )}

                  {/* Patient Number Tag */}
                  <span
                    className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                      isTop
                        ? 'bg-[#cc3535] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.patientNum}
                  </span>

                  {/* Service info & Position */}
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 text-xs font-semibold truncate">
                        {p.service}
                        {p.subcategory && ` · ${p.subcategory}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {transferTexts.queuePositionPrefix}
                        {index + 1}
                      </span>
                    </div>

                    {isTop ? (
                      <span className="text-[10px] text-emerald-600 font-bold tracking-tight">
                        {transferTexts.servingNext}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {transferTexts.lockedInStack}
                      </span>
                    )}
                  </div>

                  <ElapsedTimer
                    startedAt={p.progress_started_at}
                    warnAfterSeconds={warnAfterSeconds}
                  />
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Call Button */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      const num = p.patientNum;
                      const letter = num.charAt(0);
                      const digits = parseInt(num.slice(1), 10).toString();
                      onSpeak(
                        `Number ${letter} ${digits}, Number ${letter} ${digits}, go to the ${
                          selectedCategory || 'consultation'
                        } area`,
                        p.id
                      );
                    }}
                    disabled={speakingId === p.id}
                    title={transferTexts.callPatientTooltip}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${
                      speakingId === p.id
                        ? 'bg-blue-100 text-blue-300 cursor-not-allowed'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                    }`}
                  >
                    <i
                      className={`bx ${
                        speakingId === p.id
                          ? 'bx-loader-alt animate-spin'
                          : 'bxs-volume-full'
                      } text-sm`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Assign Now Button (Top patient only) */}
                  {isDraggable && onAssignNow && isTop && (
                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        onAssignNow(p);
                      }}
                      title={transferTexts.assignNowTooltip}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    >
                      <i className="bx bx-check-circle text-base" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}

export default OnProgressSection;