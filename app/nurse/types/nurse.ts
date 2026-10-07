/**
 * @fileoverview Domain types and interface definitions for the Nurse Dashboard.
 *
 * Defines clinical stage states, tablet selection interfaces, cubicle assignments,
 * drag-and-drop feedback types, and view configurations in accordance with AGENTS.md.
 */

import { Patient, Cubicle } from '@/types/Types';

/**
 * Valid clinical progression stages within the nurse dashboard workflow.
 */
export type ClinicalStage = 'assigned' | 'with_doctor' | 'carryout' | 'done';

/**
 * Maps a local clinical Kanban stage to the corresponding database status string.
 *
 * @param stage - The local clinical stage identifier.
 * @returns The Title Case status string stored in the database.
 */
export function stageToDbStatus(stage: ClinicalStage): string {
  switch (stage) {
    case 'assigned':
      return 'Assigned';
    case 'with_doctor':
      return 'With Doctor';
    case 'carryout':
      return 'Carryout';
    case 'done':
      return 'Done';
    default:
      return 'Assigned';
  }
}

/**
 * Normalizes an arbitrary database status string into a recognized ClinicalStage,
 * or null if the status does not correspond to an active nurse workstation stage.
 *
 * @param status - The raw status string from the database or payload.
 * @returns The normalized ClinicalStage, or null if unmapped.
 */
export function dbStatusToStage(status?: string | null): ClinicalStage | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  if (normalized === 'assigned') {
    return 'assigned';
  }
  if (normalized === 'with doctor' || normalized === 'with_doctor') {
    return 'with_doctor';
  }
  if (normalized === 'carryout') {
    return 'carryout';
  }
  if (normalized === 'done' || normalized === 'finished') {
    return 'done';
  }
  return null;
}

/**
 * Active patient selection model for Click-to-Select tablet interaction mode.
 */
export interface SelectedNursePatient {
  /** The patient entity being transitioned. */
  patient: Patient;
  /** Current clinical stage of the patient before transition. */
  currentStage: ClinicalStage;
  /** Cubicle number where the patient is currently stationed. */
  cubicleNum: string;
}

/**
 * Representation of a cubicle assigned to the active clinical user.
 */
export interface AssignedNurseCubicle {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
}

/**
 * Filter and view configuration state for the nurse workstation.
 */
export interface NurseFilterState {
  selectedCategory: string | null;
  selectedCubicleNum: string | null;
  selectedRoom: number | null;
}

/**
 * Clinical stage configuration metadata used for column rendering and dropzones.
 */
export interface StageConfig {
  id: ClinicalStage;
  titleKey: 'stageAssignedHeading' | 'stageWithDoctorHeading' | 'stageCarryoutHeading' | 'stageFinishedHeading';
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  emptyStateTextKey: 'emptyAssigned' | 'emptyWithDoctor' | 'emptyCarryout' | 'emptyFinished';
  warnAfterSeconds?: number;
  nextStageId?: ClinicalStage;
  previousStageId?: ClinicalStage;
}

/**
 * Drop feedback descriptor for UI drag-and-drop state indicators.
 */
export interface DropFeedback {
  targetStage: ClinicalStage | null;
  status: 'success' | 'invalid' | 'none';
}
