/**
 * @fileoverview Modal inspection dialog displaying detailed stage and cubicle queue information.
 *
 * Opens on-demand when the user clicks any rectangular stage node or branching cubicle station
 * on the clean minimal process-graph map.
 *
 * @module app/dashboard/pages/cubicles/components/ProcessStageModal
 */

'use client';

import { CUBICLES_STYLES, PIPELINE_STAGE_STYLES, CUBICLE_STATUS_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type {
  FlowchartStageData,
  FlowchartCubicleStation,
  FlowchartPatientItem,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

export type ProcessStageTarget =
  | { type: 'stage'; stage: FlowchartStageData }
  | { type: 'cubicle'; station: FlowchartCubicleStation };

interface ProcessStageModalProps {
  /** The currently selected stage or cubicle station for inspection. */
  target: ProcessStageTarget | null;
  /** Callback triggered to dismiss the inspection modal. */
  onClose: () => void;
  /** Optional callback to inspect a specific patient ticket in detail. */
  onSelectPatient?: (patient: FlowchartPatientItem) => void;
}

/**
 * Stage detail inspection modal dialog for the minimal process graph.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ProcessStageModal({
  target,
  onClose,
  onSelectPatient,
}: ProcessStageModalProps) {
  if (!target) return null;

  const S = CUBICLES_STYLES.processGraph;
  const T = CUBICLES_TEXTS.flowchart.processGraph.modal;

  const isStage = target.type === 'stage';
  const stage = isStage ? target.stage : null;
  const station = !isStage ? target.station : null;

  return (
    <div
      className={S.modalBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={S.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={S.modalHeader}>
          <div>
            <h3 className={S.modalTitle}>
              <i
                className={`bx ${
                  isStage
                    ? stage?.icon
                    : 'bx-clinic text-rose-500'
                }`}
              />
              <span>
                {isStage
                  ? `${T.titlePrefix} ${stage?.title}`
                  : `${T.titlePrefix} ${station?.cubicleNum}`}
              </span>
            </h3>
            <p className={S.modalSubtitle}>
              {isStage ? stage?.subtitle : station?.category}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={S.modalCloseBtn}
            title={T.closeBtn}
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Body Content */}
        <div className={S.modalBody}>
          {/* STAGE PERSPECTIVE */}
          {isStage && stage && (
            <>
              {/* Telemetry Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-surface-subtle p-3 text-center">
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    Queue Volume
                  </span>
                  <p className="font-mono text-lg font-extrabold text-content mt-0.5">
                    {stage.count}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface-subtle p-3 text-center">
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    {stage.metricLabel}
                  </span>
                  <p className="font-mono text-lg font-extrabold text-content mt-0.5">
                    {stage.metricValue}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface-subtle p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    Alert Status
                  </span>
                  <p className="font-mono text-xs font-bold mt-1 text-content">
                    {stage.alertCount && stage.alertCount > 0
                      ? `${stage.alertCount} Overdue`
                      : 'Optimal Flow'}
                  </p>
                </div>
              </div>

              {/* Patient Queue List in this Stage */}
              <div>
                <h4 className={`${S.modalSectionTitle} mb-2`}>
                  <i className="bx bx-list-ul" />
                  <span>
                    {T.queueHeading} ({stage.patients.length})
                  </span>
                </h4>

                {stage.patients.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-line bg-surface/50 text-xs text-content-muted text-center">
                    {T.emptyQueue}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {stage.patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => onSelectPatient?.(patient)}
                        className={`${S.modalItemCard} transition hover:border-slate-400 cursor-pointer`}
                        title="Click to view full patient telemetry"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-mono font-extrabold text-content">
                            <i className="bx bx-user text-rose-500 text-xs" />
                            <span>{patient.patientNum}</span>
                            {patient.cubicleNum && (
                              <span className="rounded bg-surface-subtle border border-line px-1.5 py-0.2 text-[9px] font-medium text-content-muted">
                                {patient.cubicleNum}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-content-muted">
                            {patient.service}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {patient.elapsedMinutes !== undefined && (
                            <span className="font-mono text-xs font-bold text-content">
                              {patient.elapsedMinutes}m elapsed
                            </span>
                          )}
                          {patient.isStalled && (
                            <span className="rounded bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300 border border-rose-300">
                              Stalled
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* CUBICLE PERSPECTIVE */}
          {!isStage && station && (
            <>
              {/* Doctor and Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-subtle p-3.5">
                <div>
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    {T.assignedDoctor}
                  </span>
                  <p className="text-sm font-bold text-content mt-0.5 flex items-center gap-1.5">
                    <i className="bx bx-user-pin text-rose-500" />
                    <span>
                      {station.assignedDoctor
                        ? `Dr. ${station.assignedDoctor}`
                        : 'No physician assigned'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                      CUBICLE_STATUS_STYLES[station.status].badgeBg
                    } ${CUBICLE_STATUS_STYLES[station.status].badgeText}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        CUBICLE_STATUS_STYLES[station.status].dot
                      }`}
                    />
                    <span>{station.status}</span>
                  </span>
                </div>
              </div>

              {/* Active Process vs Idle Turnaround */}
              {station.status === 'occupied' && station.currentPatient ? (
                <div className="flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span>{T.activeItemHeading}</span>
                    </span>
                    <span className="font-mono text-sm font-extrabold text-content">
                      {station.currentPatient.patientNum}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-content-muted mt-1">
                    <span>{T.elapsedLabel}</span>
                    <span className="font-mono font-bold text-content">
                      {station.elapsedMinutes || 0} minutes
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-content-muted">
                    <span>Performance Pace:</span>
                    <span className="font-bold uppercase font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface border">
                      {station.speedRating || 'Normal'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <i className="bx bx-check-circle" />
                      <span>Room Ready for Next Patient</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-content">
                      Idle: {station.idleMinutes || 0}m
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted">
                    Room is cleaned and sanitized. Awaiting next dispatch from lobby.
                  </p>
                </div>
              )}

              {/* Today's Historical Telemetry for this Cubicle */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    {T.totalServed}
                  </span>
                  <p className="font-mono text-lg font-extrabold text-content mt-0.5">
                    {station.totalConsultationsToday} pts
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                  <span className="text-[10px] font-semibold text-content-muted uppercase">
                    {T.avgDuration}
                  </span>
                  <p className="font-mono text-lg font-extrabold text-content mt-0.5">
                    {station.avgSpeedTodayMinutes > 0
                      ? `${station.avgSpeedTodayMinutes}m`
                      : '—'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
