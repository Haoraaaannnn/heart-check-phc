/**
 * @fileoverview Hourly process and arrival distribution chart card.
 *
 * Supports three complementary views (Patients by Stage, Wait Times by Stage,
 * Overall Intake) with plain-English mode explanations, daily-average vs.
 * single-day comparison, and threshold reference markers.
 *
 * @module app/dashboard/pages/analytics/components/HourlyPatternChartCard
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
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
  HOURLY_STAGE_COLORS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import { formatMinutesToHM, formatDurationString } from '@/utils/formatMinutesToHMS';

export type HourlyViewMode = 'volume' | 'waittime' | 'intake';

export interface HourlyChartPoint {
  hour: number;
  time_label: string;
  avg_patients: number;
  selected_day_patients?: number;
  kiosk_patients?: number;
  reg_patients: number;
  consult_patients: number;
  carryout_patients: number;
  avg_wait_registration?: number;
  avg_service_registration?: number;
  avg_wait_consultation?: number;
  avg_service_consultation?: number;
  avg_service_carryout?: number;
}

interface HourlyPatternChartCardProps {
  /** Processed hourly chart data points. */
  data: HourlyChartPoint[];
  /** Selected drill-down date, or null. */
  selectedDate: string | null;
  /** Whether records lack kiosk ticketing data. */
  isHistorical: boolean;
  /** Whether kiosk counts exist in the active dataset. */
  hasKioskData: boolean;
  /** Axis label color. */
  axisColor: string;
  /** Grid line color. */
  gridColor: string;
  /** Tooltip base inline styles. */
  tooltipStyle: Record<string, string | number>;
  /** Callback to clear selected date drill-down. */
  onClearSelectedDate: () => void;
}

/** Formats "08:00–09:00" into a compact axis label like "8 AM" or "1 PM". */
function formatHourAxis(timeLabel: string): string {
  if (!timeLabel) return '';
  const h = parseInt(timeLabel.split(':')[0], 10);
  if (isNaN(h)) return timeLabel;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const MODE_BUTTONS: ReadonlyArray<{ mode: HourlyViewMode; icon: string }> = [
  { mode: 'volume', icon: 'bx-group' },
  { mode: 'waittime', icon: 'bx-timer' },
  { mode: 'intake', icon: 'bx-line-chart' },
];

/**
 * Renders the Hourly Process & Arrival Distribution chart card.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HourlyPatternChartCard({
  data,
  selectedDate,
  isHistorical,
  hasKioskData,
  axisColor,
  gridColor,
  tooltipStyle,
  onClearSelectedDate,
}: HourlyPatternChartCardProps) {
  const T = ANALYTICS_TEXTS.volumeCharts;
  const HT = ANALYTICS_STYLES.hourlyToggle;
  const [hourlyMode, setHourlyMode] = useState<HourlyViewMode>('volume');

  const explainerSummary = useMemo(() => {
    if (hourlyMode === 'volume') {
      return selectedDate ? T.hourlyExplainer.volumeDay : T.hourlyExplainer.volumeRange;
    }
    if (hourlyMode === 'waittime') {
      return T.hourlyExplainer.waittime;
    }
    return selectedDate ? T.hourlyExplainer.intakeDay : T.hourlyExplainer.intakeRange;
  }, [hourlyMode, selectedDate, T.hourlyExplainer]);

  const showElevatedWaitLine = useMemo(() => {
    if (hourlyMode !== 'waittime') return false;
    return data.some((pt) =>
      [pt.avg_wait_registration, pt.avg_service_registration, pt.avg_wait_consultation, pt.avg_service_consultation, pt.avg_service_carryout].some(
        (v) => (v ?? 0) >= 20
      )
    );
  }, [hourlyMode, data]);

  const volumeSeries = useMemo(
    () => [
      ...(hasKioskData
        ? [{ key: 'kiosk_patients', name: T.series.kioskPatients, color: HOURLY_STAGE_COLORS.kiosk, connectNulls: false }]
        : []),
      { key: 'reg_patients', name: T.series.regPatients, color: HOURLY_STAGE_COLORS.registration, connectNulls: true },
      { key: 'consult_patients', name: T.series.withDoctorPatients, color: HOURLY_STAGE_COLORS.withDoctor, connectNulls: true },
      { key: 'carryout_patients', name: T.series.carryoutPatients, color: HOURLY_STAGE_COLORS.carryout, connectNulls: true },
    ],
    [hasKioskData, T.series]
  );

  const waitSeries = useMemo(
    () => [
      ...(hasKioskData
        ? [{ key: 'avg_wait_registration', name: T.series.waitReg, color: HOURLY_STAGE_COLORS.kiosk }]
        : []),
      { key: 'avg_service_registration', name: T.series.servReg, color: HOURLY_STAGE_COLORS.registration },
      { key: 'avg_wait_consultation', name: T.series.waitConsult, color: HOURLY_STAGE_COLORS.waitDoctor },
      { key: 'avg_service_consultation', name: T.series.servConsult, color: HOURLY_STAGE_COLORS.withDoctor },
      { key: 'avg_service_carryout', name: T.series.servCarry, color: HOURLY_STAGE_COLORS.carryout },
    ],
    [hasKioskData, T.series]
  );

  return (
    <DashboardCard
      title={T.hourlyPatternTitle}
      subtitle={
        selectedDate ? `${T.hourlyDrilldownSubtitle} (${selectedDate})` : T.hourlyPatternSubtitle
      }
      icon="bx-time-five"
    >
      <div className="flex flex-col gap-3.5">
        <AnalyticsExplainer summary={explainerSummary} details={T.hourlyExplainer.details} />

        {/* Mode Switcher & Drill-down Reset */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div className={HT.container}>
            {MODE_BUTTONS.map(({ mode, icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setHourlyMode(mode)}
                className={`${HT.btnBase} ${hourlyMode === mode ? HT.btnActive : HT.btnIdle}`}
              >
                <i className={`bx ${icon} text-xs`} />
                <span>{T.modes[mode]}</span>
              </button>
            ))}
          </div>

          {selectedDate && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-[#242424] dark:text-[#f5f5f5] px-2.5 py-1 font-bold border border-slate-200 dark:border-[#2e2e2e]">
                <i className="bx bx-calendar text-xs" />
                <span>Drill-Down: {selectedDate}</span>
              </span>
              <button
                type="button"
                onClick={onClearSelectedDate}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-content-muted hover:text-content transition cursor-pointer underline"
              >
                <i className="bx bx-reset text-xs" />
                <span>{T.resetButton}</span>
              </button>
            </div>
          )}
        </div>

        {selectedDate && (isHistorical || !hasKioskData) && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50/80 px-3 py-1.5 text-[11px] font-medium text-amber-800 border border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40">
            <i className="bx bx-info-circle text-sm shrink-0" />
            <span>{T.historicalNotice}</span>
          </div>
        )}

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="hourlyIntakeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={HOURLY_STAGE_COLORS.benchmark} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={HOURLY_STAGE_COLORS.benchmark} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="time_label" tickFormatter={formatHourAxis} tick={{ fontSize: 10, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
              <YAxis
                allowDecimals={hourlyMode === 'waittime'}
                tick={{ fontSize: 10, fill: axisColor }}
                tickFormatter={hourlyMode === 'waittime' ? (mins: number) => formatMinutesToHM(mins) : (pts: number) => `${pts}`}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label) => `Clinic Hour: ${String(label ?? '')}`}
                formatter={(val, name) => {
                  const labelName = String(name ?? '');
                  if (val === undefined || val === null) return ['N/A', labelName];
                  if (hourlyMode === 'waittime') {
                    return [
                      formatDurationString(
                        typeof val === 'number' || typeof val === 'string' ? val : String(val)
                      ),
                      labelName,
                    ];
                  }
                  const unitSuffix = selectedDate ? 'patients' : 'patients / day avg';
                  return [`${val} ${unitSuffix}`, labelName];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {hourlyMode === 'volume' && (
                <>
                  {volumeSeries.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: s.color }}
                      connectNulls={s.connectNulls}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="avg_patients"
                    name={T.series.rangeAverage}
                    stroke={HOURLY_STAGE_COLORS.benchmark}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    strokeOpacity={0.7}
                  />
                </>
              )}

              {hourlyMode === 'waittime' && (
                <>
                  {showElevatedWaitLine && (
                    <ReferenceLine
                      y={30}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeOpacity={0.8}
                      label={{
                        value: '30m Elevated',
                        position: 'insideTopRight',
                        fill: '#d97706',
                        fontSize: 10,
                      }}
                    />
                  )}
                  {waitSeries.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: s.color }}
                      connectNulls={false}
                    />
                  ))}
                </>
              )}

              {hourlyMode === 'intake' &&
                (selectedDate ? (
                  <>
                    <Bar
                      dataKey="selected_day_patients"
                      name={`${T.series.selectedDayPatients} (${selectedDate})`}
                      fill={HOURLY_STAGE_COLORS.intake}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_patients"
                      name={T.series.rangeAverage}
                      stroke={HOURLY_STAGE_COLORS.benchmark}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey="avg_patients"
                    name={T.series.avgPatients}
                    stroke={HOURLY_STAGE_COLORS.benchmark}
                    strokeWidth={2.5}
                    fill="url(#hourlyIntakeFill)"
                    dot={{ r: 3.5, fill: HOURLY_STAGE_COLORS.benchmark }}
                  />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
