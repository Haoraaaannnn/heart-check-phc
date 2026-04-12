"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Create a reusable fetch function
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

    // 2. Fetch immediately on mount
    fetchAnalytics();

    // 3. Set up a 60-second auto-refresh timer to keep it dynamic
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return (
    <div className="p-10 text-center text-xl text-gray-500">
      Loading Analytics Engine...
    </div>
  );

  if (error && !data) return (
    <div className="p-10 text-center text-xl text-red-500">
      Error: {error}
    </div>
  );

  if (!data) return (
    <div className="p-10 text-center text-xl text-gray-500">
      No data received.
    </div>
  );

  if (!data.lr_chart_data || !Array.isArray(data.lr_chart_data.labels)) return (
    <div className="p-10 text-center text-red-500">
      <p className="font-bold text-xl">lr_chart_data or its labels are missing from API response.</p>
      <p className="text-sm mt-2 text-gray-500">
        Make sure your backend is running the latest analytics.py with get_lr_chart_data().
      </p>
    </div>
  );

  const lrRaw = data.lr_chart_data;

  const lrChartData = [
    ...lrRaw.labels.map((date: string, i: number) => ({
      date,
      actual:  lrRaw.actual?.[i],
      lr_line: lrRaw.lr_line?.[i],
    })),
    {
      date:     lrRaw.forecast_date,
      actual:   null,
      lr_line:  null,
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

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="p-8 mx-auto max-w-7xl w-full">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            OPD Queue Analytics Dashboard
          </h1>
          {/* Visual indicator that the dashboard is live */}
          <div className="flex items-center gap-2 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates
          </div>
        </div>

        {/* ── METRIC CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <div className={`p-6 rounded-lg shadow-md text-white transition-colors duration-500 ${
            data.bottleneck_analysis?.system_status === "Overwhelmed"
              ? "bg-red-500" : "bg-green-500"
          }`}>
            <h2 className="text-sm font-semibold uppercase">System Status</h2>
            <p className="text-3xl font-bold mt-2">
              {data.bottleneck_analysis?.system_status || "Normal"}
            </p>
            <p className="text-sm mt-1">
              Bottleneck: {data.bottleneck_analysis?.bottleneck_stage || "None"}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Avg Consult Wait
            </h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {data.bottleneck_analysis?.avg_wait_consultation_min ?? 0}{" "}
              <span className="text-lg">mins</span>
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-blue-500 uppercase">
              Tomorrow's Forecast
            </h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {/* FIX: Safe fallback if AI doesn't have enough data yet */}
              {data.computational_forecasting?.next_day_forecast ?? 0}{" "}
              <span className="text-lg">patients</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Using {data.computational_forecasting?.best_algorithm ?? "Insufficient Data"}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Recommended Staff
            </h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {data.decision_support?.recommended_doctors ?? 1}{" "}
              <span className="text-lg">Doctors</span>
            </p>
          </div>

        </div>

        {/* ── TOP TWO CHARTS ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Patient Volume Trend (Past 5 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_summary || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="visit_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total_patients"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Hourly Wait Time Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourly_pattern || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time_label"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avg_wait_consultation"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── LINEAR REGRESSION CHART (full width) ─────────────────── */}
        <div className="bg-white p-6 rounded-lg shadow-md">

          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800">
              Linear Regression Forecast
            </h2>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: trendBg, color: trendColor }}
              >
                {lrRaw.trend.charAt(0).toUpperCase() + lrRaw.trend.slice(1)}
              </span>
              <span className="text-sm text-gray-400">
                slope:{" "}
                <span className="font-semibold text-gray-600">
                  {lrRaw.slope > 0 ? "+" : ""}
                  {lrRaw.slope.toFixed(2)} patients/day
                </span>
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Forecast for{" "}
            <span className="font-semibold text-gray-600">{lrRaw.forecast_date}</span>
            :{" "}
            <span className="font-semibold text-green-600">
              {lrRaw.forecast_value} patients
            </span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Forecast (tomorrow)</p>
              <p className="text-2xl font-semibold text-gray-800">
                {lrRaw.forecast_value}
                <span className="text-sm font-normal text-gray-400 ml-1">pts</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Slope</p>
              <p className="text-2xl font-semibold text-gray-800">
                {lrRaw.slope > 0 ? "+" : ""}{lrRaw.slope.toFixed(2)}
                <span className="text-sm font-normal text-gray-400 ml-1">/day</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Trend</p>
              <p className="text-2xl font-semibold" style={{ color: trendColor }}>
                {lrRaw.trend.charAt(0).toUpperCase() + lrRaw.trend.slice(1)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">R² fit score</p>
              <p className="text-2xl font-semibold text-gray-800">
                {lrRaw.r2 ?? "—"}
                <span className="text-sm font-normal text-gray-400 ml-1">/ 1.0</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">

            <div className="flex-1 min-w-0">

              <div className="flex gap-5 mb-3 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Actual patients
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block"
                    style={{ width: 22, height: 0, borderTop: "2px dashed #f97316" }}
                  />
                  LR trend line
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-green-600 inline-block" />
                  Forecast
                </span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lrChartData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      angle={-35}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      allowDecimals={false}
                      label={{
                        value: "patients",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#9ca3af" },
                      }}
                    />
                    <Tooltip
                      formatter={
                        ((value: any, name: any) => {
                          const labels: any = {
                            actual:   "Actual patients",
                            lr_line:  "LR trend line",
                            forecast: "Forecast",
                          };
                          return [value, labels[name] ?? name];
                        }) as any
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="lr_line"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      connectNulls={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#16a34a"
                      strokeWidth={0}
                      dot={{ r: 7, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }}
                    />

                    <ReferenceDot
                      x={lrRaw.forecast_date}
                      y={lrRaw.forecast_value}
                      r={7}
                      fill="#16a34a"
                      stroke="#fff"
                      strokeWidth={2}
                      label={{
                        value: `${lrRaw.forecast_value}`,
                        position: "top",
                        fontSize: 12,
                        fill: "#16a34a",
                        fontWeight: 600,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Each dot is one day's actual patient count. The dashed line is
                the linear regression fit across all historical days. The green
                point is tomorrow's forecast — the trend line extended one step
                forward.
              </p>
            </div>

            <div className="xl:w-72 shrink-0 flex flex-col gap-4">

              {/* FIX: Handle missing algorithm comparison gracefully */}
              {data.computational_forecasting?.evaluation_metrics ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Algorithm comparison
                  </p>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Algorithm</th>
                          <th className="px-3 py-2 text-right">MAE</th>
                          <th className="px-3 py-2 text-right">RMSE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          data.computational_forecasting.evaluation_metrics
                        ).map(([algo, metrics]: [string, any]) => {
                          const isBest =
                            algo === data.computational_forecasting.best_algorithm;
                          return (
                            <tr
                              key={algo}
                              className={isBest ? "bg-blue-50" : "bg-white"}
                            >
                              <td className="px-3 py-2 font-medium text-gray-700">
                                {algo}
                                {isBest && (
                                  <span className="text-blue-500 font-semibold ml-1">
                                    ✓
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">
                                {metrics.MAE}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">
                                {metrics.RMSE}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {data.computational_forecasting.algorithmic_conclusion}
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-orange-600 mb-1">More Data Needed</p>
                  <p className="text-xs text-orange-500 leading-relaxed">
                    The advanced AI algorithm comparison requires at least 7 days of queue data to run. Check back next week!
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Historical data
                </p>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">Actual</th>
                        <th className="px-3 py-2 text-right">LR fit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lrRaw.labels.map((date: string, i: number) => (
                        <tr
                          key={date}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-3 py-1.5 text-gray-500 text-xs">
                            {date}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium text-gray-700">
                            {lrRaw.actual[i]}
                          </td>
                          <td className="px-3 py-1.5 text-right text-orange-500">
                            {lrRaw.lr_line[i]}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-green-50 border-t border-green-100">
                        <td className="px-3 py-1.5 text-green-700 text-xs font-semibold">
                          {lrRaw.forecast_date} ★
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-400 text-xs">
                          —
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-green-600">
                          {lrRaw.forecast_value}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div> 
    </div> 
  );
}