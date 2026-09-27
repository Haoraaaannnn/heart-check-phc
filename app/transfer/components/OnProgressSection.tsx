/**
 * @fileoverview Active Queue (On Progress) panel component.
 *
 * Implements strict hospital FIFO queue discipline: only the front/top patient
 * (`index === 0`, "Serving Next") is unlocked for transfer, pointer drag-and-drop,
 * or Click-to-Select tablet assignment. Subsequent downstream patients remain locked
 * in the stack until the front patient is served or rotated.
 *
 * Designed as the designated vertically scrollable container on the dashboard left column.
 *
 * @module app/transfer/components/OnProgressSection
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
 * Props for {@link OnProgressSection}.
 */
export interface OnProgressSectionProps {
  /** Array of active queue patients sorted by queue priority. */
  patients: Patient[];
  /** Whether drag-and-drop or tap assignment is permitted. */
  isDraggable: boolean;
  /** Currently selected service category name. */
  selectedCategory: string | null;
  /** ID of patient currently being dragged, if any. */
  draggedPatientId?: number;
  /** Currently selected patient in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when the unlocked top patient is tapped/clicked for selection. */
  onSelectPatient?: (patient: Patient) => void;
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
 * Queue component with strict FIFO queue stack discipline and internal smooth scrolling.
 *
 * @param props - Queue data, drag handlers, and action triggers.
 * @returns The rendered OnProgressSection component.
 */
export function OnProgressSection({
  patients,
  isDraggable,
  selectedCategory,
  draggedPatientId,
  selectedPatient,
  onSelectPatient,
  onPointerDown,
  onDragStart,
  onSpeak,
  onAssignNow,
  speakingId,
  warnAfterSeconds,
}: OnProgressSectionProps) {
  const safePatients = Array.isArray(patients) ? patients : [];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.onProgressHeading}
          </h2>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {safePatients.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {isDraggable
            ? transferTexts.dragToCubiclesHint
            : transferTexts.autoAssigningHint}
        </span>
      </div>

      {/* Patient List (The only scrollable container in the Active Queue) */}
      {safePatients.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          {transferTexts.noPatientsInQueue}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto phc-scroll pr-1 space-y-1.5">
          {safePatients.map((p, index) => {
            // Stack discipline: Only the top patient (index === 0) is unlocked
            const isTop = index === 0;
            const isLocked = !isTop;
            const isBeingDragged = draggedPatientId === p.id;
            const isSelected = selectedPatient?.patient.id === p.id;

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

            const handleCardClick = () => {
              if (isTop && isDraggable && onSelectPatient) {
                onSelectPatient(p);
              }
            };

            return (
              <div
                key={p.id}
                onPointerDown={handlePointerStart}
                onMouseDown={handleMouseStart}
                onClick={handleCardClick}
                style={isSelected ? TransferStyle.selectedPatientRow : undefined}
                className={`relative flex items-center justify-between border rounded-xl p-2 transition-all select-none ${
                  isBeingDragged
                    ? 'opacity-30 border-[#cc3535] bg-red-50'
                    : isSelected
                    ? 'border-[#cc3535] bg-red-50/80 shadow-xs ring-2 ring-[#cc3535] cursor-pointer'
                    : isTop
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs cursor-grab active:cursor-grabbing hover:border-emerald-400'
                    : 'border-slate-200 bg-slate-50/60 opacity-80 cursor-not-allowed'
                }`}
              >
                {/* Left Patient Details */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Grip, Lock Icon, or Selection Indicator */}
                  {isDraggable && (
                    isTop ? (
                      isSelected ? (
                        <span className="w-6 h-6 rounded-md bg-[#cc3535] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <i className="bx bx-check text-sm font-bold" aria-hidden="true" />
                        </span>
                      ) : (
                        <DragHandle title={transferTexts.tapToSelectHint} />
                      )
                    ) : (
                      <span
                        title={transferTexts.lockedInStack}
                        className="inline-flex items-center justify-center w-6 h-6 text-slate-400"
                      >
                        <i className="bx bx-lock-alt text-sm" aria-hidden="true" />
                      </span>
                    )
                  )}

                  {/* Patient Number Tag */}
                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-[#cc3535] text-white shadow-2xs'
                        : isTop
                        ? 'bg-[#cc3535] text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.patientNum}
                  </span>

                  {/* Service info & Position */}
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-800 text-xs font-semibold truncate">
                        {p.service}
                        {p.subcategory && ` · ${p.subcategory}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {transferTexts.queuePositionPrefix}
                        {index + 1}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="text-[10px] text-[#cc3535] font-bold tracking-tight">
                        {transferTexts.selectedBadge} · {transferTexts.selectedQueuePatientHint}
                      </span>
                    ) : isTop ? (
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
                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  {/* Call Button */}
                  <button
                    type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      const num = p.patientNum || '';
                      const letter = num ? num.charAt(0) : '';
                      const digits = num.length > 1 ? parseInt(num.slice(1), 10).toString() : '';
                      onSpeak(
                        `Number ${letter} ${digits}, Number ${letter} ${digits}, go to the ${
                          selectedCategory || 'consultation'
                        } area`,
                        p.id
                      );
                    }}
                    disabled={speakingId === p.id}
                    title={transferTexts.callPatientTooltip}
                    className={`w-6 h-6 flex items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
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
                      } text-xs`}
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
                      className="w-6 h-6 flex items-center justify-center rounded-md text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    >
                      <i className="bx bx-check-circle text-sm" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OnProgressSection;