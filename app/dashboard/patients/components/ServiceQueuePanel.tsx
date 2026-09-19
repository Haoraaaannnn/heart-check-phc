'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ServiceMetricCard from '@/components/reusables/serviceMetricCard';
import { useServiceQueue } from '../hooks/useServiceQueue';

const BOTTLENECK_MINS = 60;

interface ServiceQueuePanelProps {
  service: string;
}

export default function ServiceQueuePanel({ service }: ServiceQueuePanelProps) {
  const { stats, hourlyTrend } = useServiceQueue(service);
  const [now, setNow] = useState(() => Date.now());

  // Ticks every minute so "Waiting For" stays live between realtime events
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const liveWaitMins = (joinedAtMs: number) =>
    Math.max(0, Math.floor((now - joinedAtMs) / 60000));

  const isActive = stats.serving > 0;
  const isBottleneck = stats.longestWaitMins > BOTTLENECK_MINS;

  return (
    <div className="flex flex-col gap-6">
      {/* Status strip */}
      <div className="flex items-center gap-3">
        {isActive ? (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" /> Standby
          </span>
        )}
        {stats.activeRooms.length > 0 && (
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Rooms:{' '}
            <span className="text-gray-800 dark:text-gray-200">
              {stats.activeRooms.join(', ')}
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Up Next */}
        <ServiceMetricCard className="lg:col-span-2">
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200 mb-6">
            Up Next Queue
          </h2>

          <div className="flex flex-col gap-3">
            {stats.waitingList.length > 0 ? (
              stats.waitingList.map((patient, idx) => {
                const mins = liveWaitMins(patient.joinedAtMs);
                const overdue = mins > BOTTLENECK_MINS;
                const isNext = idx === 0;

                return (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                      isNext
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-2xl font-extrabold ${
                          isNext
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {idx + 1}. {patient.ticket}
                      </span>
                      {isNext && (
                        <span className="px-2 py-1 bg-red-600 dark:bg-red-700 text-white text-xs font-bold rounded uppercase">
                          Next
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">
                        Waiting For
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          overdue
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {mins} mins
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500 italic">
                No patients waiting in this queue.
              </div>
            )}
          </div>
        </ServiceMetricCard>

        {/* Time stats */}
        <ServiceMetricCard>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-500 dark:text-gray-400">
            Time Stats
          </h3>

          <div className="flex flex-col gap-6">
            <div>
              <span className="text-gray-500 dark:text-gray-400 font-semibold block mb-1">
                Average Wait Time
              </span>
              <span className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">
                {stats.avgWaitMins !== null ? `${stats.avgWaitMins} min` : '--'}
              </span>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            <div>
              <span className="text-gray-500 dark:text-gray-400 font-semibold block mb-1">
                Longest Wait (Bottleneck)
              </span>
              <span
                className={`text-3xl font-extrabold ${
                  isBottleneck
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {stats.longestWaitMins > 0 ? `${stats.longestWaitMins} min` : '--'}
              </span>
              {isBottleneck && (
                <p className="text-xs text-red-500 dark:text-red-400 font-bold mt-2">
                  Alert: Patient waiting over 1 hour!
                </p>
              )}
            </div>
          </div>
        </ServiceMetricCard>
      </div>

      {/* Demand trend */}
      <ServiceMetricCard>
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
            Service Demand Trend
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Hourly patient arrivals for {service} today
          </p>
        </div>

        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              />
              <Tooltip
                cursor={{ stroke: '#fca5a5', strokeWidth: 2, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value} patients`, 'Arrivals'] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPatients)"
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ServiceMetricCard>
    </div>
  );
}