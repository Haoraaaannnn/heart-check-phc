/**
 * @fileoverview Branching examination station bays section extending directly from the
 * Stage 3 Clinical Examination node on the interactive pipeline map.
 *
 * Implements a connected visual pod layout rendering individual room bays with physician
 * assignments, active consultation speed evaluations, and idle turnaround intervals.
 *
 * @module app/dashboard/pages/cubicles/components/BranchingStationBays
 */

'use client';

import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { FlowchartCubicleStation } from '@/app/dashboard/pages/cubicles/types/cubicle';
import StationBayCard from '@/app/dashboard/pages/cubicles/components/StationBayCard';

interface BranchingStationBaysProps {
  /** Array of examination cubicle stations with live telemetry. */
  stations: FlowchartCubicleStation[];
  /** Callback triggered when user clicks a station bay for detailed inspection. */
  onSelectStation: (station: FlowchartCubicleStation) => void;
}

/**
 * Direct branching bays container displaying room stations extending out of the Examination hub.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function BranchingStationBays({
  stations,
  onSelectStation,
}: BranchingStationBaysProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.map;

  const occupiedCount = stations.filter((s) => s.status === 'occupied').length;
  const availableCount = stations.filter((s) => s.status === 'available').length;

  return (
    <div className={S.branchingBaysSection}>
      {/* Branching Header */}
      <div className={S.branchingHeader}>
        <div className={S.branchingTitleWrap}>
          <div className={S.branchingIcon}>
            <i className="bx bx-git-branch" />
          </div>
          <div>
            <h4 className={S.branchingTitle}>{T.branchingTitle}</h4>
            <p className={S.branchingSubtitle}>{T.branchingSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{occupiedCount} Occupied</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{availableCount} Available</span>
          </span>
        </div>
      </div>

      {/* Grid of Branching Cubicle Station Pods */}
      <div className={S.branchingGrid}>
        {stations.map((station) => (
          <StationBayCard
            key={station.id}
            station={station}
            onClick={() => onSelectStation(station)}
          />
        ))}
      </div>
    </div>
  );
}
