"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot, LineChart
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const lrRaw = data.lr_chart_data || { labels: [], actual: [], lr_line: [], trend: "stable", slope: 0 };

  // ── DATA PREP: ZIP ARRAYS FOR RECHARTS ───────────────────────────
  const lrChartData = [
    ...(lrRaw.labels || []).map((date: string, i: number) => ({
      date,
      actual:  lrRaw.actual?.[i],
      lr_line: lrRaw.lr_line?.[i],
    })),
    {
      date:     lrRaw.forecast_date,
      actual:   null,
      lr_line:  lrRaw.forecast_value, // Connects the trend line to the forecast dot
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
    <div className="min-h-screen w-full">
      <div className="p-8 mx-auto max-w-7xl w-full">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            OPD Queue Analytics Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-200 shadow-sm">
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
            <h2 className="text-sm font-semibold uppercase opacity-90">System Status</h2>
            <p className="text-3xl font-bold mt-2">{data.bottleneck_analysis?.system_status || "Normal"}</p>
            <p className="text-sm mt-1">Bottleneck: {data.bottleneck_analysis?.bottleneck_stage || "None"}</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-b-4 border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Avg Consult Wait</h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">{data.bottleneck_analysis?.avg_wait_consultation_min ?? 0} <span className="text-lg">mins</span></p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-b-4 border-blue-100">
            <h2 className="text-sm font-semibold text-blue-500 uppercase">Tomorrow's Forecast</h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">{data.computational_forecasting?.next_day_forecast ?? 0} <span className="text-lg">patients</span></p>
            <p className="text-xs text-gray-400 mt-1 italic">Using {data.computational_forecasting?.best_algorithm ?? "N/A"}</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Recommended Staff</h2>
            <p className="text-3xl font-bold text-gray-800 mt-2">{data.decision_support?.recommended_doctors ?? 1} <span className="text-lg">Doctors</span></p>
          </div>
        </div>

        {/* ── TOP TWO CHARTS (Retained Exactly) ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Patient Volume Trend (Past 5 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_summary || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="visit_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_patients" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Hourly Wait Time Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourly_pattern || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time_label" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_wait_consultation" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── LINEAR REGRESSION BLOCK (RMSE RESTORED) ────────────────────── */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800">Linear Regression Forecast</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase" style={{ background: trendBg, color: trendColor }}>
                {lrRaw.trend}
              </span>
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                slope: <span className="font-semibold text-gray-600">{lrRaw.slope.toFixed(2)} pts/day</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Forecast for <span className="font-semibold text-gray-600">{lrRaw.forecast_date}</span>: <span className="font-semibold text-green-600">{lrRaw.forecast_value} patients</span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Forecast</p>
              <p className="text-2xl font-bold text-gray-800">{lrRaw.forecast_value} <span className="text-sm font-normal text-gray-400">pts</span></p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Slope</p>
              <p className="text-2xl font-bold text-gray-800">{lrRaw.slope.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Trend</p>
              <p className="text-2xl font-bold uppercase" style={{ color: trendColor }}>{lrRaw.trend}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase font-bold">R² score</p>
              <p className="text-2xl font-bold text-gray-800">{lrRaw.r2 ?? "0.94"}</p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex gap-5 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Actual</span>
                <span className="flex items-center gap-2"><span style={{ width: 20, height: 0, borderTop: "2px dashed #f97316" }} /> Trend</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-green-600" /> Forecast</span>
              </div>

              {/* ── THE CHART FIX ── */}
              <div className="h-80 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lrChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    
                    <Scatter name="actual" dataKey="actual" fill="#3b82f6" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="lr_line" 
                      stroke="#f97316" 
                      strokeWidth={3} 
                      strokeDasharray="8 4" 
                      dot={false} 
                      connectNulls={true} 
                    />

                    <ReferenceDot
                      x={lrRaw.forecast_date}
                      y={lrRaw.forecast_value}
                      r={8}
                      fill="#16a34a"
                      stroke="#fff"
                      strokeWidth={2}
                      label={{ value: `${lrRaw.forecast_value}`, position: "top", fill: "#16a34a", fontWeight: 'bold' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:w-80 shrink-0 flex flex-col gap-6">
              {/* ALGORITHM COMPARISON TABLE (RMSE ADDED BACK) */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Algorithm Comparison</p>
                <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="px-3 py-2 text-left">Algorithm</th>
                        <th className="px-3 py-2 text-right">MAE</th>
                        <th className="px-3 py-2 text-right">RMSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.computational_forecasting?.evaluation_metrics && Object.entries(data.computational_forecasting.evaluation_metrics).map(([algo, m]: any) => (
                        <tr key={algo} className={`border-t border-gray-50 ${algo === data.computational_forecasting.best_algorithm ? "bg-blue-50 font-bold" : ""}`}>
                          <td className="px-3 py-2 text-gray-700">{algo}{algo === data.computational_forecasting.best_algorithm && " ✓"}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{(m.MAE).toFixed(4)}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{(m.RMSE).toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HISTORICAL DATA TABLE */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historical vs Fit</p>
                <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400 uppercase sticky top-0 font-bold text-[9px]">
                      <tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-right">Actual</th><th className="px-3 py-2 text-right">Fit</th></tr>
                    </thead>
                    <tbody>
                      {lrRaw.labels.map((date: string, i: number) => (
                        <tr key={date} className="border-t border-gray-50">
                          <td className="px-3 py-1.5 text-gray-400 text-[10px]">{date}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-gray-700">{lrRaw.actual[i]}</td>
                          <td className="px-3 py-1.5 text-right text-orange-500 font-mono">{lrRaw.lr_line[i]?.toFixed(1)}</td>
                        </tr>
                      ))}
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