/** @fileoverview Acknowledged pointer-based registration counter handoffs. */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types/Types';
import { DragPoint, pointOf, findDropTarget, canStartDrag } from '@/app/transfer/hooks/dragUtils';
import { moveCounterPatient } from '@/app/transfer/lib/moveCounterPatient';

/**
 * Hook handling pointer-based drag and drop between registration counters.
 *
 * @param registrationPatients - List of active patients at registration counters.
 * @param setRegistrationPatients - React state setter for updating the local patient list.
 * @returns State and event handlers for registration counter drags.
 */
export function useRegistrationDragAndDrop(
  registrationPatients: Patient[],
  setRegistrationPatients: React.Dispatch<React.SetStateAction<Patient[]>>
) {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragOverCounter, setDragOverCounter] = useState<number | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [counterDragError, setCounterDragError] = useState('');

  /**
   * Pointer down starter for dragging a patient from a registration counter.
   */
  const handleRegPointerDown = useCallback(
    (e: React.PointerEvent, patient: Patient) => {
      if (!canStartDrag(e)) return;
      e.preventDefault();
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
    },
    []
  );

  /**
   * Backward-compatible mouse starter.
   */
  const handleRegDragStart = useCallback(
    (e: React.MouseEvent, patient: Patient) => {
      e.preventDefault();
      setDragPoint(pointOf(e));
      setDraggedPatient(patient);
    },
    []
  );

  useEffect(() => {
    if (!draggedPatient) return;

    const handlePointerMove = (e: PointerEvent) => {
      const pt = pointOf(e);
      setDragPoint(pt);

      const targetStr = findDropTarget(pt, 'data-counter');
      setDragOverCounter(targetStr ? parseInt(targetStr, 10) : null);
    };

    const handlePointerUp = async (e: PointerEvent) => {
      const pt = pointOf(e);
      const targetStr = findDropTarget(pt, 'data-counter');
      const targetCounter = targetStr ? parseInt(targetStr, 10) : null;

      if (draggedPatient && targetCounter && targetCounter !== draggedPatient.counter) {
        setCounterDragError('');
        try {
          if (typeof draggedPatient.counter !== 'number') throw new Error('Refresh before moving this ticket.');
          await moveCounterPatient({ patientId: draggedPatient.id, sourceCounter: draggedPatient.counter, targetCounter });
          setRegistrationPatients(prev => prev.map(p => p.id === draggedPatient.id ? {
            ...p, counter: targetCounter, counter_top_started_at: null, counter_paused_at: null,
            counter_rejoin_at: new Date().toISOString(),
          } : p));
        } catch (failure: unknown) {
          setCounterDragError(failure instanceof Error ? failure.message : 'The ticket was not moved.');
        }
      }

      setDraggedPatient(null);
      setDragOverCounter(null);
      setDragPoint(null);
    };

    const handlePointerCancel = () => {
      setDraggedPatient(null);
      setDragOverCounter(null);
      setDragPoint(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [draggedPatient, setRegistrationPatients]);

  return {
    regDraggedPatient: draggedPatient,
    regDragPoint: dragPoint,
    dragOverCounter,
    counterDragError,
    handleRegPointerDown,
    handleRegDragStart,
  };
}

export default useRegistrationDragAndDrop;
