'use client';

/**
 * @fileoverview Hook managing Click-to-Select patient transfer mode.
 *
 * Provides a touch-friendly, accessibility-conscious alternative to drag-and-drop
 * interactions on tablet devices. Enables tapping active queue patients or assigned
 * cubicle/counter patients to select them, followed by tapping an available destination
 * cubicle or counter to complete the transfer without requiring precise pointer dragging.
 *
 * @module app/transfer/hooks/useTransferSelection
 */

import React, { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { SelectedTransferPatient, TransferSourceType } from '../types/transfer';

/**
 * Configuration options required by {@link useTransferSelection}.
 */
export interface UseTransferSelectionOptions {
  /** Record of currently assigned patients indexed by cubicle number. */
  assignedPatients: Record<string, Patient[]>;
  /** React state dispatcher for updating the active queue patient list. */
  setOnProgressPatients: Dispatch<SetStateAction<Patient[]>>;
  /** React state dispatcher for updating cubicle assignments. */
  setAssignedPatients: Dispatch<SetStateAction<Record<string, Patient[]>>>;
  /** React state dispatcher for queuing pending patient updates to be persisted. */
  setPendingUpdates: Dispatch<SetStateAction<Patient[]>>;
  /** React state dispatcher for updating registration counter patient list. */
  setRegistrationPatients: Dispatch<SetStateAction<Patient[]>>;
}

/**
 * Return interface for the {@link useTransferSelection} hook.
 */
export interface UseTransferSelectionReturn {
  /** Currently selected patient awaiting target assignment, or null if none selected. */
  selectedPatient: SelectedTransferPatient | null;
  /** Sets or toggles selection for a given patient. */
  selectPatient: (patient: Patient, sourceType: TransferSourceType, sourceId?: string | number) => void;
  /** Cancels and clears the current patient selection. */
  clearSelection: () => void;
  /** Transfers the currently selected patient to the specified destination cubicle. */
  assignSelectedToCubicle: (targetCubicle: string) => boolean;
  /** Moves the currently selected registration counter patient to the specified target counter. */
  moveSelectedToCounter: (targetCounter: number) => Promise<boolean>;
}

/**
 * Custom React hook managing tap-to-select and tap-to-assign workflows.
 *
 * @param options - Dispatchers and current state maps for patient allocation.
 * @returns State and mutation handlers for Click-to-Select transfer interactions.
 *
 * @remarks
 * Adheres strictly to AGENTS.md separation-of-concerns and comprehensive JSDoc guidelines.
 * Supports keyboard 'Escape' cancellation for improved accessibility.
 */
export function useTransferSelection({
  assignedPatients,
  setOnProgressPatients,
  setAssignedPatients,
  setPendingUpdates,
  setRegistrationPatients,
}: UseTransferSelectionOptions): UseTransferSelectionReturn {
  const [selectedPatient, setSelectedPatient] = useState<SelectedTransferPatient | null>(null);

  /**
   * Clears any active patient selection.
   */
  const clearSelection = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  /**
   * Selects a patient for transfer, or deselects if the same patient is tapped again.
   *
   * @param patient - The patient entity to select.
   * @param sourceType - The domain where the patient currently resides ('queue', 'cubicle', or 'counter').
   * @param sourceId - Optional identifier for cubicle number or counter number.
   */
  const selectPatient = useCallback(
    (patient: Patient, sourceType: TransferSourceType, sourceId?: string | number) => {
      setSelectedPatient(prev => {
        if (prev?.patient.id === patient.id) {
          return null; // Toggle off if clicked again
        }
        return { patient, sourceType, sourceId };
      });
    },
    []
  );

  /**
   * Assigns the actively selected patient to a destination cubicle.
   *
   * @param targetCubicle - The destination cubicle identifier string.
   * @returns True if assignment was successfully committed, false otherwise.
   */
  const assignSelectedToCubicle = useCallback(
    (targetCubicle: string): boolean => {
      if (!selectedPatient) return false;

      const { patient, sourceType, sourceId } = selectedPatient;

      // Check destination capacity
      const currentOccupants = (assignedPatients && assignedPatients[targetCubicle]?.length) || 0;
      if (currentOccupants >= MAX_PATIENTS_PER_CUBICLE) {
        return false;
      }

      const now = new Date().toISOString();

      if (sourceType === 'cubicle') {
        const sourceCubicleStr = String(sourceId);
        // If target is the same as source, cancel without state changes
        if (sourceCubicleStr === targetCubicle) {
          clearSelection();
          return false;
        }

        // Reassign between cubicles
        setAssignedPatients(prev => {
          const safePrev = prev || {};
          return {
            ...safePrev,
            [sourceCubicleStr]: (safePrev[sourceCubicleStr] || []).filter(p => p.id !== patient.id),
            [targetCubicle]: [
              ...(safePrev[targetCubicle] || []),
              {
                ...patient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
              },
            ],
          };
        });

        setPendingUpdates(prev => [
          ...(prev || []).filter(p => p.id !== patient.id),
          {
            ...patient,
            cubicleNum: targetCubicle,
            status: 'Assigned',
          },
        ]);

        clearSelection();
        return true;
      }

      if (sourceType === 'queue') {
        // Assign from Active Queue to Cubicle
        setOnProgressPatients(prev => (prev || []).filter(p => p.id !== patient.id));
        setAssignedPatients(prev => {
          const safePrev = prev || {};
          return {
            ...safePrev,
            [targetCubicle]: [
              ...(safePrev[targetCubicle] || []),
              {
                ...patient,
                cubicleNum: targetCubicle,
                status: 'Assigned',
                reg_end: patient.reg_end || now,
                called_at: patient.called_at || now,
              },
            ],
          };
        });

        setPendingUpdates(prev => [
          ...(prev || []).filter(p => p.id !== patient.id),
          {
            ...patient,
            cubicleNum: targetCubicle,
            status: 'Assigned',
            reg_end: patient.reg_end || now,
            called_at: patient.called_at || now,
          },
        ]);

        clearSelection();
        return true;
      }

      return false;
    },
    [selectedPatient, assignedPatients, clearSelection, setAssignedPatients, setOnProgressPatients, setPendingUpdates]
  );

  /**
   * Moves the selected registration counter patient to another counter.
   *
   * @param targetCounter - Destination registration counter number.
   * @returns Promise resolving to true if moved, false otherwise.
   */
  const moveSelectedToCounter = useCallback(
    async (targetCounter: number): Promise<boolean> => {
      if (!selectedPatient || selectedPatient.sourceType !== 'counter') {
        return false;
      }

      const { patient, sourceId } = selectedPatient;
      if (sourceId === targetCounter) {
        clearSelection();
        return false;
      }

      // Optimistically update registration patients list
      setRegistrationPatients(prev =>
        prev.map(p => (p.id === patient.id ? { ...p, counter: targetCounter } : p))
      );

      clearSelection();

      try {
        await supabase
          .from('patients')
          .update({ counter: targetCounter })
          .eq('id', patient.id);
        return true;
      } catch (err) {
        console.error('Failed to update patient counter via selection:', err);
        return false;
      }
    },
    [selectedPatient, clearSelection, setRegistrationPatients]
  );

  // Keyboard shortcut: Pressing Escape deselects the current patient
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPatient) {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient, clearSelection]);

  return {
    selectedPatient,
    selectPatient,
    clearSelection,
    assignSelectedToCubicle,
    moveSelectedToCounter,
  };
}

export default useTransferSelection;
