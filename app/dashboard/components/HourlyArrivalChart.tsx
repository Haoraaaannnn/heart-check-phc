'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface HourlyArrivalsChartProps {
  hourlyData: { time: string; patients: number }[];
  isMounted: boolean;
}

export default function HourlyArrivalsChart({ hourlyData, isMounted }: HourlyArrivalsChartProps) {
  return (
    <div className="bg-white/35 rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-red-50 backdrop-blur-xl p-8 w-full mb-8
      dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">Hourly Patient Arrivals</h2>
        <p className="text-sm text-gray-400 mt-1">Number of patients registered per hour today</p>
      </div>

      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
        {isMounted ? (
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={((value: number) => [`${value} patients`, 'Arrivals']) as any}
              />
              <Bar dataKey="patients" fill="#cc3535" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}