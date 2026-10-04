/**
 * @fileoverview Volume and wait-time charts component for the Analytics dashboard page.
 *
 * Renders daily patient volume with 7-day trailing moving average,
 * hourly arrival pattern curves, and stage-by-stage wait time trends.
 * Supports interactive chart drill-down on dates and bars to inspect
 * that day's granular hourly arrivals and queue bottleneck breakdown.
 *
 * @module app/dashboard/pages/analytics/components/VolumeAndWaitCharts
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
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import {
  ANALYTICS_STYLES,
  STAGE_LINES,
  DRILLDOWN_CHART_COLORS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import { useDailyDrilldown } from '@/app/dashboard/pages/analytics/hooks/useDailyDrilldown';
import DailyDrillDownDetail from '@/app/dashboard/pages/analytics/components/DailyDrillDownDetail';
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';

interface VolumeAndWaitChartsProps {
  /** Array of daily summary logs. */
  dailySummary: any[];
  /** Array of hourly pattern intake points. */
  hourlyPattern: any[];
}

/**
 * Adds a trailing N-day moving average alongside the raw daily volume.
 *
 * @param data - Array of daily records.
 * @param windowSize - Rolling window day count.
 * @returns Array of daily records enriched with moving_avg.
 */
function withMovingAverage(data: any[], windowSize: number) {
  return data.map((row, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = data.slice(start, i + 1);
    const avg =
      windowSlice.reduce((sum, r) => sum + (r.total_patients || 0), 0) / windowSlice.length;
    return { ...row, moving_avg: Math.round(avg * 10) / 10 };
  });
}

/**
 * Multi-chart section displaying volume history, hourly patterns, and wait time curves.
 * Allows interactive drill-down on any date or bar across timeline charts.
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

  const {
    selectedDate,
    drilldownData,
    loading: drilldownLoading,
    error: drilldownError,
    selectDate,
    clearSelectedDate,
    retry,
  } = useDailyDrilldown();

  // Normalize daily records to ensure date / visit_date consistency
  const enrichedDaily = useMemo(() => {
    const normalized = (dailySummary || []).map((row) => {
      const dateVal = row.date || row.visit_date || '';
      return {
        ...row,
        date: dateVal,
        visit_date: dateVal,
      };
    });
    return withMovingAverage(normalized, 7);
  }, [dailySummary]);

  // Extract fallback summary from daily records if drilldown is still loading
  const fallbackSummary = useMemo(() => {
    if (!selectedDate) return undefined;
    const match = enrichedDaily.find(
      (d) => (d.date || d.visit_date) === selectedDate,
    );
    if (!match) return undefined;
    return {
      total_patients: match.total_patients,
      avg_total_time: match.avg_total_time,
      avg_wait_registration: match.avg_wait_registration,
      avg_wait_consultation: match.avg_wait_consultation,
    };
  }, [selectedDate, enrichedDaily]);

  // Merge hourly distribution data when a date is selected for comparison
  const activeHourlyData = useMemo(() => {
    const baseHourly = hourlyPattern || [];
    if (!selectedDate || !drilldownData?.hourly_pattern || drilldownData.hourly_pattern.length === 0) {
      return baseHourly.map((hp) => ({
        ...hp,
        avg_patients: hp.avg_patients ?? 0,
        selected_day_patients: undefined,
      }));
    }

    const drilldownMap = new Map<number, number>();
    for (const point of drilldownData.hourly_pattern) {
      drilldownMap.set(point.hour, point.avg_patients);
    }

    return baseHourly.map((hp) => {
      const dayIntake = drilldownMap.get(hp.hour) ?? 0;
      return {
        ...hp,
        selected_day_patients: dayIntake,
      };
    });
  }, [selectedDate, drilldownData, hourlyPattern]);

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

  /** Handles date selection from any timeline chart. */
  const handleDateSelect = (dateStr?: string) => {
    if (!dateStr) return;
    selectDate(dateStr);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Interactive Drill-Down Tip / Notice */}
      {!selectedDate && (
        <div className={ANALYTICS_STYLES.drilldown.hintBanner}>
          <div className={ANALYTICS_STYLES.drilldown.hintContent}>
            <i className={`bx bx-mouse-alt ${ANALYTICS_STYLES.drilldown.hintIcon}`} />
            <span>{T.clickHint}</span>
          </div>
        </div>
      )}

      {/* Top 2 Charts: Daily Volume & Hourly Arrival */}
      <div className={ANALYTICS_STYLES.chartGrid}>
        {/* 1. Daily Volume Chart */}
        <DashboardCard
          title={T.dailyVolumeTitle}
          subtitle={
            selectedDate
              ? `${T.dailyVolumeSubtitle} (Selected: ${selectedDate})`
              : T.dailyVolumeSubtitle
          }
          icon="bx-bar-chart-alt-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={enrichedDaily}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const row = e.activePayload[0].payload;
                    const dateVal = row.date || row.visit_date;
                    if (dateVal) handleDateSelect(dateVal);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
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
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any, item: any) => {
                    const row = item?.payload;
                    const rowDate = row?.date || row?.visit_date;
                    const label = name === T.series.dailyPatients ? `${val} ${T.patientsUnit}` : val;
                    return [
                      label,
                      rowDate === selectedDate
                        ? `${name} ${T.activeSelectionSuffix}`
                        : `${name} — ${T.chartClickTooltip} ${rowDate}`,
                    ];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="total_patients"
                  name={T.series.dailyPatients}
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => {
                    const dateVal = data?.date || data?.visit_date;
                    if (dateVal) handleDateSelect(dateVal);
                  }}
                >
                  {enrichedDaily.map((entry) => {
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
                        stroke={isSelected ? DRILLDOWN_CHART_COLORS.barSelectedStroke : undefined}
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
                  strokeDasharray="4 4"
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
        </DashboardCard>

        {/* 2. Hourly Arrival Pattern Chart */}
        <DashboardCard
          title={T.hourlyPatternTitle}
          subtitle={
            selectedDate
              ? `${T.hourlyDrilldownSubtitle} (${selectedDate})`
              : T.hourlyPatternSubtitle
          }
          icon="bx-time-five"
        >
          {selectedDate && (
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className={ANALYTICS_STYLES.drilldown.activeSelectionBadge}>
                <i className="bx bx-calendar text-xs" />
                <span>{T.drillDownBadgePrefix} {selectedDate}</span>
              </span>
              <button
                type="button"
                onClick={clearSelectedDate}
                className={ANALYTICS_STYLES.drilldown.clearSelectedBtn}
              >
                <i className="bx bx-reset text-xs" />
                <span>{T.resetButton}</span>
              </button>
            </div>
          )}

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={activeHourlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
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

                {/* When drilldown is active, show the selected day's actual intake */}
                {selectedDate && (
                  <Line
                    type="monotone"
                    dataKey="selected_day_patients"
                    name={`${T.series.selectedDayPatients} (${selectedDate})`}
                    stroke={DRILLDOWN_CHART_COLORS.hourlyDayIntake}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: DRILLDOWN_CHART_COLORS.hourlyDayIntake }}
                  />
                )}

                {/* Base range average benchmark curve */}
                <Line
                  type="monotone"
                  dataKey="avg_patients"
                  name={selectedDate ? T.series.rangeAverage : T.series.avgPatients}
                  stroke={DRILLDOWN_CHART_COLORS.hourlyRangeAvg}
                  strokeWidth={selectedDate ? 1.5 : 2.5}
                  strokeDasharray={selectedDate ? '3 3' : undefined}
                  dot={
                    selectedDate
                      ? false
                      : { r: 3, fill: DRILLDOWN_CHART_COLORS.hourlyRangeAvg }
                  }
                  strokeOpacity={selectedDate ? 0.65 : 1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* 3. Detailed Daily Drill-Down Panel (shown when a date is selected) */}
      {selectedDate && (
        <DailyDrillDownDetail
          date={selectedDate}
          drilldown={drilldownData}
          loading={drilldownLoading}
          error={drilldownError}
          onClose={clearSelectedDate}
          onRetry={retry}
          fallbackSummary={fallbackSummary}
        />
      )}

      {/* 4. Stage-by-Stage Wait Time Trends (Timeline Chart) */}
      <DashboardCard
        title={T.stageWaitTitle}
        subtitle={
          selectedDate
            ? `${T.stageWaitSubtitle} (Selected: ${selectedDate})`
            : T.stageWaitSubtitle
        }
        icon="bx-timer"
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enrichedDaily}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const row = e.activePayload[0].payload;
                  const dateVal = row.date || row.visit_date;
                  if (dateVal) handleDateSelect(dateVal);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={(d: string) => (d ? d.slice(5) : '')}
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
                formatter={(val: any, name: any, item: any) => {
                  const row = item?.payload;
                  const rowDate = row?.date || row?.visit_date;
                  const durationStr =
                    typeof val === 'number' ? formatMinutesToHMS(val) : '—';
                  return [
                    durationStr,
                    rowDate === selectedDate
                      ? `${name} ${T.activeSelectionSuffix}`
                      : `${name} — ${T.chartClickTooltip} ${rowDate}`,
                  ];
                }}
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
              {selectedDate && (
                <ReferenceLine
                  x={selectedDate}
                  stroke={DRILLDOWN_CHART_COLORS.referenceLine}
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: selectedDate.slice(5),
                    fill: axisColor,
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>
    </div>
  );
}
