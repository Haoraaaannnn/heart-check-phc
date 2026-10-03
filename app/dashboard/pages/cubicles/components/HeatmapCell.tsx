/**
 * @fileoverview Individual heatmap cell component visualizing patient processing speed,
 * idle interval downtime, and consultation count for a specific cubicle and hourly slot.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapCell
 */

'use client';

import {
  CUBICLES_STYLES,
  HEATMAP_SPEED_STYLES,
  HEATMAP_IDLE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type {
  HeatmapCellData,
  HeatmapViewMode,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

interface HeatmapCellProps {
  /** Aggregated analytical data for this cubicle and hour slot. */
  cell: HeatmapCellData;
  /** Active perspective mode. */
  viewMode: HeatmapViewMode;
  /** Callback triggered when user clicks the cell for deep consultation inspection. */
  onClick: () => void;
}

/**
 * Visual matrix cell rendering color-coded processing speed and idle interval metrics.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HeatmapCell({ cell, viewMode, onClick }: HeatmapCellProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap.table;

  // Upcoming hour slot outside current operational progression
  if (cell.isUpcoming) {
    return (
      <div className={`${S.cellButton} ${S.cellUpcoming}`} title={T.upcomingSlot}>
        <span className="text-[10px] font-semibold text-content-subtle">
          {T.upcomingSlot}
        </span>
      </div>
    );
  }

  const speedStyle = HEATMAP_SPEED_STYLES[cell.speedRating];
  const idleStyle = HEATMAP_IDLE_STYLES[cell.idleRating];

  // Active current hour highlight border
  const currentHourRing = cell.isCurrentHour ? 'ring-2 ring-rose-500/60 shadow-xs' : '';

  // Render Speed Perspective
  if (viewMode === 'speed') {
    if (cell.patientsCount === 0) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${S.cellButton} ${speedStyle.bg} ${speedStyle.border} ${currentHourRing}`}
          title={`${cell.timeSlotLabel}: 0 consultations recorded`}
        >
          <span className="font-mono text-xs font-bold text-content-subtle">—</span>
          <span className="text-[10px] text-content-subtle mt-0.5">{T.noPatients}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${S.cellButton} ${speedStyle.bg} ${speedStyle.border} ${currentHourRing}`}
        title={`${cell.timeSlotLabel}: ${cell.avgSpeedMinutes}m avg speed (${cell.patientsCount} ${
          cell.patientsCount > 1 ? T.ptsUnit : T.ptUnit
        })`}
      >
        <span className={`${S.cellPrimaryValue} ${speedStyle.text}`}>
          {cell.avgSpeedMinutes}
          <span className="text-[10px] font-normal">{T.minsUnit}</span>
        </span>
        <span className={S.cellSecondaryValue}>
          {cell.patientsCount} {cell.patientsCount > 1 ? T.ptsUnit : T.ptUnit}
        </span>
        <span className={`${S.cellBadge} ${speedStyle.badge}`}>
          {cell.speedRating}
        </span>
      </button>
    );
  }

  // Render Idle Perspective
  if (viewMode === 'idle') {
    if (cell.patientsCount === 0) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${S.cellButton} ${idleStyle.bg} ${idleStyle.border} ${currentHourRing}`}
          title={`${cell.timeSlotLabel}: 60m idle downtime`}
        >
          <span className="font-mono text-xs font-bold text-content-subtle">
            60{T.minsUnit}
          </span>
          <span className="text-[10px] text-content-subtle mt-0.5">{T.idleUnit}</span>
          <span className={`${S.cellBadge} ${idleStyle.badge}`}>{T.noPatients}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${S.cellButton} ${idleStyle.bg} ${idleStyle.border} ${currentHourRing}`}
        title={`${cell.timeSlotLabel}: ${cell.idleMinutes}m idle (${cell.occupancyPercent}% occupancy)`}
      >
        <span className={`${S.cellPrimaryValue} ${idleStyle.text}`}>
          {cell.idleMinutes}
          <span className="text-[10px] font-normal">{T.minsUnit}</span>
        </span>
        <span className={S.cellSecondaryValue}>
          {cell.occupancyPercent}% {T.activeUnit}
        </span>
        <span className={`${S.cellBadge} ${idleStyle.badge}`}>
          {cell.idleRating}
        </span>
      </button>
    );
  }

  // Render Dual Perspective (Combined view)
  const dualBg =
    cell.patientsCount > 0 ? speedStyle.bg : idleStyle.bg;
  const dualBorder =
    cell.patientsCount > 0 ? speedStyle.border : idleStyle.border;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${S.cellButton} ${dualBg} ${dualBorder} ${currentHourRing}`}
      title={`${cell.timeSlotLabel}: ${cell.avgSpeedMinutes}m avg speed, ${cell.idleMinutes}m idle`}
    >
      {cell.patientsCount === 0 ? (
        <>
          <span className="font-mono text-xs font-bold text-content-subtle">60m {T.idleUnit}</span>
          <span className="text-[10px] text-content-subtle mt-0.5">{T.noPatients}</span>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 font-mono text-xs font-extrabold leading-tight">
            <span className={`h-1.5 w-1.5 rounded-full ${speedStyle.dot}`} />
            <span className={speedStyle.text}>
              {cell.avgSpeedMinutes}
              {T.minsUnit}
            </span>
          </div>
          <span className="font-mono text-[10px] text-content-muted leading-tight mt-0.5">
            {cell.idleMinutes}m {T.idleUnit} ({cell.patientsCount}p)
          </span>
        </>
      )}
    </button>
  );
}
