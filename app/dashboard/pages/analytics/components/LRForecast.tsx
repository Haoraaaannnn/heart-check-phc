/**
 * @fileoverview Linear Regression Forecast component for the Analytics dashboard page.
 *
 * Charts historical registration points against the calculated linear regression line,
 * highlighting the next-day point forecast, slope, R² goodness of fit, and model comparisons.
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
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import AlgorithmComparisonTable from '@/app/dashboard/pages/analytics/components/AlgorithmComparisonTable';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface LRForecastProps {
  /** Raw linear regression stats from the backend. */
  lrRaw: any;
  /** Processed chart coordinates for scatter and regression lines. */
  lrChartData: any[];
  /** Color string representing trend (e.g. rising/falling). */
  trendColor: string;
  /** Background color string representing trend. */
  trendBg: string;
  /** Computational forecasting summary object. */
  computationalForecasting: any;
  /** AIC value for ARIMA comparison. */
  arimaAic: number | null;
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
          className="rounded-full px-3 py-1 text-xs font-bold uppercase"
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
      <div className="flex flex-col gap-6">
        {/* Next Day Pill Banner */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-muted/40 p-4 flex-wrap gap-2">
          <span className="text-xs font-semibold text-content-muted">
            {T.nextDayLabel}{' '}
            <span className="font-bold text-content">{lrRaw?.forecast_date || '—'}</span>
          </span>
          <span className="text-base font-extrabold text-brand-accent">
            {lrRaw?.forecast_value ?? 0} {T.patientsUnit}
          </span>
        </div>

        {/* Forecast Chart */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={lrChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                contentStyle={{
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  borderColor: 'var(--color-line, #e5e7eb)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  color: 'var(--color-content, #1f2937)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              {/* Actual Observations */}
              <Scatter
                name="Actual"
                dataKey="actual"
                fill="#3b82f6"
                shape="circle"
              />
              {/* Linear Regression Line */}
              <Line
                type="monotone"
                dataKey="lr_line"
                name="Regression Trend"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                connectNulls={true}
              />
              {/* Highlight forecasted next day */}
              {lrRaw?.forecast_date && lrRaw?.forecast_value !== undefined && (
                <ReferenceDot
                  x={lrRaw.forecast_date}
                  y={lrRaw.forecast_value}
                  r={6}
                  fill="#cc3535"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Algorithm Comparison Table */}
        <AlgorithmComparisonTable
          evaluationMetrics={computationalForecasting?.evaluation_metrics}
          bestAlgorithm={computationalForecasting?.best_algorithm}
          arimaAic={arimaAic}
        />
      </div>
    </DashboardCard>
  );
}
