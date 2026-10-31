/**
 * @fileoverview Summary KPI metrics card row for the Admin Dashboard overview.
 *
 * Displays executive indicators (Total Patients, On Queue, Served, Average Waiting Time)
 * with dynamic period-adjusted labels, subtitle annotations, and historical percentage trends.
 *
 * @remarks
 * Conforms to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast solid surfaces, and zero emojis.
 *
 * @module app/dashboard/components/DashboardMetrics
 */

'use client';

import type { DashboardStats } from '@/app/dashboard/hooks/useOverviewData';
import {
  METRIC_CARDS,
  METRIC_RANGE_CONFIG,
  TREND_LABEL,
  type MetricKey,
  type OverviewDateRange,
} from '@/app/dashboard/constants/content';
import { DASH, TONES } from '@/app/dashboard/constants/styles';
import { DashboardMetricsSkeleton } from '@/app/dashboard/components/skeletons/DashboardMetricsSkeleton';

const S = DASH.metric;

/** Placeholder shown before mount or when a value is unavailable. */
const PLACEHOLDER = '--';

/**
 * Properties for the {@link DashboardMetrics} component.
 */
export interface DashboardMetricsProps {
  /** Operational counters for the active timeframe */
  stats: DashboardStats;
  /** Pre-formatted average wait duration in minutes, or '--' when unavailable */
  avgWaitTime: string;
  /**
   * Comparison count from the preceding equivalent timeframe
   * (e.g., yesterday up to same hour for 'today', prior 7d for '7d', prior month for 'mtd').
   */
  comparisonCount?: number | null;
  /** Legacy alias for comparison count maintained for backwards compatibility */
  yesterdayCount?: number | null;
  /** Contextual comparison text label (e.g. "vs. yesterday", "vs. prior 7d") */
  comparisonLabel?: string;
  /** Active timeframe filter range */
  range?: OverviewDateRange;
  /** Flag indicating whether component has completed client hydration */
  isMounted: boolean;
  /** Flag indicating whether data query is actively loading */
  isLoading?: boolean;
}

/**
 * Computed percentage change between current and previous time periods.
 */
interface Trend {
  /** Absolute percentage change */
  percent: number;
  /** True when current value is at or above the comparison baseline */
  up: boolean;
}

/**
 * Calculates percentage trend comparison between current and previous periods.
 *
 * @param current - Current period count.
 * @param previous - Previous period baseline count, or null.
 * @returns Trend trend object, or null if baseline is invalid or zero.
 */
function getTrend(current: number, previous: number | null): Trend | null {
  if (previous === null || previous <= 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(change), up: change >= 0 };
}

/**
 * Four-column executive KPI card row adhering to the enterprise solid surfaces standard.
 *
 * @param props - Component properties.
 * @returns Rendered JSX element.
 */
export default function DashboardMetrics({
  stats,
  avgWaitTime,
  comparisonCount,
  yesterdayCount,
  comparisonLabel,
  range = 'today',
  isMounted,
  isLoading = false,
}: DashboardMetricsProps) {
  if (isLoading) {
    return <DashboardMetricsSkeleton />;
  }
  const isCustomDate = range.startsWith('date:') || /^\d{4}-\d{2}-\d{2}$/.test(range);
  const customDateStr = isCustomDate ? range.replace('date:', '') : '';
  const rangeConfig =
    (METRIC_RANGE_CONFIG as Record<string, any>)[range] ?? {
      totalLabel: isCustomDate ? `Total Patients (${customDateStr})` : METRIC_RANGE_CONFIG.today.totalLabel,
      totalSubtitle: isCustomDate ? 'Registrations on selected date' : METRIC_RANGE_CONFIG.today.totalSubtitle,
      trendLabel: 'vs. prev day',
      onQueueLabel: isCustomDate ? 'Unserved at Close' : METRIC_RANGE_CONFIG.today.onQueueLabel,
      onQueueSubtitle: isCustomDate ? 'Ended day waiting' : METRIC_RANGE_CONFIG.today.onQueueSubtitle,
      servedLabel: isCustomDate ? 'Served on Date' : METRIC_RANGE_CONFIG.today.servedLabel,
      servedSubtitle: isCustomDate ? 'Completed visits on date' : METRIC_RANGE_CONFIG.today.servedSubtitle,
      avgWaitSubtitle: isCustomDate ? 'Selected date average' : METRIC_RANGE_CONFIG.today.avgWaitSubtitle,
    };
  const baseline = comparisonCount !== undefined ? comparisonCount : (yesterdayCount ?? null);
  const trendText = comparisonLabel ?? rangeConfig.trendLabel ?? TREND_LABEL;

  const values: Record<MetricKey, string | number> = {
    todayCount: stats.todayCount,
    onQueue: stats.onQueue,
    served: stats.served,
    avgWait: avgWaitTime,
  };

  const servedPercent =
    isMounted && stats.todayCount > 0
      ? Math.round((stats.served / stats.todayCount) * 100)
      : 0;

  return (
    <div className={DASH.layout.metricGrid}>
      {METRIC_CARDS.map((metric) => {
        const tone = TONES[metric.tone] ?? TONES.blue;
        const value = isMounted ? String(values[metric.key]) : PLACEHOLDER;
        const showUnit = Boolean(metric.unit) && value !== PLACEHOLDER;
        const trend =
          metric.showTrend && isMounted ? getTrend(stats.todayCount, baseline) : null;

        // Resolve dynamic range-specific label and subtitle
        let cardLabel = metric.label;
        let cardSubtitle = metric.subtitle;

        if (metric.key === 'todayCount') {
          cardLabel = rangeConfig.totalLabel;
          cardSubtitle = rangeConfig.totalSubtitle;
        } else if (metric.key === 'onQueue') {
          cardLabel = rangeConfig.onQueueLabel;
          cardSubtitle = rangeConfig.onQueueSubtitle;
        } else if (metric.key === 'served') {
          cardLabel = rangeConfig.servedLabel;
          cardSubtitle = rangeConfig.servedSubtitle;
        } else if (metric.key === 'avgWait') {
          cardSubtitle = rangeConfig.avgWaitSubtitle;
        }

        return (
          <div key={metric.key} className={`${S.tile} ${tone.tile}`}>
            <span className={`${S.iconWrap} ${tone.icon}`}>
              <i className={`bx ${metric.icon}`} />
            </span>

            <div className="flex-1 min-w-0">
              <p className={S.label}>{cardLabel}</p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={S.value}>{value}</span>
                {showUnit && <span className={S.unit}>{metric.unit}</span>}
                {metric.key === 'served' && isMounted && stats.todayCount > 0 && (
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    / {stats.todayCount}
                  </span>
                )}
              </div>

              {trend && (
                <p className={trend.up ? S.trendUp : S.trendDown}>
                  <i className={`bx ${trend.up ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`} />
                  {trend.percent}%
                  <span className={S.trendLabel}>{trendText}</span>
                </p>
              )}

              {/* Card-specific analyst ratio and operational health enrichments */}
              {metric.key === 'todayCount' && isMounted && (
                <div className={S.ratioBox}>
                  <div className={S.ratioLabel}>
                    <span>Served vs. Total:</span>
                    <span className={S.ratioValue}>
                      {stats.served} of {stats.todayCount} ({servedPercent}%)
                    </span>
                  </div>
                  <div className={S.progressTrack}>
                    <div
                      className={`${S.progressFill} bg-rose-600 dark:bg-rose-400`}
                      style={{ width: `${Math.min(servedPercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {metric.key === 'onQueue' && isMounted && (
                <div className={S.ratioBox}>
                  <div className={S.ratioLabel}>
                    <span>Workload Distribution:</span>
                    <span className="font-mono font-semibold text-content text-[10px]">
                      {stats.inService} in care
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted">
                    {stats.onQueue} waiting in active line
                  </p>
                </div>
              )}

              {metric.key === 'served' && isMounted && (
                <div className={S.ratioBox}>
                  <div className={S.ratioLabel}>
                    <span>Completion Rate:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                      {servedPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted">
                    {stats.served} out of {stats.todayCount} completed
                  </p>
                </div>
              )}

              {metric.key === 'avgWait' && isMounted && (
                <div className={S.ratioBox}>
                  <div className={S.ratioLabel}>
                    <span>PHC Target:</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                      &le; 150 min
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted">
                    {cardSubtitle || 'Active queue average'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}