'use client';

import React from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { ElapsedTimer } from './ElapsedTimer';
import { transferTexts } from '../constants/transferTexts';
import { DragHandle } from './DragHandle';

/**
 * Props for `CubicleCard`.
 */
export interface CubicleCardProps {
  /** Cubicle data object. */
  cubicle: Cubicle;
  /** Array of patients currently assigned to this cubicle. */
  assigned: Patient[];
  /** Whether the drag cursor is currently hovering over this cubicle. */
  isOver: boolean;
  /** Whether drag-and-drop reassignment is permitted. */
  isDraggable: boolean;
  /** Whether maximum capacity has been reached. */
  isFull: boolean;
  /** Pointer down drag initiation handler. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  /** Mouse drag handler for backward compatibility. */
  onDragStart?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  /** Text-to-speech announcement callback. */
  onSpeak: (text: string, patientId: number) => void;
  /** Return patient back to the queue callback. */
  onMoveBack: (patient: Patient, cubicleNum: string) => void;
  /** ID of patient currently being dragged. */
  draggedPatientId?: number;
  /** ID of patient currently being spoken. */
  speakingId?: number | null;
  /** Seconds before elapsed timer flags warning. */
  warnAfterSeconds?: number;
  /** Name of doctor assigned to this cubicle. */
  doctorName?: string;
}

/**
 * Professional Cubicle Lane component designed for list-based layout.
 *
 * @remarks
 * **List-Oriented Architecture:**
 * Formatted as a rich, spacious station card that excels in vertical list layouts,
 * avoiding the cramped columns of legacy grid layouts.
 *
 * @param props - Cubicle state, assigned patients, and pointer handlers.
 * @returns The rendered cubicle card component.
 */
export function CubicleCard({
  cubicle,
  assigned,
  isOver,
  isDraggable,
  isFull,
  onPointerDown,
  onDragStart,
  onSpeak,
  onMoveBack,
  draggedPatientId,
  speakingId,
  warnAfterSeconds,
  doctorName,
}: CubicleCardProps) {
  const uniqueAssigned = Array.from(new Map(assigned.map(p => [p.id, p])).values());
  const visibleAssigned = uniqueAssigned.slice(0, MAX_PATIENTS_PER_CUBICLE);

  return (
    <div
      data-cubicle={cubicle.cubicleNum}
      className={`rounded-2xl border-2 p-4 transition-all duration-150 select-none flex flex-col gap-3 shadow-xs ${
        isOver && isDraggable
          ? 'border-[#cc3535] bg-red-50/80 scale-[1.01] shadow-md phc-dropzone'
          : isFull
          ? 'border-rose-200 bg-rose-50/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Station Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {cubicle.cubicleNum}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              {cubicle.cubicleNum}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {doctorName
                ? `${transferTexts.doctorPrefix} ${doctorName}`
                : transferTexts.unassignedDoctor}
            </p>
          </div>
        </div>

        {/* Capacity & Status Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isFull
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isFull ? transferTexts.cubicleFullAlert : transferTexts.cubicleAvailable}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {visibleAssigned.length}/{MAX_PATIENTS_PER_CUBICLE}
          </span>
        </div>
      </div>

      {/* Patient Assignment Area */}
      {visibleAssigned.length === 0 ? (
        <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium">
          {transferTexts.dropPatientHere}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleAssigned.map((p, index) => {
            const isBeingDragged = draggedPatientId === p.id;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                  isBeingDragged
                    ? 'opacity-40 border-[#cc3535] bg-red-50'
                    : index === 0
                    ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                {/* Patient Info */}
                <div className="flex items-center gap-2 min-w-0">
                  {isDraggable && (
                    <span
                      onPointerDown={e => onPointerDown?.(e, p, cubicle.cubicleNum)}
                      onMouseDown={e => onDragStart?.(e, p, cubicle.cubicleNum)}
                    >
                      <DragHandle title="Drag patient to reassign" />
                    </span>
                  )}

                  <span className="px-2 py-0.5 bg-[#cc3535] text-white rounded-lg text-xs font-black shadow-xs shrink-0">
                    {p.patientNum}
                  </span>

                  <span className="text-xs text-slate-600 font-medium truncate">
                    {p.service}
                    {p.subcategory && ` · ${p.subcategory}`}
                  </span>

                  {index === 0 && (
                    <ElapsedTimer
                      startedAt={p.cubicle_top_started_at}
                      warnAfterSeconds={warnAfterSeconds}
                    />
                  )}
                </div>

                {/* Patient Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {/* Call Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const num = p.patientNum;
                      const letter = num.charAt(0);
                      const digits = parseInt(num.slice(1), 10).toString();
                      onSpeak(
                        `Number ${letter} ${digits}, Number ${letter} ${digits}, go to ${cubicle.cubicleNum}`,
                        p.id
                      );
                    }}
                    disabled={speakingId === p.id}
                    title={transferTexts.callPatientTooltip}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
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

                  {/* Move Back to Queue */}
                  <button
                    type="button"
                    onClick={() => onMoveBack(p, cubicle.cubicleNum)}
                    title={transferTexts.moveToQueueTooltip}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                  >
                    <i className="bx bx-undo text-base" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CubicleCard;