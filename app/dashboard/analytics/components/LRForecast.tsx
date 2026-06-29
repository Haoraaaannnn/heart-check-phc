"use client";

import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";
import AlgorithmComparisonTable from "./AlgorithmComparisonTable";
import { darkTheme, lightTheme, textDark, textLight } from "@/constants/themes";

interface Props {
  lrRaw: any;
  lrChartData: any[];
  trendColor: string;
  trendBg: string;
  computationalForecasting: any;
  arimaAic: number | null;
}

export default function LRForecast({
  lrRaw,
  lrChartData,
  trendColor,
  trendBg,
  computationalForecasting,
  arimaAic,
}: Props) {
  return (
    <AnalyticsMetricCards>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
          Linear Regression Forecast
        </h2>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full uppercase"
            style={{ background: trendBg, color: trendColor }}
          >
            {lrRaw.trend}
          </span>
          <span className="text-sm px-2 py-1 text-gray-600 dark:text-gray-400">
            slope:{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {lrRaw.slope?.toFixed(2)} patients/day
            </span>
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Forecast for{" "}
        <span className="font-semibold text-gray-600 dark:text-gray-300">{lrRaw.forecast_date}</span>:{" "}
        <span className="font-semibold text-green-600">{lrRaw.forecast_value} patients</span>
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Forecast", value: `${lrRaw.forecast_value} patients` },
          { label: "Slope",    value: lrRaw.slope?.toFixed(2) },
          { label: "Trend",    value: lrRaw.trend, color: trendColor },
          { label: "R² score", value: lrRaw.r2 ?? "—" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
            <p className="text-xs mb-2 uppercase font-bold text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${textLight} ${textDark}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-5 mb-4 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Actual
            </span>
            <span className="flex items-center gap-2">
              <span style={{ width: 20, height: 0, borderTop: "2px dashed #f97316" }} /> Trend
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-green-600" /> Forecast
            </span>
          </div>

          <div className="h-80 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lrChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Scatter name="actual" dataKey="actual" fill="#3b82f6" />
                <Line
                  type="monotone" dataKey="lr_line"
                  stroke="#f97316" strokeWidth={3}
                  strokeDasharray="8 4" dot={false} connectNulls={true}
                />
                <ReferenceDot
                  x={lrRaw.forecast_date} y={lrRaw.forecast_value}
                  r={8} fill="#16a34a" stroke="#fff" strokeWidth={2}
                  label={{
                    value: `${lrRaw.forecast_value}`,
                    position: "top",
                    fill: "#16a34a",
                    fontWeight: "bold",
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Each dot is one day's actual patient count. The dashed line is the
            linear regression fit across all historical days. The green point
            is tomorrow's forecast — the trend line extended one step forward.
          </p>
        </div>

        {/* Side tables */}
        <div className="xl:w-80 shrink-0 flex flex-col gap-6">
          <AlgorithmComparisonTable
            evaluationMetrics={computationalForecasting?.evaluation_metrics}
            bestAlgorithm={computationalForecasting?.best_algorithm}
            arimaAic={arimaAic}
          />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Historical vs Fit
            </p>
            <div className={`${darkTheme} ${lightTheme} overflow-hidden max-h-64`}>
              <table className="w-full text-xs">
                <thead className={`${darkTheme} ${lightTheme} font-bold uppercase text-[9px] text-gray-400 sticky top-0`}>
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Actual</th>
                    <th className="px-3 py-2 text-right">Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {lrRaw.labels.map((date: string, i: number) => (
                    <tr key={date} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-[10px]">{date}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300">
                        {lrRaw.actual[i]}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400 font-mono font-semibold">
                        {lrRaw.lr_line[i]?.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsMetricCards>
  );
}