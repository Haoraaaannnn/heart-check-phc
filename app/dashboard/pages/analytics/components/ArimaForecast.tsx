/**
 * @fileoverview ARIMA Forecast component for the Analytics dashboard page.
 *
 * Visualizes the Autoregressive Integrated Moving Average (1,1,1) time series model,
 * plotting actual observations against fitted values and the next-step forward forecast.
 *
 * @module app/dashboard/pages/analytics/components/ArimaForecast
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
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface ArimaForecastProps {
  /** Raw ARIMA parameters from the backend. */
  arimaRaw: any;
  /** Chart coordinates containing actual, fitted, and forecast values. */
  arimaChartData: any[];
}

/**
 * ARIMA forecast time series chart wrapped in DashboardCard.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ArimaForecast({
  arimaRaw,
  arimaChartData,
}: ArimaForecastProps) {
  const { isDark } = useDashboardTheme();
  const T = ANALYTICS_TEXTS.forecasts.arima;

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const F = ANALYTICS_STYLES.forecasts;

  const headerAction = (
    <div className={F.headerActions}>
      {typeof arimaRaw?.aic === 'number' && (
        <span className={F.aicBadge}>
          {T.aicPrefix}{' '}
          <span className={F.aicValue}>
            {arimaRaw.aic.toFixed(1)}
          </span>
        </span>
      )}
      <span className={F.modelTag}>
        {T.modelTag}
      </span>
    </div>
  );

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-analyse"
      action={headerAction}
    >
      <div className={F.container}>
        {/* Next Day Pill Banner */}
        <div className={F.pillBanner}>
          <span className={F.pillLabel}>
            {T.forecastForPrefix}{' '}
            <span className={F.pillValueBold}>{arimaRaw?.forecast_date || T.emptyDash}</span>
          </span>
          <span className={F.pillValuePurple}>
            {arimaRaw?.forecast_value ?? 0} {T.patientsUnit}
          </span>
        </div>

        {/* ARIMA Chart */}
        <div className={F.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={arimaChartData}
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
              {/* Actual Daily Values */}
              <Scatter
                name="Actual Patients"
                dataKey="actual"
                fill="#3b82f6"
                shape="circle"
              />
              {/* Fitted ARIMA In-Sample Line */}
              <Line
                type="monotone"
                dataKey="fitted"
                name="Fitted Model"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
              {/* Forecast Point */}
              {arimaRaw?.forecast_date && arimaRaw?.forecast_value !== undefined && (
                <ReferenceDot
                  x={arimaRaw.forecast_date}
                  y={arimaRaw.forecast_value}
                  r={6}
                  fill="#9333ea"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {typeof arimaRaw?.sigma2 === 'number' && (
          <div className="text-right text-xs text-content-subtle">
            {T.residualVariance}{' '}
            <span className="font-mono font-semibold text-content-muted">
              {arimaRaw.sigma2.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
