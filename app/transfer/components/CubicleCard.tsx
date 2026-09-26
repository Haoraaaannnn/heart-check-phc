/**
 * @fileoverview Compact horizontal Cubicle Station component formatted identically to registration counters.
 *
 * Implements a streamlined horizontal tile displaying:
 * - Cubicle identifier badge and assigned doctor
 * - Station capacity badge and Click-to-Select assignment trigger
 * - Primary patient currently at cubicle with elapsed timer, audio call, and undo actions
 * - Compact queue line of waiting patients
 * - Direct pointer dropzone target (`data-cubicle`) for drag-and-drop transfers
 *
 * @module app/transfer/components/CubicleCard
 */

'use client';

import React from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { ElapsedTimer } from './ElapsedTimer';
import { transferTexts } from '../constants/transferTexts';
import { TransferStyle } from '../constants/transfer';
import { SelectedTransferPatient } from '../types/transfer';
import { DragHandle } from './DragHandle';

/**
 * Props for {@link CubicleCard}.
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
  /** Currently selected patient awaiting target assignment in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when user taps an assigned patient to select them for reassignment. */
  onSelectPatient?: (patient: Patient, cubicleNum: string) => void;
  /** Callback triggered when user taps this cubicle as the destination target for the selected patient. */
  onTargetClick?: (cubicleNum: string) => void;
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
 * Compact horizontal Cubicle Station card structured identically to registration counter tiles.
 *
 * @param props - Cubicle state, assigned patients, and interaction handlers.
 * @returns The rendered horizontal cubicle card.
 */
export function CubicleCard({
  cubicle,
  assigned,
  isOver,
  isDraggable,
  isFull,
  selectedPatient,
  onSelectPatient,
  onTargetClick,
  onPointerDown,
  onDragStart,
  onSpeak,
  onMoveBack,
  draggedPatientId,
  speakingId,
  warnAfterSeconds,
  doctorName,
}: CubicleCardProps) {
  const safeAssigned = Array.isArray(assigned) ? assigned : [];
  const uniqueAssigned = Array.from(new Map(safeAssigned.map(p => [p.id, p])).values());
  const visibleAssigned = uniqueAssigned.slice(0, MAX_PATIENTS_PER_CUBICLE);
  const topPatient = visibleAssigned[0];
  const waitingPatients = visibleAssigned.slice(1);

  // Check if this cubicle is an eligible destination for the active selection
  const isTargetEligible =
    Boolean(selectedPatient) &&
    (selectedPatient?.sourceType === 'queue' ||
      (selectedPatient?.sourceType === 'cubicle' &&
        String(selectedPatient.sourceId) !== cubicle.cubicleNum)) &&
    !isFull;

  const handleCardTargetClick = () => {
    if (isTargetEligible && onTargetClick) {
      onTargetClick(cubicle.cubicleNum);
    }
  };

  return (
    <div
      data-cubicle={cubicle.cubicleNum}
      onClick={handleCardTargetClick}
      style={isTargetEligible ? TransferStyle.assignTargetCard : undefined}
      className={`rounded-xl border p-2 flex flex-col justify-between transition-all select-none min-h-[76px] ${
        isOver && isDraggable
          ? 'border-[#cc3535] bg-red-50/80 scale-[1.01] shadow-xs phc-dropzone'
          : isTargetEligible
          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 hover:border-emerald-600 hover:shadow-xs cursor-pointer'
          : isFull
          ? 'border-rose-200 bg-rose-50/20'
          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
      }`}
    >
      {/* Cubicle Tile Header: Badge + Cubicle Num + Doctor + Assign / Capacity */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
            {cubicle.cubicleNum}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-800 truncate block leading-none">
              {cubicle.cubicleNum}
            </span>
            <span className="text-[9px] text-slate-500 font-medium truncate block leading-none mt-0.5">
              {doctorName
                ? `${transferTexts.doctorPrefix} ${doctorName}`
                : transferTexts.unassignedDoctor}
            </span>
          </div>
        </div>

        {/* Right side of header: "+ Assign" button if target eligible, or capacity pill */}
        {isTargetEligible ? (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleCardTargetClick();
            }}
            className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            {selectedPatient?.sourceType === 'queue'
              ? transferTexts.assignHereBtn
              : transferTexts.reassignHereBtn}
          </button>
        ) : (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
              isFull
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {visibleAssigned.length}/{MAX_PATIENTS_PER_CUBICLE}
          </span>
        )}
      </div>

      {/* Primary Patient at Cubicle (or Drop/Assign target) */}
      {topPatient ? (
        (() => {
          const isTopSelected = selectedPatient?.patient.id === topPatient.id;

          const handleTopPatientClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isDraggable && onSelectPatient) {
              onSelectPatient(topPatient, cubicle.cubicleNum);
            }
          };

          return (
            <div
              onPointerDown={e => onPointerDown?.(e, topPatient, cubicle.cubicleNum)}
              onMouseDown={e => onDragStart?.(e, topPatient, cubicle.cubicleNum)}
              onClick={handleTopPatientClick}
              style={isTopSelected ? TransferStyle.selectedPatientRow : undefined}
              className={`p-1.5 bg-white rounded-lg border transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer ${
                draggedPatientId === topPatient.id
                  ? 'opacity-40'
                  : isTopSelected
                  ? 'border-[#cc3535] bg-red-50/80 ring-2 ring-[#cc3535]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                {isDraggable && (
                  isTopSelected ? (
                    <span className="w-4 h-4 rounded bg-[#cc3535] text-white flex items-center justify-center shrink-0">
                      <i className="bx bx-check text-[10px] font-bold" aria-hidden="true" />
                    </span>
                  ) : (
                    <DragHandle title={transferTexts.tapToSelectHint} />
                  )
                )}
                <span className="font-black text-xs text-[#cc3535] shrink-0">
                  {topPatient.patientNum}
                </span>
                <span className="text-[10px] text-slate-500 truncate hidden xl:inline">
                  {topPatient.subcategory || topPatient.service}
                </span>
                <ElapsedTimer
                  startedAt={topPatient.cubicle_top_started_at}
                  warnAfterSeconds={warnAfterSeconds}
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Audio call button */}
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    const num = topPatient.patientNum || '';
                    const letter = num ? num.charAt(0) : '';
                    const digits = num.length > 1 ? parseInt(num.slice(1), 10).toString() : '';
                    onSpeak(
                      `Number ${letter} ${digits}, Number ${letter} ${digits}, go to ${cubicle.cubicleNum}`,
                      topPatient.id
                    );
                  }}
                  disabled={speakingId === topPatient.id}
                  title={transferTexts.callPatientTooltip}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    speakingId === topPatient.id
                      ? 'bg-blue-100 text-blue-300 cursor-not-allowed'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                  }`}
                >
                  <i
                    className={`bx ${
                      speakingId === topPatient.id
                        ? 'bx-loader-alt animate-spin'
                        : 'bxs-volume-full'
                    } text-[11px]`}
                    aria-hidden="true"
                  />
                </button>

                {/* Return to queue button */}
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    onMoveBack(topPatient, cubicle.cubicleNum);
                  }}
                  title={transferTexts.moveToQueueTooltip}
                  className="w-5 h-5 rounded flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                >
                  <i className="bx bx-undo text-xs" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="py-2 text-center text-slate-400 text-[11px] italic">
          {isTargetEligible ? transferTexts.cubicleSelectTargetHint : 'Available'}
        </div>
      )}

      {/* Additional Waiting Patients in this Cubicle Lane */}
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
                onPointerDown={e => onPointerDown?.(e, p, cubicle.cubicleNum)}
                onMouseDown={e => onDragStart?.(e, p, cubicle.cubicleNum)}
                onClick={e => {
                  e.stopPropagation();
                  onSelectPatient?.(p, cubicle.cubicleNum);
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
}

export default CubicleCard;