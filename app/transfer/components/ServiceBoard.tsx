/**
 * @fileoverview Non-scrollable ServiceBoard orchestrating Queue Panel, Counters, and Cubicles.
 *
 * Implements a non-scrollable, fit-to-screen dashboard layout:
 * - Left column (4 cols): Active queue and idle patients panel (the only vertically scrollable component).
 * - Right column (8 cols): Registration counters in a compact horizontal grid and cubicle stations in a responsive grid.
 * - Zero page-level or station-level scrolling, ensuring all components are directly visible on screen.
 *
 * @module app/transfer/components/ServiceBoard
 */

'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { QueuePanel } from './QueuePanel';
import { RegistrationCounterSection } from './RegistrationCounterSection';
import { CubicleCard } from './CubicleCard';
import { SelectionBanner } from './SelectionBanner';
import { transferTexts } from '../constants/transferTexts';
import { SelectedTransferPatient } from '../types/transfer';

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
      <div className="h-full flex-1 flex flex-col md:grid md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Queue & Idle Panel (4 cols on tablet and desktop) */}
        <div className="md:col-span-4 lg:col-span-4 h-full flex flex-col min-h-0 overflow-hidden">
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
        <div className="md:col-span-8 lg:col-span-8 h-full flex flex-col min-h-0 gap-2.5 overflow-hidden">
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-2.5 sm:p-3 select-none shrink-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
                <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
                  {transferTexts.cubiclesHeading}
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {cubicles.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {category}
              </span>
            </div>

            {/* Horizontal Cubicles Grid - same as counters! */}
            {(() => {
              const safeCubicles = Array.isArray(cubicles) ? cubicles : [];
              const safeAssignedPatients = assignedPatients || {};
              const safeDoctorMap = cubicleDoctorMap || {};

              if (safeCubicles.length === 0) {
                return (
                  <p className="text-slate-400 text-xs py-2 text-center">
                    {transferTexts.noRoomsConfiguredDesc}
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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

      {/* Floating Selection Banner for Click-to-Select Tablet Guidance */}
      <SelectionBanner
        selectedPatient={selectedPatient ?? null}
        onCancel={onCancelSelection || (() => {})}
      />
    </>
  );
}

export default ServiceBoard;
