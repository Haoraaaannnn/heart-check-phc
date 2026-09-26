/**
 * @fileoverview Hook managing pointer-based drag-and-drop operations between
 * clinical pipeline stages in the Nurse Dashboard.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - Unified Pointer Events supporting touch, mouse, and stylus
 * - React Portal drag preview tracking
 * - Stage dropzone hit-testing with visual feedback
 * - Comprehensive JSDoc and zero emojis
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage, DropFeedback } from '../types/nurse';
import { DragPoint, pointOf, findDropTarget, canStartDrag } from './dragUtils';

/**
 * Return model for the useNurseDragAndDrop hook.
 */
export interface UseNurseDragAndDropReturn {
  /** The patient currently being dragged, or null if idle. */
  draggedPatient: Patient | null;
  /** Clinical stage where the drag originated. */
  dragSourceStage: ClinicalStage | null;
  /** Clinical stage currently hovered over by pointer, or null. */
  dragOverStage: ClinicalStage | null;
  /** Current coordinates `{ x, y }` of the pointer. */
  dragPoint: DragPoint | null;
  /** Transient visual feedback status for drop operations. */
  dropFeedback: DropFeedback;
  /** Whether an active drag operation is currently underway. */
  isDragging: boolean;
  /** Pointer down initiator to be attached to draggable cards or handles. */
  handlePointerDown: (e: React.PointerEvent, patient: Patient, sourceStage: ClinicalStage) => void;
  /** Explicit reset handler to abort any active drag operation. */
  cancelDrag: () => void;
}

/**
 * Validates whether a requested transition between two clinical stages is allowed.
 *
 * @param from - Origin clinical stage.
 * @param to - Destination clinical stage.
 * @returns True if the transition is allowed; false otherwise.
 */
export function isValidStageTransition(from: ClinicalStage, to: ClinicalStage): boolean {
  if (from === to) return false;

  // Forward progression
  if (from === 'assigned' && to === 'with_doctor') return true;
  if (from === 'with_doctor' && to === 'carryout') return true;
  if (from === 'carryout' && to === 'done') return true;

  // Rollback progression
  if (from === 'with_doctor' && to === 'assigned') return true;
  if (from === 'carryout' && to === 'with_doctor') return true;

  return false;
}

/**
 * Custom React hook managing pointer drag-and-drop interactions across clinical stage columns.
 *
 * @param onTransition - Callback triggered when a patient is dropped onto a valid destination stage.
 * @returns State and event handlers for drag tracking, ghost rendering, and dropzones.
 */
export function useNurseDragAndDrop(
  onTransition: (patient: Patient, targetStage: ClinicalStage) => boolean | void | Promise<boolean | void>
): UseNurseDragAndDropReturn {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragSourceStage, setDragSourceStage] = useState<ClinicalStage | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ClinicalStage | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [dropFeedback, setDropFeedback] = useState<DropFeedback>({ targetStage: null, status: 'none' });

  const activeDragRef = useRef<{
    patient: Patient | null;
    sourceStage: ClinicalStage | null;
  }>({ patient: null, sourceStage: null });

  const cancelDrag = useCallback(() => {
    setDraggedPatient(null);
    setDragSourceStage(null);
    setDragOverStage(null);
    setDragPoint(null);
    activeDragRef.current = { patient: null, sourceStage: null };
  }, []);

  // Cancel drag on window blur to prevent stuck ghost cards
  useEffect(() => {
    const onBlur = () => cancelDrag();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [cancelDrag]);

  /**
   * Pointer down handler starting a drag from a patient card.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, patient: Patient, sourceStage: ClinicalStage) => {
      if (!canStartDrag(e)) return;

      e.preventDefault();
      const pt = pointOf(e);

      setDragPoint(pt);
      setDraggedPatient(patient);
      setDragSourceStage(sourceStage);
      setDragOverStage(null);

      activeDragRef.current = { patient, sourceStage };
    },
    []
  );

  // Global pointer listeners while dragging is active
  useEffect(() => {
    if (!draggedPatient) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const pt = pointOf(e);
      setDragPoint(pt);

      const target = findDropTarget(pt, 'data-stage-id') as ClinicalStage | null;
      setDragOverStage(target);
    };

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      const pt = pointOf(e);
      const target = findDropTarget(pt, 'data-stage-id') as ClinicalStage | null;
      const currentPatient = activeDragRef.current.patient;
      const currentSource = activeDragRef.current.sourceStage;

      if (!currentPatient || !currentSource || !target) {
        cancelDrag();
        return;
      }

      // Dropped onto same stage
      if (currentSource === target) {
        cancelDrag();
        return;
      }

      if (isValidStageTransition(currentSource, target)) {
        setDropFeedback({ targetStage: target, status: 'success' });
        setTimeout(() => setDropFeedback({ targetStage: null, status: 'none' }), 400);

        try {
          await onTransition(currentPatient, target);
        } catch (err) {
          console.error('Failed to transition stage on drop:', err);
        }
      } else {
        setDropFeedback({ targetStage: target, status: 'invalid' });
        setTimeout(() => setDropFeedback({ targetStage: null, status: 'none' }), 400);
      }

      cancelDrag();
    };

    const handleGlobalPointerCancel = () => {
      cancelDrag();
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerCancel);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };
  }, [draggedPatient, onTransition, cancelDrag]);

  return {
    draggedPatient,
    dragSourceStage,
    dragOverStage,
    dragPoint,
    dropFeedback,
    isDragging: !!draggedPatient,
    handlePointerDown,
    cancelDrag,
  };
}

export default useNurseDragAndDrop;
