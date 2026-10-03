/**
 * @fileoverview Clinical examination stations telemetry grid embedded within the Active Examination stage.
 *
 * Visualizes individual examination rooms, physician assignments, active consultation timers,
 * real-time processing speed ratings, and idle turnaround intervals.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartCubicleGrid
 */

'use client';

import {
  CUBICLES_STYLES,
  CUBICLE_STATUS_STYLES,
  HEATMAP_SPEED_STYLES,
  HEATMAP_IDLE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { FlowchartCubicleStation } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface FlowchartCubicleGridProps {
  /** Array of examination cubicle stations. */
  stations: FlowchartCubicleStation[];
  /** Callback when user clicks a cubicle station for inspection. */
  onSelectStation: (station: FlowchartCubicleStation) => void;
}

/**
 * Grid layout rendering examination cubicle stations with live consultation speed and idle metrics.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function FlowchartCubicleGrid({
  stations,
  onSelectStation,
}: FlowchartCubicleGridProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.hub;

  return (
    <div className={S.hubCard}>
      {/* Hub Header */}
      <div className={S.hubHeader}>
        <div className={S.hubTitleGroup}>
          <div className={S.hubTitleIcon}>
            <i className="bx bx-clinic" />
          </div>
          <div>
            <h3 className={S.hubTitle}>{T.title}</h3>
            <p className={S.hubSubtitle}>{T.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>
              {stations.filter((s) => s.status === 'occupied').length} Occupied
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>
              {stations.filter((s) => s.status === 'available').length} Available
            </span>
          </span>
        </div>
      </div>

      {/* Stations Grid */}
      <div className={S.stationGrid}>
        {stations.map((station) => {
          const statusStyle = CUBICLE_STATUS_STYLES[station.status];
          const isOccupied = station.status === 'occupied';
          const speedStyle = station.speedRating
            ? HEATMAP_SPEED_STYLES[station.speedRating]
            : null;
          const idleStyle = station.idleRating
            ? HEATMAP_IDLE_STYLES[station.idleRating]
            : null;
          const elapsed = station.elapsedMinutes || 0;
          const isProlonged = elapsed > 35;
          const isStalled = elapsed > 45;

          const alertRing = isStalled
            ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse'
            : isProlonged
            ? 'ring-1 ring-amber-400 border-amber-300'
            : '';

          return (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              className={`${S.stationCard} ${statusStyle.border} ${statusStyle.bg} ${alertRing}`}
              title={T.clickToInspect}
            >
              {/* Station Header */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-content">
                      {station.cubicleNum}
                    </span>
                    <span className="rounded bg-surface-subtle px-1.5 py-0.2 text-[10px] font-semibold text-content-muted border border-line">
                      {station.category}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle.badgeBg} ${statusStyle.badgeText}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                    {station.status}
                  </span>
                </div>

                {/* Physician Assignment */}
                <div className="flex items-center gap-1 text-[11px] text-content-muted mb-3">
                  <i className="bx bx-user-pin text-xs text-rose-500" />
                  <span className="truncate">
                    {station.assignedDoctor
                      ? `Dr. ${station.assignedDoctor}`
                      : 'No physician rostered'}
                  </span>
                </div>
              </div>

              {/* Station Body */}
              <div className="flex flex-col gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 p-3 border border-line">
                {isOccupied && station.currentPatient ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <i className="bx bx-user text-rose-600 dark:text-rose-400" />
                        <span className="font-mono text-xs font-extrabold text-content">
                          {station.currentPatient.patientNum}
                        </span>
                      </div>
                      <span className="text-[10px] text-content-muted">
                        {station.currentPatient.service}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-line/60">
                      <span className="text-[11px] font-medium text-content-muted">
                        {T.elapsed}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-content">
                          {station.elapsedMinutes}m
                        </span>
                        {speedStyle && (
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${speedStyle.badge}`}
                          >
                            {station.speedRating}
                          </span>
                        )}
                      </div>
                    </div>

                    {isStalled ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-1.5 py-0.5 border border-rose-300 dark:border-rose-800">
                        <i className="bx bx-alarm-exclamation" />
                        Stalled Alert (&gt;45m)
                      </span>
                    ) : isProlonged ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 border border-amber-300 dark:border-amber-800">
                        <i className="bx bx-time-five" />
                        Extended (&gt;35m)
                      </span>
                    ) : null}

                    {station.estimatedRemainingMinutes !== undefined && !isProlonged && (
                      <div className="flex items-center justify-between text-[10px] text-content-subtle font-mono">
                        <span>{T.estRemaining}</span>
                        <span>~{station.estimatedRemainingMinutes}m</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <i className="bx bx-check-circle" />
                        {T.ready}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-line/60">
                      <span className="text-[11px] font-medium text-content-muted">
                        {T.idleGap}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-content">
                          {station.idleMinutes}m
                        </span>
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

              {/* Station Daily Throughput Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/70 text-[10px] text-content-muted">
                <span>
                  {T.todayConsults}{' '}
                  <span className="font-mono font-bold text-content">
                    {station.totalConsultationsToday}
                  </span>
                </span>
                <span>
                  {T.todayAvg}{' '}
                  <span className="font-mono font-bold text-content">
                    {station.avgSpeedTodayMinutes > 0
                      ? `${station.avgSpeedTodayMinutes}m`
                      : '—'}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
