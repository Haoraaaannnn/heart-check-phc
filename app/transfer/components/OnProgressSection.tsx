/**
 * @fileoverview Active Queue (On Progress) panel component.
 *
 * Implements strict hospital FIFO queue discipline: only the front/top patient
 * (`index === 0`, "Serving Next") is unlocked for transfer, pointer drag-and-drop,
 * or Click-to-Select tablet assignment. Subsequent downstream patients remain locked
 * in the stack until the front patient is served or rotated.
 *
 * Designed as the designated vertically scrollable container on the dashboard left column.
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/OnProgressSection
 */

'use client';

import React from 'react';
import { PatientHistoryButton } from '@/components/patients/PatientHistoryButton';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from '@/app/transfer/components/ElapsedTimer';
import { transferTexts } from '@/constants/texts/transferTexts';
import { TransferStyle } from '@/app/transfer/constants/transfer';
import { onProgressStyles } from '@/constants/designs/transferStyles';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';
import { DragHandle } from '@/app/transfer/components/DragHandle';

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
    <div className={onProgressStyles.wrapper}>
      {/* Header */}
      <div className={onProgressStyles.header}>
        <div className={onProgressStyles.headerLeft}>
          <span className={onProgressStyles.headerPulseDot} />
          <h2 className={onProgressStyles.headerTitle}>
            {transferTexts.onProgressHeading}
          </h2>
          <span className={onProgressStyles.headerCountBadge}>
            {safePatients.length}
          </span>
        </div>
        <span className={onProgressStyles.headerHint}>
          {isDraggable
            ? transferTexts.dragToCubiclesHint
            : transferTexts.autoAssigningHint}
        </span>
      </div>

      {/* Patient List (The only scrollable container in the Active Queue) */}
      {safePatients.length === 0 ? (
        <div className={onProgressStyles.emptyNotice}>
          {transferTexts.noPatientsInQueue}
        </div>
      ) : (
        <div className={onProgressStyles.scrollList}>
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

            const cardStateClass = isBeingDragged
              ? onProgressStyles.cardBeingDragged
              : isSelected
              ? onProgressStyles.cardSelected
              : isTop
              ? onProgressStyles.cardTop
              : onProgressStyles.cardLocked;

            const numBadgeClass = isSelected
              ? onProgressStyles.patientNumBadgeSelected
              : isTop
              ? onProgressStyles.patientNumBadgeTop
              : onProgressStyles.patientNumBadgeNormal;

            return (
              <div
                key={p.id}
                onPointerDown={handlePointerStart}
                onMouseDown={handleMouseStart}
                onClick={handleCardClick}
                style={isSelected ? TransferStyle.selectedPatientRow : undefined}
                className={`${onProgressStyles.cardBase} ${cardStateClass}`}
              >
                {/* Left Patient Details */}
                <div className="flex items-center gap-2 min-w-0 flex-1 basis-44">
                  {/* Grip, Status Label, or Selection Indicator */}
                  {isDraggable && (
                    isTop ? (
                      isSelected ? (
                        <span className={onProgressStyles.selBadge}>
                          SEL
                        </span>
                      ) : (
                        <DragHandle title={transferTexts.tapToSelectHint} />
                      )
                    ) : (
                      <span
                        title={transferTexts.lockedInStack}
                        className={onProgressStyles.waitBadge}
                      >
                        WAIT
                      </span>
                    )
                  )}

                  {/* Patient Number Tag */}
                  <span className={numBadgeClass}>
                    {p.patientNum}
                  </span>

                  {/* Service info & Position */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="min-w-0">
                      <span className={onProgressStyles.serviceText}>
                        {p.service}
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        {p.subcategory && (
                          <span className={onProgressStyles.subCategoryText}>
                            {p.subcategory}
                          </span>
                        )}
                        <span className={`${onProgressStyles.positionPrefix} whitespace-nowrap`}>
                          {transferTexts.queuePositionPrefix}
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      {isSelected ? (
                        <span className={onProgressStyles.selectedLabel}>
                          {transferTexts.selectedBadge} · {transferTexts.selectedQueuePatientHint}
                        </span>
                      ) : isTop ? (
                        <span className={onProgressStyles.servingNextLabel}>
                          {transferTexts.servingNext}
                        </span>
                      ) : (
                        <span className={onProgressStyles.lockedLabel}>
                          {transferTexts.lockedInStack}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <PatientHistoryButton patientId={p.id} ticket={p.patientNum} />
                  <ElapsedTimer
                    startedAt={p.progress_started_at}
                    warnAfterSeconds={warnAfterSeconds}
                  />
                  {/* Call Button */}
                  <button
                    type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      const ticket = formatTicketForSpeech(p.patientNum);
                      onSpeak(
                        `Number ${ticket}, Number ${ticket}, go to the ${
                          selectedCategory || 'consultation'
                        } area`,
                        p.id
                      );
                    }}
                    disabled={speakingId === p.id}
                    title={transferTexts.callPatientTooltip}
                    className={
                      speakingId === p.id
                        ? onProgressStyles.callBtnSpeaking
                        : onProgressStyles.callBtn
                    }
                  >
                    {speakingId === p.id ? transferTexts.callingBtn : transferTexts.callBtn}
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
                      className={onProgressStyles.assignNowBtn}
                    >
                      {transferTexts.assignBtn}
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
