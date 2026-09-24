'use client';

import React from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { QueuePanel } from './QueuePanel';
import { RegistrationCounterSection } from './RegistrationCounterSection';
import { CubicleCard } from './CubicleCard';
import { ScrollArea } from '@/components/reusables/ScrollArea';
import { transferTexts } from '../constants/transferTexts';

/**
 * Props for `ServiceBoard`.
 */
export interface ServiceBoardProps {
  /** Service category identifier. */
  category: string;
  /** Active queue patients list. */
  onProgressPatients: Patient[];
  /** Idle patients list. */
  idlePatients: Patient[];
  /** Cubicles configured for this service/room. */
  cubicles: Cubicle[];
  /** Map of assigned patients by cubicle number. */
  assignedPatients: Record<string, Patient[]>;
  /** Whether drag-and-drop assignment is active. */
  isDraggable: boolean;
  /** Currently dragged patient, if any. */
  draggedPatient?: Patient | null;
  /** Cubicle number currently being hovered over during a drag. */
  dragOverCubicle?: string | null;
  /** Active text-to-speech patient ID. */
  speakingId?: number | null;
  /** Audio announcement callback. */
  onSpeak: (text: string, patientId: number) => void;
  /** Move back to queue callback. */
  onMoveBackToProgress: (patient: Patient, cubicleNum: string) => void;
  /** Pointer down handler from queue. */
  onPointerDownFromQueue?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse handler from queue (backward compatibility). */
  onDragStartFromQueue?: (e: React.MouseEvent, patient: Patient) => void;
  /** Pointer down handler from cubicle. */
  onPointerDownFromCubicle?: (e: React.PointerEvent, patient: Patient, cubicleNum: string) => void;
  /** Mouse handler from cubicle (backward compatibility). */
  onDragStartFromCubicle?: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  /** Instant assign handler. */
  onAssignNow?: (patient: Patient) => void;
  /** Idle reactivation handler. */
  onActivateIdle: (patient: Patient) => void;
  /** Idle removal handler. */
  onRemoveIdle: (patient: Patient) => void;
  /** Map of cubicle numbers to doctor names. */
  cubicleDoctorMap?: Record<string, string>;
  /** Optional timeout warning in seconds. */
  warnAfterSeconds?: number;

  // Registration counter props (for Consultation and OPD Screening)
  /** Registration counter patients. */
  registrationPatients?: Patient[];
  /** Currently dragged registration patient. */
  regDraggedPatient?: Patient | null;
  /** Counter number hovered during registration drag. */
  dragOverCounter?: number | null;
  /** Pointer handler for registration drag. */
  onRegPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse handler for registration drag (backward compatibility). */
  onRegDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Release from counter callback. */
  onReleaseFromCounter?: (patient: Patient) => void;
  /** Allowed counter numbers. */
  allowedCounters?: number[];
}

/**
 * Shared two-column board orchestrating the queue panel on the left and station list on the right.
 *
 * @remarks
 * **List Transformation & Architecture:**
 * - Left column: Dedicated queue and idle operations panel.
 * - Right column: Registration counters and cubicles structured as clear, vertical list lanes.
 * - Responsive layout stacks gracefully on mobile / narrow tablet screens.
 *
 * @param props - All data and interaction handlers for the service board.
 * @returns The rendered ServiceBoard component.
 */
export function ServiceBoard({
  category,
  onProgressPatients,
  idlePatients,
  cubicles,
  assignedPatients,
  isDraggable,
  draggedPatient,
  dragOverCubicle,
  speakingId,
  onSpeak,
  onMoveBackToProgress,
  onPointerDownFromQueue,
  onDragStartFromQueue,
  onPointerDownFromCubicle,
  onDragStartFromCubicle,
  onAssignNow,
  onActivateIdle,
  onRemoveIdle,
  cubicleDoctorMap = {},
  warnAfterSeconds,
  registrationPatients,
  regDraggedPatient,
  dragOverCounter,
  onRegPointerDown,
  onRegDragStart,
  onReleaseFromCounter,
  allowedCounters,
}: ServiceBoardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Queue & Idle Panel (4 cols on lg, 3.5 on xl) */}
      <div className="lg:col-span-4 xl:col-span-4 space-y-4">
        <QueuePanel
          onProgressPatients={onProgressPatients}
          idlePatients={idlePatients}
          isDraggable={isDraggable}
          selectedCategory={category}
          draggedPatientId={draggedPatient?.id}
          onPointerDown={onPointerDownFromQueue}
          onDragStart={onDragStartFromQueue}
          onSpeak={onSpeak}
          onAssignNow={onAssignNow}
          speakingId={speakingId}
          warnAfterSeconds={warnAfterSeconds}
          onActivateIdle={onActivateIdle}
          onRemoveIdle={onRemoveIdle}
        />
      </div>

      {/* Right Column: Registration & Cubicles List (8 cols on lg, 8 on xl) */}
      <div className="lg:col-span-8 xl:col-span-8 space-y-4">
        {/* Registration Counters (if available for this flow) */}
        {registrationPatients !== undefined && onReleaseFromCounter && (
          <RegistrationCounterSection
            patients={registrationPatients}
            draggedPatient={regDraggedPatient ?? null}
            dragOverCounter={dragOverCounter ?? null}
            onPointerDown={onRegPointerDown}
            onDragStart={onRegDragStart}
            onRelease={onReleaseFromCounter}
            allowedCounters={allowedCounters}
          />
        )}

        {/* Cubicles Station List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
              <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
                {transferTexts.cubiclesHeading}
              </h2>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {cubicles.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {category}
            </span>
          </div>

          {/* List of Cubicle Lanes */}
          <ScrollArea className="max-h-[580px] pr-1 space-y-3">
            {cubicles.map(cubicle => {
              const assigned = assignedPatients[cubicle.cubicleNum] || [];
              const isOver = dragOverCubicle === cubicle.cubicleNum;
              const isFull = assigned.length >= 5;

              return (
                <CubicleCard
                  key={cubicle.id}
                  cubicle={cubicle}
                  assigned={assigned}
                  isOver={isOver}
                  isDraggable={isDraggable}
                  isFull={isFull}
                  onPointerDown={onPointerDownFromCubicle}
                  onDragStart={onDragStartFromCubicle}
                  onSpeak={onSpeak}
                  onMoveBack={onMoveBackToProgress}
                  draggedPatientId={draggedPatient?.id}
                  speakingId={speakingId}
                  doctorName={cubicleDoctorMap[cubicle.cubicleNum]}
                  warnAfterSeconds={warnAfterSeconds}
                />
              );
            })}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default ServiceBoard;
