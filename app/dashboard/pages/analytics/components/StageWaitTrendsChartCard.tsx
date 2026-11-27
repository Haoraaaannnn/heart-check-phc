/**
 * @fileoverview Stage-by-Stage Wait Time Trends chart card.
 *
 * Redesigned with an Individual Steps vs. Total Journey scale toggle,
 * interactive per-stage filter pills, threshold reference lines (30m, 60m, 150m),
 * and plain-English explanations so individual step delays are never squished.
 *
 * @module app/dashboard/pages/analytics/components/StageWaitTrendsChartCard
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
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
  STAGE_LINES,
  DRILLDOWN_CHART_COLORS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import { formatMinutesToHMS, formatMinutesToHM } from '@/utils/formatMinutesToHMS';

export interface StageTrendRow {
  date: string;
  visit_date: string;
  avg_wait_registration?: number | null;
  avg_service_registration?: number | null;
  avg_wait_consultation?: number | null;
  avg_service_consultation?: number | null;
  avg_service_carryout?: number | null;
  avg_total_time?: number | null;
}

interface StageWaitTrendsChartCardProps {
  /** Daily stage duration records. */
  data: StageTrendRow[];
  /** Currently selected drill-down date, or null. */
  selectedDate: string | null;
  /** Axis label hex color. */
  axisColor: string;
  /** Grid line color. */
  gridColor: string;
  /** Tooltip inline styling object. */
  tooltipStyle: Record<string, string | number>;
  /** Callback fired when clicking a date on the chart. */
  onSelectDate: (dateStr?: string) => void;
}

/**
 * Renders the Stage-by-Stage Wait Time Trends chart card with interactive stage filtering.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function StageWaitTrendsChartCard({
  data,
  selectedDate,
  axisColor,
  gridColor,
  tooltipStyle,
  onSelectDate,
}: StageWaitTrendsChartCardProps) {
  const T = ANALYTICS_TEXTS.volumeCharts;
  const F = ANALYTICS_STYLES.stageFilter;
  const HT = ANALYTICS_STYLES.hourlyToggle;

  const [includeTotalJourney, setIncludeTotalJourney] = useState(false);
  const [hiddenStages, setHiddenStages] = useState<Record<string, boolean>>({});

  const availableLines = useMemo(() => {
    return STAGE_LINES.filter((line) => (includeTotalJourney ? true : !line.isTotal));
  }, [includeTotalJourney]);

  const visibleLines = useMemo(() => {
    return availableLines.filter((line) => !hiddenStages[line.dataKey]);
  }, [availableLines, hiddenStages]);

  const toggleStage = (key: string) => {
    setHiddenStages((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetStageFilters = () => {
    setHiddenStages({});
  };

  const hasHiddenStages = availableLines.some((line) => hiddenStages[line.dataKey]);

  return (
    <DashboardCard
      title={T.stageWaitTitle}
      subtitle={
        selectedDate
          ? `${T.stageWaitSubtitle} (Selected: ${selectedDate})`
          : T.stageWaitSubtitle
      }
      icon="bx-timer"
      action={
        <div className={HT.container}>
          <button
            type="button"
            onClick={() => setIncludeTotalJourney(false)}
            className={`${HT.btnBase} ${!includeTotalJourney ? HT.btnActive : HT.btnIdle}`}
          >
            <span>{T.stageToggle.stepsOnly}</span>
          </button>
          <button
            type="button"
            onClick={() => setIncludeTotalJourney(true)}
            className={`${HT.btnBase} ${includeTotalJourney ? HT.btnActive : HT.btnIdle}`}
          >
            <span>{T.stageToggle.withTotal}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <AnalyticsExplainer
          summary={T.stageWaitExplainer.summary}
          details={T.stageWaitExplainer.details}
        />

        {/* Interactive Per-Stage Filter Pills */}
        <div className={F.bar}>
          <div className={F.pillGroup}>
            {availableLines.map((line) => {
              const isVisible = !hiddenStages[line.dataKey];
              return (
                <button
                  key={line.dataKey}
                  type="button"
                  onClick={() => toggleStage(line.dataKey)}
                  aria-pressed={isVisible}
                  className={`${F.pillBase} ${isVisible ? F.pillActive : F.pillMuted}`}
                >
                  <span className={F.dot} style={{ backgroundColor: line.color }} />
                  <span>{line.name}</span>
                </button>
              );
            })}
            {hasHiddenStages && (
              <button
                type="button"
                onClick={resetStageFilters}
                className="text-[11px] font-semibold text-accent hover:underline px-2 py-1 cursor-pointer"
              >
                {T.stageToggle.allStagesBtn}
              </button>
            )}
          </div>

          <span className="text-[11px] text-content-subtle">
            Click any stage pill to show/hide its line
          </span>
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              onClick={(e: { activePayload?: Array<{ payload?: StageTrendRow }> } | null) => {
                const row = e?.activePayload?.[0]?.payload;
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
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={(mins: number) => formatMinutesToHM(mins)}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val, name, item) => {
                  const row = item?.payload as StageTrendRow | undefined;
                  const rowDate = row?.date || row?.visit_date || '';
                  const durationStr =
                    typeof val === 'number' ? formatMinutesToHMS(val) : '—';
                  const seriesName = String(name ?? '');
                  return [
                    durationStr,
                    rowDate === selectedDate
                      ? `${seriesName} (Active Selection)`
                      : `${seriesName} — ${T.chartClickTooltip} ${rowDate}`,
                  ];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {!includeTotalJourney ? (
                <>
                  <ReferenceLine
                    y={30}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: '30m Elevated',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeOpacity={0.65}
                    label={{
                      value: '60m Exceeded',
                      position: 'insideTopRight',
                      fill: '#dc2626',
                      fontSize: 10,
                    }}
                  />
                </>
              ) : (
                <ReferenceLine
                  y={150}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeOpacity={0.75}
                  label={{
                    value: '150m PHC Target',
                    position: 'insideTopRight',
                    fill: '#2563eb',
                    fontSize: 10,
                  }}
                />
              )}

              {visibleLines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={line.isTotal ? 2.5 : 2}
                  dot={false}
                  connectNulls={false}
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
      </div>
    </DashboardCard>
  );
}
