/**
 * @fileoverview Column 2: With Doctor section component for the Nurse Dashboard.
 *
 * Displays patients currently undergoing physician examination inside cubicles,
 * tracking real-time consultation duration and providing advance/rollback actions.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';
import { StageColumn } from './StageColumn';
import { NursePatientCard } from './NursePatientCard';

/**
 * Props for the WithDoctorSection component.
 */
export interface WithDoctorSectionProps {
  /** Roster of patients currently in medical consultation. */
  patients: Patient[];
  /** ID of patient currently selected in tablet selection mode. */
  selectedPatientId?: number | null;
  /** Whether this stage is currently hovered during a drag. */
  isDragOver?: boolean;
  /** Whether this stage is an eligible destination during tablet selection. */
  isValidSelectionTarget?: boolean;
  /** Action handler rolling back patient to assigned waiting queue. */
  onMoveBack: (patient: Patient) => void;
  /** Action handler advancing patient to post-care carryout. */
  onMoveToCarryout: (patient: Patient) => void;
  /** Callback to select a patient in tablet mode. */
  onSelectPatient?: (patient: Patient, stage: ClinicalStage, cubicleNum: string) => void;
  /** Pointer down listener for drag initiation. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient, stage: ClinicalStage) => void;
  /** Callback triggered when user clicks '+ Move Here' in selection mode. */
  onMoveHere?: () => void;
}

/**
 * Renders the With Doctor column within the clinical pipeline.
 *
 * @param props - Section configuration and patient rosters.
 * @returns The rendered With Doctor section component.
 */
export function WithDoctorSection({
  patients,
  selectedPatientId,
  isDragOver = false,
  isValidSelectionTarget = false,
  onMoveBack,
  onMoveToCarryout,
  onSelectPatient,
  onPointerDown,
  onMoveHere,
}: WithDoctorSectionProps) {
  return (
    <StageColumn
      stage="with_doctor"
      title={nurseTexts.stageWithDoctorHeading}
      icon="bx-pulse"
      badgeColorClass="bg-purple-100 text-purple-700"
      count={patients.length}
      emptyText={nurseTexts.emptyWithDoctor}
      isDragOver={isDragOver}
      isValidSelectionTarget={isValidSelectionTarget}
      onMoveHere={onMoveHere}
    >
      {patients.map((patient) => (
        <NursePatientCard
          key={patient.id}
          patient={patient}
          stage="with_doctor"
          isSelected={selectedPatientId === patient.id}
          onSelect={onSelectPatient}
          onPointerDown={onPointerDown}
          onMoveBackFromDoctor={onMoveBack}
          onMoveToCarryout={onMoveToCarryout}
        />
      ))}
    </StageColumn>
  );
}

export default WithDoctorSection;