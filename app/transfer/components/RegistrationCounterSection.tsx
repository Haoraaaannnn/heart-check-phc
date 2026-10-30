/**
 * @fileoverview Registration Counters component formatted as a non-scrollable horizontal grid.
 *
 * Displays all assigned registration counters simultaneously in a space-efficient
 * horizontal row/grid without vertical scrolling. Supports:
 * - Direct pointer drag-and-drop between counter lanes (`data-counter`)
 * - Click-to-Select patient selection and counter reassignment
 * - Real-time elapsed timers and instant "Send to Queue" release triggers
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/RegistrationCounterSection
 */

'use client';

import React, { useRef, useState } from 'react';
import { PatientHistoryButton } from '@/components/patients/PatientHistoryButton';
import { Patient } from '@/types/Types';
import { CounterTimerControl } from './CounterTimerControl';
import { transferTexts } from '@/constants/texts/transferTexts';
import { TransferStyle } from '@/app/transfer/constants/transfer';
import { registrationCounterStyles } from '@/constants/designs/transferStyles';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';
import { DragHandle } from '@/app/transfer/components/DragHandle';
import { useStationBreaks } from '@/hooks/useStationBreaks';
import { StationBreakButton } from '@/components/reusables/StationBreakButton';
import { StationOwnerBadge } from '@/components/reusables/StationOwnerBadge';

/**
 * Props for {@link RegistrationCounterSection}.
 */
export interface RegistrationCounterSectionProps {
  /** All patients currently at registration counters. */
  patients: Patient[];
  /** Currently dragged patient, if any. */
  draggedPatient: Patient | null;
  /** Counter number currently being hovered over as a drop target. */
  dragOverCounter: number | null;
  /** Currently selected patient in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when user taps a counter patient for reassignment. */
  onSelectPatient?: (patient: Patient, counterNum: number) => void;
  /** Callback triggered when user taps a destination counter to move the selected patient. */
  onTargetCounterClick?: (counterNum: number) => void;
  /** Pointer down drag initiation handler. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse drag handler for backward compatibility. */
  onDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Callback to release the front patient from the counter to the queue. */
  onRelease: (patient: Patient) => void | Promise<void>;
  /** Optional allowed counter numbers. */
  allowedCounters?: number[];
}

const DEFAULT_COUNTERS: number[] = [];

/**
 * Registration Counters section presenting all counters in a non-scrollable compact layout.
 *
 * @param props - Counter patient data and interaction listeners.
 * @returns The rendered non-scrollable RegistrationCounterSection.
 */
export function RegistrationCounterSection({
  patients,
  draggedPatient: _draggedPatient,
  dragOverCounter,
  selectedPatient,
  onSelectPatient,
  onTargetCounterClick,
  onPointerDown,
  onDragStart,
  onRelease,
  allowedCounters,
}: RegistrationCounterSectionProps) {
  const counters = allowedCounters && allowedCounters.length > 0 ? allowedCounters : DEFAULT_COUNTERS;
  const safePatients = Array.isArray(patients) ? patients : [];
  const breaks = useStationBreaks();
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const releasingRef = useRef(false);
  const unassignedPatients = safePatients.filter(p => !p.counter);

  return (
    <div className={registrationCounterStyles.sectionCard}>
      {/* Section Header */}
      <div className={registrationCounterStyles.header}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={registrationCounterStyles.headerPulseDot} />
          <h2 className={registrationCounterStyles.headerTitle}>
            {transferTexts.registrationHeading}
          </h2>
          <span className={registrationCounterStyles.headerCountBadge}>
            {safePatients.length}
          </span>
        </div>
        <span className={registrationCounterStyles.headerHint}>
          {transferTexts.dragCounterHint}
        </span>
      </div>

      {breaks.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300 mb-2">{breaks.error}</p>}

      {unassignedPatients.length > 0 && (
        <div className="mb-2.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <i className="bx bx-error-circle text-base text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {unassignedPatients.length} patient(s) waiting for an active registration counter
            </span>
          </div>
          <span className="font-mono font-bold shrink-0 ml-2">
            {unassignedPatients.map(p => p.patientNum).join(', ')}
          </span>
        </div>
      )}
      {/* Non-scrollable Horizontal Counters Grid */}
      {counters.length === 0 ? (
        <p className={registrationCounterStyles.emptyNotice}>
          {transferTexts.noCountersAssigned}
        </p>
      ) : (
        <div className={registrationCounterStyles.counterGrid}>
          {counters.map(counterNum => {
            const counterPatients = safePatients
              .filter(p => p.counter === counterNum)
              .sort(
                (a, b) =>
                  new Date(a.counter_rejoin_at || a.created_at || 0).getTime() -
                  new Date(b.counter_rejoin_at || b.created_at || 0).getTime()
              );

            const isOver = dragOverCounter === counterNum;
            const topPatient = counterPatients[0];
            const station = breaks.stations.find(item => item.kind === 'counter' && item.id === counterNum);
            const waitingPatients = counterPatients.slice(1);

            // Check if this counter is an eligible target to receive selected counter patient
            const isTargetEligible =
              !station?.onBreak &&
              Boolean(selectedPatient) &&
              selectedPatient?.sourceType === 'counter' &&
              selectedPatient.sourceId !== counterNum;

            const handleCounterClick = () => {
              if (isTargetEligible && onTargetCounterClick) {
                onTargetCounterClick(counterNum);
              }
            };

            const cardStateClass = isOver
              ? registrationCounterStyles.counterCardDropOver
              : isTargetEligible
              ? registrationCounterStyles.counterCardTargetEligible
              : registrationCounterStyles.counterCardNormal;

            return (
              <div
                key={counterNum}
                data-counter={station?.onBreak ? undefined : counterNum}
                onClick={handleCounterClick}
                style={isTargetEligible ? TransferStyle.assignTargetCard : undefined}
                className={`${registrationCounterStyles.counterCardBase} ${cardStateClass}`}
              >
                <StationOwnerBadge owners={station?.owners} variant="header" actions={station
                  ? <StationBreakButton station={station} compact busy={breaks.busy !== null} onToggle={() => void breaks.toggle(station)} />
                  : undefined} />
                {/* Counter Tile Header */}
                <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                  <span className={registrationCounterStyles.counterTitle}>
                    {transferTexts.counterPrefix} {counterNum}
                  </span>

                  {isTargetEligible ? (
                    <span className={registrationCounterStyles.counterTargetPill}>
                      {transferTexts.moveToCounterBtn}
                    </span>
                  ) : (
                    <span className={registrationCounterStyles.counterCount}>
                      {counterPatients.length} {counterPatients.length === 1 ? 'pt' : 'pts'}
                    </span>
                  )}
                </div>

                {/* Primary Patient at Counter Window */}
                {topPatient ? (
                  (() => {
                    const isTopSelected = selectedPatient?.patient.id === topPatient.id;

                    const handleTopPatientClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (onSelectPatient) {
                        onSelectPatient(topPatient, counterNum);
                      }
                    };

                    return (
                      <div
                        onPointerDown={e => onPointerDown?.(e, topPatient)}
                        onMouseDown={e => onDragStart?.(e, topPatient)}
                        onClick={handleTopPatientClick}
                        style={isTopSelected ? TransferStyle.selectedPatientRow : undefined}
                        className={
                          isTopSelected
                            ? registrationCounterStyles.topPatientCardSelected
                            : registrationCounterStyles.topPatientCard
                        }
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isTopSelected ? (
                            <span className="px-1 py-0.5 rounded bg-[#cc3535] text-white text-[9px] font-bold shrink-0">
                              SEL
                            </span>
                          ) : (
                            <DragHandle title={transferTexts.tapToSelectHint} />
                          )}
                          <span className={registrationCounterStyles.patientNum}>
                            {topPatient.patientNum}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <CounterTimerControl key={`${topPatient.id}:${topPatient.counter_top_started_at}:${topPatient.counter_paused_at}`} patient={topPatient} />

                          <button
                            type="button"
                            disabled={releasingId !== null}
                            onPointerDown={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={async e => {
                              e.stopPropagation();
                              if (releasingRef.current) return;
                              releasingRef.current = true; setReleasingId(topPatient.id);
                              try { await onRelease(topPatient); }
                              finally { releasingRef.current = false; setReleasingId(null); }
                            }}
                            title={transferTexts.moveToQueueTooltip}
                            className={registrationCounterStyles.queueBtn}
                          >
                            {releasingId === topPatient.id ? 'Queuing...' : transferTexts.sendToQueueBtn}
                          </button>
                          <PatientHistoryButton patientId={topPatient.id} ticket={topPatient.patientNum} compact />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className={registrationCounterStyles.availableLabel}>
                    {isTargetEligible
                      ? transferTexts.counterSelectTargetHint
                      : station?.onBreak ? 'On break' : transferTexts.cubicleAvailable}
                  </div>
                )}

                {/* Additional Waiting Queue in Lane */}
                {waitingPatients.length > 0 && (
                  <div className={registrationCounterStyles.nextQueueWrap}>
                    <span className={registrationCounterStyles.nextLabel}>
                      Next:
                    </span>
                    {waitingPatients.slice(0, 2).map(p => {
                      const isWaitingSelected = selectedPatient?.patient.id === p.id;
                      return (
                        <span
                          key={p.id}
                          onPointerDown={e => onPointerDown?.(e, p)}
                          onMouseDown={e => onDragStart?.(e, p)}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectPatient?.(p, counterNum);
                          }}
                          className={
                            isWaitingSelected
                              ? registrationCounterStyles.waitingPatientChipSelected
                              : registrationCounterStyles.waitingPatientChip
                          }
                        >
                          {p.patientNum}
                          <PatientHistoryButton patientId={p.id} ticket={p.patientNum} compact />
                        </span>
                      );
                    })}
                    {waitingPatients.length > 2 && (
                      <span className={registrationCounterStyles.morePatientsText}>
                        +{waitingPatients.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RegistrationCounterSection;
