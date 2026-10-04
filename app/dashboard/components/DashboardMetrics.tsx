import type { DashboardStats } from '@/app/dashboard/hooks/useOverviewData';
import {
  METRIC_CARDS,
  TREND_LABEL,
  type MetricKey,
} from '@/app/dashboard/constants/content';
import { DASH, TONES } from '@/app/dashboard/constants/styles';

const S = DASH.metric;

/** Placeholder shown before mount / when a value is unavailable. */
const PLACEHOLDER = '--';

interface DashboardMetricsProps {
  stats: DashboardStats;
  /** Pre-formatted average wait in minutes, or '--' when there is no data. */
  avgWaitTime: string;
  /** Tickets created yesterday up to the same time of day; null while loading. */
  yesterdayCount: number | null;
  isMounted: boolean;
}

interface Trend {
  /** Absolute percentage change. */
  percent: number;
  /** True when today is at or above yesterday. */
  up: boolean;
}

/**
 * Percentage change of `current` versus `previous`.
 * Returns null when there is no usable baseline (still loading, or zero).
 */
function getTrend(current: number, previous: number | null): Trend | null {
  if (previous === null || previous <= 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(change), up: change >= 0 };
}

/**
 * Row of four summary cards (total, on queue, served, average wait).
 * What each card shows (label, icon, tone, unit, trend) is defined in
 * METRIC_CARDS (constants/content.ts).
 */
export default function DashboardMetrics({
  stats,
  avgWaitTime,
  yesterdayCount,
  isMounted,
}: DashboardMetricsProps) {
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
          metric.showTrend && isMounted ? getTrend(stats.todayCount, yesterdayCount) : null;

        return (
          <div key={metric.key} className={`${S.tile} ${tone.tile}`}>
            <span className={`${S.iconWrap} ${tone.icon}`}>
              <i className={`bx ${metric.icon}`} />
            </span>

            <div>
              <p className={S.label}>{metric.label}</p>
              <p className={S.value}>
                {value}
                {showUnit && <span className={S.unit}>{metric.unit}</span>}
              </p>

              {trend ? (
                <p className={trend.up ? S.trendUp : S.trendDown}>
                  <i className={`bx ${trend.up ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`} />
                  {trend.percent}%
                  <span className={S.trendLabel}>{TREND_LABEL}</span>
                </p>
              ) : (
                metric.subtitle && <p className={S.subtitle}>{metric.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}