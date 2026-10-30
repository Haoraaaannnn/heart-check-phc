/**
 * @fileoverview Familiar three-stage clinical board using the shared workstation visual language.
 *
 * Preserves the Assigned, With Doctor and Carryout workflow and drag destinations while
 * keeping patient controls directly beside their tickets with all care stages visible together.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { ClinicalStage, SelectedNursePatient } from '@/app/nurse/types/nurse';
import { NurseStyle } from '@/app/nurse/constants/nurse';
import { StationOverview } from '@/app/nurse/components/StationOverview';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { AssignedSection } from '@/app/nurse/components/AssignedSection';
import { WithDoctorSection } from '@/app/nurse/components/WithDoctorSection';
import { CarryoutSection } from '@/app/nurse/components/CarryoutSection';

/**
 * Props for the NurseBoard component.
 */
export interface NurseBoardProps {
  /** Completed visits matching the page's current filters. */
  finishedCount?: number;
  /** Current station, service or all-cubicle filter label. */
  scopeLabel?: string;
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
 * Clinical board presenting all stages and their existing patient actions directly.
 *
 * @param props - Patient datasets, drag states, selection models, and action dispatchers.
 * @returns The rendered non-scrollable board element.
 */
export function NurseBoard({
  finishedCount = 0,
  scopeLabel = nurseTexts.allMyCubicles,
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
      <StationOverview activeCount={assignedPatients.length + withDoctorPatients.length + carryoutPatients.length}
        finishedCount={finishedCount} scopeLabel={scopeLabel} selectedTicket={selectedPatient?.patient.patientNum} />
      <div className="grid min-h-0 flex-1 auto-rows-[minmax(18rem,1fr)] grid-cols-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-[#2e2e2e] dark:bg-[#1a1a1a] lg:auto-rows-fr lg:grid-cols-3 lg:overflow-hidden">
        <AssignedSection patients={assignedPatients} speakingId={speakingId} selectedPatientId={selectedPatientId}
          isDragOver={dragOverStage === 'assigned'} isValidSelectionTarget={isStageValidTarget('assigned')}
          onCall={onCall} onSelectPatient={onSelectPatient} onPointerDown={onPointerDown}
          onMoveToWithDoctor={onMoveToWithDoctor} onMoveHere={() => onAssignSelectedToStage('assigned')} />
        <WithDoctorSection patients={withDoctorPatients} selectedPatientId={selectedPatientId}
          isDragOver={dragOverStage === 'with_doctor'} isValidSelectionTarget={isStageValidTarget('with_doctor')}
          onMoveBack={onMoveBackFromDoctor} onMoveToCarryout={onMoveToCarryout}
          onSelectPatient={onSelectPatient} onPointerDown={onPointerDown}
          onMoveHere={() => onAssignSelectedToStage('with_doctor')} />
        <CarryoutSection patients={carryoutPatients} selectedPatientId={selectedPatientId}
          isDragOver={dragOverStage === 'carryout'} isValidSelectionTarget={isStageValidTarget('carryout')}
          onMoveBack={onMoveBackFromCarryout} onFinish={onFinish} onSelectPatient={onSelectPatient} onPointerDown={onPointerDown}
          onMoveHere={() => onAssignSelectedToStage('carryout')} />
      </div>
    </main>
  );
}

export default NurseBoard;
