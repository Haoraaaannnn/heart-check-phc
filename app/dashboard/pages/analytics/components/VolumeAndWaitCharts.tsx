/**
 * @fileoverview Volume and wait-time charts component for the Analytics dashboard page.
 *
 * Renders daily patient volume with 7-day trailing moving average,
 * hourly arrival pattern curves, and stage-by-stage wait time trends.
 *
 * @module app/dashboard/pages/analytics/components/VolumeAndWaitCharts
 */

'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import {
  ANALYTICS_STYLES,
  STAGE_LINES,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface VolumeAndWaitChartsProps {
  /** Array of daily summary logs. */
  dailySummary: any[];
  /** Array of hourly pattern intake points. */
  hourlyPattern: any[];
}

/** Adds trailing N-day moving average. */
function withMovingAverage(data: any[], windowSize: number) {
  return data.map((row, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = data.slice(start, i + 1);
    const avg =
      windowSlice.reduce((sum, r) => sum + (r.total_patients || 0), 0) / windowSlice.length;
    return { ...row, moving_avg: Math.round(avg * 10) / 10 };
  });
}

/** Formats minutes to H:MM:SS. */
function formatMinutesToHMS(totalMinutes: number | undefined | null): string {
  if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes)) {
    return '—';
  }
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Multi-chart section displaying volume history and wait time curves.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function VolumeAndWaitCharts({
  dailySummary,
  hourlyPattern,
}: VolumeAndWaitChartsProps) {
  const { isDark } = useDashboardTheme();
  const T = ANALYTICS_TEXTS.volumeCharts;

  const enrichedDaily = withMovingAverage(dailySummary, 7);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface, #ffffff)',
    borderColor: 'var(--color-line, #e5e7eb)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    color: 'var(--color-content, #1f2937)',
    fontSize: '12px',
    fontWeight: 600,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={ANALYTICS_STYLES.chartGrid}>
        {/* 1. Daily Volume Chart */}
        <DashboardCard
          title={T.dailyVolumeTitle}
          subtitle={T.dailyVolumeSubtitle}
          icon="bx-bar-chart-alt-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedDaily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: axisColor }}
                  tickFormatter={(d: string) => d.slice(5)}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="total_patients"
                  name={T.series.dailyPatients}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="moving_avg"
                  name={T.series.movingAvg}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* 2. Hourly Arrival Pattern Chart */}
        <DashboardCard
          title={T.hourlyPatternTitle}
          subtitle={T.hourlyPatternSubtitle}
          icon="bx-time-five"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyPattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="time_label"
                  tick={{ fontSize: 10, fill: axisColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="avg_patients"
                  name={T.series.avgPatients}
                  stroke="#cc3535"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#cc3535' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* 3. Stage-by-Stage Wait Time Trends */}
      <DashboardCard
        title={T.stageWaitTitle}
        subtitle={T.stageWaitSubtitle}
        icon="bx-timer"
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailySummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={(mins: number) => `${Math.round(mins)}m`}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: any, name: any) => [
                  typeof val === 'number' ? formatMinutesToHMS(val) : '—',
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {STAGE_LINES.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>
    </div>
  );
}
