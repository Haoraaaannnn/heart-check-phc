/**
 * @fileoverview Idle downtime and room turnaround telemetry panel for outpatient cubicles.
 *
 * Monitors inter-patient turnaround intervals across examination rooms against clinical SLA benchmarks.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartIdleTelemetry
 */

'use client';

import {
  CUBICLES_STYLES,
  HEATMAP_IDLE_THRESHOLDS,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { FlowchartCubicleStation } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface FlowchartIdleTelemetryProps {
  /** Array of examination cubicle stations with idle metrics. */
  stations: FlowchartCubicleStation[];
  /** Facility-wide average idle interval in minutes. */
  facilityAvgIdle: number;
}

/**
 * Telemetry bar visualizing room turnover intervals and turnaround benchmark compliance.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function FlowchartIdleTelemetry({
  stations,
  facilityAvgIdle,
}: FlowchartIdleTelemetryProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.telemetry;

  return (
    <div className={S.telemetryStrip}>
      <div className={S.telemetryHeader}>
        <div>
          <h4 className={S.telemetryTitle}>
            <i className="bx bx-timer text-brand-accent text-base" />
            <span>{T.title}</span>
          </h4>
          <p className="text-[11px] text-content-muted mt-0.5">{T.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            <i className="bx bx-check-shield" />
            <span>{T.benchmark}</span>
          </span>

          <span className="rounded-md bg-surface-subtle px-2.5 py-1 text-xs font-mono font-bold text-content border border-line">
            Mean Gap: {facilityAvgIdle}m
          </span>
        </div>
      </div>

      <div className={S.telemetryBar}>
        {stations.map((station) => {
          const isOccupied = station.status === 'occupied';

          if (isOccupied) {
            return (
              <div
                key={station.id}
                className={`${S.telemetryTile} border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-extrabold text-content">{station.cubicleNum}</span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                  {T.activeConsult} ({station.elapsedMinutes}m)
                </span>
              </div>
            );
          }

          const idle = station.idleMinutes || 0;
          const rating = station.idleRating;
          let toneClass =
            'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
          let dotClass = 'bg-emerald-500';
          let label: string = T.continuous;

          if (
            rating === 'high-idle' ||
            rating === 'dormant' ||
            idle > HEATMAP_IDLE_THRESHOLDS.moderateIdleMax
          ) {
            toneClass =
              'border-amber-300 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200';
            dotClass = 'bg-amber-500';
            label = T.highIdle;
          } else if (
            rating === 'moderate-idle' ||
            idle > HEATMAP_IDLE_THRESHOLDS.lowIdleMax
          ) {
            toneClass =
              'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300';
            dotClass = 'bg-amber-500';
            label = T.moderateIdle;
          } else if (
            rating === 'low-idle' ||
            idle > HEATMAP_IDLE_THRESHOLDS.continuousMax
          ) {
            toneClass =
              'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300';
            dotClass = 'bg-blue-500';
            label = T.lowIdle;
          }

          return (
            <div key={station.id} className={`${S.telemetryTile} ${toneClass}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                <span className="font-extrabold text-content">{station.cubicleNum}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-extrabold">{idle}m idle</span>
                <span className="block text-[9px] font-semibold opacity-75">{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
