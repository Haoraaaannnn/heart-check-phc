'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { returnToQueueFields, updateLiveTransferPatient } from '@/app/transfer/lib/transferMutations';
import { Patient } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '@/app/transfer/lib/constants';
import { DragPoint, pointOf, findDropTarget, canStartDrag } from '@/app/transfer/hooks/dragUtils';


/**
 * Drop feedback descriptor for UI animations.
 */
export interface DropFeedback {
  target: string | null;
  status: 'success' | 'invalid' | 'none';
}

/**
 * Hook managing pointer-based drag-and-drop operations for assigning and reassigning patients.
 *
 * @param assignedPatients - Map of cubicle identifiers to assigned patient lists.
 * @param setOnProgressPatients - State setter for active queue patients.
 * @param setAssignedPatients - State setter for cubicle-assigned patients.
 * @param fetchData - Callback to re-synchronize data with the backend.
 * @param pendingUpdatesRef - Synchronous ref storing active unconfirmed pending updates.
 * @param unpinConfirmedPatient - Callback to clear any confirmed mutation pin if reassigning a patient.
 * @returns State and event handlers for drag ghost, drop target highlight, and assignment actions.
 */
export function useDragAndDrop(
  assignedPatients: Record<string, Patient[]>,
  setOnProgressPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setAssignedPatients: React.Dispatch<React.SetStateAction<Record<string, Patient[]>>>,
  fetchData: () => Promise<void>,
  pendingUpdatesRef?: React.MutableRefObject<Patient[]>,
  unpinConfirmedPatient?: (patientId: number) => void
) {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragSourceCubicle, setDragSourceCubicle] = useState<string | null>(null);
  const [dragOverCubicle, setDragOverCubicle] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [dropFeedback, setDropFeedback] = useState<DropFeedback>({ target: null, status: 'none' });
  const [pendingUpdates, setPendingUpdates] = useState<Patient[]>([]);

  const movingBackIds = useRef<Set<number>>(new Set());
  const activeDragRef = useRef<{
    patient: Patient | null;
    sourceCubicle: string | null;
  }>({ patient: null, sourceCubicle: null });

  const assignedPatientsRef = useRef(assignedPatients);
  useEffect(() => {
    assignedPatientsRef.current = assignedPatients;
  }, [assignedPatients]);

  const resetDrag = useCallback(() => {
    setDraggedPatient(null);
    setDragSourceCubicle(null);
    setDragOverCubicle(null);
    setDragPoint(null);
    activeDragRef.current = { patient: null, sourceCubicle: null };
  }, []);

  useEffect(() => {
    const onBlur = () => resetDrag();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [resetDrag]);

  /**
   * Pointer down handler starting a drag from the active queue.
   */
  const handlePointerDownFromQueue = useCallback(
    (e: React.PointerEvent, patient: Patient) => {
      if (!canStartDrag(e)) return;
      e.preventDefault();
      const pt = pointOf(e);
      setDragPoint(pt);
      setDraggedPatient(patient);
      setDragSourceCubicle(null);
      activeDragRef.current = { patient, sourceCubicle: null };
    },
    []
  );

  /**
   * Backward-compatible mouse event drag starter from queue.
   */
  const handleDragStartFromQueue = useCallback(
    (e: React.MouseEvent, patient: Patient) => {
      e.preventDefault();
      const pt = pointOf(e);
      setDragPoint(pt);
      setDraggedPatient(patient);
      setDragSourceCubicle(null);
      activeDragRef.current = { patient, sourceCubicle: null };
    },
    []
  );

  /**
   * Pointer down handler starting a drag from an assigned cubicle card.
   */
  const handlePointerDownFromCubicle = useCallback(
    (e: React.PointerEvent, patient: Patient, cubicleNum: string) => {
      if (!canStartDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = pointOf(e);
      setDragPoint(pt);
      setDraggedPatient(patient);
      setDragSourceCubicle(cubicleNum);
      activeDragRef.current = { patient, sourceCubicle: cubicleNum };
    },
    []
  );

  /**
   * Backward-compatible mouse event drag starter from cubicle.
   */
  const handleDragStartFromCubicle = useCallback(
    (e: React.MouseEvent, patient: Patient, cubicleNum: string) => {
      e.preventDefault();
      e.stopPropagation();
      const pt = pointOf(e);
      setDragPoint(pt);
      setDraggedPatient(patient);
      setDragSourceCubicle(cubicleNum);
      activeDragRef.current = { patient, sourceCubicle: cubicleNum };
    },
    []
  );

  /**
   * Returns a patient from a cubicle back to the queue.
   */
  const handleMoveBackToProgress = async (patient: Patient, oldCubicleNum: string) => {
    if (movingBackIds.current.has(patient.id)) return;
    movingBackIds.current.add(patient.id);
    try {
      const fields = returnToQueueFields(patient, Date.now());
      await updateLiveTransferPatient({ id: patient.id, fields, sourceCubicle: oldCubicleNum });
      unpinConfirmedPatient?.(patient.id);
      const remainingPending = (pendingUpdatesRef?.current ?? []).filter(p => p.id !== patient.id);
      if (pendingUpdatesRef) pendingUpdatesRef.current = remainingPending;
      setPendingUpdates(remainingPending);
      setAssignedPatients(previous => ({
        ...previous,
        [oldCubicleNum]: (previous[oldCubicleNum] ?? []).filter(p => p.id !== patient.id),
      }));
      setOnProgressPatients(previous => [
        ...previous.filter(p => p.id !== patient.id), { ...patient, ...fields },
      ]);
      await fetchData();
    } finally {
      movingBackIds.current.delete(patient.id);
    }
  };

  useEffect(() => {
    if (!draggedPatient) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const pt = pointOf(e);
      setDragPoint(pt);

      const targetCubicle = findDropTarget(pt, 'data-cubicle');
      setDragOverCubicle(targetCubicle);
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      const pt = pointOf(e);
      const targetCubicle = findDropTarget(pt, 'data-cubicle');
      const currentPatient = activeDragRef.current.patient ?? draggedPatient;
      const currentSource = activeDragRef.current.sourceCubicle;

      if (!currentPatient) {
        resetDrag();
        return;
      }

      if (targetCubicle) {
        // If dropped onto the same cubicle it originated from, no-op cleanly
        if (currentSource === targetCubicle) {
          resetDrag();
          return;
        }

        const currentOccupancy = assignedPatientsRef.current[targetCubicle]?.length || 0;
        if (currentOccupancy >= MAX_PATIENTS_PER_CUBICLE) {
          setDropFeedback({ target: targetCubicle, status: 'invalid' });
          setTimeout(() => setDropFeedback({ target: null, status: 'none' }), 400);
          resetDrag();
          return;
        }

        const now = new Date().toISOString();
        setDropFeedback({ target: targetCubicle, status: 'success' });
        setTimeout(() => setDropFeedback({ target: null, status: 'none' }), 400);

        if (currentSource) {
          // Reassign between cubicles
          unpinConfirmedPatient?.(currentPatient.id);
          setAssignedPatients(prev => ({
            ...prev,
            [currentSource]: (prev[currentSource] || []).filter(
              p => p.id !== currentPatient.id
            ),
            [targetCubicle]: [
              ...(prev[targetCubicle] || []),
              {
                ...currentPatient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
              },
            ],
          }));

          const nextPending = [
            ...(pendingUpdatesRef?.current || []).filter(p => p.id !== currentPatient.id),
            {
              ...currentPatient,
              cubicleNum: targetCubicle,
              status: 'Assigned',
            },
          ];
          if (pendingUpdatesRef) {
            pendingUpdatesRef.current = nextPending;
          }
          setPendingUpdates(nextPending);
        } else {
          // Assign from Queue to Cubicle
          unpinConfirmedPatient?.(currentPatient.id);
          setOnProgressPatients(prev => prev.filter(p => p.id !== currentPatient.id));
          setAssignedPatients(prev => ({
            ...prev,
            [targetCubicle]: [
              ...(prev[targetCubicle] || []),
              {
                ...currentPatient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
                reg_end: now,
              },
            ],
          }));

          const nextPending = [
            ...(pendingUpdatesRef?.current || []).filter(p => p.id !== currentPatient.id),
            {
              ...currentPatient,
              cubicleNum: targetCubicle,
              status: 'Assigned',
              reg_end: now,
            },
          ];
          if (pendingUpdatesRef) {
            pendingUpdatesRef.current = nextPending;
          }
          setPendingUpdates(nextPending);
        }
      }

      resetDrag();
    };

    const handleGlobalPointerCancel = () => {
      resetDrag();
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp, true);
    window.addEventListener('pointercancel', handleGlobalPointerCancel, true);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp, true);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel, true);
    };
  }, [
    draggedPatient,
    resetDrag,
    pendingUpdatesRef,
    setAssignedPatients,
    setOnProgressPatients,
    unpinConfirmedPatient,
  ]);

  /**
   * Maintained for backward compatibility. Global drag listeners are now handled
   * internally with captured window listeners to prevent teardown churn.
   */
  const setupGlobalDragHandlers = useCallback((_isDragEnabled?: boolean) => {
    return () => {};
  }, []);

  const dragOrigin = dragSourceCubicle ? `Cubicle ${dragSourceCubicle}` : 'Queue';

  return {
    draggedPatient,
    dragPoint,
    dragOrigin,
    dragOverCubicle,
    dropFeedback,
    handlePointerDownFromQueue,
    handlePointerDownFromCubicle,
    handleDragStartFromQueue,
    handleDragStartFromCubicle,
    handleMoveBackToProgress,
    setupGlobalDragHandlers,
    resetDrag,
    pendingUpdates,
    setPendingUpdates,
  };
}

export { useTransferSelection } from '@/app/transfer/hooks/useTransferSelection';
export type { UseTransferSelectionOptions, UseTransferSelectionReturn } from '@/app/transfer/hooks/useTransferSelection';

export default useDragAndDrop;
