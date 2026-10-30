/**
 * @fileoverview Data types and stage computation helpers for patient journey history.
 *
 * Provides domain classification for tracking patient progression across hospital stages:
 * Intake/Registration -> Waiting Queue -> In Service (Station/Cubicle) -> Completed.
 *
 * Adheres strictly to AGENTS.md:
 * - Deterministic pure domain logic separated from side-effects
 * - Strict type-safety, zero any, guard clauses, and maximum 3 nesting levels
 * - Zero emojis in comments or labels
 *
 * @module app/transfer/types/history
 */

import { Patient } from '@/types/Types';

/**
 * Standard progression stages in the clinic workflow.
 */
export type PatientJourneyStage =
  | 'registration'
  | 'queued'
  | 'in_service'
  | 'done'
  | 'idle'
  | 'removed';

/**
 * Stage descriptor containing display metadata and progress indexing.
 */
export interface PatientStageInfo {
  stage: PatientJourneyStage;
  label: string;
  stepIndex: number; // 0: Registration, 1: Waiting Queue, 2: In Service, 3: Completed
  isTerminal: boolean;
  isException: boolean;
  stageColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';
  currentLocation?: string;
}

/**
 * Historical patient record enriched with stage timeline calculation.
 */
export interface EnrichedHistoryPatient {
  patient: Patient;
  stageInfo: PatientStageInfo;
  registeredTimeFormatted: string;
  elapsedWaitMinutes: number;
}

/**
 * Ordered list of progressive stages for the 4-step progress indicator.
 */
export const JOURNEY_STEPS: readonly {
  step: number;
  stage: PatientJourneyStage;
  label: string;
  shortLabel: string;
}[] = [
  { step: 0, stage: 'registration', label: 'Registration', shortLabel: 'Reg' },
  { step: 1, stage: 'queued', label: 'Waiting Queue', shortLabel: 'Queue' },
  { step: 2, stage: 'in_service', label: 'In Service', shortLabel: 'Service' },
  { step: 3, stage: 'done', label: 'Completed', shortLabel: 'Done' },
] as const;

/**
 * Computes the active progression stage and metadata for a patient record.
 *
 * @param patient - Patient record to evaluate.
 * @returns Comprehensive stage metadata.
 */
export function getPatientStage(patient: Patient): PatientStageInfo {
  const status = (patient.status ?? '').toLowerCase().trim();

  if (status === 'removed' || Boolean(patient.removed_at)) {
    return {
      stage: 'removed',
      label: 'Removed',
      stepIndex: -1,
      isTerminal: true,
      isException: true,
      stageColor: 'slate',
    };
  }

  if (status === 'idle' || Boolean(patient.idle_at)) {
    return {
      stage: 'idle',
      label: 'On Hold (Idle)',
      stepIndex: 1,
      isTerminal: false,
      isException: true,
      stageColor: 'amber',
      currentLocation: patient.cubicleNum ? `Cubicle ${patient.cubicleNum}` : undefined,
    };
  }

  if (
    status === 'done' ||
    status === 'completed' ||
    status === 'served' ||
    Boolean(patient.consult_end) ||
    Boolean(patient.carryout_end)
  ) {
    return {
      stage: 'done',
      label: 'Completed',
      stepIndex: 3,
      isTerminal: true,
      isException: false,
      stageColor: 'emerald',
      currentLocation: patient.cubicleNum ? `Cubicle ${patient.cubicleNum}` : undefined,
    };
  }

  if (status === 'assigned' || status === 'with doctor' || Boolean(patient.cubicleNum)) {
    const loc = patient.cubicleNum ? `Cubicle ${patient.cubicleNum}` : 'Station Assigned';
    return {
      stage: 'in_service',
      label: `In Service (${loc})`,
      stepIndex: 2,
      isTerminal: false,
      isException: false,
      stageColor: 'purple',
      currentLocation: loc,
    };
  }

  if (patient.reg_end || (!patient.counter && status === 'on progress')) {
    return {
      stage: 'queued',
      label: 'Waiting in Queue',
      stepIndex: 1,
      isTerminal: false,
      isException: false,
      stageColor: 'blue',
    };
  }

  if (patient.counter != null || Boolean(patient.reg_start)) {
    const loc = patient.counter ? `Counter ${patient.counter}` : 'Registration';
    return {
      stage: 'registration',
      label: `In Registration (${loc})`,
      stepIndex: 0,
      isTerminal: false,
      isException: false,
      stageColor: 'amber',
      currentLocation: loc,
    };
  }

  return {
    stage: 'queued',
    label: 'Waiting in Queue',
    stepIndex: 1,
    isTerminal: false,
    isException: false,
    stageColor: 'blue',
  };
}
