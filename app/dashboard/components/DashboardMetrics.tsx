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
 * @returns Trend object, or null if baseline is invalid or zero.
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
}: DashboardMetricsProps) {
  const rangeConfig = METRIC_RANGE_CONFIG[range] ?? METRIC_RANGE_CONFIG.today;
  const baseline = comparisonCount !== undefined ? comparisonCount : (yesterdayCount ?? null);
  const trendText = comparisonLabel ?? rangeConfig.trendLabel ?? TREND_LABEL;

  const values: Record<MetricKey, string | number> = {
    todayCount: stats.todayCount,
    onQueue: stats.onQueue,
    served: stats.served,
    avgWait: avgWaitTime,
  };

  return (
    <div className={DASH.layout.metricGrid}>
      {METRIC_CARDS.map((metric) => {
        const tone = TONES[metric.tone];
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

            <div>
              <p className={S.label}>{cardLabel}</p>
              <p className={S.value}>
                {value}
                {showUnit && <span className={S.unit}>{metric.unit}</span>}
              </p>

              {trend ? (
                <p className={trend.up ? S.trendUp : S.trendDown}>
                  <i className={`bx ${trend.up ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`} />
                  {trend.percent}%
                  <span className={S.trendLabel}>{trendText}</span>
                </p>
              ) : (
                cardSubtitle && <p className={S.subtitle}>{cardSubtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}