/**
 * @fileoverview Hook managing Click-to-Select patient transition mode for tablet devices
 * in the Nurse Dashboard.
 *
 * Provides a touch-friendly, accessibility-conscious alternative to drag-and-drop
 * interactions on tablet screens.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

import { useState, useCallback, useEffect } from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage, SelectedNursePatient } from '../types/nurse';
import { isValidStageTransition } from './useNurseDragAndDrop';

/**
 * Return model for the useNurseSelection hook.
 */
export interface UseNurseSelectionReturn {
  /** Currently selected patient awaiting stage assignment, or null. */
  selectedPatient: SelectedNursePatient | null;
  /** Sets or toggles selection for a given patient. */
  selectPatient: (patient: Patient, currentStage: ClinicalStage, cubicleNum: string) => void;
  /** Cancels and clears the active selection. */
  clearSelection: () => void;
  /** Transitions the currently selected patient to the target stage. */
  assignSelectedToStage: (targetStage: ClinicalStage) => Promise<boolean>;
  /** Checks if a specific stage is an eligible drop or click target for the selected patient. */
  isStageValidTarget: (stage: ClinicalStage) => boolean;
}

/**
 * Custom React hook managing tap-to-select and tap-to-advance workflows for tablets.
 *
 * @param onTransition - Callback triggered to persist patient stage transition.
 * @returns State and mutation handlers for Click-to-Select interactions.
 */
export function useNurseSelection(
  onTransition: (patient: Patient, targetStage: ClinicalStage) => boolean | void | Promise<boolean | void>
): UseNurseSelectionReturn {
  const [selectedPatient, setSelectedPatient] = useState<SelectedNursePatient | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  const selectPatient = useCallback(
    (patient: Patient, currentStage: ClinicalStage, cubicleNum: string) => {
      setSelectedPatient((previous) => {
        if (previous?.patient.id === patient.id) {
          return null; // Toggle off if clicked again
        }
        return { patient, currentStage, cubicleNum };
      });
    },
    []
  );

  const isStageValidTarget = useCallback(
    (stage: ClinicalStage): boolean => {
      if (!selectedPatient) return false;
      return isValidStageTransition(selectedPatient.currentStage, stage);
    },
    [selectedPatient]
  );

  const assignSelectedToStage = useCallback(
    async (targetStage: ClinicalStage): Promise<boolean> => {
      if (!selectedPatient) return false;

      if (!isValidStageTransition(selectedPatient.currentStage, targetStage)) {
        return false;
      }

      try {
        await onTransition(selectedPatient.patient, targetStage);
        clearSelection();
        return true;
      } catch (err) {
        console.error('Failed to assign selected patient to stage:', err);
        return false;
      }
    },
    [selectedPatient, onTransition, clearSelection]
  );

  // Keyboard accessibility: dismiss selection on Escape key
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
    assignSelectedToStage,
    isStageValidTarget,
  };
}

export default useNurseSelection;
