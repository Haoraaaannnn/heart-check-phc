/**
 * @fileoverview Individual room station bay component branching directly out of the
 * Active Examination stage node on the interactive pipeline map.
 *
 * Visualizes physician assignment, live patient countdown, consultation speed evaluation,
 * and inter-patient turnaround idle downtime.
 *
 * @module app/dashboard/pages/cubicles/components/StationBayCard
 */

'use client';

import {
  CUBICLES_STYLES,
  CUBICLE_STATUS_STYLES,
  HEATMAP_SPEED_STYLES,
  HEATMAP_IDLE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import type { FlowchartCubicleStation } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface StationBayCardProps {
  /** The examination room station telemetry model. */
  station: FlowchartCubicleStation;
  /** Callback triggered when user clicks the station for deep inspection. */
  onClick: () => void;
}

/**
 * Visual room station pod branching directly from the Stage 3 Examination hub.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function StationBayCard({ station, onClick }: StationBayCardProps) {
  const S = CUBICLES_STYLES.flowchart;
  const statusStyle = CUBICLE_STATUS_STYLES[station.status];
  const isOccupied = station.status === 'occupied';

  const elapsed = station.elapsedMinutes || 0;
  const isProlonged = elapsed > 35;
  const isStalled = elapsed > 45;

  const speedStyle = station.speedRating
    ? HEATMAP_SPEED_STYLES[station.speedRating]
    : null;
  const idleStyle = station.idleRating
    ? HEATMAP_IDLE_STYLES[station.idleRating]
    : null;

  const alertRing = isStalled
    ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse'
    : isProlonged
    ? 'ring-1 ring-amber-400 border-amber-300'
    : '';

  // Progress percentage against target 20m consultation baseline
  const progressPercent = Math.min(100, Math.round((elapsed / 20) * 100));

  return (
    <div
      onClick={onClick}
      className={`${S.bayCard} ${statusStyle.border} ${statusStyle.bg} ${alertRing}`}
      title={`Click to inspect ${station.cubicleNum} station telemetry`}
    >
      {/* Top Header */}
      <div>
        <div className={S.bayHeader}>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${statusStyle.dot}`} />
            <span className={S.bayTitle}>{station.cubicleNum}</span>
            <span className="rounded bg-surface-subtle px-1.5 py-0.2 text-[9px] font-semibold text-content-muted border border-line">
              {station.category}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle.badgeBg} ${statusStyle.badgeText}`}
          >
            {station.status}
          </span>
        </div>

        {/* Doctor assignment */}
        <div className={S.bayDoctor}>
          <i className="bx bx-user-pin text-rose-500 text-xs shrink-0" />
          <span className="truncate">
            {station.assignedDoctor
              ? `Dr. ${station.assignedDoctor}`
              : 'No physician assigned'}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className={`${S.bayBody} my-2`}>
        {isOccupied && station.currentPatient ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <i className="bx bx-user text-rose-600 dark:text-rose-400 text-xs shrink-0" />
                <span className="font-mono text-xs font-extrabold text-content truncate">
                  {station.currentPatient.patientNum}
                </span>
              </div>
              <span className="text-[10px] text-content-muted truncate ml-1">
                {station.currentPatient.service}
              </span>
            </div>

            <div className={S.bayTimerRow}>
              <span className="text-[11px] text-content-muted">Elapsed Time:</span>
              <div className="flex items-center gap-1.5">
                <span className={S.bayTimerText}>{elapsed}m</span>
                {speedStyle && (
                  <span
                    className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${speedStyle.badge}`}
                  >
                    {station.speedRating}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar toward 20m benchmark */}
            <div className={S.bayProgressWrap}>
              <div
                className={`${S.bayProgressBar} ${
                  isStalled
                    ? 'bg-rose-500'
                    : isProlonged
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isStalled && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-bold px-1.5 py-0.5 border border-rose-300 dark:border-rose-800 mt-0.5">
                <i className="bx bx-alarm-exclamation" />
                Stalled Alert (&gt;45m)
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <i className="bx bx-check-circle" />
                Ready for next patient
              </span>
            </div>

            <div className={S.bayTimerRow}>
              <span className="text-[11px] text-content-muted">Turnaround Gap:</span>
              <div className="flex items-center gap-1.5">
                <span className={S.bayTimerText}>{station.idleMinutes}m</span>
                {idleStyle && (
                  <span
                    className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${idleStyle.badge}`}
                  >
                    {station.idleRating}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Throughput Summary */}
      <div className="flex items-center justify-between text-[10px] text-content-muted pt-1.5 border-t border-line/60">
        <span>
          Today: <span className="font-mono font-bold text-content">{station.totalConsultationsToday}</span>
        </span>
        <span>
          Avg: <span className="font-mono font-bold text-content">{station.avgSpeedTodayMinutes > 0 ? `${station.avgSpeedTodayMinutes}m` : '—'}</span>
        </span>
      </div>
    </div>
  );
}
