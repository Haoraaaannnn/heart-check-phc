"use client";

import { useAnalyticsData } from "@/app/dashboard/analytics/hooks/useAnalyticsData";
import { getLRRaw, getARIMARaw, prepareLRChartData, prepareARIMAChartData, getTrendColor, getTrendBg } from "@/utils/chartDataPrep";
import MetricCardsRow from "@/app/dashboard/analytics/components/MetricCardShow";
import VolumeAndWaitCharts from "@/app/dashboard/analytics/components/VolumeAndWaitCharts";
import LRForecast from "@/app/dashboard/analytics/components/LRForecast";
import ArimaForecast from "@/app/dashboard/analytics/components/ArimaForecast";

export default function AdminDashboard() {
  const { data, loading, error } = useAnalyticsData();

  if (loading && !data) return (
    <div className="p-10 text-center text-xl text-gray-500 font-bold">
      Loading Heart Check Analytics Engine...
    </div>
  );
  if (error && !data) return (
    <div className="p-10 text-center text-xl text-red-500 font-bold">
      Error: {error}
    </div>
  );
  if (!data) return (
    <div className="p-10 text-center text-xl text-gray-500 font-bold">
      No data received.
    </div>
  );

  const lrRaw        = getLRRaw(data);
  const arimaRaw     = getARIMARaw(data);
  const lrChartData  = prepareLRChartData(lrRaw);
  const arimaChartData = prepareARIMAChartData(arimaRaw);
  const trendColor   = getTrendColor(lrRaw.trend);
  const trendBg      = getTrendBg(lrRaw.trend);

  return (
    <div className="min-h-screen w-full">
      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">

        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            OPD Queue Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Advanced forecasting and bottleneck analysis</p>
        </div>

        <MetricCardsRow data={data} />

        <VolumeAndWaitCharts
          dailySummary={data.daily_summary || []}
          hourlyPattern={data.hourly_pattern || []}
        />

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
    </div>
  );
}