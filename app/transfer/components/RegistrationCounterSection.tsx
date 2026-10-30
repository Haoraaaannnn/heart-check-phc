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

import React, { useMemo, useRef, useState } from 'react';
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
  /** Optional allowed counter numbers that this user can interact with. */
  allowedCounters?: number[];
  /** All available physical counters in the facility. */
  allCounters?: number[];
  /** Callback to trigger auto-sort / equal distribution. */
  onAutoSort?: () => void | Promise<void>;
  /** Indicates if auto-sort operation is currently running. */
  isAutoSorting?: boolean;
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
  allCounters,
  onAutoSort,
  isAutoSorting = false,
}: RegistrationCounterSectionProps) {
  const safePatients = Array.isArray(patients) ? patients : [];
  const breaks = useStationBreaks();
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const releasingRef = useRef(false);

  // Compute active counters: only those logged in with an account, with "my counter" strictly first
  const activeCounters = useMemo(() => {
    const rawCounters = (allCounters && allCounters.length > 0)
      ? allCounters
      : (allowedCounters && allowedCounters.length > 0 ? allowedCounters : DEFAULT_COUNTERS);

    const hasLoadedOwnership = breaks.stations.some(s => s.kind === 'counter' && s.owners !== undefined);

    // Filter counters to only those logged in with an account
    const filtered = rawCounters.filter(counterNum => {
      const isMine = allowedCounters ? allowedCounters.includes(counterNum) : false;
      if (isMine) return true;

      if (hasLoadedOwnership) {
        const station = breaks.stations.find(item => item.kind === 'counter' && item.id === counterNum);
        return Boolean(station && station.owners && station.owners.length > 0);
      }

      // If station metadata is not loaded yet, trust the pre-filtered allCounters from page
      return true;
    });

    const candidateSet = new Set(filtered);

    // If breaks discovered any logged-in counter that wasn't in allCounters yet, include it
    if (hasLoadedOwnership) {
      for (const st of breaks.stations) {
        if (st.kind === 'counter' && st.owners && st.owners.length > 0) {
          candidateSet.add(st.id);
        }
      }
    }

    // Always include allowedCounters (the user's own counter)
    if (allowedCounters) {
      for (const c of allowedCounters) candidateSet.add(c);
    }

    // Sort: My counter ALWAYS first, then other counters in ascending numerical order
    return Array.from(candidateSet).sort((a, b) => {
      const aIsMine = allowedCounters ? allowedCounters.includes(a) : false;
      const bIsMine = allowedCounters ? allowedCounters.includes(b) : false;
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return a - b;
    });
  }, [allCounters, allowedCounters, breaks.stations]);

  const activeCounterSet = useMemo(() => new Set(activeCounters), [activeCounters]);
  const unassignedPatients = safePatients.filter(p => !p.counter || !activeCounterSet.has(p.counter));

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

        <div className="flex items-center gap-2.5 shrink-0">
          {onAutoSort && (
            <button
              type="button"
              onClick={() => void onAutoSort()}
              disabled={isAutoSorting || safePatients.length === 0 || activeCounters.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#1f1f1f] text-slate-700 dark:text-[#e5e5e5] hover:bg-slate-50 dark:hover:bg-[#282828] active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              title="Equally distribute waiting patients across all active counters"
            >
              <i className={`bx ${isAutoSorting ? 'bx-loader-alt animate-spin text-[#cc3535]' : 'bx-sort-alt-2 text-[#cc3535] dark:text-[#f87171]'}`} aria-hidden="true" />
              <span>{isAutoSorting ? 'Sorting...' : 'Auto-Sort'}</span>
            </button>
          )}
          <span className={registrationCounterStyles.headerHint}>
            {transferTexts.dragCounterHint}
          </span>
        </div>
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
      {activeCounters.length === 0 ? (
        <p className={registrationCounterStyles.emptyNotice}>
          {transferTexts.noCountersAssigned}
        </p>
      ) : (
        <div className={registrationCounterStyles.counterGrid}>
          {activeCounters.map(counterNum => {
            const isInteractive = allowedCounters ? allowedCounters.includes(counterNum) : false;

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
              isInteractive &&
              !station?.onBreak &&
              Boolean(selectedPatient) &&
              selectedPatient?.sourceType === 'counter' &&
              selectedPatient.sourceId !== counterNum;

            const handleCounterClick = () => {
              if (isInteractive && isTargetEligible && onTargetCounterClick) {
                onTargetCounterClick(counterNum);
              }
            };

            const cardStateClass = isOver && isInteractive
              ? registrationCounterStyles.counterCardDropOver
              : isTargetEligible
              ? registrationCounterStyles.counterCardTargetEligible
              : registrationCounterStyles.counterCardNormal;

            return (
              <div
                key={counterNum}
                data-counter={isInteractive && !station?.onBreak ? counterNum : undefined}
                onClick={handleCounterClick}
                style={isTargetEligible ? TransferStyle.assignTargetCard : undefined}
                className={`${registrationCounterStyles.counterCardBase} ${cardStateClass}`}
              >
                <StationOwnerBadge
                  owners={station?.owners}
                  variant="header"
                  actions={isInteractive && station
                    ? <StationBreakButton station={station} compact busy={breaks.busy !== null} onToggle={() => void breaks.toggle(station)} />
                    : undefined}
                />
                {/* Counter Tile Header */}
                <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={registrationCounterStyles.counterTitle}>
                      {transferTexts.counterPrefix} {counterNum}
                    </span>
                    {isInteractive ? (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Your Counter
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-[#262626] border border-slate-200 dark:border-[#333333] shrink-0">
                        View Only
                      </span>
                    )}
                  </div>

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
                      if (!isInteractive) return;
                      e.stopPropagation();
                      if (onSelectPatient) {
                        onSelectPatient(topPatient, counterNum);
                      }
                    };

                    return (
                      <div
                        onPointerDown={e => isInteractive && onPointerDown?.(e, topPatient)}
                        onMouseDown={e => isInteractive && onDragStart?.(e, topPatient)}
                        onClick={handleTopPatientClick}
                        style={isTopSelected ? TransferStyle.selectedPatientRow : undefined}
                        className={
                          isTopSelected
                            ? registrationCounterStyles.topPatientCardSelected
                            : isInteractive
                            ? registrationCounterStyles.topPatientCard
                            : 'p-2 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/60 dark:bg-[#1a1a1a]/60 flex items-center justify-between gap-2 min-w-0'
                        }
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isTopSelected ? (
                            <span className="px-1 py-0.5 rounded bg-[#cc3535] text-white text-[9px] font-bold shrink-0">
                              SEL
                            </span>
                          ) : isInteractive ? (
                            <DragHandle title={transferTexts.tapToSelectHint} />
                          ) : (
                            <i className="bx bx-receipt text-xs text-slate-400 dark:text-[#737373] shrink-0" aria-hidden="true" />
                          )}
                          <span className={registrationCounterStyles.patientNum}>
                            {topPatient.patientNum}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <CounterTimerControl
                            key={`${topPatient.id}:${topPatient.counter_top_started_at}:${topPatient.counter_paused_at}`}
                            patient={topPatient}
                            readOnly={!isInteractive}
                          />

                          {isInteractive ? (
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
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-[#737373] px-2 py-1">
                              In Service
                            </span>
                          )}
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
                          onPointerDown={e => isInteractive && onPointerDown?.(e, p)}
                          onMouseDown={e => isInteractive && onDragStart?.(e, p)}
                          onClick={e => {
                            if (!isInteractive) return;
                            e.stopPropagation();
                            onSelectPatient?.(p, counterNum);
                          }}
                          className={
                            isWaitingSelected
                              ? registrationCounterStyles.waitingPatientChipSelected
                              : isInteractive
                              ? registrationCounterStyles.waitingPatientChip
                              : 'px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 dark:bg-[#202020] text-slate-500 dark:text-[#888888] border border-slate-200 dark:border-[#2e2e2e] select-none'
                          }
                        >
                          {p.patientNum}
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
