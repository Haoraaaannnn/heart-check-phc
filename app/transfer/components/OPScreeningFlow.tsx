/**
 * @fileoverview OPD Screening service workflow component.
 *
 * Implements subcategory selection, room routing, and the active two-column
 * ServiceBoard layout with Click-to-Select tablet transfer mechanics.
 *
 * @module app/transfer/components/OPScreeningFlow
 */

'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { SubcategoryPicker, RoomPicker } from './StepPickers';
import { ServiceBoard } from './ServiceBoard';
import { SelectedTransferPatient } from '../types/transfer';

/**
 * Props for {@link OPScreeningFlow}.
 */
export interface OPScreeningFlowProps {
  selectedSubcategory: string | null;
  onSelectSubcategory: (sub: string) => void;
  selectedRoom: number | null;
  rooms: number[];
  visibleCubicles: Cubicle[];
  visibleOnProgress: Patient[];
  assignedPatients: Record<string, Patient[]>;
  draggedPatient: Patient | null;
  dragOverCubicle: string | null;
  speaking: number | null;
  onSelectRoom: (room: number) => void;
  onPointerDownFromQueue?: (e: React.PointerEvent, patient: Patient) => void;
  onDragStartFromQueue?: (e: React.MouseEvent, patient: Patient) => void;
  onPointerDownFromCubicle?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  onDragStartFromCubicle?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBackToProgress: (patient: Patient, cubicleNum: string) => void;
  isDragEnabled: boolean;
  registrationPatients: Patient[];
  regDraggedPatient: Patient | null;
  dragOverCounter: number | null;
  onRegPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  onRegDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  cubicleDoctorMap?: Record<string, string>;
  onReleaseFromCounter: (patient: Patient) => void;
  onAssignNow?: (patient: Patient) => void;
  idlePatients: Patient[];
  onActivateIdle: (patient: Patient) => void;
  onRemoveIdle: (patient: Patient) => void;
  allowedCounters?: number[];
  allowedSubcategories?: string[];

  // Click-to-Select tablet mode props
  selectedPatient?: SelectedTransferPatient | null;
  onSelectQueuePatient?: (patient: Patient) => void;
  onSelectCubiclePatient?: (patient: Patient, cubicleNum: string) => void;
  onSelectCounterPatient?: (patient: Patient, counterNum: number) => void;
  onTargetCubicleClick?: (cubicleNum: string) => void;
  onTargetCounterClick?: (counterNum: number) => void;
  onCancelSelection?: () => void;
}

/**
 * OPD Screening service workflow component.
 *
 * @param props - Screening state, patient queues, and interaction handlers.
 * @returns The active OPD Screening step view.
 */
export function OPScreeningFlow({
  selectedSubcategory,
  onSelectSubcategory,
  selectedRoom,
  rooms,
  visibleCubicles,
  visibleOnProgress,
  assignedPatients,
  draggedPatient,
  dragOverCubicle,
  speaking,
  onSelectRoom,
  onPointerDownFromQueue,
  onDragStartFromQueue,
  onPointerDownFromCubicle,
  onDragStartFromCubicle,
  onSpeak,
  onMoveBackToProgress,
  isDragEnabled,
  registrationPatients,
  regDraggedPatient,
  dragOverCounter,
  onRegPointerDown,
  onRegDragStart,
  cubicleDoctorMap = {},
  onReleaseFromCounter,
  onAssignNow,
  idlePatients,
  onActivateIdle,
  onRemoveIdle,
  allowedCounters,
  allowedSubcategories,
  selectedPatient,
  onSelectQueuePatient,
  onSelectCubiclePatient,
  onSelectCounterPatient,
  onTargetCubicleClick,
  onTargetCounterClick,
  onCancelSelection,
}: OPScreeningFlowProps) {
  // Step 1: Subcategory Picker
  if (!selectedSubcategory) {
    const safeOnProgress = Array.isArray(visibleOnProgress) ? visibleOnProgress : [];
    const safeIdle = Array.isArray(idlePatients) ? idlePatients : [];
    const safeRegistration = Array.isArray(registrationPatients) ? registrationPatients : [];

    const countFor = (sub: string) => ({
      queue: safeOnProgress.filter(p => p.subcategory === sub).length,
      idle: safeIdle.filter(p => p.subcategory === sub).length,
      registration: safeRegistration.filter(p => p.subcategory === sub).length,
    });

    const ALL_SUBCATEGORIES = [
      { sub: 'Adult', icon: 'bx-male' },
      { sub: 'Pedia', icon: 'bx-child' },
    ];

    const visibleSubcategories = ALL_SUBCATEGORIES;

    return (
      <SubcategoryPicker
        subcategories={visibleSubcategories}
        onSelect={onSelectSubcategory}
        countFor={countFor}
      />
    );
  }

  // Step 2: Room Picker
  if (!selectedRoom) {
    return (
      <RoomPicker
        rooms={rooms}
        visibleCubicles={visibleCubicles}
        assignedPatients={assignedPatients}
        onProgressPatients={visibleOnProgress}
        onSelectRoom={onSelectRoom}
        serviceContext="OPD Screening"
      />
    );
  }

  // Step 3: Service Board
  return (
    <ServiceBoard
      category="OPD Screening"
      onProgressPatients={visibleOnProgress}
      idlePatients={idlePatients}
      cubicles={visibleCubicles}
      assignedPatients={assignedPatients}
      isDraggable={isDragEnabled}
      draggedPatient={draggedPatient}
      dragOverCubicle={dragOverCubicle}
      speakingId={speaking}
      onSpeak={onSpeak}
      onMoveBackToProgress={onMoveBackToProgress}
      onPointerDownFromQueue={onPointerDownFromQueue}
      onDragStartFromQueue={onDragStartFromQueue}
      onPointerDownFromCubicle={onPointerDownFromCubicle}
      onDragStartFromCubicle={onDragStartFromCubicle}
      onAssignNow={onAssignNow}
      onActivateIdle={onActivateIdle}
      onRemoveIdle={onRemoveIdle}
      cubicleDoctorMap={cubicleDoctorMap}
      registrationPatients={registrationPatients}
      regDraggedPatient={regDraggedPatient}
      dragOverCounter={dragOverCounter}
      onRegPointerDown={onRegPointerDown}
      onRegDragStart={onRegDragStart}
      onReleaseFromCounter={onReleaseFromCounter}
      allowedCounters={allowedCounters}
      selectedPatient={selectedPatient}
      onSelectQueuePatient={onSelectQueuePatient}
      onSelectCubiclePatient={onSelectCubiclePatient}
      onSelectCounterPatient={onSelectCounterPatient}
      onTargetCubicleClick={onTargetCubicleClick}
      onTargetCounterClick={onTargetCounterClick}
      onCancelSelection={onCancelSelection}
    />
  );
}

export default OPScreeningFlow;