/**
 * @fileoverview Visual legend component for interpreting the Cubicles Heatmap color scales.
 *
 * Details the performance benchmarks and color gradations for patient processing speed
 * and cubicle idle downtime intervals.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapLegend
 */

'use client';

import {
  CUBICLES_STYLES,
  HEATMAP_SPEED_STYLES,
  HEATMAP_IDLE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { HeatmapViewMode } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface HeatmapLegendProps {
  /** Active perspective view mode. */
  viewMode: HeatmapViewMode;
}

/**
 * Color scale reference panel for clinical speed thresholds and idle downtime categories.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HeatmapLegend({ viewMode }: HeatmapLegendProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap;

  const speedScale = [
    { label: T.speedRatings.fast, style: HEATMAP_SPEED_STYLES.fast },
    { label: T.speedRatings.optimal, style: HEATMAP_SPEED_STYLES.optimal },
    { label: T.speedRatings.moderate, style: HEATMAP_SPEED_STYLES.moderate },
    { label: T.speedRatings.slow, style: HEATMAP_SPEED_STYLES.slow },
    { label: T.speedRatings.inactive, style: HEATMAP_SPEED_STYLES.inactive },
  ];

  const idleScale = [
    { label: T.idleRatings.continuous, style: HEATMAP_IDLE_STYLES.continuous },
    { label: T.idleRatings.lowIdle, style: HEATMAP_IDLE_STYLES['low-idle'] },
    { label: T.idleRatings.moderateIdle, style: HEATMAP_IDLE_STYLES['moderate-idle'] },
    { label: T.idleRatings.highIdle, style: HEATMAP_IDLE_STYLES['high-idle'] },
    { label: T.idleRatings.dormant, style: HEATMAP_IDLE_STYLES.dormant },
  ];

  return (
    <div className={S.legendWrap}>
      <div className={S.legendHeader}>
        <div>
          <span className={S.legendTitle}>{T.legend.title}</span>
          <span className={`block ${S.legendSubtitle}`}>
            {viewMode === 'speed'
              ? T.legend.speedTitle
              : viewMode === 'idle'
              ? T.legend.idleTitle
              : `${T.legend.speedTitle} & ${T.legend.idleTitle}`}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          <i className="bx bx-check-double" />
          <span>{T.legend.targetBenchmark}</span>
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {(viewMode === 'speed' || viewMode === 'dual') && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
              Processing Speed:
            </span>
            <div className={S.legendScale}>
              {speedScale.map((item) => (
                <div key={item.label} className={S.legendItem}>
                  <span
                    className={`${S.legendSwatch} ${item.style.bg} ${item.style.border}`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(viewMode === 'idle' || viewMode === 'dual') && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
              Idle Downtime:
            </span>
            <div className={S.legendScale}>
              {idleScale.map((item) => (
                <div key={item.label} className={S.legendItem}>
                  <span
                    className={`${S.legendSwatch} ${item.style.bg} ${item.style.border}`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
