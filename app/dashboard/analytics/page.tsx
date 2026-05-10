"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot, LineChart
} from "recharts";
import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";
import AnalyticsMetricHeader from "@/components/reusables/analyticsMetricHeader";
import AnalyticsMetricPara from "@/components/reusables/analyticsMetricPara";
import { textLight, textDark } from "@/constants/themes";
import { darkTheme, lightTheme } from "@/constants/themes";

export default function AdminDashboard() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = () => {
      fetch("http://localhost:8000/api/dashboard-data")
        .then((res) => {
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          return res.json();
        })
        .then((json) => {
          console.log("API response:", json);
          setData(json);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // ── LR chart data prep ──────────────────────────────────────────
  const lrRaw = data.lr_chart_data || {
    labels: [], actual: [], lr_line: [],
    trend: "stable", slope: 0, r2: 0,
    forecast_date: "", forecast_value: 0,
  };

  const lrChartData = [
    ...(lrRaw.labels || []).map((date: string, i: number) => ({
      date,
      actual:  lrRaw.actual?.[i],
      lr_line: lrRaw.lr_line?.[i],
    })),
    {
      date:     lrRaw.forecast_date,
      actual:   null,
      lr_line:  lrRaw.forecast_value,
      forecast: lrRaw.forecast_value,
    },
  ];

  const trendColor =
    lrRaw.trend === "increasing" ? "#ef4444"
    : lrRaw.trend === "decreasing" ? "#22c55e"
    : "#6b7280";

  const trendBg =
    lrRaw.trend === "increasing" ? "#fee2e2"
    : lrRaw.trend === "decreasing" ? "#dcfce7"
    : "#f3f4f6";

  // ── ARIMA chart data prep ───────────────────────────────────────
  const arimaRaw = data.arima_chart_data || {
    labels: [], actual: [], fitted: [],
    forecast_date: "", forecast_value: 0, aic: null, status: "",
  };

  const arimaChartData = [
    ...(arimaRaw.labels || []).map((date: string, i: number) => ({
      date,
      actual: arimaRaw.actual?.[i],
      fitted: arimaRaw.fitted?.[i],
    })),
    {
      date:     arimaRaw.forecast_date,
      actual:   null,
      fitted:   arimaRaw.forecast_value,
      forecast: arimaRaw.forecast_value,
    },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">

        {/* HEADER */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            OPD Queue Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Advanced forecasting and bottleneck analysis</p>
        </div>

        {/* METRIC CARDS */}
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

          <AnalyticsMetricCards >
            <AnalyticsMetricHeader>Recommended Staff</AnalyticsMetricHeader>
            <div className="text-4xl font-extrabold text-green-600 mt-2">
              {data.decision_support?.recommended_doctors ?? 1}{" "}
              <span className="text-xl text-gray-400">Doctors</span>
            </div>
          </AnalyticsMetricCards>
        </div>

        {/* ── TOP TWO CHARTS ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsMetricCards>
            <h2 className={`text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200`}>
              Patient Volume Trend (Past 5 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_summary || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="visit_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone" dataKey="total_patients"
                    stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsMetricCards>

          <AnalyticsMetricCards>
            <h2 className={`text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200`}>
              Hourly Wait Time Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourly_pattern || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time_label" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone" dataKey="avg_wait_consultation"
                    stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsMetricCards>
        </div>

        {/* ── LINEAR REGRESSION BLOCK ────────────────────────────── */}
        <AnalyticsMetricCards>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className={`text-xl font-extrabold text-gray-800 dark:text-gray-200`}>Linear Regression Forecast</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase"
                style={{ background: trendBg, color: trendColor }}>
                {lrRaw.trend}
              </span>
              <span className={`text-sm px-2 py-1 text-gray-600 dark:text-gray-400`}>
                slope: <span className={`font-semibold text-gray-800 dark:text-gray-200`}>{lrRaw.slope?.toFixed(2)} patients/day</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Forecast for <span className={`font-semibold text-gray-600 dark:text-gray-300`}>{lrRaw.forecast_date}</span>:{" "}
            <span className="font-semibold text-green-600">{lrRaw.forecast_value} patients</span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Forecast", value: `${lrRaw.forecast_value} patients` },
              { label: "Slope",    value: lrRaw.slope?.toFixed(2) },
              { label: "Trend",    value: lrRaw.trend, color: trendColor },
              { label: "R² score", value: lrRaw.r2 ?? "—" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-2 uppercase font-bold">{label}</p>
                <p className="text-2xl font-bold" style={{ color: color || "#1f2937" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
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
                      label={{ value: `${lrRaw.forecast_value}`, position: "top", fill: "#16a34a", fontWeight: "bold" }}
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

            <div className="xl:w-80 shrink-0 flex flex-col gap-6">

              {/* Algorithm comparison - Combined LR & ARIMA */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Algorithm Comparison
                </p>
                <div className={`${darkTheme} ${lightTheme} overflow-hidden`}>
                  <table className="w-full text-xs">
                    <thead className={`font-bold uppercase text-[9px] text-gray-400`}>
                      <tr>
                        <th className="px-3 py-2 text-left">Algorithm</th>
                        <th className="px-3 py-2 text-right">MAE</th>
                        <th className="px-3 py-2 text-right">RMSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.computational_forecasting?.evaluation_metrics &&
                        Object.entries(data.computational_forecasting.evaluation_metrics)
                          .map(([algo, m]: any) => (
                            <tr key={algo}
                              className={`border-t border-gray-100 dark:border-gray-700 ${
                                algo === data.computational_forecasting.best_algorithm
                                  ? "bg-red-50 dark:bg-red-900/20" : ""
                              }`}>
                              <td className={`px-3 py-2 text-gray-600 dark:text-gray-400`}>
                                {algo}
                                {algo === data.computational_forecasting.best_algorithm && " ✓"}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500 font-mono">{m.MAE.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right text-gray-500 font-mono">{m.RMSE.toFixed(2)}</td>
                            </tr>
                          ))}
                      {/* Add ARIMA row */}
                      {arimaRaw.aic !== null && (
                        <tr className="border-t border-gray-100 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                          <td className="px-3 py-2 text-purple-700 dark:text-purple-400 font-semibold">ARIMA</td>
                          <td className="px-3 py-2 text-right text-gray-500 font-mono">—</td>
                          <td className="px-3 py-2 text-right text-purple-600 dark:text-purple-400 font-mono font-bold">
                            AIC: {arimaRaw.aic?.toFixed(1)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historical data table */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Historical vs Fit
                </p>
                <div className={`${darkTheme} ${lightTheme} overflow-hidden max-h-64 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700`}>
                  <table className="w-full text-xs">
                    <thead className={`font-bold uppercase text-[9px] text-gray-400 sticky top-0 bg-gray-50 dark:bg-gray-800`}>
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">Actual</th>
                        <th className="px-3 py-2 text-right">Fit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lrRaw.labels.map((date: string, i: number) => (
                        <tr key={date} className="border-t border-gray-100 dark:border-gray-700">
                          <td className={`px-3 py-2 text-gray-500 dark:text-gray-400 text-[10px]`}>{date}</td>
                          <td className={`px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300`}>{lrRaw.actual[i]}</td>
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

        {/* ── ARIMA BLOCK ────────────────────────────────────────── */}
        <AnalyticsMetricCards>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className={`text-xl font-extrabold text-gray-800 dark:text-gray-200`}>ARIMA Forecast</h2>
            <div className="flex items-center gap-3">
              {arimaRaw.aic !== null && (
                <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                  AIC: <span className="font-semibold text-gray-800 dark:text-gray-200">{arimaRaw.aic.toFixed(1)}</span>
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
            <span className="font-semibold text-purple-600 dark:text-purple-400">{arimaRaw.forecast_value} patients</span>
          </p>

          {/* ARIMA stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Forecast</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {arimaRaw.forecast_value}{" "}
                <span className="text-sm font-normal text-gray-400">patients</span>
              </p>
            </div>
            <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold">AIC Score</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {arimaRaw.aic?.toFixed(1) ?? "—"}
              </p>
            </div>
            <div className="p-4 text-center border border-gray-100 dark:border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Model</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">ARIMA</p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 min-w-0">
              {/* ARIMA legend */}
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

              {/* ARIMA chart */}
              <div className="h-80 w-full mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={arimaChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
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

                    {/* Actual dots */}
                    <Scatter name="actual" dataKey="actual" fill="#3b82f6" />

                    {/* ARIMA fitted line — solid purple */}
                    <Line
                      type="monotone" dataKey="fitted"
                      stroke="#a855f7" strokeWidth={2.5}
                      dot={false} connectNulls={true}
                    />

                    {/* Forecast dot */}
                    <ReferenceDot
                      x={arimaRaw.forecast_date}
                      y={arimaRaw.forecast_value}
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
                fits historical data. A lower AIC score indicates a better
                model fit.
              </p>
            </div>

            {/* ARIMA historical fitted table */}
            <div className="xl:w-80 shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Historical vs ARIMA Fit
              </p>
              <div className={`${darkTheme} ${lightTheme} overflow-hidden max-h-64 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700`}>
                <table className="w-full text-xs">
                  <thead className="text-gray-400 uppercase sticky top-0 font-bold text-[9px] bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Actual</th>
                      <th className="px-3 py-2 text-right">ARIMA fit</th>
                      <th className="px-3 py-2 text-right">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arimaRaw.labels.map((date: string, i: number) => {
                      const actual  = arimaRaw.actual[i];
                      const fitted  = arimaRaw.fitted[i];
                      const error   = fitted != null
                        ? Math.abs(actual - fitted).toFixed(1)
                        : "—";
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
                    {/* Forecast row */}
                    <tr className="border-t-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
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

      </div>
    </div>
  );
}