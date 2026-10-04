/**
 * @fileoverview Column 3: Carryout section component for the Nurse Dashboard.
 *
 * Displays patients undergoing post-consultation care coordination (prescriptions,
 * lab scheduling, education), tracking carryout duration and concluding visits.
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
 * Props for the CarryoutSection component.
 */
export interface CarryoutSectionProps {
  /** Roster of patients in post-consultation care orders. */
  patients: Patient[];
  /** ID of patient currently selected in tablet selection mode. */
  selectedPatientId?: number | null;
  /** Whether this stage is currently hovered during a drag. */
  isDragOver?: boolean;
  /** Whether this stage is an eligible destination during tablet selection. */
  isValidSelectionTarget?: boolean;
  /** Action handler rolling back patient to doctor consultation. */
  onMoveBack: (patient: Patient) => void | Promise<boolean | void>;
  /** Action handler completing care orders and archiving patient visit today. */
  onFinish: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback to select a patient in tablet mode. */
  onSelectPatient?: (patient: Patient, stage: ClinicalStage, cubicleNum: string) => void;
  /** Pointer down listener for drag initiation. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient, stage: ClinicalStage) => void;
  /** Callback triggered when user clicks '+ Move Here' in selection mode. */
  onMoveHere?: () => void | Promise<boolean | void>;
}

/**
 * Renders the Carryout & Post-Care column within the clinical pipeline.
 *
 * @param props - Section configuration and patient rosters.
 * @returns The rendered Carryout section component.
 */
export function CarryoutSection({
  patients,
  selectedPatientId,
  isDragOver = false,
  isValidSelectionTarget = false,
  onMoveBack,
  onFinish,
  onSelectPatient,
  onPointerDown,
  onMoveHere,
}: CarryoutSectionProps) {
  return (
    <StageColumn
      stage="carryout"
      title={nurseTexts.stageCarryoutHeading}
      icon="bx-capsule"
      badgeColorClass="bg-orange-100 text-orange-700"
      count={patients.length}
      emptyText={nurseTexts.emptyCarryout}
      isDragOver={isDragOver}
      isValidSelectionTarget={isValidSelectionTarget}
      onMoveHere={onMoveHere}
    >
      {patients.map((patient) => (
        <NursePatientCard
          key={patient.id}
          patient={patient}
          stage="carryout"
          isSelected={selectedPatientId === patient.id}
          onSelect={onSelectPatient}
          onPointerDown={onPointerDown}
          onMoveBackFromCarryout={onMoveBack}
          onFinish={onFinish}
        />
      ))}
    </StageColumn>
  );
}

export default CarryoutSection;