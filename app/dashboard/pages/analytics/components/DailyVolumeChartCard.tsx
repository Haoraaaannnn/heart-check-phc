/**
 * @fileoverview Daily patient volume and 7-day moving average chart card.
 *
 * Visualizes daily patient intake bars alongside a 7-day trailing moving average,
 * an overall daily average reference line, a quick summary strip, and plain-English
 * explanations for non-technical users.
 *
 * @module app/dashboard/pages/analytics/components/DailyVolumeChartCard
 */

'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
import {
  ANALYTICS_STYLES,
  DRILLDOWN_CHART_COLORS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

export interface DailyVolumeRow {
  date: string;
  visit_date: string;
  total_patients: number;
  moving_avg: number;
}

interface DailyVolumeChartCardProps {
  /** Enriched daily summary records with 7-day moving average. */
  data: DailyVolumeRow[];
  /** Currently selected drill-down date (YYYY-MM-DD), or null. */
  selectedDate: string | null;
  /** Axis label hex color. */
  axisColor: string;
  /** Grid line color. */
  gridColor: string;
  /** Callback triggered when clicking a bar or date point. */
  onSelectDate: (dateStr?: string) => void;
}

interface VolumeTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DailyVolumeRow }>;
  overallAvg: number;
  selectedDate: string | null;
}

/**
 * Formats a YYYY-MM-DD string into a concise readable label (e.g. "Nov 14, 2025").
 */
function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Custom plain-English tooltip for Daily Volume chart.
 */
function DailyVolumeTooltip({ active, payload, overallAvg, selectedDate }: VolumeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const dateVal = row.date || row.visit_date;
  const diff = Math.round((row.total_patients - overallAvg) * 10) / 10;
  const isSelected = dateVal === selectedDate;

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-lg text-xs max-w-[240px]">
      <p className="font-extrabold text-content">{formatShortDate(dateVal)}</p>
      <div className="mt-1.5 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-content-muted">Total Patients:</span>
          <span className="font-mono font-bold text-content">{row.total_patients}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-content-muted">7-Day Average:</span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
            {row.moving_avg} / day
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-content-muted">vs. Overall Avg:</span>
          <span
            className={`font-mono font-semibold ${
              diff >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-content-muted'
            }`}
          >
            {diff >= 0 ? `+${diff}` : diff} patients
          </span>
        </div>
      </div>
      <p className="mt-2 pt-1.5 border-t border-line text-[11px] font-semibold text-accent">
        {isSelected ? 'Currently inspecting this day' : 'Click bar to inspect this day'}
      </p>
    </div>
  );
}

/**
 * Renders the Daily Patient Volume & 7-Day Trend chart card.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function DailyVolumeChartCard({
  data,
  selectedDate,
  axisColor,
  gridColor,
  onSelectDate,
}: DailyVolumeChartCardProps) {
  const T = ANALYTICS_TEXTS.volumeCharts;
  const S = ANALYTICS_STYLES.chartStatsStrip;

  const summary = useMemo(() => {
    if (!data || data.length === 0) {
      return { avg: 0, maxRow: null as DailyVolumeRow | null, minRow: null as DailyVolumeRow | null, count: 0 };
    }
    let total = 0;
    let maxRow = data[0];
    let minRow = data[0];
    for (const row of data) {
      const pts = row.total_patients || 0;
      total += pts;
      if (pts > (maxRow.total_patients || 0)) maxRow = row;
      if (pts < (minRow.total_patients || 0)) minRow = row;
    }
    return {
      avg: Math.round((total / data.length) * 10) / 10,
      maxRow,
      minRow,
      count: data.length,
    };
  }, [data]);

  return (
    <DashboardCard
      title={T.dailyVolumeTitle}
      subtitle={
        selectedDate
          ? `${T.dailyVolumeSubtitle} (Selected: ${selectedDate})`
          : T.dailyVolumeSubtitle
      }
      icon="bx-bar-chart-alt-2"
    >
      <div className="flex flex-col gap-4">
        <AnalyticsExplainer
          summary={T.dailyExplainer.summary}
          details={T.dailyExplainer.details}
        />

        {/* Quick Takeaway Strip */}
        {summary.count > 0 && (
          <div className={S.grid}>
            <div className={S.card}>
              <span className={S.label}>{T.dailyStats.avgPerDay}</span>
              <span className={S.value}>{summary.avg}</span>
              <span className={S.sub}>patients per clinic day</span>
            </div>
            <div className={S.card}>
              <span className={S.label}>{T.dailyStats.busiestDay}</span>
              <span className={S.value}>{summary.maxRow?.total_patients ?? 0}</span>
              <span className={S.sub}>{summary.maxRow?.date || '—'}</span>
            </div>
            <div className={S.card}>
              <span className={S.label}>{T.dailyStats.quietestDay}</span>
              <span className={S.value}>{summary.minRow?.total_patients ?? 0}</span>
              <span className={S.sub}>{summary.minRow?.date || '—'}</span>
            </div>
            <div className={S.card}>
              <span className={S.label}>{T.dailyStats.daysShown}</span>
              <span className={S.value}>{summary.count}</span>
              <span className={S.sub}>recorded clinic days</span>
            </div>
          </div>
        )}

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              onClick={(nextState) => {
                if (typeof nextState.activeLabel === 'string' && nextState.activeLabel) {
                  onSelectDate(nextState.activeLabel);
                  return;
                }
                const idx = typeof nextState.activeTooltipIndex === 'number' ? nextState.activeTooltipIndex : -1;
                const row = idx >= 0 ? data[idx] : undefined;
                const dateVal = row?.date || row?.visit_date;
                if (dateVal) onSelectDate(dateVal);
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                minTickGap={28}
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={(d: string) => (d ? d.slice(5) : '')}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: axisColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <Tooltip
                content={
                  <DailyVolumeTooltip overallAvg={summary.avg} selectedDate={selectedDate} />
                }
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {summary.avg > 0 && (
                <ReferenceLine
                  y={summary.avg}
                  stroke={DRILLDOWN_CHART_COLORS.overallAvg}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: `${T.dailyStats.overallAvgLine}: ${summary.avg}`,
                    position: 'insideTopRight',
                    fill: axisColor,
                    fontSize: 10,
                  }}
                />
              )}

              <Bar
                dataKey="total_patients"
                name={T.series.dailyPatients}
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(_barItem, index) => {
                  const row = data[index];
                  const dateVal = row?.date || row?.visit_date;
                  if (dateVal) onSelectDate(dateVal);
                }}
              >
                {data.map((entry) => {
                  const entryDate = entry.date || entry.visit_date;
                  const isSelected = entryDate === selectedDate;
                  return (
                    <Cell
                      key={`volume-bar-${entryDate}`}
                      fill={
                        isSelected
                          ? DRILLDOWN_CHART_COLORS.barActive
                          : DRILLDOWN_CHART_COLORS.barNormal
                      }
                      fillOpacity={selectedDate ? (isSelected ? 1 : 0.45) : 0.85}
                      stroke={isSelected ? '#1e40af' : undefined}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                  );
                })}
              </Bar>
              <Line
                type="monotone"
                dataKey="moving_avg"
                name={T.series.movingAvg}
                stroke={DRILLDOWN_CHART_COLORS.movingAvg}
                strokeWidth={2.5}
                dot={false}
              />
              {selectedDate && (
                <ReferenceLine
                  x={selectedDate}
                  stroke={DRILLDOWN_CHART_COLORS.referenceLine}
                  strokeDasharray="3 3"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
