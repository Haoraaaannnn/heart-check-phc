/**
 * @fileoverview Column 1: Assigned Queue section component for the Nurse Dashboard.
 *
 * Displays patients transferred and waiting in the queue for their consultation,
 * supporting Deepgram TTS audio calls, drag-and-drop advancement, and Click-to-Select tablet mode.
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
 * Props for the AssignedSection component.
 */
export interface AssignedSectionProps {
  /** Roster of waiting patients assigned to cubicles. */
  patients: Patient[];
  /** ID of patient currently being called by TTS, or null. */
  speakingId?: number | null;
  /** ID of patient currently selected in tablet selection mode. */
  selectedPatientId?: number | null;
  /** Whether this stage is currently hovered during a drag. */
  isDragOver?: boolean;
  /** Whether this stage is an eligible destination during tablet selection. */
  isValidSelectionTarget?: boolean;
  /** Callback to trigger Deepgram TTS audio announcement. */
  onCall: (patient: Patient) => void;
  /** Callback to select a patient in tablet mode. */
  onSelectPatient?: (patient: Patient, stage: ClinicalStage, cubicleNum: string) => void;
  /** Pointer down listener for drag initiation. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient, stage: ClinicalStage) => void;
  /** Action handler advancing patient to doctor consultation. */
  onMoveToWithDoctor: (patient: Patient) => void | Promise<boolean | void>;
  /** Callback triggered when user clicks '+ Move Here' in selection mode. */
  onMoveHere?: () => void | Promise<boolean | void>;
}

/**
 * Renders the Assigned Queue column within the clinical pipeline.
 *
 * @param props - Section configuration and patient rosters.
 * @returns The rendered Assigned section component.
 */
export function AssignedSection({
  patients,
  speakingId = null,
  selectedPatientId,
  isDragOver = false,
  isValidSelectionTarget = false,
  onCall,
  onSelectPatient,
  onPointerDown,
  onMoveToWithDoctor,
  onMoveHere,
}: AssignedSectionProps) {
  return (
    <StageColumn
      stage="assigned"
      title={nurseTexts.stageAssignedHeading}
      icon="bx-user-check"
      badgeColorClass="bg-blue-100 text-blue-700"
      count={patients.length}
      emptyText={nurseTexts.emptyAssigned}
      isDragOver={isDragOver}
      isValidSelectionTarget={isValidSelectionTarget}
      onMoveHere={onMoveHere}
    >
      {patients.map((patient) => (
        <NursePatientCard
          key={patient.id}
          patient={patient}
          stage="assigned"
          speakingId={speakingId}
          isSelected={selectedPatientId === patient.id}
          onCall={onCall}
          onSelect={onSelectPatient}
          onPointerDown={onPointerDown}
          onMoveToWithDoctor={onMoveToWithDoctor}
        />
      ))}
    </StageColumn>
  );
}

export default AssignedSection;