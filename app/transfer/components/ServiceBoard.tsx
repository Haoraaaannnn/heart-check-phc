/**
 * @fileoverview Non-scrollable ServiceBoard orchestrating Queue Panel, Counters, and Cubicles.
 *
 * Implements a non-scrollable, fit-to-screen dashboard layout:
 * - Left column (4 cols): Active queue and idle patients panel (the only vertically scrollable component).
 * - Right column (8 cols): Registration counters in a compact horizontal grid and cubicle stations in a responsive grid.
 * - Zero page-level or station-level scrolling, ensuring all components are directly visible on screen.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/ServiceBoard
 */

'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { QueuePanel } from '@/app/transfer/components/QueuePanel';
import { RegistrationCounterSection } from '@/app/transfer/components/RegistrationCounterSection';
import { CubicleCard } from '@/app/transfer/components/CubicleCard';
import { QuickAssignDropdown } from '@/app/transfer/components/QuickAssignDropdown';
import { transferTexts } from '@/constants/texts/transferTexts';
import { transferLayoutStyles, cubicleStyles } from '@/constants/designs/transferStyles';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';

/**
 * Props for {@link ServiceBoard}.
 */
export interface ServiceBoardProps {
  /** Service category identifier. */
  category: string;
  /** Active queue patients list. */
  onProgressPatients: Patient[];
  /** Idle patients list. */
  idlePatients: Patient[];
  /** Cubicles configured for this service/room. */
  cubicles: Cubicle[];
  /** Map of assigned patients by cubicle number. */
  assignedPatients: Record<string, Patient[]>;
  /** Whether drag-and-drop or tap assignment is active. */
  isDraggable: boolean;
  /** Currently dragged patient, if any. */
  draggedPatient?: Patient | null;
  /** Cubicle number currently being hovered over during a drag. */
  dragOverCubicle?: string | null;
  /** Active text-to-speech patient ID. */
  speakingId?: number | null;
  /** Audio announcement callback. */
  onSpeak: (text: string, patientId: number) => void;
  /** Move back to queue callback. */
  onMoveBackToProgress: (patient: Patient, cubicleNum: string) => void;
  /** Pointer down handler from queue. */
  onPointerDownFromQueue?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse handler from queue (backward compatibility). */
  onDragStartFromQueue?: (e: React.MouseEvent, patient: Patient) => void;
  /** Pointer down handler from cubicle. */
  onPointerDownFromCubicle?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  /** Mouse handler from cubicle (backward compatibility). */
  onDragStartFromCubicle?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  /** Instant assign handler. */
  onAssignNow?: (patient: Patient) => void;
  /** Idle reactivation handler. */
  onActivateIdle: (patient: Patient) => void;
  /** Idle removal handler. */
  onRemoveIdle: (patient: Patient) => void;
  /** Map of cubicle numbers to doctor names. */
  cubicleDoctorMap?: Record<string, string>;
  /** Optional timeout warning in seconds. */
  warnAfterSeconds?: number;

  // Registration counter props (for Consultation and OPD Screening)
  /** Registration counter patients. */
  registrationPatients?: Patient[];
  /** Currently dragged registration patient. */
  regDraggedPatient?: Patient | null;
  /** Counter number hovered during registration drag. */
  dragOverCounter?: number | null;
  /** Pointer handler for registration drag. */
  onRegPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse handler for registration drag (backward compatibility). */
  onRegDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Release from counter callback. */
  onReleaseFromCounter?: (patient: Patient) => void;
  /** Allowed counter numbers. */
  allowedCounters?: number[];

  // Click-to-Select Tablet Interaction Mode Props
  /** Currently selected patient in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when user taps an active queue patient to select. */
  onSelectQueuePatient?: (patient: Patient) => void;
  /** Callback triggered when user taps a cubicle patient to select. */
  onSelectCubiclePatient?: (patient: Patient, cubicleNum: string) => void;
  /** Callback triggered when user taps a registration counter patient to select. */
  onSelectCounterPatient?: (patient: Patient, counterNum: number) => void;
  /** Callback triggered when user taps an available cubicle to assign the selected patient. */
  onTargetCubicleClick?: (cubicleNum: string) => void;
  /** Callback triggered when user taps a target counter to move the selected patient. */
  onTargetCounterClick?: (counterNum: number) => void;
  /** Callback to cancel patient selection. */
  onCancelSelection?: () => void;
}

/**
 * ServiceBoard presenting Queue, Counters, and Cubicles on screen without scrolling.
 *
 * @param props - All data and interaction handlers for the service board.
 * @returns The rendered ServiceBoard component.
 */
export function ServiceBoard({
  category,
  onProgressPatients,
  idlePatients,
  cubicles,
  assignedPatients,
  isDraggable,
  draggedPatient,
  dragOverCubicle,
  speakingId,
  onSpeak,
  onMoveBackToProgress,
  onPointerDownFromQueue,
  onDragStartFromQueue,
  onPointerDownFromCubicle,
  onDragStartFromCubicle,
  onAssignNow,
  onActivateIdle,
  onRemoveIdle,
  cubicleDoctorMap = {},
  warnAfterSeconds,
  registrationPatients,
  regDraggedPatient,
  dragOverCounter,
  onRegPointerDown,
  onRegDragStart,
  onReleaseFromCounter,
  allowedCounters,
  selectedPatient,
  onSelectQueuePatient,
  onSelectCubiclePatient,
  onSelectCounterPatient,
  onTargetCubicleClick,
  onTargetCounterClick,
  onCancelSelection,
}: ServiceBoardProps) {
  const hasRegistrationCounters = Boolean(
    registrationPatients !== undefined && onReleaseFromCounter
  );

  return (
    <>
      <div className={transferLayoutStyles.twoColumnGrid}>
        {/* Left Column: Queue & Idle Panel (4 cols on tablet and desktop) */}
        <div className={transferLayoutStyles.leftColumn}>
          <QueuePanel
            onProgressPatients={onProgressPatients}
            idlePatients={idlePatients}
            isDraggable={isDraggable}
            selectedCategory={category}
            draggedPatientId={draggedPatient?.id}
            selectedPatient={selectedPatient}
            onSelectQueuePatient={onSelectQueuePatient}
            onPointerDown={onPointerDownFromQueue}
            onDragStart={onDragStartFromQueue}
            onSpeak={onSpeak}
            onAssignNow={onAssignNow}
            speakingId={speakingId}
            warnAfterSeconds={warnAfterSeconds}
            onActivateIdle={onActivateIdle}
            onRemoveIdle={onRemoveIdle}
          />
        </div>

        {/* Right Column: Counters + Cubicles (8 cols on tablet and desktop) */}
        <div className={transferLayoutStyles.rightColumn}>
          {/* Registration Counters (if available) - Horizontal compact grid, NO scrollbar */}
          {hasRegistrationCounters && (
            <RegistrationCounterSection
              patients={registrationPatients!}
              draggedPatient={regDraggedPatient ?? null}
              dragOverCounter={dragOverCounter ?? null}
              selectedPatient={selectedPatient}
              onSelectPatient={onSelectCounterPatient}
              onTargetCounterClick={onTargetCounterClick}
              onPointerDown={onRegPointerDown}
              onDragStart={onRegDragStart}
              onRelease={onReleaseFromCounter!}
              allowedCounters={allowedCounters}
            />
          )}

          {/* Consultation & Screening Cubicles - Horizontal row same as counters */}
          <div className={cubicleStyles.sectionCard}>
            <div className={cubicleStyles.header}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={cubicleStyles.headerDot} />
                <h2 className={cubicleStyles.headerTitle}>
                  {transferTexts.cubiclesHeading}
                </h2>
                <span className={cubicleStyles.headerCountBadge}>
                  {cubicles.length}
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-[#d4d4d4] font-semibold whitespace-normal break-words min-w-0">
                {category}
              </span>
            </div>

            {/* Horizontal Cubicles Grid - same as counters */}
            {(() => {
              const safeCubicles = Array.isArray(cubicles) ? cubicles : [];
              const safeAssignedPatients = assignedPatients || {};
              const safeDoctorMap = cubicleDoctorMap || {};

              if (safeCubicles.length === 0) {
                return (
                  <p className={cubicleStyles.emptyNotice}>
                    {transferTexts.noRoomsConfiguredDesc}
                  </p>
                );
              }

              return (
                <div className={cubicleStyles.cubicleGrid}>
                  {safeCubicles.map(cubicle => {
                    const assigned = safeAssignedPatients[cubicle.cubicleNum] || [];
                    const isOver = dragOverCubicle === cubicle.cubicleNum;
                    const isFull = assigned.length >= 5;

                    return (
                      <CubicleCard
                        key={cubicle.id}
                        cubicle={cubicle}
                        assigned={assigned}
                        isOver={isOver}
                        isDraggable={isDraggable}
                        isFull={isFull}
                        selectedPatient={selectedPatient}
                        onSelectPatient={onSelectCubiclePatient}
                        onTargetClick={onTargetCubicleClick}
                        onPointerDown={onPointerDownFromCubicle}
                        onDragStart={onDragStartFromCubicle}
                        onSpeak={onSpeak}
                        onMoveBack={onMoveBackToProgress}
                        draggedPatientId={draggedPatient?.id}
                        speakingId={speakingId}
                        doctorName={safeDoctorMap[cubicle.cubicleNum]}
                        warnAfterSeconds={warnAfterSeconds}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Quick-Assign Destination Popover for One-Tap Station Allocation */}
      {selectedPatient && (
        <QuickAssignDropdown
          patient={selectedPatient.patient}
          sourceType={selectedPatient.sourceType === 'counter' ? 'queue' : selectedPatient.sourceType}
          currentCubicleNum={
            selectedPatient.sourceType === 'cubicle'
              ? String(selectedPatient.sourceId)
              : undefined
          }
          cubicles={cubicles}
          cubicleDoctorMap={cubicleDoctorMap}
          assignedPatients={assignedPatients}
          onAssignToCubicle={(p, cubicleNum) => {
            if (onTargetCubicleClick) {
              onTargetCubicleClick(cubicleNum);
            }
          }}
          onMoveBackToQueue={(p, cubicleNum) => {
            if (onMoveBackToProgress) {
              onMoveBackToProgress(p, cubicleNum);
            }
          }}
          onSpeak={onSpeak}
          categoryName={category}
          onClose={onCancelSelection || (() => {})}
        />
      )}
    </>
  );
}

export default ServiceBoard;
