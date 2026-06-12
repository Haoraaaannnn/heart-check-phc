"use client";

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AnalyticsMetricCards from "@/components/reusables/analyticsMetricCards";

interface Props {
  dailySummary: any[];
  hourlyPattern: any[];
}

export default function VolumeAndWaitCharts({ dailySummary, hourlyPattern }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsMetricCards>
        <h2 className="text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">
          Patient Volume Trend (Past 5 Days)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySummary}>
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
        <h2 className="text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">
          Hourly Wait Time Distribution
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyPattern}>
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
  );
}