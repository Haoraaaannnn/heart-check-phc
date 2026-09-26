/**
 * @fileoverview 3-Column Non-scrollable Clinical Pipeline Board for the Nurse Dashboard.
 *
 * Renders the three core clinical stages (Assigned, With Doctor, Carryout) side-by-side
 * in a fit-to-screen grid layout where only the internal column lists scroll.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage, SelectedNursePatient } from '../types/nurse';
import { NurseStyle } from '../constants/nurse';
import { AssignedSection } from './AssignedSection';
import { WithDoctorSection } from './WithDoctorSection';
import { CarryoutSection } from './CarryoutSection';

/**
 * Props for the NurseBoard component.
 */
export interface NurseBoardProps {
  /** Roster of waiting patients assigned to cubicles. */
  assignedPatients: Patient[];
  /** Roster of patients currently in medical consultation. */
  withDoctorPatients: Patient[];
  /** Roster of patients in post-consultation care coordination. */
  carryoutPatients: Patient[];
  /** ID of patient receiving TTS audio announcement, or null. */
  speakingId?: number | null;
  /** Actively selected patient in tablet mode, or null. */
  selectedPatient: SelectedNursePatient | null;
  /** Stage currently hovered over by pointer during a drag. */
  dragOverStage: ClinicalStage | null;
  /** Callback to trigger TTS audio announcement. */
  onCall: (patient: Patient) => void;
  /** Callback to select a patient in tablet mode. */
  onSelectPatient: (patient: Patient, stage: ClinicalStage, cubicleNum: string) => void;
  /** Pointer down listener for drag initiation. */
  onPointerDown: (e: React.PointerEvent, patient: Patient, stage: ClinicalStage) => void;
  /** Transition handlers. */
  onMoveToWithDoctor: (patient: Patient) => void | Promise<boolean | void>;
  onMoveBackFromDoctor: (patient: Patient) => void | Promise<boolean | void>;
  onMoveToCarryout: (patient: Patient) => void | Promise<boolean | void>;
  onMoveBackFromCarryout: (patient: Patient) => void | Promise<boolean | void>;
  onFinish: (patient: Patient) => void | Promise<boolean | void>;
  /** Direct advance handler in tablet selection mode. */
  onAssignSelectedToStage: (stage: ClinicalStage) => void | Promise<boolean | void>;
  /** Helper checking if a stage is an eligible destination for selection. */
  isStageValidTarget: (stage: ClinicalStage) => boolean;
}

/**
 * 3-Column clinical progression board rendering active patient stages simultaneously.
 *
 * @param props - Patient datasets, drag states, selection models, and action dispatchers.
 * @returns The rendered non-scrollable board element.
 */
export function NurseBoard({
  assignedPatients,
  withDoctorPatients,
  carryoutPatients,
  speakingId,
  selectedPatient,
  dragOverStage,
  onCall,
  onSelectPatient,
  onPointerDown,
  onMoveToWithDoctor,
  onMoveBackFromDoctor,
  onMoveToCarryout,
  onMoveBackFromCarryout,
  onFinish,
  onAssignSelectedToStage,
  isStageValidTarget,
}: NurseBoardProps) {
  const selectedPatientId = selectedPatient?.patient.id ?? null;

  return (
    <main style={NurseStyle.boardContainer}>
      {/* Column 1: Assigned Queue (Waiting / Calling) */}
      <AssignedSection
        patients={assignedPatients}
        speakingId={speakingId}
        selectedPatientId={selectedPatientId}
        isDragOver={dragOverStage === 'assigned'}
        isValidSelectionTarget={isStageValidTarget('assigned')}
        onCall={onCall}
        onSelectPatient={onSelectPatient}
        onPointerDown={onPointerDown}
        onMoveToWithDoctor={onMoveToWithDoctor}
        onMoveHere={() => onAssignSelectedToStage('assigned')}
      />

      {/* Column 2: With Doctor (Active Consultation) */}
      <WithDoctorSection
        patients={withDoctorPatients}
        selectedPatientId={selectedPatientId}
        isDragOver={dragOverStage === 'with_doctor'}
        isValidSelectionTarget={isStageValidTarget('with_doctor')}
        onMoveBack={onMoveBackFromDoctor}
        onMoveToCarryout={onMoveToCarryout}
        onSelectPatient={onSelectPatient}
        onPointerDown={onPointerDown}
        onMoveHere={() => onAssignSelectedToStage('with_doctor')}
      />

      {/* Column 3: Carryout & Post-Care */}
      <CarryoutSection
        patients={carryoutPatients}
        selectedPatientId={selectedPatientId}
        isDragOver={dragOverStage === 'carryout'}
        isValidSelectionTarget={isStageValidTarget('carryout')}
        onMoveBack={onMoveBackFromCarryout}
        onFinish={onFinish}
        onSelectPatient={onSelectPatient}
        onPointerDown={onPointerDown}
        onMoveHere={() => onAssignSelectedToStage('carryout')}
      />
    </main>
  );
}

export default NurseBoard;
