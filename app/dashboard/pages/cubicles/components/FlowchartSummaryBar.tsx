/**
 * @fileoverview Summary KPI telemetry bar for the Outpatient Cubicle Pipeline Flowchart.
 *
 * Displays aggregated facility metrics across the live pipeline including total active patients,
 * mean processing speed, average idle turnaround downtime, and cubicle utilization rate.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartSummaryBar
 */

'use client';

import { TONES } from '@/app/dashboard/constants/styles';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { FlowchartPipelineKpis } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface FlowchartSummaryBarProps {
  /** Facility performance metrics across the active queue pipeline. */
  kpis: FlowchartPipelineKpis;
  /** Current live clock timestamp. */
  currentTime: Date;
  /** Callback to trigger manual data refresh. */
  onRefresh: () => void;
  /** Loading state indicator. */
  isLoading: boolean;
}

/**
 * Top summary bar highlighting overall flow metrics and operational efficiency.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function FlowchartSummaryBar({
  kpis,
  currentTime,
  onRefresh,
  isLoading,
}: FlowchartSummaryBarProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.kpis;

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const items = [
    {
      key: 'inPipeline',
      label: T.inPipeline,
      value: `${kpis.totalInPipeline} pts`,
      subtext: `${kpis.waitingCount} waiting, ${kpis.activeExamCount} in exam`,
      icon: 'bx-git-merge',
      tone: TONES.blue,
    },
    {
      key: 'meanSpeed',
      label: T.meanSpeed,
      value: `${kpis.facilityAvgSpeedMinutes}m`,
      subtext: T.meanSpeedSub,
      icon: 'bx-tachometer',
      tone: TONES.green,
    },
    {
      key: 'meanIdle',
      label: T.meanIdle,
      value: `${kpis.facilityAvgIdleMinutes}m`,
      subtext: `${kpis.idleCubiclesCount} rooms available`,
      icon: 'bx-time-five',
      tone: TONES.purple,
    },
    {
      key: 'utilization',
      label: T.utilization,
      value: `${kpis.facilityUtilizationPercent}%`,
      subtext: `${kpis.activeExamCount} / ${kpis.totalCubiclesCount} rooms active`,
      icon: 'bx-pie-chart-alt-2',
      tone: TONES.rose,
    },
  ];

  return (
    <div className={S.summaryBar}>
      <div className={S.summaryPillGroup}>
        {items.map((item) => (
          <div key={item.key} className={S.summaryPill}>
            <div className={`${S.summaryIconWrap} ${item.tone.icon}`}>
              <i className={`bx ${item.icon}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={S.summaryLabel}>{item.label}</span>
              <span className={S.summaryValue}>{item.value}</span>
              <span className={S.summarySubtext}>{item.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Live Synchronization Chip */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">{T.liveSync}</span>
          <span className="font-mono text-content-muted">({formattedTime})</span>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh flowchart telemetry"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-content-muted hover:text-content hover:bg-surface-subtle transition disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <i className={`bx bx-refresh text-lg ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
