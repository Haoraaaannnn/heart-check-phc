"use client";

import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";
import { darkTheme, lightTheme } from "@/constants/themes";
import { textLight, textDark } from "@/constants/themes";

interface Props {
  arimaRaw: any;
  arimaChartData: any[];
}

export default function ArimaForecast({ arimaRaw, arimaChartData }: Props) {
  return (
    <AnalyticsMetricCards>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">ARIMA Forecast</h2>
        <div className="flex items-center gap-3">
          {arimaRaw.aic !== null && (
            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
              AIC:{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {arimaRaw.aic.toFixed(1)}
              </span>
            </span>
          )}
          <span className="text-xs font-bold px-3 py-1 rounded-full uppercase text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
            ARIMA (1,1,1)
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Forecast for{" "}
        <span className="font-semibold text-gray-600 dark:text-gray-300">{arimaRaw.forecast_date}</span>:{" "}
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          {arimaRaw.forecast_value} patients
        </span>
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Forecast</p>
          <p className={`text-2xl font-bold ${textLight} ${textDark}`}>
            {arimaRaw.forecast_value}{" "}
            <span className="text-sm font-normal text-gray-400">patients</span>
          </p>
        </div>
        <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 uppercase font-bold">AIC Score</p>
          <p className={`text-2xl font-bold ${textLight} ${textDark}`}>
            {arimaRaw.aic?.toFixed(1) ?? "—"}
          </p>
        </div>
        <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Model</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">ARIMA</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-5 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Actual
            </span>
            <span className="flex items-center gap-2">
              <span style={{ width: 20, height: 0, borderTop: "2px solid #a855f7" }} /> ARIMA Fit
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-purple-600" /> Forecast
            </span>
          </div>

          <div className="h-80 w-full mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={arimaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={((value: any, name: any) => {
                    const labels: any = {
                      actual: "Actual patients",
                      fitted: "ARIMA fit",
                      forecast: "Forecast",
                    };
                    return [value, labels[name] ?? name];
                  }) as any}
                />
                <Scatter name="actual" dataKey="actual" fill="#3b82f6" />
                <Line
                  type="monotone" dataKey="fitted"
                  stroke="#a855f7" strokeWidth={2.5}
                  dot={false} connectNulls={true}
                />
                <ReferenceDot
                  x={arimaRaw.forecast_date} y={arimaRaw.forecast_value}
                  r={8} fill="#7c3aed" stroke="#fff" strokeWidth={2}
                  label={{
                    value: `${arimaRaw.forecast_value}`,
                    position: "top",
                    fill: "#7c3aed",
                    fontWeight: "bold",
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            ARIMA (AutoRegressive Integrated Moving Average) captures
            short-term autocorrelation and weekly seasonality patterns
            in patient volume. The purple line shows how well the model
            fits historical data. A lower AIC score indicates a better model fit.
          </p>
        </div>

        {/* Historical fitted table */}
        <div className="xl:w-80 shrink-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Historical vs ARIMA Fit
          </p>
          <div className={`${darkTheme} ${lightTheme} overflow-hidden max-h-64 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700`}>
            <table className="w-full text-xs">
              <thead className="text-gray-400 uppercase sticky top-0 font-bold text-[9px]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">ARIMA fit</th>
                  <th className="px-3 py-2 text-right">Error</th>
                </tr>
              </thead>
              <tbody>
                {arimaRaw.labels.map((date: string, i: number) => {
                  const actual = arimaRaw.actual[i];
                  const fitted = arimaRaw.fitted[i];
                  const error  = fitted != null ? Math.abs(actual - fitted).toFixed(1) : "—";
                  return (
                    <tr key={date} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-[10px]">{date}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300">{actual}</td>
                      <td className="px-3 py-2 text-right text-purple-600 dark:text-purple-400 font-mono font-semibold">
                        {fitted?.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                        {error}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-purple-200 dark:border-purple-800">
                  <td className="px-3 py-2 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                    {arimaRaw.forecast_date} ★
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 text-[10px]">—</td>
                  <td className="px-3 py-2 text-right font-bold text-purple-700 dark:text-purple-400">
                    {arimaRaw.forecast_value}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 text-[10px]">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnalyticsMetricCards>
  );
}