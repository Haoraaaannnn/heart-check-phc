'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { DragPoint, pointOf, findDropTarget, canStartDrag } from './dragUtils';

const MANUAL_SERVICES = ['Consultation', 'OPD Screening'];

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
 * @returns State and event handlers for drag ghost, drop target highlight, and assignment actions.
 */
export function useDragAndDrop(
  assignedPatients: Record<string, Patient[]>,
  setOnProgressPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setAssignedPatients: React.Dispatch<React.SetStateAction<Record<string, Patient[]>>>,
  fetchData: () => Promise<void>
) {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragSourceCubicle, setDragSourceCubicle] = useState<string | null>(null);
  const [dragOverCubicle, setDragOverCubicle] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [dropFeedback, setDropFeedback] = useState<DropFeedback>({ target: null, status: 'none' });
  const [pendingUpdates, setPendingUpdates] = useState<Patient[]>([]);

  const movingBackIds = useRef<Set<number>>(new Set());

  const resetDrag = useCallback(() => {
    setDraggedPatient(null);
    setDragSourceCubicle(null);
    setDragOverCubicle(null);
    setDragPoint(null);
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
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
      setDragSourceCubicle(null);
    },
    []
  );

  /**
   * Backward-compatible mouse event drag starter from queue.
   */
  const handleDragStartFromQueue = useCallback(
    (e: React.MouseEvent, patient: Patient) => {
      e.preventDefault();
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
      setDragSourceCubicle(null);
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
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
      setDragSourceCubicle(cubicleNum);
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
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
      setDragSourceCubicle(cubicleNum);
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
      const isManual = !!patient.service && MANUAL_SERVICES.includes(patient.service);

      if (isManual) {
        const cooldownUntil = new Date(Date.now() + 60 * 1000).toISOString();

        setAssignedPatients(prev => ({
          ...prev,
          [oldCubicleNum]: (prev[oldCubicleNum] || []).filter(p => p.id !== patient.id),
        }));

        setOnProgressPatients(prev => [
          ...prev,
          { ...patient, cubicleNum: null, status: 'On Progress', progress_started_at: null, cooldown_until: cooldownUntil },
        ]);

        setPendingUpdates(prev => [
          ...prev.filter(p => p.id !== patient.id),
          { ...patient, cubicleNum: null, status: 'On Progress', progress_started_at: null, cooldown_until: cooldownUntil },
        ]);
        return;
      }

      const { data: minRow } = await supabase
        .from('patients')
        .select('queue_position')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      const frontPosition = (minRow?.queue_position ?? 1) - 1;

      setAssignedPatients(prev => ({
        ...prev,
        [oldCubicleNum]: (prev[oldCubicleNum] || []).filter(p => p.id !== patient.id),
      }));

      setOnProgressPatients(prev => [
        ...prev,
        { ...patient, cubicleNum: null, status: 'Waiting', queue_position: frontPosition },
      ]);

      await supabase
        .from('patients')
        .update({
          cubicleNum: null,
          status: 'Waiting',
          called_at: null,
          progress_started_at: null,
          cubicle_top_started_at: null,
          queue_position: frontPosition,
        })
        .eq('id', patient.id);

      await fetchData();
    } catch (err) {
      console.error('Failed to move patient back to progress:', err);
      fetchData();
    } finally {
      movingBackIds.current.delete(patient.id);
    }
  };

  /**
   * Sets up global pointer listeners during active drag operation.
   */
  const setupGlobalDragHandlers = (isDragEnabled: boolean) => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!draggedPatient) return;
      const pt = pointOf(e);
      setDragPoint(pt);

      const targetCubicle = findDropTarget(pt, 'data-cubicle');
      setDragOverCubicle(targetCubicle);
    };

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      if (!draggedPatient) {
        resetDrag();
        return;
      }

      const pt = pointOf(e);
      const targetCubicle = findDropTarget(pt, 'data-cubicle');

      if (targetCubicle) {
        // If dropped onto the same cubicle it originated from, no-op cleanly
        if (dragSourceCubicle === targetCubicle) {
          resetDrag();
          return;
        }

        const currentOccupancy = assignedPatients[targetCubicle]?.length || 0;
        if (currentOccupancy >= MAX_PATIENTS_PER_CUBICLE) {
          setDropFeedback({ target: targetCubicle, status: 'invalid' });
          setTimeout(() => setDropFeedback({ target: null, status: 'none' }), 400);
          resetDrag();
          return;
        }

        const now = new Date().toISOString();
        setDropFeedback({ target: targetCubicle, status: 'success' });
        setTimeout(() => setDropFeedback({ target: null, status: 'none' }), 400);

        if (dragSourceCubicle) {
          // Reassign between cubicles
          setAssignedPatients(prev => ({
            ...prev,
            [dragSourceCubicle]: (prev[dragSourceCubicle] || []).filter(
              p => p.id !== draggedPatient.id
            ),
            [targetCubicle]: [
              ...(prev[targetCubicle] || []),
              {
                ...draggedPatient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
              },
            ],
          }));

          setPendingUpdates(prev => [
            ...prev.filter(p => p.id !== draggedPatient.id),
            {
              ...draggedPatient,
              cubicleNum: targetCubicle,
              status: 'Assigned',
            },
          ]);
        } else {
          // Assign from Queue to Cubicle
          setOnProgressPatients(prev => prev.filter(p => p.id !== draggedPatient.id));
          setAssignedPatients(prev => ({
            ...prev,
            [targetCubicle]: [
              ...(prev[targetCubicle] || []),
              {
                ...draggedPatient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
                reg_end: now,
              },
            ],
          }));

          setPendingUpdates(prev => [
            ...prev.filter(p => p.id !== draggedPatient.id),
            {
              ...draggedPatient,
              cubicleNum: targetCubicle,
              status: 'Assigned',
              reg_end: now,
            },
          ]);
        }
      }

      resetDrag();
    };

    const handleGlobalPointerCancel = () => {
      resetDrag();
    };

    if (draggedPatient && isDragEnabled) {
      window.addEventListener('pointermove', handleGlobalGlobalPointerMove as any);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerCancel);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalGlobalPointerMove as any);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };

    function handleGlobalGlobalPointerMove(ev: PointerEvent) {
      handleGlobalPointerMove(ev);
    }
  };

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

export { useTransferSelection } from './useTransferSelection';
export type { UseTransferSelectionOptions, UseTransferSelectionReturn } from './useTransferSelection';

export default useDragAndDrop;