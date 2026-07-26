"use client";

import {
  ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";

interface Props {
  dailySummary: any[];
  hourlyPattern: any[];
}

// Adds a trailing N-day moving average alongside the raw daily line —
// same idea as the SMA algorithm already used in forecasting, just
// applied here for visual readability rather than prediction.
function withMovingAverage(data: any[], windowSize: number) {
  return data.map((row, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = data.slice(start, i + 1);
    const avg =
      windowSlice.reduce((sum, r) => sum + (r.total_patients || 0), 0) / windowSlice.length;
    return { ...row, moving_avg: Math.round(avg * 10) / 10 };
  });
}

export default function VolumeAndWaitCharts({ dailySummary, hourlyPattern }: Props) {
  const volumeData = withMovingAverage(dailySummary, 7);

  // Keeps x-axis tick spacing even regardless of how many points are
  // plotted — avoids Recharts clustering ticks unevenly on long ranges.
  const tickInterval = Math.max(0, Math.floor(volumeData.length / 8) - 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsMetricCards>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
            Patient Volume Trend
          </h2>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300" /> Daily
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-700" /> 7-day avg
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="visit_date"
                tick={{ fontSize: 10 }}
                interval={tickInterval}
                angle={-30}
                textAnchor="end"
                height={40}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone" dataKey="total_patients"
                stroke="#93c5fd" strokeWidth={1} dot={false}
                name="Daily patients"
              />
              <Line
                type="monotone" dataKey="moving_avg"
                stroke="#1d4ed8" strokeWidth={2.5} dot={false}
                name="7-day average"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsMetricCards>

      <AnalyticsMetricCards>
        <h2 className="text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">
          Hourly Wait Time Distribution
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyPattern}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time_label" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone" dataKey="avg_wait_consultation"
                stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }}
                name="Avg wait (min)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsMetricCards>
    </div>
  );
}