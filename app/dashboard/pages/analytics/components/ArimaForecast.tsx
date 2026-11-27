/**
 * @fileoverview ARIMA Forecast component for the Analytics dashboard page.
 *
 * Visualizes the Autoregressive Integrated Moving Average (1,1,1) time series model,
 * plotting actual observations against fitted values and the next-step forward forecast,
 * with plain-English explanations of AIC and Residual Variance (sigma^2).
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
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface ArimaRawData {
  labels?: string[];
  actual?: number[];
  fitted?: number[];
  forecast_date?: string;
  forecast_value?: number;
  aic?: number | null;
  sigma2?: number | null;
  status?: string;
}

interface ArimaChartPoint {
  date?: string;
  actual?: number | null;
  fitted?: number;
  forecast?: number;
}

interface ArimaForecastProps {
  /** Raw ARIMA parameters from the backend. */
  arimaRaw: ArimaRawData;
  /** Chart coordinates containing actual, fitted, and forecast values. */
  arimaChartData: ArimaChartPoint[];
}

interface ArimaTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ArimaChartPoint }>;
  forecastDate?: string;
}

/**
 * Custom plain-English tooltip comparing Actual Patients against the ARIMA Model Estimate.
 */
function ArimaChartTooltip({ active, payload, forecastDate }: ArimaTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const isForecast = Boolean(forecastDate && row.date === forecastDate);
  const hasActual = row.actual !== null && row.actual !== undefined;
  const gap =
    hasActual && typeof row.fitted === 'number'
      ? Math.round(Math.abs((row.actual ?? 0) - row.fitted) * 10) / 10
      : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-lg text-xs">
      <p className="font-extrabold text-content">
        {row.date || '—'} {isForecast ? '(Tomorrow Forecast)' : ''}
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {hasActual && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-content-muted">Actual Patients:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {row.actual}
            </span>
          </div>
        )}
        {typeof row.fitted === 'number' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-content-muted">
              {isForecast ? 'ARIMA Forecast:' : 'Model Estimate:'}
            </span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              {row.fitted} patients
            </span>
          </div>
        )}
        {gap !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-content-muted">Difference:</span>
            <span className="font-mono font-semibold text-content-muted">
              off by {gap} patients
            </span>
          </div>
        )}
      </div>
    </div>
  );
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
  const G = ANALYTICS_STYLES.forecastGuide;

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const headerAction = (
    <div className="flex items-center gap-2">
      {typeof arimaRaw?.aic === 'number' && (
        <span className="rounded-lg border border-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content-muted">
          {T.aicPrefix}{' '}
          <span className="font-mono font-bold text-content">
            {arimaRaw.aic.toFixed(1)}
          </span>
        </span>
      )}
      <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold uppercase text-purple-600 dark:text-purple-400">
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
      <div className="flex flex-col gap-5">
        <AnalyticsExplainer
          summary={T.explainer.summary}
          details={T.explainer.details}
        />

        {/* Next Day Pill Banner */}
        <div className={ANALYTICS_STYLES.forecastPill}>
          <span className="text-xs font-semibold text-content-muted">
            {T.forecastForPrefix}{' '}
            <span className="font-bold text-content">{arimaRaw?.forecast_date || '—'}</span>
          </span>
          <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
            {arimaRaw?.forecast_value ?? 0} {T.patientsUnit}
          </span>
        </div>

        {/* ARIMA Chart */}
        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={arimaChartData}
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
              <Tooltip content={<ArimaChartTooltip forecastDate={arimaRaw?.forecast_date} />} />
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
                dataKey="fitted"
                name={T.legend.fitted}
                stroke="#a855f7"
                strokeWidth={2.25}
                dot={false}
              />
              {arimaRaw?.forecast_date && arimaRaw?.forecast_value !== undefined && (
                <ReferenceDot
                  x={arimaRaw.forecast_date}
                  y={arimaRaw.forecast_value}
                  r={7}
                  fill="#9333ea"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Plain-English Interpretation Cards for AIC & Residual Variance */}
        {(typeof arimaRaw?.aic === 'number' || typeof arimaRaw?.sigma2 === 'number') && (
          <div className={G.grid2}>
            {typeof arimaRaw?.aic === 'number' && (
              <div className={G.card}>
                <span className={G.eyebrow}>{T.cards.aicTitle}</span>
                <span className={G.headline}>AIC = {arimaRaw.aic.toFixed(1)}</span>
                <p className={G.explain}>{T.cards.aicDesc}</p>
              </div>
            )}
            {typeof arimaRaw?.sigma2 === 'number' && (
              <div className={G.card}>
                <span className={G.eyebrow}>{T.cards.sigmaTitle}</span>
                <span className={G.headline}>
                  Residual Variance (σ²) = {arimaRaw.sigma2.toFixed(2)}
                </span>
                <p className={G.explain}>{T.cards.sigmaDesc}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
