"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard-data")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center text-xl">Loading Analytics Engine...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">OPD Queue Analytics Dashboard</h1>

      {/* TOP ROW: METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        
        <div className={`p-6 rounded-lg shadow-md text-white ${data.bottleneck_analysis.system_status === "Overwhelmed" ? "bg-red-500" : "bg-green-500"}`}>
          <h2 className="text-sm font-semibold uppercase">System Status</h2>
          <p className="text-3xl font-bold mt-2">{data.bottleneck_analysis.system_status}</p>
          <p className="text-sm mt-1">Bottleneck: {data.bottleneck_analysis.bottleneck_stage}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Avg Consult Wait</h2>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {data.bottleneck_analysis.avg_wait_consultation_min} <span className="text-lg">mins</span>
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-sm font-semibold text-blue-500 uppercase">Tomorrow's Forecast</h2>
          <p className="text-3xl font-bold text-gray-800 mt-2">{data.computational_forecasting.next_day_forecast} <span className="text-lg">patients</span></p>
          <p className="text-xs text-gray-400 mt-1">Using {data.computational_forecasting.best_algorithm}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Recommended Staff</h2>
          <p className="text-3xl font-bold text-gray-800 mt-2">{data.decision_support.recommended_doctors} <span className="text-lg">Doctors</span></p>
        </div>
      </div>

      {/* BOTTOM ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Patient Volume Trend (Past 5 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="visit_date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_patients" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Hourly Wait Time Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourly_pattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avg_wait_consultation" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}