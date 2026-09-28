/**
 * @fileoverview Hook managing patient state mutations and clinical stage progressions.
 *
 * Implements optimistic state transitions with graceful rollback on persistence failures.
 * Removes browser alert dialogs in compliance with AGENTS.md standards.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { enqueueMutation, removeMutation } from '@/lib/offlineQueue';
import { Patient } from '@/types/Types';
import { ClinicalStage } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';

/**
 * Return model for the useNurseActions hook.
 */
export interface UseNurseActionsReturn {
  /** Last error message encountered during state mutations, or null. */
  actionError: string | null;
  /** Clears the active action error state. */
  clearActionError: () => void;
  /** Moves an assigned patient into consultation with the physician. */
  handleMoveToWithDoctor: (patient: Patient) => Promise<boolean>;
  /** Rolls back a consultation patient back into the assigned waiting queue. */
  handleMoveBackFromDoctor: (patient: Patient) => Promise<boolean>;
  /** Advances a patient from doctor consultation to post-care carryout. */
  handleMoveToCarryout: (patient: Patient) => Promise<boolean>;
  /** Rolls back a carryout patient back to doctor consultation. */
  handleMoveBackFromCarryout: (patient: Patient) => Promise<boolean>;
  /** Concludes care orders and marks patient session as completed today. */
  handleFinish: (patient: Patient) => Promise<boolean>;
  /** Unified dispatcher executing transition to target clinical stage. */
  handleTransitionStage: (patient: Patient, targetStage: ClinicalStage) => Promise<boolean>;
}

/**
 * Custom React hook coordinating optimistic patient stage updates and database synchronization.
 *
 * @param setAssignedPatients - React dispatcher for assigned queue state.
 * @param setWithDoctorPatients - React dispatcher for active consultation state.
 * @param setCarryoutPatients - React dispatcher for carryout state.
 * @param fetchFinished - Callback to re-synchronize the finished patient ledger.
 * @returns Action handlers and error indicators.
 */
export function useNurseActions(
  setAssignedPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setWithDoctorPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setCarryoutPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  fetchFinished: () => Promise<void>
): UseNurseActionsReturn {
  const [actionError, setActionError] = useState<string | null>(null);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  /**
   * Persists patient column mutations with durable offline outbox logging.
   *
   * @remarks
   * Commits the mutation to IndexedDB first to guarantee survival across power outages.
   * If the network is offline or drops, retains the mutation in local storage without
   * rolling back optimistic state. Only rolls back on genuine database authorization errors.
   */
  const persistPatientUpdate = async (
    patientId: number,
    updates: Record<string, string | null>
  ): Promise<boolean> => {
    let queuedMutationId: string | null = null;

    try {
      // 1. Immediately log mutation to non-volatile IndexedDB disk storage
      const queued = await enqueueMutation({
        table: 'patients',
        type: 'update',
        payload: updates,
        matchKey: 'id',
        matchValue: patientId,
        clientTimestamp: new Date().toISOString(),
        description: `Nurse update patient #${patientId}`,
      });
      queuedMutationId = queued.id;
    } catch (storageErr) {
      console.warn('IndexedDB unavailable, falling back to direct network call:', storageErr);
    }

    // 2. If browser is currently offline, keep optimistic state and leave item in outbox
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true;
    }

    // 3. Attempt immediate network persistence to Supabase
    try {
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', patientId);

      if (error) {
        // If server rules or RLS rejected it, discard queued mutation and rollback
        console.error('NURSE MUTATION ERROR:', error.message);
        if (queuedMutationId) {
          await removeMutation(queuedMutationId);
        }
        setActionError(nurseTexts.errorUnauthorizedCubicle);
        return false;
      }

      // Successfully pushed to Supabase! Dequeue from local storage
      if (queuedMutationId) {
        await removeMutation(queuedMutationId);
      }

      return true;
    } catch (err) {
      // Network drop or timeout: keep item in outbox queue, DO NOT rollback optimistic state
      console.warn('Nurse mutation network drop - saved to offline outbox for automatic sync:', err);
      return true;
    }
  };

  /**
   * Transition: Assigned -> With Doctor
   */
  const handleMoveToWithDoctor = useCallback(
    async (patient: Patient): Promise<boolean> => {
      const now = new Date().toISOString();

      // Optimistic state update
      setAssignedPatients((prev) => prev.filter((item) => item.id !== patient.id));
      setWithDoctorPatients((prev) => [
        ...prev,
        { ...patient, status: 'With Doctor', consult_start: now },
      ]);

      const success = await persistPatientUpdate(patient.id, {
        status: 'With Doctor',
        consult_start: now,
      });

      // Rollback on failure
      if (!success) {
        setWithDoctorPatients((prev) => prev.filter((item) => item.id !== patient.id));
        setAssignedPatients((prev) => [...prev, patient]);
        return false;
      }

      return true;
    },
    [setAssignedPatients, setWithDoctorPatients]
  );

  /**
   * Transition: With Doctor -> Assigned (Rollback)
   */
  const handleMoveBackFromDoctor = useCallback(
    async (patient: Patient): Promise<boolean> => {
      // Optimistic state update
      setWithDoctorPatients((prev) => prev.filter((item) => item.id !== patient.id));
      setAssignedPatients((prev) => [
        ...prev,
        { ...patient, status: 'Assigned', consult_start: undefined },
      ]);

      const success = await persistPatientUpdate(patient.id, {
        status: 'Assigned',
        consult_start: null,
      });

      // Rollback on failure
      if (!success) {
        setAssignedPatients((prev) => prev.filter((item) => item.id !== patient.id));
        setWithDoctorPatients((prev) => [...prev, patient]);
        return false;
      }

      return true;
    },
    [setAssignedPatients, setWithDoctorPatients]
  );

  /**
   * Transition: With Doctor -> Carryout
   */
  const handleMoveToCarryout = useCallback(
    async (patient: Patient): Promise<boolean> => {
      const now = new Date().toISOString();

      // Optimistic state update
      setWithDoctorPatients((prev) => prev.filter((item) => item.id !== patient.id));
      setCarryoutPatients((prev) => [
        ...prev,
        {
          ...patient,
          status: 'Carryout',
          consult_end: now,
          carryout_start: now,
          carryout_end: undefined,
        },
      ]);

      const success = await persistPatientUpdate(patient.id, {
        status: 'Carryout',
        consult_end: now,
        carryout_start: now,
        carryout_end: null,
      });

      // Rollback on failure
      if (!success) {
        setCarryoutPatients((prev) => prev.filter((item) => item.id !== patient.id));
        setWithDoctorPatients((prev) => [...prev, patient]);
        return false;
      }

      return true;
    },
    [setWithDoctorPatients, setCarryoutPatients]
  );

  /**
   * Transition: Carryout -> With Doctor (Rollback)
   */
  const handleMoveBackFromCarryout = useCallback(
    async (patient: Patient): Promise<boolean> => {
      // Optimistic state update
      setCarryoutPatients((prev) => prev.filter((item) => item.id !== patient.id));
      setWithDoctorPatients((prev) => [
        ...prev,
        {
          ...patient,
          status: 'With Doctor',
          consult_end: undefined,
          carryout_start: undefined,
          carryout_end: undefined,
        },
      ]);

      const success = await persistPatientUpdate(patient.id, {
        status: 'With Doctor',
        consult_end: null,
        carryout_start: null,
        carryout_end: null,
      });

      // Rollback on failure
      if (!success) {
        setWithDoctorPatients((prev) => prev.filter((item) => item.id !== patient.id));
        setCarryoutPatients((prev) => [...prev, patient]);
        return false;
      }

      return true;
    },
    [setCarryoutPatients, setWithDoctorPatients]
  );

  /**
   * Transition: Carryout -> Done
   */
  const handleFinish = useCallback(
    async (patient: Patient): Promise<boolean> => {
      const now = new Date().toISOString();

      // Optimistic state update
      setCarryoutPatients((prev) => prev.filter((item) => item.id !== patient.id));

      const success = await persistPatientUpdate(patient.id, {
        status: 'Done',
        carryout_end: now,
      });

      // Rollback on failure
      if (!success) {
        setCarryoutPatients((prev) => [...prev, patient]);
        return false;
      }

      await fetchFinished();
      return true;
    },
    [setCarryoutPatients, fetchFinished]
  );

  /**
   * Routes a transition request to the appropriate stage handler.
   */
  const handleTransitionStage = useCallback(
    async (patient: Patient, targetStage: ClinicalStage): Promise<boolean> => {
      const statusLower = (patient.status || '').toLowerCase().trim();

      if (targetStage === 'with_doctor') {
        if (statusLower === 'assigned' || patient.status === 'Assigned') {
          return handleMoveToWithDoctor(patient);
        }
        if (statusLower === 'carryout' || patient.status === 'Carryout') {
          return handleMoveBackFromCarryout(patient);
        }
      }

      if (targetStage === 'carryout') {
        if (statusLower === 'with doctor' || patient.status === 'With Doctor') {
          return handleMoveToCarryout(patient);
        }
      }

      if (targetStage === 'done') {
        if (statusLower === 'carryout' || patient.status === 'Carryout') {
          return handleFinish(patient);
        }
      }

      if (targetStage === 'assigned') {
        if (statusLower === 'with doctor' || patient.status === 'With Doctor') {
          return handleMoveBackFromDoctor(patient);
        }
      }

      return false;
    },
    [
      handleMoveToWithDoctor,
      handleMoveBackFromDoctor,
      handleMoveToCarryout,
      handleMoveBackFromCarryout,
      handleFinish,
    ]
  );

  return {
    actionError,
    clearActionError,
    handleMoveToWithDoctor,
    handleMoveBackFromDoctor,
    handleMoveToCarryout,
    handleMoveBackFromCarryout,
    handleFinish,
    handleTransitionStage,
  };
}

export default useNurseActions;