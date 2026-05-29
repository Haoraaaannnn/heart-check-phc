"use client";

import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";
import AnalyticsMetricHeader from "@/components/reusables/analyticsMetricHeader";

interface Props {
  data: any;
}

export default function MetricCardsRow({ data }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className={`p-6 rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] backdrop-blur-xl
        text-white transition-colors duration-500 ${
          data.bottleneck_analysis?.system_status === "Overwhelmed"
            ? "bg-red-500" : "bg-green-500"
        }`}>
        <h2 className="text-xs font-bold uppercase tracking-widest">System Status</h2>
        <p className="text-4xl font-extrabold mt-3">
          {data.bottleneck_analysis?.system_status || "Normal"}
        </p>
        <p className="text-xs mt-2 font-semibold">
          Bottleneck: {data.bottleneck_analysis?.bottleneck_stage || "None"}
        </p>
      </div>

      <AnalyticsMetricCards>
        <AnalyticsMetricHeader>Average Consult Wait</AnalyticsMetricHeader>
        <div className="text-4xl font-extrabold text-blue-600 mt-2">
          {data.bottleneck_analysis?.avg_wait_consultation_min ?? 0}{" "}
          <span className="text-xl text-gray-400">mins</span>
        </div>
      </AnalyticsMetricCards>

      <AnalyticsMetricCards>
        <AnalyticsMetricHeader>Tomorrow's Forecast</AnalyticsMetricHeader>
        <div className="text-4xl font-extrabold text-orange-600 mt-2">
          {data.computational_forecasting?.next_day_forecast ?? 0}{" "}
          <span className="text-xl text-gray-400">patients</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Using {data.computational_forecasting?.best_algorithm ?? "N/A"}
        </p>
      </AnalyticsMetricCards>

      <AnalyticsMetricCards>
        <AnalyticsMetricHeader>Recommended Staff</AnalyticsMetricHeader>
        <div className="text-4xl font-extrabold text-green-600 mt-2">
          {data.decision_support?.recommended_doctors ?? 1}{" "}
          <span className="text-xl text-gray-400">Doctors</span>
        </div>
      </AnalyticsMetricCards>
    </div>
  );
}