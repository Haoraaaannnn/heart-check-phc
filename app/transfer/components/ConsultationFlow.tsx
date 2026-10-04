/**
 * @fileoverview Consultation service workflow component.
 *
 * Progresses across 3 stages:
 * 1. Subcategory Selection (Adult / Pedia) with real-time queue badges.
 * 2. Room Selection (e.g. Room 1, 2) with assigned counts.
 * 3. Two-Column ServiceBoard with queue panel, list-based stations, and Click-to-Select tablet support.
 *
 * @module app/transfer/components/ConsultationFlow
 */

'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { SubcategoryPicker, RoomPicker } from './StepPickers';
import { ServiceBoard } from './ServiceBoard';
import { SelectedTransferPatient } from '../types/transfer';

/**
 * Props for {@link ConsultationFlow}.
 */
export interface ConsultationFlowProps {
  selectedSubcategory: string | null;
  selectedRoom: number | null;
  rooms: number[];
  visibleCubicles: Cubicle[];
  visibleOnProgress: Patient[];
  assignedPatients: Record<string, Patient[]>;
  draggedPatient: Patient | null;
  dragOverCubicle: string | null;
  speaking: number | null;
  registrationPatients: Patient[];
  regDraggedPatient: Patient | null;
  dragOverCounter: number | null;
  onRegPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  onRegDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  onSelectSubcategory: (sub: string) => void;
  onSelectRoom: (room: number) => void;
  onPointerDownFromQueue?: (e: React.PointerEvent, patient: Patient) => void;
  onDragStartFromQueue?: (e: React.MouseEvent, patient: Patient) => void;
  onPointerDownFromCubicle?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  onDragStartFromCubicle?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBackToProgress: (patient: Patient, cubicleNum: string) => void;
  isDragEnabled: boolean;
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
 * Consultation service workflow component.
 *
 * @param props - Navigation state, patient queues, and interaction handlers.
 * @returns The active view corresponding to current selection step.
 */
export function ConsultationFlow({
  selectedSubcategory,
  selectedRoom,
  rooms,
  visibleCubicles,
  visibleOnProgress,
  assignedPatients,
  draggedPatient,
  dragOverCubicle,
  speaking,
  registrationPatients,
  regDraggedPatient,
  dragOverCounter,
  onRegPointerDown,
  onRegDragStart,
  onSelectSubcategory,
  onSelectRoom,
  onPointerDownFromQueue,
  onDragStartFromQueue,
  onPointerDownFromCubicle,
  onDragStartFromCubicle,
  onSpeak,
  onMoveBackToProgress,
  isDragEnabled,
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
}: ConsultationFlowProps) {
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

    const SUBCATEGORY_DEFINITIONS = [
      { sub: 'Adult', icon: 'bx-male' },
      { sub: 'Pedia', icon: 'bx-child' },
    ];

    const visibleList = SUBCATEGORY_DEFINITIONS;

    return (
      <SubcategoryPicker
        subcategories={visibleList}
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
        serviceContext="Consultation"
      />
    );
  }

  // Step 3: Service Board (Two-column queue + list-based stations)
  return (
    <ServiceBoard
      category="Consultation"
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

export default ConsultationFlow;