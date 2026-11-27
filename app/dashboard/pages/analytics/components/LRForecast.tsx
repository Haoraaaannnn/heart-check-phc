/**
 * @fileoverview Linear Regression Forecast component for the Analytics dashboard page.
 *
 * Charts historical registration points against the calculated linear regression line,
 * highlighting the next-day point forecast, plain-English interpretations of slope and R²,
 * chart legend, custom tooltip, and algorithm comparison table.
 *
 * @module app/dashboard/pages/analytics/components/LRForecast
 */

'use client';

import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import AlgorithmComparisonTable, {
  type AlgorithmMetricEntry,
} from '@/app/dashboard/pages/analytics/components/AlgorithmComparisonTable';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface LRRawData {
  labels?: string[];
  actual?: number[];
  lr_line?: number[];
  trend?: string;
  slope?: number;
  r2?: number;
  r_squared?: number;
  forecast_date?: string;
  forecast_value?: number;
}

interface LRChartPoint {
  date?: string;
  actual?: number | null;
  lr_line?: number;
  forecast?: number;
}

interface ComputationalForecastingData {
  evaluation_metrics?: Record<string, AlgorithmMetricEntry>;
  best_algorithm?: string;
  algorithmic_conclusion?: string;
  next_day_forecast?: number;
}

interface LRForecastProps {
  /** Raw linear regression stats from the backend. */
  lrRaw: LRRawData;
  /** Processed chart coordinates for scatter and regression lines. */
  lrChartData: LRChartPoint[];
  /** Color string representing trend (e.g. rising/falling). */
  trendColor: string;
  /** Background color string representing trend. */
  trendBg: string;
  /** Computational forecasting summary object. */
  computationalForecasting?: ComputationalForecastingData;
  /** AIC value for ARIMA comparison. */
  arimaAic: number | null;
}

interface LRTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: LRChartPoint }>;
  forecastDate?: string;
}

/**
 * Custom plain-English tooltip for the Linear Regression chart.
 */
function LRChartTooltip({ active, payload, forecastDate }: LRTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const isForecastPoint = Boolean(forecastDate && row.date === forecastDate);

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-lg text-xs">
      <p className="font-extrabold text-content">
        {row.date || '—'} {isForecastPoint ? '(Tomorrow Forecast)' : ''}
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {row.actual !== null && row.actual !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-content-muted">Actual Patients:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {row.actual}
            </span>
          </div>
        )}
        {typeof row.lr_line === 'number' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-content-muted">
              {isForecastPoint ? '5-Day Trend Forecast:' : 'Overall Trend Line:'}
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {row.lr_line} patients
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Translates raw R² into a plain-English fit label.
 */
function describeR2Fit(r2: number | undefined): string {
  if (r2 === undefined || isNaN(r2)) return 'Not enough data';
  const pct = Math.round(r2 * 100);
  if (r2 >= 0.6) return `${pct}% fit — steady straight-line trend`;
  if (r2 >= 0.25) return `${pct}% fit — moderate trend with daily swings`;
  return `${pct}% fit — high day-to-day variation (not a straight line)`;
}

/**
 * Translates raw slope into an everyday patients-per-day description.
 */
function describeSlope(slope: number | undefined, trend: string | undefined): string {
  if (slope === undefined || isNaN(slope)) return 'Steady';
  const rounded = slope.toFixed(2);
  if (Math.abs(slope) < 0.05 || trend === 'stable') {
    return `Flat (${rounded} patients/day) — roughly steady overall`;
  }
  const direction = slope > 0 ? 'Rising' : 'Dropping';
  const sign = slope > 0 ? '+' : '';
  return `${direction} (${sign}${rounded} patients/clinic day on average)`;
}

/**
 * Linear Regression forecasting chart and evaluation breakdown wrapped in DashboardCard.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function LRForecast({
  lrRaw,
  lrChartData,
  trendColor,
  trendBg,
  computationalForecasting,
  arimaAic,
}: LRForecastProps) {
  const { isDark } = useDashboardTheme();
  const T = ANALYTICS_TEXTS.forecasts.lr;
  const G = ANALYTICS_STYLES.forecastGuide;

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const r2Value = lrRaw?.r2 ?? lrRaw?.r_squared;
  const r2Display =
    typeof r2Value === 'number'
      ? r2Value.toFixed(2)
      : r2Value !== undefined && r2Value !== null
      ? String(r2Value)
      : '—';

  const slopeDisplay =
    typeof lrRaw?.slope === 'number' ? `${lrRaw.slope.toFixed(2)}` : null;

  const trendBadge = (
    <div className="flex items-center gap-3">
      {lrRaw?.trend && (
        <span
          className="rounded-md px-2.5 py-0.5 text-xs font-bold uppercase"
          style={{ background: trendBg, color: trendColor }}
        >
          {lrRaw.trend}
        </span>
      )}
      {slopeDisplay && (
        <span className="text-xs font-semibold text-content-muted hidden sm:inline">
          slope: <span className="font-mono font-bold text-content">{slopeDisplay}</span>
        </span>
      )}
      <span className="text-xs font-semibold text-content-muted">
        {T.r2Label} <span className="font-mono font-bold text-content">{r2Display}</span>
      </span>
    </div>
  );

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-line-chart-down"
      action={trendBadge}
    >
      <div className="flex flex-col gap-5">
        <AnalyticsExplainer
          summary={T.explainer.summary}
          details={T.explainer.details}
        />

        {/* Next Day Pill Banner */}
        <div className={ANALYTICS_STYLES.forecastPill}>
          <span className="text-xs font-semibold text-content-muted">
            {T.nextDayLabel}{' '}
            <span className="font-bold text-content">{lrRaw?.forecast_date || '—'}</span>
          </span>
          <span className="text-base font-extrabold text-accent">
            {lrRaw?.forecast_value ?? 0} {T.patientsUnit}
          </span>
        </div>

        {/* Plain-English Interpretation Cards */}
        <div className={G.grid3}>
          <div className={G.card}>
            <span className={G.eyebrow}>{T.cards.trendTitle}</span>
            <span className={G.headline}>{describeSlope(lrRaw?.slope, lrRaw?.trend)}</span>
            <p className={G.explain}>
              Slope tells you how fast average daily volume is climbing or falling across the entire date range.
            </p>
          </div>
          <div className={G.card}>
            <span className={G.eyebrow}>{T.cards.r2Title}</span>
            <span className={G.headline}>{describeR2Fit(r2Value)}</span>
            <p className={G.explain}>
              Measures how closely daily visits stick to a straight line (100% = perfect line; low % = normal daily ups and downs).
            </p>
          </div>
          <div className={G.card}>
            <span className={G.eyebrow}>{T.cards.forecastTitle}</span>
            <span className={G.headline}>
              {lrRaw?.forecast_value ?? 0} {T.patientsUnit} ({lrRaw?.forecast_date || '—'})
            </span>
            <p className={G.explain}>{T.cards.forecastDesc}</p>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={lrChartData}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
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
              <Tooltip content={<LRChartTooltip forecastDate={lrRaw?.forecast_date} />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              <Scatter
                name={T.legend.actual}
                dataKey="actual"
                fill="#3b82f6"
                fillOpacity={0.75}
                shape="circle"
              />
              <Line
                type="monotone"
                dataKey="lr_line"
                name={T.legend.trend}
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                connectNulls={true}
              />
              {lrRaw?.forecast_date && lrRaw?.forecast_value !== undefined && (
                <ReferenceDot
                  x={lrRaw.forecast_date}
                  y={lrRaw.forecast_value}
                  r={7}
                  fill="#cc3535"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <AlgorithmComparisonTable
          evaluationMetrics={computationalForecasting?.evaluation_metrics}
          bestAlgorithm={computationalForecasting?.best_algorithm}
          arimaAic={arimaAic}
          algorithmicConclusion={computationalForecasting?.algorithmic_conclusion}
        />
      </div>
    </DashboardCard>
  );
}
