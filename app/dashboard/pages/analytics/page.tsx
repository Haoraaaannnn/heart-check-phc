/**
 * @fileoverview Queue analytics and forecasting dashboard page (/dashboard/pages/analytics).
 *
 * Visualizes queue bottlenecks, daily volumes, PHC hospital standard compliance,
 * linear regression forecasts, and ARIMA predictive models.
 *
 * @module app/dashboard/pages/analytics/page
 */

'use client';

import { useAnalyticsData } from '@/app/dashboard/pages/analytics/hooks/useAnalyticsData';
import {
  getLRRaw,
  getARIMARaw,
  prepareLRChartData,
  prepareARIMAChartData,
  getTrendColor,
  getTrendBg,
} from '@/utils/chartDataPrep';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import AnalyticsHeader from '@/app/dashboard/pages/analytics/components/AnalyticsHeader';
import AnalyticsMetricCards from '@/app/dashboard/pages/analytics/components/AnalyticsMetricCards';
import BottleneckStageTable from '@/app/dashboard/pages/analytics/components/BottleneckStageTable';
import VolumeAndWaitCharts from '@/app/dashboard/pages/analytics/components/VolumeAndWaitCharts';
import PHCComplianceSummary from '@/app/dashboard/pages/analytics/components/PHCComplianceSummary';
import LRForecast from '@/app/dashboard/pages/analytics/components/LRForecast';
import ArimaForecast from '@/app/dashboard/pages/analytics/components/ArimaForecast';

/**
 * Root analytical dashboard page.
 *
 * @returns JSX element.
 */
export default function AnalyticsPage() {
  const { data, loading, isRefreshing, error, range, setRange } = useAnalyticsData();
  const T = ANALYTICS_TEXTS.header;

  if (loading && !data) {
    return (
      <div className={ANALYTICS_STYLES.page}>
        <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-surface p-12 text-center text-sm font-semibold text-content-muted shadow-card">
          <div className="flex flex-col items-center gap-3">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
            <p>{T.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={ANALYTICS_STYLES.page}>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center font-bold text-rose-600 dark:text-rose-400">
          {T.errorPrefix} {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={ANALYTICS_STYLES.page}>
        <div className="rounded-2xl border border-line bg-surface p-12 text-center text-sm font-semibold text-content-muted">
          {T.empty}
        </div>
      </div>
    );
  }

  const lrRaw = getLRRaw(data);
  const arimaRaw = getARIMARaw(data);
  const lrChartData = prepareLRChartData(lrRaw);
  const arimaChartData = prepareARIMAChartData(arimaRaw);
  const trendColor = getTrendColor(lrRaw.trend);
  const trendBg = getTrendBg(lrRaw.trend);

  return (
    <div className={ANALYTICS_STYLES.page}>
      <AnalyticsHeader
        range={range}
        setRange={setRange}
        loading={loading}
        isRefreshing={isRefreshing}
      />

      <AnalyticsMetricCards data={data} />

      <BottleneckStageTable stages={data.bottleneck_analysis?.stages || []} />

      <VolumeAndWaitCharts
        dailySummary={data.daily_summary || []}
        hourlyPattern={data.hourly_pattern || []}
      />

      <PHCComplianceSummary data={data.phc_compliance} />

      <LRForecast
        lrRaw={lrRaw}
        lrChartData={lrChartData}
        trendColor={trendColor}
        trendBg={trendBg}
        computationalForecasting={data.computational_forecasting}
        arimaAic={arimaRaw.aic}
      />

      <ArimaForecast
        arimaRaw={arimaRaw}
        arimaChartData={arimaChartData}
      />
    </div>
  );
}
