'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { ServiceBoard } from './ServiceBoard';

/**
 * Props for `OtherServicesFlow`.
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
}

/**
 * Workflow wrapper for non-consultation services (e.g. ECG, Refill Prescription, Warfarin).
 *
 * @param props - Service configuration, queues, and handlers.
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
    />
  );
}

export default OtherServicesFlow;