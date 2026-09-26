/**
 * @fileoverview Workflow wrapper for non-consultation services (e.g. ECG, Refill Prescription, Warfarin).
 *
 * Renders the two-column ServiceBoard with queue panel, cubicle lanes, and Click-to-Select
 * tablet interaction support.
 *
 * @module app/transfer/components/OtherServicesFlow
 */

'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { ServiceBoard } from './ServiceBoard';
import { SelectedTransferPatient } from '../types/transfer';

/**
 * Props for {@link OtherServicesFlow}.
 */
export interface OtherServicesFlowProps {
  visibleCubicles: Cubicle[];
  visibleOnProgress: Patient[];
  assignedPatients: Record<string, Patient[]>;
  draggedPatient: Patient | null;
  dragOverCubicle: string | null;
  speaking: number | null;
  selectedCategory: string;
  onPointerDownFromQueue?: (e: React.PointerEvent, patient: Patient) => void;
  onDragStartFromQueue?: (e: React.MouseEvent, patient: Patient) => void;
  onPointerDownFromCubicle?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  onDragStartFromCubicle?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBackToProgress: (patient: Patient, cubicleNum: string) => void;
  isDragEnabled: boolean;
  rotateTimeoutMs: number;
  idlePatients: Patient[];
  onActivateIdle: (patient: Patient) => void;
  onRemoveIdle: (patient: Patient) => void;

  // Click-to-Select tablet mode props
  selectedPatient?: SelectedTransferPatient | null;
  onSelectQueuePatient?: (patient: Patient) => void;
  onSelectCubiclePatient?: (patient: Patient, cubicleNum: string) => void;
  onTargetCubicleClick?: (cubicleNum: string) => void;
  onCancelSelection?: () => void;
}

/**
 * Workflow wrapper for non-consultation services.
 *
 * @param props - Service configuration, queues, and interaction handlers.
 * @returns The rendered ServiceBoard view.
 */
export function OtherServicesFlow({
  visibleCubicles,
  visibleOnProgress,
  assignedPatients,
  draggedPatient,
  dragOverCubicle,
  speaking,
  selectedCategory,
  onPointerDownFromQueue,
  onDragStartFromQueue,
  onPointerDownFromCubicle,
  onDragStartFromCubicle,
  onSpeak,
  onMoveBackToProgress,
  isDragEnabled,
  rotateTimeoutMs,
  idlePatients,
  onActivateIdle,
  onRemoveIdle,
  selectedPatient,
  onSelectQueuePatient,
  onSelectCubiclePatient,
  onTargetCubicleClick,
  onCancelSelection,
}: OtherServicesFlowProps) {
  return (
    <ServiceBoard
      category={selectedCategory}
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
      onActivateIdle={onActivateIdle}
      onRemoveIdle={onRemoveIdle}
      warnAfterSeconds={rotateTimeoutMs / 1000}
      selectedPatient={selectedPatient}
      onSelectQueuePatient={onSelectQueuePatient}
      onSelectCubiclePatient={onSelectCubiclePatient}
      onTargetCubicleClick={onTargetCubicleClick}
      onCancelSelection={onCancelSelection}
    />
  );
}

export default OtherServicesFlow;